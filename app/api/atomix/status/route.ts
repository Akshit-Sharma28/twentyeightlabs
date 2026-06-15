import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const endpoint = process.env.ATOMIX_AI_ENDPOINT;
  const ollamaEndpoint = process.env.OLLAMA_BASE_URL;

  if (!endpoint) {
    if (!ollamaEndpoint && process.env.NODE_ENV !== "development") {
      return NextResponse.json({
        status: "offline",
        label: "Offline",
        detail: "No Atomix or Ollama endpoint is configured.",
      });
    }

    const localEndpoint = (ollamaEndpoint ?? "http://127.0.0.1:11434").replace(
      /\/$/,
      ""
    );

    return checkEndpoint(`${localEndpoint}/api/version`, "Local AI Online");
  }

  return checkEndpoint(statusEndpointFor(endpoint), "Local AI Online");
}

function statusEndpointFor(endpoint: string) {
  try {
    const url = new URL(endpoint);

    if (url.pathname.endsWith("/analyze")) {
      url.pathname = url.pathname.replace(/\/analyze$/, "/health");
    }

    return url.toString();
  } catch {
    return endpoint;
  }
}

async function checkEndpoint(endpoint: string, onlineLabel: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
      headers: { accept: "application/json,text/plain,*/*" },
    });

    const reachable = response.ok || [401, 403, 405].includes(response.status);

    return NextResponse.json({
      status: reachable ? "online" : "offline",
      label: reachable ? onlineLabel : "Offline",
      detail: `Health probe returned HTTP ${response.status}.`,
    });
  } catch {
    return NextResponse.json({
      status: "offline",
      label: "Offline",
      detail: "Health probe failed or timed out.",
    });
  } finally {
    clearTimeout(timeout);
  }
}
