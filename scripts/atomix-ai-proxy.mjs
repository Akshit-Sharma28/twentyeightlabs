#!/usr/bin/env node

import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const host = process.env.ATOMIX_AI_PROXY_HOST ?? "127.0.0.1";
const port = Number(process.env.ATOMIX_AI_PROXY_PORT ?? 8787);
const ollamaBaseUrl = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(
  /\/$/,
  ""
);
const model = process.env.OLLAMA_MODEL ?? "qwen3:8b";
const tokenPath = resolve(".atomix-ai-proxy-token");
const token = process.env.ATOMIX_AI_PROXY_TOKEN ?? readOrCreateToken();
const statePath = resolve(".ollama-ai-state.json");
const startedAt = new Date().toISOString();

const server = createServer(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.url === "/health" && request.method === "GET") {
    await handleHealth(response);
    return;
  }

  if (request.url === "/analyze" && request.method === "POST") {
    if (!isAuthorized(request)) {
      sendJson(response, 401, { error: "Unauthorized" });
      return;
    }

    await handleAnalyze(request, response);
    return;
  }

  if (
    request.url?.startsWith("/api/tags") ||
    request.url?.startsWith("/api/generate")
  ) {
    if (!isAuthorized(request)) {
      sendJson(response, 401, { error: "Unauthorized" });
      return;
    }

    await forwardOllama(request, response);
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, host, () => {
  console.log("Atomix AI Proxy");
  console.log("---------------");
  console.log(`Local URL: http://${host}:${port}`);
  console.log(`Health: http://${host}:${port}/health`);
  console.log(`Analyze endpoint: http://${host}:${port}/analyze`);
  console.log(`Model: ${model}`);
  console.log(`Proxy token file: ${tokenPath}`);
  console.log("");
  console.log("For Vercel:");
  console.log("  ATOMIX_AI_ENDPOINT=<your tunnel URL>/analyze");
  console.log(`  ATOMIX_AI_API_KEY=${token}`);
});

async function handleHealth(response) {
  const health = await getOllamaHealth();
  const running = await getRunningModels();
  const state = readState();

  sendJson(response, health.up ? 200 : 503, {
    status: health.up ? "online" : "offline",
    startedAt,
    ollama: health,
    model,
    loaded: running.some((item) => item.name === model || item.name.startsWith(`${model}:`)),
    runningModels: running.map((item) => item.name),
    trackedTokens: {
      prompt: state.promptTokens ?? 0,
      response: state.responseTokens ?? 0,
      total: (state.promptTokens ?? 0) + (state.responseTokens ?? 0),
    },
  });
}

async function handleAnalyze(request, response) {
  const body = await readJson(request);
  const tool = String(body?.tool ?? "general");
  const payload = body?.payload ?? {};

  const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: "json",
      system:
        "You are Atomix Local AI. Act as a careful Web, LLM, and API pentester. Return JSON only with summary, priority, findings, likelyAttackPaths, testIdeas, and nextActions. Keep recommendations safe and focused on authorized defensive testing.",
      prompt: `Tool: ${tool}\nPayload JSON:\n${JSON.stringify(payload, null, 2)}`,
    }),
  });
  const data = await ollamaResponse.json().catch(() => null);

  if (!ollamaResponse.ok || !data?.response) {
    sendJson(response, 502, {
      error: "Ollama generation failed.",
      detail: data?.error ?? `HTTP ${ollamaResponse.status}`,
    });
    return;
  }

  const promptTokens = Number(data.prompt_eval_count ?? 0);
  const responseTokens = Number(data.eval_count ?? 0);
  const parsed = parseModelJson(data.response);
  const state = readState();

  writeState({
    ...state,
    trackedSince: state.trackedSince ?? startedAt,
    promptTokens: (state.promptTokens ?? 0) + promptTokens,
    responseTokens: (state.responseTokens ?? 0) + responseTokens,
    lastModel: model,
    lastPromptTokens: promptTokens,
    lastResponseTokens: responseTokens,
    lastRunAt: new Date().toISOString(),
  });

  sendJson(response, 200, {
    ...parsed,
    model,
    tokenUsage: {
      prompt: promptTokens,
      response: responseTokens,
      total: promptTokens + responseTokens,
    },
  });
}

async function forwardOllama(request, response) {
  const body = request.method === "GET" ? undefined : await readRawBody(request);
  const upstreamResponse = await fetch(`${ollamaBaseUrl}${request.url}`, {
    method: request.method,
    headers: {
      "content-type": request.headers["content-type"] ?? "application/json",
    },
    body,
  });
  const responseBody = Buffer.from(await upstreamResponse.arrayBuffer());

  response.writeHead(upstreamResponse.status, {
    "content-type":
      upstreamResponse.headers.get("content-type") ?? "application/json",
  });
  response.end(responseBody);
}

async function getOllamaHealth() {
  try {
    const response = await fetch(`${ollamaBaseUrl}/api/version`, {
      signal: AbortSignal.timeout(2000),
    });
    const data = await response.json().catch(() => ({}));

    return {
      up: response.ok,
      baseUrl: ollamaBaseUrl,
      version: data.version ?? "unknown",
    };
  } catch (error) {
    return {
      up: false,
      baseUrl: ollamaBaseUrl,
      detail: error instanceof Error ? error.message : "connection failed",
    };
  }
}

async function getRunningModels() {
  const response = await fetch(`${ollamaBaseUrl}/api/ps`, {
    signal: AbortSignal.timeout(2000),
  }).catch(() => null);
  const data = await response?.json().catch(() => null);
  return Array.isArray(data?.models) ? data.models : [];
}

function isAuthorized(request) {
  const auth = request.headers.authorization ?? "";
  return auth === `Bearer ${token}`;
}

function readOrCreateToken() {
  if (existsSync(tokenPath)) {
    return readFileSync(tokenPath, "utf8").trim();
  }

  const nextToken = randomBytes(32).toString("hex");
  writeFileSync(tokenPath, `${nextToken}\n`, { mode: 0o600 });
  return nextToken;
}

function readState() {
  if (!existsSync(statePath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(statePath, "utf8"));
  } catch {
    return {};
  }
}

function writeState(nextState) {
  writeFileSync(statePath, `${JSON.stringify(nextState, null, 2)}\n`);
}

function parseModelJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {
      summary: value,
      priority: "medium",
      findings: [],
      likelyAttackPaths: [],
      testIdeas: [],
      nextActions: ["Review the raw local model output and rerun with more structured input."],
    };
  }
}

function readJson(request) {
  return new Promise((resolve) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function readRawBody(request) {
  return new Promise((resolve) => {
    const chunks = [];

    request.on("data", (chunk) => {
      chunks.push(chunk);
    });
    request.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

function setCors(response) {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "authorization,content-type");
}

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}
