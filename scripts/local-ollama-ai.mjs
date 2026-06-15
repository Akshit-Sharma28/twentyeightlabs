#!/usr/bin/env node

import { spawn, execFile } from "node:child_process";
import { existsSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const command = process.argv[2] ?? "status";
const prompt = process.argv.slice(3).join(" ").trim();
const baseUrl = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(
  /\/$/,
  ""
);
const model = process.env.OLLAMA_MODEL ?? "qwen3:8b";
const statePath = resolve(".ollama-ai-state.json");
const logPath = resolve(".ollama-ai.log");

async function main() {
  if (command === "start") {
    await start();
    return;
  }

  if (command === "status") {
    await printStatus();
    return;
  }

  if (command === "ask") {
    await ask();
    return;
  }

  help();
}

async function start() {
  const before = await getHealth();

  if (!before.up) {
    const hasOllama = await commandExists("ollama");

    if (!hasOllama) {
      fail("Ollama is not installed or not on PATH. Install Ollama first, then rerun this script.");
    }

    const logFd = openSync(logPath, "a");
    const child = spawn("ollama", ["serve"], {
      detached: true,
      stdio: ["ignore", logFd, logFd],
    });
    child.unref();
    writeState({ trackedSince: new Date().toISOString(), logPath });

    await waitForOllama();
  }

  await printStatus();
}

async function printStatus() {
  const health = await getHealth();
  const processSince = await getOllamaProcessSince();
  const state = readState();

  line("Atomix Local AI / Ollama");
  line("------------------------");
  line(`Base URL: ${baseUrl}`);
  line(`Status: ${health.up ? "up" : "down"}`);

  if (!health.up) {
    line(`Detail: ${health.detail}`);
    line(`Run: npm run ai:local`);
    return;
  }

  const [tags, running] = await Promise.all([getTags(), getRunningModels()]);
  const installed = tags.some((item) => item.name === model || item.name.startsWith(`${model}:`));
  const runningModel = running.find(
    (item) => item.name === model || item.name.startsWith(`${model}:`)
  );

  line(`Version: ${health.version ?? "unknown"}`);
  line(`Configured model: ${model}`);
  line(`Model installed: ${installed ? "yes" : "no"}`);
  line(`Model loaded: ${runningModel ? "yes" : "no"}`);
  line(`Running models: ${running.map((item) => item.name).join(", ") || "none loaded yet"}`);
  line(`Up since: ${processSince ?? state.trackedSince ?? "unknown"}`);
  line(`Tracked prompt tokens: ${state.promptTokens ?? 0}`);
  line(`Tracked response tokens: ${state.responseTokens ?? 0}`);
  line(`Tracked total tokens: ${(state.promptTokens ?? 0) + (state.responseTokens ?? 0)}`);

  if (!installed) {
    line("");
    line(`Model is not installed. Run: ollama pull ${model}`);
  }
}

async function ask() {
  const health = await getHealth();

  if (!health.up) {
    await start();
  }

  const input =
    prompt ||
    "Reply with one sentence confirming you are ready to act as a Web, LLM, and API pentest assistant.";

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      prompt: input,
      system:
        "You are Atomix Local AI. Act as a careful Web, LLM, and API pentester. Keep answers concise and safe.",
    }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    fail(
      `Ollama generate failed with HTTP ${response.status}. ${
        data?.error ? `Detail: ${data.error}` : `Try: ollama pull ${model}`
      }`
    );
  }

  const promptTokens = Number(data?.prompt_eval_count ?? 0);
  const responseTokens = Number(data?.eval_count ?? 0);
  const state = readState();
  writeState({
    ...state,
    trackedSince: state.trackedSince ?? new Date().toISOString(),
    promptTokens: (state.promptTokens ?? 0) + promptTokens,
    responseTokens: (state.responseTokens ?? 0) + responseTokens,
    lastModel: model,
    lastPromptTokens: promptTokens,
    lastResponseTokens: responseTokens,
    lastRunAt: new Date().toISOString(),
  });

  line(data?.response ?? "");
  line("");
  line(`Model: ${model}`);
  line(`This request tokens: prompt=${promptTokens}, response=${responseTokens}, total=${promptTokens + responseTokens}`);
  line(`Tracked tokens updated in ${statePath}`);
}

async function waitForOllama() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const health = await getHealth();

    if (health.up) {
      return;
    }

    await sleep(500);
  }

  fail(`Started ollama serve, but ${baseUrl} did not become ready. Check ${logPath}.`);
}

async function getHealth() {
  try {
    const response = await fetch(`${baseUrl}/api/version`, {
      signal: AbortSignal.timeout(1500),
    });
    const data = await response.json().catch(() => ({}));

    return {
      up: response.ok,
      version: data.version,
      detail: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      up: false,
      detail: error instanceof Error ? error.message : "connection failed",
    };
  }
}

async function getTags() {
  const response = await fetch(`${baseUrl}/api/tags`, {
    signal: AbortSignal.timeout(2500),
  }).catch(() => null);
  const data = await response?.json().catch(() => null);
  return Array.isArray(data?.models) ? data.models : [];
}

async function getRunningModels() {
  const response = await fetch(`${baseUrl}/api/ps`, {
    signal: AbortSignal.timeout(2500),
  }).catch(() => null);
  const data = await response?.json().catch(() => null);
  return Array.isArray(data?.models) ? data.models : [];
}

async function commandExists(binary) {
  try {
    await execFileAsync("which", [binary]);
    return true;
  } catch {
    return false;
  }
}

async function getOllamaProcessSince() {
  try {
    const { stdout: pidOutput } = await execFileAsync("pgrep", ["-f", "ollama"]);
    const pid = pidOutput
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean)[0];

    if (!pid) {
      return null;
    }

    const { stdout } = await execFileAsync("ps", ["-p", pid, "-o", "lstart="]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
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

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function line(value) {
  console.log(value);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function help() {
  line("Usage:");
  line("  npm run ai:local        # start Ollama if needed and print status");
  line("  npm run ai:status       # print Ollama status");
  line("  npm run ai:ask -- hi    # test generation and update token counters");
  line("");
  line("Environment:");
  line("  OLLAMA_BASE_URL=http://127.0.0.1:11434");
  line("  OLLAMA_MODEL=llama3.2:3b");
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : "Unexpected local AI script failure.");
});
