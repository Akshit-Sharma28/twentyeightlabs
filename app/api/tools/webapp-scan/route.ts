import dns from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type FindingSeverity = "pass" | "info" | "low" | "medium" | "high";

type Finding = {
  check: string;
  severity: FindingSeverity;
  points: number;
  maxPoints: number;
  owasp: string;
  evidence: string;
  recommendation: string;
};

const blockedHostnames = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const endpoint = String(body?.endpoint ?? "").trim();

  if (!endpoint) {
    return NextResponse.json(
      { error: "Endpoint is required." },
      { status: 400 }
    );
  }

  const target = normalizeEndpoint(endpoint);

  if (!target) {
    return NextResponse.json(
      { error: "Use a valid http or https URL." },
      { status: 400 }
    );
  }

  const safety = await validatePublicTarget(target);

  if (!safety.ok) {
    return NextResponse.json({ error: safety.error }, { status: 400 });
  }

  const response = await fetchTarget(target).catch((error) => {
    const message =
      error instanceof Error
        ? `Could not fetch target: ${error.message}`
        : "Could not fetch target.";

    return { error: message };
  });

  if ("error" in response) {
    return NextResponse.json({ error: response.error }, { status: 502 });
  }

  const contentProbe = await fetchContentProbe(target).catch(() => null);
  const headers = headersToRecord(response.headers);
  const tlsCertificate =
    target.protocol === "https:" ? await getCertificate(target) : null;
  const openPorts = await probeCommonPorts(target.hostname, target.protocol);
  const contentSignals = analyzeContent(contentProbe?.body ?? "", target);
  const findings = scoreHeaders(
    headers,
    target,
    response.status,
    tlsCertificate,
    openPorts,
    contentSignals
  );
  const possiblePoints = findings.reduce(
    (total, finding) => total + finding.maxPoints,
    0
  );
  const earnedPoints = findings.reduce(
    (total, finding) => total + finding.points,
    0
  );
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round((earnedPoints / possiblePoints) * 100)
    )
  );
  const grade = gradeScore(score);
  const scoreBreakdown = createScoreBreakdown(findings, earnedPoints, possiblePoints);

  return NextResponse.json({
    endpoint: target.toString(),
    finalUrl: response.url,
    status: response.status,
    score,
    grade,
    scannedAt: new Date().toISOString(),
    headers,
    tlsCertificate,
    openPorts,
    contentSignals,
    findings,
    scoreBreakdown,
    summary: summarize(score, findings, grade, scoreBreakdown),
  });
}

function normalizeEndpoint(endpoint: string) {
  try {
    const withProtocol = /^https?:\/\//i.test(endpoint)
      ? endpoint
      : `https://${endpoint}`;
    const url = new URL(withProtocol);

    if (!["https:", "http:"].includes(url.protocol)) {
      return null;
    }

    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

async function validatePublicTarget(url: URL) {
  const hostname = url.hostname.toLowerCase();

  if (blockedHostnames.has(hostname) || hostname.endsWith(".local")) {
    return { ok: false, error: "Local and private targets are not supported." };
  }

  const records = await dns.lookup(hostname, { all: true }).catch(() => []);

  if (records.length === 0) {
    return { ok: false, error: "Could not resolve the target hostname." };
  }

  const privateRecord = records.find((record) => isPrivateAddress(record.address));

  if (privateRecord) {
    return {
      ok: false,
      error: "Targets resolving to private network addresses are blocked.",
    };
  }

  return { ok: true };
}

function isPrivateAddress(address: string) {
  if (net.isIP(address) === 4) {
    const [first, second] = address.split(".").map(Number);

    return (
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      first === 127 ||
      first === 0 ||
      (first === 169 && second === 254)
    );
  }

  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

async function fetchTarget(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    let response = await requestWithRedirects(url, "HEAD", controller.signal);

    if (response.status === 405 || response.status === 403) {
      response = await requestWithRedirects(url, "GET", controller.signal);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchContentProbe(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await requestWithRedirects(url, "GET", controller.signal, {
      range: "bytes=0-200000",
      accept: "text/html,application/xhtml+xml,application/javascript,text/javascript,*/*;q=0.1",
    });
    const contentType = response.headers.get("content-type") ?? "";
    const body = (await response.text()).slice(0, 220000);

    return {
      contentType,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function requestWithRedirects(
  initialUrl: URL,
  method: "GET" | "HEAD",
  signal: AbortSignal,
  headers?: HeadersInit
) {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount < 4; redirectCount += 1) {
    const safety = await validatePublicTarget(currentUrl);

    if (!safety.ok) {
      throw new Error(safety.error);
    }

    const response = await fetch(currentUrl, {
      method,
      headers,
      redirect: "manual",
      signal,
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get("location");

    if (!location) {
      return response;
    }

    currentUrl = new URL(location, currentUrl);
  }

  throw new Error("Too many redirects while probing target.");
}

function headersToRecord(headers: Headers) {
  const record = Array.from(headers.entries()).reduce<Record<string, string>>(
    (result, [key, value]) => {
      result[key.toLowerCase()] = value;
      return result;
    },
    {}
  );

  const getSetCookie = (
    headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;

  if (getSetCookie) {
    const cookies = getSetCookie.call(headers);

    if (cookies.length > 0) {
      record["set-cookie"] = cookies.join("\n");
    }
  }

  return record;
}

async function getCertificate(url: URL) {
  return new Promise<null | {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    daysRemaining: number;
    authorized: boolean;
    authorizationError: string | null;
    protocol: string;
    cipher: string;
  }>((resolve) => {
    const socket = tls.connect(
      {
        host: url.hostname,
        port: Number(url.port || 443),
        servername: url.hostname,
        timeout: 7000,
      },
      () => {
        const certificate = socket.getPeerCertificate();
        const validTo = new Date(certificate.valid_to);
        const daysRemaining = Math.ceil(
          (validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        resolve({
          subject: certificate.subject?.CN ?? url.hostname,
          issuer: certificate.issuer?.O ?? certificate.issuer?.CN ?? "Unknown",
          validFrom: certificate.valid_from,
          validTo: certificate.valid_to,
          daysRemaining,
          authorized: socket.authorized,
          authorizationError: socket.authorizationError
            ? String(socket.authorizationError)
            : null,
          protocol: socket.getProtocol() ?? "unknown",
          cipher: socket.getCipher()?.name ?? "unknown",
        });
        socket.end();
      }
    );

    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
    socket.on("error", () => resolve(null));
  });
}

function scoreHeaders(
  headers: Record<string, string>,
  target: URL,
  status: number,
  certificate: Awaited<ReturnType<typeof getCertificate>>,
  openPorts: Array<{ port: number; service: string; open: boolean }>,
  contentSignals: ReturnType<typeof analyzeContent>
) {
  const findings: Finding[] = [];
  const header = (name: string) => headers[name.toLowerCase()];
  const csp = header("content-security-policy");
  const hsts = header("strict-transport-security");
  const cacheControl = header("cache-control");
  const acao = header("access-control-allow-origin");
  const acac = header("access-control-allow-credentials");
  const server = header("server");
  const poweredBy = header("x-powered-by");
  const cookieIssues = analyzeCookies(header("set-cookie") ?? "");
  const cspIssues = analyzeCsp(csp);

  findings.push({
    check: "HTTPS and certificate",
    severity:
      target.protocol === "https:" && certificate?.authorized ? "pass" : "high",
    points: target.protocol === "https:" && certificate?.authorized ? 15 : 0,
    maxPoints: 15,
    owasp: "A02: Cryptographic Failures",
    evidence:
      target.protocol === "https:"
        ? certificate
          ? `Certificate valid for ${certificate.daysRemaining} days; issuer ${certificate.issuer}; ${certificate.protocol} using ${certificate.cipher}.`
          : "HTTPS is enabled, but certificate details could not be read."
        : "Target is using plain HTTP.",
    recommendation:
      "Use HTTPS with a trusted certificate and monitor expiry before production releases.",
  });

  findings.push({
    check: "HTTP Strict Transport Security",
    severity: hsts ? "pass" : target.protocol === "https:" ? "medium" : "info",
    points:
      hsts && hsts.toLowerCase().includes("includesubdomains")
        ? 12
        : hsts
          ? 8
          : 0,
    maxPoints: 12,
    owasp: "A05: Security Misconfiguration",
    evidence: hsts ?? "Strict-Transport-Security header is missing.",
    recommendation:
      "Set HSTS to max-age=31536000 with includeSubDomains after validating HTTPS coverage.",
  });

  findings.push({
    check: "Content Security Policy",
    severity: csp ? (cspIssues.length > 2 ? "medium" : "pass") : "high",
    points: csp ? Math.max(4, 15 - cspIssues.length * 3) : 0,
    maxPoints: 15,
    owasp: "A03: Injection",
    evidence: csp
      ? cspIssues.length > 0
        ? cspIssues.join("; ")
        : "CSP is present with no obvious wildcard, inline, eval, object, base-uri, or frame-ancestor gaps."
      : "Content-Security-Policy header is missing.",
    recommendation:
      "Define a CSP with strict script-src, object-src 'none', base-uri 'self', frame-ancestors, and minimal connect/img/font sources.",
  });

  findings.push({
    check: "Clickjacking protection",
    severity: header("x-frame-options") || csp?.includes("frame-ancestors")
      ? "pass"
      : "medium",
    points: header("x-frame-options") || csp?.includes("frame-ancestors") ? 8 : 0,
    maxPoints: 8,
    owasp: "A05: Security Misconfiguration",
    evidence:
      header("x-frame-options") ??
      (csp?.includes("frame-ancestors")
        ? "CSP frame-ancestors directive is present."
        : "No X-Frame-Options or frame-ancestors directive detected."),
    recommendation:
      "Use CSP frame-ancestors or X-Frame-Options to prevent unauthorized framing.",
  });

  findings.push({
    check: "MIME sniffing protection",
    severity: header("x-content-type-options") === "nosniff" ? "pass" : "low",
    points: header("x-content-type-options") === "nosniff" ? 6 : 0,
    maxPoints: 6,
    owasp: "A05: Security Misconfiguration",
    evidence: header("x-content-type-options") ?? "Header is missing.",
    recommendation: "Set X-Content-Type-Options: nosniff.",
  });

  findings.push({
    check: "Referrer policy",
    severity: header("referrer-policy") ? "pass" : "low",
    points: header("referrer-policy") ? 6 : 0,
    maxPoints: 6,
    owasp: "A01: Broken Access Control",
    evidence: header("referrer-policy") ?? "Referrer-Policy header is missing.",
    recommendation:
      "Use strict-origin-when-cross-origin or a stricter policy for sensitive apps.",
  });

  findings.push({
    check: "Permissions policy",
    severity: header("permissions-policy") ? "pass" : "low",
    points: header("permissions-policy") ? 6 : 0,
    maxPoints: 6,
    owasp: "A05: Security Misconfiguration",
    evidence:
      header("permissions-policy") ?? "Permissions-Policy header is missing.",
    recommendation:
      "Limit browser features such as camera, microphone, geolocation, and payment.",
  });

  findings.push({
    check: "Cache control",
    severity: cacheControl ? "pass" : "medium",
    points: cacheControl ? (isStrictCacheControl(cacheControl) ? 8 : 5) : 0,
    maxPoints: 8,
    owasp: "A02: Cryptographic Failures",
    evidence: cacheControl ?? "Cache-Control header is missing.",
    recommendation:
      "Use explicit cache directives such as no-cache, no-store, max-age=0 for sensitive pages.",
  });

  findings.push({
    check: "CORS exposure",
    severity:
      acao === "*" || acac?.toLowerCase() === "true" ? "medium" : acao ? "info" : "pass",
    points: acao === "*" || acac?.toLowerCase() === "true" ? 2 : 6,
    maxPoints: 6,
    owasp: "A05: Security Misconfiguration",
    evidence: acao
      ? `Access-Control-Allow-Origin: ${acao}${
          acac ? `; Access-Control-Allow-Credentials: ${acac}` : ""
        }`
      : "No broad ACAO header detected.",
    recommendation:
      "Avoid wildcard CORS and credentialed cross-origin responses on endpoints that handle sessions, tokens, or sensitive data.",
  });

  findings.push({
    check: "Cross-origin isolation headers",
    severity:
      header("cross-origin-opener-policy") ||
      header("cross-origin-resource-policy") ||
      header("cross-origin-embedder-policy")
        ? "pass"
        : "low",
    points:
      header("cross-origin-opener-policy") ||
      header("cross-origin-resource-policy") ||
      header("cross-origin-embedder-policy")
        ? 5
        : 0,
    maxPoints: 5,
    owasp: "A05: Security Misconfiguration",
    evidence:
      [
        header("cross-origin-opener-policy")
          ? `COOP: ${header("cross-origin-opener-policy")}`
          : "",
        header("cross-origin-resource-policy")
          ? `CORP: ${header("cross-origin-resource-policy")}`
          : "",
        header("cross-origin-embedder-policy")
          ? `COEP: ${header("cross-origin-embedder-policy")}`
          : "",
      ]
        .filter(Boolean)
        .join("; ") || "No COOP, CORP, or COEP headers detected.",
    recommendation:
      "Use COOP/CORP/COEP where appropriate to reduce cross-origin data exposure and browser side-channel risk.",
  });

  findings.push({
    check: "Version disclosure",
    severity: server || poweredBy ? "low" : "pass",
    points: server || poweredBy ? 2 : 6,
    maxPoints: 6,
    owasp: "A06: Vulnerable and Outdated Components",
    evidence:
      [server ? `Server: ${server}` : "", poweredBy ? `X-Powered-By: ${poweredBy}` : ""]
        .filter(Boolean)
        .join("; ") || "No obvious server/framework disclosure headers detected.",
    recommendation:
      "Minimize version and framework disclosure in response headers where possible.",
  });

  findings.push({
    check: "Response availability",
    severity: status >= 500 ? "medium" : "pass",
    points: status < 500 ? 12 : 0,
    maxPoints: 12,
    owasp: "A09: Security Logging and Monitoring Failures",
    evidence: `Probe returned HTTP ${status}.`,
    recommendation:
      "Investigate server errors before deeper testing; scanners can miss controls behind failures.",
  });

  findings.push({
    check: "TLS CBC cipher exposure",
    severity: certificate?.cipher.toUpperCase().includes("CBC") ? "medium" : "pass",
    points: certificate?.cipher.toUpperCase().includes("CBC") ? 0 : 8,
    maxPoints: 8,
    owasp: "A02: Cryptographic Failures",
    evidence: certificate
      ? `Negotiated cipher: ${certificate.cipher}`
      : "No TLS cipher data available.",
    recommendation:
      "Disable CBC-mode TLS ciphers and prefer TLS 1.2/1.3 AEAD suites such as AES-GCM or ChaCha20-Poly1305.",
  });

  const riskyOpenPorts = openPorts.filter(
    (port) => port.open && ![80, 443].includes(port.port)
  );
  findings.push({
    check: "Redundant exposed services",
    severity: riskyOpenPorts.length > 0 ? "medium" : "pass",
    points: riskyOpenPorts.length > 0 ? 0 : 8,
    maxPoints: 8,
    owasp: "A05: Security Misconfiguration",
    evidence:
      riskyOpenPorts.length > 0
        ? riskyOpenPorts
            .map((port) => `${port.service} (${port.port})`)
            .join(", ")
        : "No common non-web service ports were reachable.",
    recommendation:
      "Expose only required services publicly; move admin, database, and cache ports behind private networks or VPNs.",
  });

  findings.push({
    check: "Cookie hardening",
    severity: cookieIssues.length > 0 ? "medium" : "pass",
    points: cookieIssues.length > 0 ? 2 : 8,
    maxPoints: 8,
    owasp: "A07: Identification and Authentication Failures",
    evidence:
      cookieIssues.length > 0
        ? cookieIssues.join("; ")
        : "No insecure Set-Cookie attributes detected.",
    recommendation:
      "Set Secure, HttpOnly, and SameSite=Lax or Strict on session cookies.",
  });

  findings.push({
    check: "Token and JWT exposure hints",
    severity: contentSignals.tokenHints.length > 0 ? "high" : "pass",
    points: contentSignals.tokenHints.length > 0 ? 0 : 8,
    maxPoints: 8,
    owasp: "A02: Cryptographic Failures",
    evidence:
      contentSignals.tokenHints.length > 0
        ? contentSignals.tokenHints.join("; ")
        : "No obvious JWT or bearer token literals detected in sampled HTML.",
    recommendation:
      "Do not expose tokens in HTML, JavaScript globals, URLs, comments, or localStorage bootstraps.",
  });

  findings.push({
    check: "Mixed-content references",
    severity: contentSignals.mixedContent.length > 0 ? "medium" : "pass",
    points: contentSignals.mixedContent.length > 0 ? 1 : 6,
    maxPoints: 6,
    owasp: "A02: Cryptographic Failures",
    evidence:
      contentSignals.mixedContent.length > 0
        ? contentSignals.mixedContent.join("; ")
        : "No obvious HTTP subresource references detected in sampled HTML.",
    recommendation:
      "Load scripts, styles, images, frames, and API endpoints over HTTPS only; block mixed content with CSP upgrade-insecure-requests.",
  });

  findings.push({
    check: "Client-side dangerous sink hints",
    severity: contentSignals.dangerousJsSinks.length > 0 ? "medium" : "pass",
    points: contentSignals.dangerousJsSinks.length > 0 ? 2 : 7,
    maxPoints: 7,
    owasp: "A03: Injection",
    evidence:
      contentSignals.dangerousJsSinks.length > 0
        ? contentSignals.dangerousJsSinks.join("; ")
        : "No obvious eval, document.write, innerHTML, or dynamic Function hints found in sampled HTML.",
    recommendation:
      "Review client code for DOM XSS sinks and ensure untrusted data is encoded, sanitized, or rendered through safe framework APIs.",
  });

  findings.push({
    check: "Sensitive route discovery hints",
    severity: contentSignals.sensitivePathHints.length > 0 ? "low" : "pass",
    points: contentSignals.sensitivePathHints.length > 0 ? 3 : 6,
    maxPoints: 6,
    owasp: "A01: Broken Access Control",
    evidence:
      contentSignals.sensitivePathHints.length > 0
        ? contentSignals.sensitivePathHints.join("; ")
        : "No obvious admin, debug, GraphQL, Swagger, or API documentation links in sampled HTML.",
    recommendation:
      "Keep admin/debug/API docs behind authentication, validate authorization server-side, and avoid public breadcrumbs to privileged surfaces.",
  });

  findings.push({
    check: "HTML comments and leaked code notes",
    severity: contentSignals.commentFindings.length > 0 ? "low" : "pass",
    points: contentSignals.commentFindings.length > 0 ? 3 : 6,
    maxPoints: 6,
    owasp: "A05: Security Misconfiguration",
    evidence:
      contentSignals.commentFindings.length > 0
        ? contentSignals.commentFindings.join("; ")
        : "No suspicious HTML comments found in the sampled response.",
    recommendation:
      "Remove debug comments, TODOs, internal paths, credentials, and deployment notes from client-delivered assets.",
  });

  findings.push({
    check: "Client library version disclosure",
    severity: contentSignals.versionDisclosures.length > 0 ? "low" : "pass",
    points: contentSignals.versionDisclosures.length > 0 ? 3 : 6,
    maxPoints: 6,
    owasp: "A06: Vulnerable and Outdated Components",
    evidence:
      contentSignals.versionDisclosures.length > 0
        ? contentSignals.versionDisclosures.join("; ")
        : "No obvious client library versions found in sampled HTML.",
    recommendation:
      "Inventory disclosed client libraries and compare versions against vendor advisories and CVE feeds.",
  });

  findings.push({
    check: "Password form policy hints",
    severity:
      contentSignals.passwordIssues.length > 0
        ? "medium"
        : contentSignals.hasPasswordForm
          ? "pass"
          : "info",
    points: contentSignals.passwordIssues.length > 0 ? 2 : 6,
    maxPoints: 6,
    owasp: "A07: Identification and Authentication Failures",
    evidence:
      contentSignals.passwordIssues.length > 0
        ? contentSignals.passwordIssues.join("; ")
        : contentSignals.hasPasswordForm
          ? "Password form includes baseline client-side policy hints."
          : "No password form detected in sampled HTML.",
    recommendation:
      "Use strong server-side password policy, breached-password checks, MFA, rate limiting, and safe autocomplete values.",
  });

  findings.push({
    check: "SSRF and unsafe URL input hints",
    severity: contentSignals.ssrfHints.length > 0 ? "medium" : "pass",
    points: contentSignals.ssrfHints.length > 0 ? 2 : 8,
    maxPoints: 8,
    owasp: "A10: Server-Side Request Forgery",
    evidence:
      contentSignals.ssrfHints.length > 0
        ? contentSignals.ssrfHints.join("; ")
        : "No obvious URL-fetching, redirect, callback, or webhook parameters detected in the sampled page.",
    recommendation:
      "Validate URL inputs with allowlists, block private IP ranges after DNS resolution, disable redirects where possible, and isolate outbound fetchers.",
  });

  findings.push({
    check: "CSRF passive form hints",
    severity:
      contentSignals.csrfIssues.length > 0 ||
      contentSignals.externalFormActions.length > 0
        ? "medium"
        : "pass",
    points:
      contentSignals.csrfIssues.length > 0 ||
      contentSignals.externalFormActions.length > 0
        ? 2
        : 8,
    maxPoints: 8,
    owasp: "A01: Broken Access Control",
    evidence:
      contentSignals.csrfIssues.length > 0 ||
      contentSignals.externalFormActions.length > 0
        ? [...contentSignals.csrfIssues, ...contentSignals.externalFormActions].join("; ")
        : "No obvious unsafe forms without CSRF hints were detected in sampled HTML.",
    recommendation:
      "Require server-validated CSRF tokens on state-changing browser forms and pair them with SameSite cookies.",
  });

  findings.push({
    check: "Input validation passive hints",
    severity:
      contentSignals.inputValidationIssues.length > 4
        ? "medium"
        : contentSignals.inputValidationIssues.length > 0
          ? "low"
          : "pass",
    points:
      contentSignals.inputValidationIssues.length > 4
        ? 2
        : contentSignals.inputValidationIssues.length > 0
          ? 5
          : 8,
    maxPoints: 8,
    owasp: "A03: Injection",
    evidence:
      contentSignals.inputValidationIssues.length > 0
        ? contentSignals.inputValidationIssues.join("; ")
        : "Sampled form inputs expose baseline client-side validation hints.",
    recommendation:
      "Enforce allowlist validation server-side for every parameter and add client hints such as required, maxlength, pattern, and typed inputs.",
  });

  return findings;
}

function isStrictCacheControl(cacheControl: string) {
  const normalized = cacheControl.toLowerCase();
  return (
    normalized.includes("no-store") &&
    normalized.includes("no-cache") &&
    normalized.includes("max-age=0")
  );
}

async function probeCommonPorts(hostname: string, protocol: string) {
  const ports = [
    { port: 21, service: "FTP" },
    { port: 22, service: "SSH" },
    { port: 25, service: "SMTP" },
    { port: 80, service: "HTTP" },
    { port: 110, service: "POP3" },
    { port: 143, service: "IMAP" },
    { port: 443, service: "HTTPS" },
    { port: 445, service: "SMB" },
    { port: 3306, service: "MySQL" },
    { port: 3389, service: "RDP" },
    { port: 5432, service: "PostgreSQL" },
    { port: 6379, service: "Redis" },
    { port: 8080, service: "Alternate HTTP" },
    { port: 8443, service: "Alternate HTTPS" },
  ];
  const defaultPort = protocol === "https:" ? 443 : 80;

  const results = await Promise.all(
    ports.map(
      (entry) =>
        new Promise<{ port: number; service: string; open: boolean }>(
          (resolve) => {
            const socket = net.connect({
              host: hostname,
              port: entry.port,
              timeout: entry.port === defaultPort ? 1200 : 800,
            });

            socket.on("connect", () => {
              socket.destroy();
              resolve({ ...entry, open: true });
            });
            socket.on("timeout", () => {
              socket.destroy();
              resolve({ ...entry, open: false });
            });
            socket.on("error", () => resolve({ ...entry, open: false }));
          }
        )
    )
  );

  return results;
}

function analyzeContent(body: string, target: URL) {
  const comments = Array.from(body.matchAll(/<!--([\s\S]*?)-->/g))
    .map((match) => match[1].replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 8);
  const suspiciousComments = comments.filter((comment) =>
    /(todo|fixme|password|secret|token|api[_-]?key|debug|internal|staging)/i.test(
      comment
    )
  );
  const jwtMatches = Array.from(
    body.matchAll(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{8,}\b/g)
  ).map(() => "JWT-like token literal found");
  const tokenHints = [
    ...jwtMatches,
    ...Array.from(
      body.matchAll(
        /(access_token|id_token|refresh_token|authorization["']?\s*:\s*["']?bearer|localStorage\.[gs]etItem\(["'][^"']*token)/gi
      )
    ).map((match) => `Token keyword: ${match[1]}`),
  ].slice(0, 8);
  const versionDisclosures = [
    ...Array.from(
      body.matchAll(
        /(jquery|bootstrap|lodash|angular|react|vue|next|express|axios)[\w./@-]*?([0-9]+\.[0-9]+(?:\.[0-9]+)?)/gi
      )
    ).map((match) => `${match[1]} ${match[2]}`),
    ...Array.from(
      body.matchAll(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)/gi)
    ).map((match) => `Generator: ${match[1]}`),
  ].slice(0, 8);
  const passwordInputs = Array.from(
    body.matchAll(/<input[^>]+type=["']password["'][^>]*>/gi)
  ).map((match) => match[0]);
  const forms = Array.from(body.matchAll(/<form\b[\s\S]*?<\/form>/gi)).map(
    (match) => match[0]
  );
  const allInputs = Array.from(body.matchAll(/<input\b[^>]*>/gi)).map(
    (match) => match[0]
  );
  const interestingUrlNames =
    /(?:^|["'\s_-])(url|uri|redirect|return|next|continue|callback|webhook|feed|image|avatar|file|path|dest|destination)(?:$|["'\s_-])/i;
  const ssrfHints = [
    ...Array.from(target.searchParams.keys())
      .filter((name) => interestingUrlNames.test(name))
      .map((name) => `URL parameter "${name}" may influence redirects or server-side fetches`),
    ...allInputs
      .filter((input) => interestingUrlNames.test(getAttribute(input, "name")))
      .map((input) => {
        const name = getAttribute(input, "name") || "unnamed";
        return `Form input "${name}" looks URL, callback, redirect, or webhook related`;
      }),
  ].slice(0, 8);
  const mixedContent = Array.from(
    body.matchAll(
      /<(script|link|img|iframe|source|video|audio|form)\b[^>]+(?:src|href|action)=["']http:\/\/([^"']+)/gi
    )
  )
    .map((match) => `HTTP ${match[1].toLowerCase()} reference to ${match[2].slice(0, 90)}`)
    .slice(0, 8);
  const dangerousJsSinks = Array.from(
    body.matchAll(
      /\b(eval\s*\(|new\s+Function\s*\(|document\.write\s*\(|\.innerHTML\s*=|dangerouslySetInnerHTML|setTimeout\s*\(\s*["'`]|setInterval\s*\(\s*["'`])/gi
    )
  )
    .map((match) => `Potential DOM sink: ${match[1].replace(/\s+/g, " ").trim()}`)
    .slice(0, 8);
  const sensitivePathHints = Array.from(
    body.matchAll(
      /(?:href|src|action)=["']([^"']*(?:\/admin\b|\/debug\b|\/swagger\b|\/api-docs\b|\/graphql\b|\/actuator\b|\/console\b|\/internal\b|\/_next\/static|\/openapi)[^"']*)["']/gi
    )
  )
    .map((match) => `Exposed path reference: ${new URL(match[1], target).pathname}`)
    .slice(0, 8);
  const externalFormActions = forms
    .map((form, index) => {
      const action = getAttribute(form, "action");

      if (!action) return "";

      const actionUrl = new URL(action, target);

      if (actionUrl.origin !== target.origin) {
        return `Form ${index + 1} posts to external origin ${actionUrl.origin}`;
      }

      return "";
    })
    .filter(Boolean)
    .slice(0, 6);
  const csrfIssues = forms
    .map((form, index) => {
      const method = getAttribute(form, "method").toLowerCase() || "get";
      const hasToken =
        /(name|id)=["'][^"']*(csrf|xsrf|_token|authenticity_token)[^"']*["']/i.test(
          form
        );

      if (method === "post" && !hasToken) {
        return `POST form ${index + 1} has no visible CSRF token field`;
      }

      return "";
    })
    .filter(Boolean)
    .slice(0, 8);
  const inputValidationIssues = allInputs
    .flatMap((input, index) => {
      const type = (getAttribute(input, "type") || "text").toLowerCase();
      const name = getAttribute(input, "name") || getAttribute(input, "id") || `input ${index + 1}`;
      const shouldValidate = [
        "text",
        "search",
        "email",
        "url",
        "tel",
        "password",
        "number",
      ].includes(type);
      const issues: string[] = [];

      if (!shouldValidate || /type=["']hidden["']/i.test(input)) {
        return issues;
      }

      if (!/\srequired(?:\s|>|=)/i.test(input)) {
        issues.push(`${name} is not marked required`);
      }

      if (!/(maxlength|pattern|min|max)=/i.test(input)) {
        issues.push(`${name} has no visible length, range, or pattern hint`);
      }

      return issues;
    })
    .slice(0, 10);
  const passwordIssues = passwordInputs.flatMap((input, index) => {
    const label = `password field ${index + 1}`;
    const issues = [];

    if (!/autocomplete=["'](?:current-password|new-password)/i.test(input)) {
      issues.push(`${label} missing safe autocomplete hint`);
    }

    if (!/(minlength|pattern)=/i.test(input)) {
      issues.push(`${label} has no visible minlength or pattern hint`);
    }

    return issues;
  });

  return {
    hasPasswordForm: passwordInputs.length > 0,
    commentFindings:
      suspiciousComments.length > 0
        ? suspiciousComments.slice(0, 4)
        : comments.length > 0
          ? [`${comments.length} HTML comment(s) present`]
          : [],
    tokenHints: Array.from(new Set(tokenHints)),
    versionDisclosures: Array.from(new Set(versionDisclosures)),
    passwordIssues: passwordIssues.slice(0, 6),
    ssrfHints: Array.from(new Set(ssrfHints)),
    csrfIssues: Array.from(new Set(csrfIssues)),
    inputValidationIssues: Array.from(new Set(inputValidationIssues)),
    mixedContent: Array.from(new Set(mixedContent)),
    dangerousJsSinks: Array.from(new Set(dangerousJsSinks)),
    sensitivePathHints: Array.from(new Set(sensitivePathHints)),
    externalFormActions: Array.from(new Set(externalFormActions)),
  };
}

function getAttribute(tag: string, attribute: string) {
  const match = tag.match(new RegExp(`${attribute}=["']([^"']*)["']`, "i"));
  return match?.[1] ?? "";
}

function analyzeCookies(setCookieHeader: string) {
  if (!setCookieHeader) {
    return [];
  }

  return setCookieHeader
    .split(/\n(?=[^;=]+=)/)
    .flatMap((cookie, index) => {
      const label = `cookie ${index + 1}`;
      const issues = [];

      if (!/;\s*secure\b/i.test(cookie)) {
        issues.push(`${label} missing Secure`);
      }

      if (!/;\s*httponly\b/i.test(cookie)) {
        issues.push(`${label} missing HttpOnly`);
      }

      if (!/;\s*samesite=(lax|strict|none)/i.test(cookie)) {
        issues.push(`${label} missing SameSite`);
      }

      if (/;\s*samesite=none/i.test(cookie) && !/;\s*secure\b/i.test(cookie)) {
        issues.push(`${label} uses SameSite=None without Secure`);
      }

      return issues;
    })
    .slice(0, 8);
}

function analyzeCsp(csp = "") {
  if (!csp) {
    return [];
  }

  const normalized = csp.toLowerCase();
  const issues = [];

  if (normalized.includes("unsafe-inline")) {
    issues.push("script/style allows unsafe-inline");
  }

  if (normalized.includes("unsafe-eval")) {
    issues.push("script allows unsafe-eval");
  }

  if (/\s\*\s|:\*/.test(normalized)) {
    issues.push("wildcard source detected");
  }

  if (!normalized.includes("object-src")) {
    issues.push("object-src directive missing");
  }

  if (!normalized.includes("base-uri")) {
    issues.push("base-uri directive missing");
  }

  if (!normalized.includes("frame-ancestors")) {
    issues.push("frame-ancestors directive missing");
  }

  if (!normalized.includes("form-action")) {
    issues.push("form-action directive missing");
  }

  return issues.slice(0, 8);
}

function gradeScore(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function createScoreBreakdown(
  findings: Finding[],
  earnedPoints: number,
  possiblePoints: number
) {
  const severityCounts = findings.reduce<Record<FindingSeverity, number>>(
    (counts, finding) => ({
      ...counts,
      [finding.severity]: counts[finding.severity] + 1,
    }),
    { pass: 0, info: 0, low: 0, medium: 0, high: 0 }
  );
  const categories = findings.reduce<
    Record<string, { earned: number; possible: number; checks: number }>
  >((result, finding) => {
    const current = result[finding.owasp] ?? { earned: 0, possible: 0, checks: 0 };

    return {
      ...result,
      [finding.owasp]: {
        earned: current.earned + finding.points,
        possible: current.possible + finding.maxPoints,
        checks: current.checks + 1,
      },
    };
  }, {});

  return {
    earnedPoints,
    possiblePoints,
    severityCounts,
    categories,
    gradeBands: [
      "A: 90-100 strong preliminary posture",
      "B: 80-89 good posture with minor hardening gaps",
      "C: 70-79 fair posture with meaningful remediation items",
      "D: 60-69 moderate/weak posture requiring fixes before pentest",
      "F: below 60 high-risk baseline gaps likely to create avoidable findings",
    ],
  };
}

function summarize(
  score: number,
  findings: Finding[],
  grade: string,
  scoreBreakdown: ReturnType<typeof createScoreBreakdown>
) {
  const failed = findings.filter((finding) => finding.severity !== "pass");
  const topRisks = failed
    .filter((finding) => ["high", "medium"].includes(finding.severity))
    .map((finding) => finding.check);
  const highCount = scoreBreakdown.severityCounts.high;
  const mediumCount = scoreBreakdown.severityCounts.medium;

  return {
    posture:
      score >= 80
        ? "Strong preliminary posture"
        : score >= 60
          ? "Moderate preliminary posture"
          : "Weak preliminary posture",
    topRisks,
    scoreRationale: `Grade ${grade} is based on ${scoreBreakdown.earnedPoints}/${scoreBreakdown.possiblePoints} weighted passive-control points. The score includes ${highCount} high and ${mediumCount} medium findings; high-impact controls such as HTTPS, CSP, HSTS, CORS, cookies, token exposure, and public services carry more weight than informational observations.`,
    nextStep:
      topRisks.length > 0
        ? "Fix the high and medium findings before a full pentest."
        : "Proceed to authenticated testing, API mapping, and business logic review.",
  };
}
