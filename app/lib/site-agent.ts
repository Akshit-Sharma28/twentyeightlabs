import { capabilities, research, tools, ventures } from "../data";

export type AgentTraceStep = {
  step: number;
  phase: "plan" | "tool" | "answer";
  label: string;
  status: "completed" | "failed";
  detail: string;
  elapsedMs: number;
};

type AgentAction =
  | { action: "tool"; tool: AgentToolName; arguments?: Record<string, unknown>; reason?: string }
  | { action: "final"; answer: string };

type AgentToolName =
  | "site_overview"
  | "search_research"
  | "inspect_security_tool"
  | "build_security_workflow";

type Observation = { tool: AgentToolName; result: unknown };

const MAX_TOOL_CALLS = 4;
const MAX_OBSERVATION_CHARS = 14000;

const toolDefinitions = [
  { name: "site_overview", description: "Inspect Twenty Eight Labs capabilities, ventures, and available security tools.", arguments: {} },
  { name: "search_research", description: "Find relevant security research by topic or keyword.", arguments: { query: "string" } },
  { name: "inspect_security_tool", description: "Inspect a site tool, its inputs, outputs, workflow, maturity, and use cases.", arguments: { slug: "string" } },
  { name: "build_security_workflow", description: "Create a grounded workflow by selecting relevant site tools and research for an objective.", arguments: { objective: "string" } },
] as const;

export async function runSiteAgent(question: string, page: string, history: unknown[]) {
  const startedAt = Date.now();
  const trace: AgentTraceStep[] = [];
  const observations: Observation[] = [];
  let finalAnswer = "";

  for (let step = 1; step <= MAX_TOOL_CALLS + 1; step += 1) {
    const planningStarted = Date.now();
    const action = await planNextAction(question, page, history, observations);
    trace.push({
      step: trace.length + 1,
      phase: "plan",
      label: action.action === "tool" ? `Selected ${action.tool}` : "Completed reasoning",
      status: "completed",
      detail: action.action === "tool" ? action.reason ?? "Selected from available read-only tools." : "Enough evidence collected to answer.",
      elapsedMs: Date.now() - planningStarted,
    });

    if (action.action === "final") {
      finalAnswer = action.answer;
      break;
    }

    const toolStarted = Date.now();
    try {
      const result = executeTool(action.tool, action.arguments ?? {}, question);
      observations.push({ tool: action.tool, result });
      trace.push({
        step: trace.length + 1,
        phase: "tool",
        label: action.tool,
        status: "completed",
        detail: summarizeResult(result),
        elapsedMs: Date.now() - toolStarted,
      });
    } catch (error) {
      trace.push({
        step: trace.length + 1,
        phase: "tool",
        label: action.tool,
        status: "failed",
        detail: error instanceof Error ? error.message : "Tool failed.",
        elapsedMs: Date.now() - toolStarted,
      });
    }
  }

  if (!finalAnswer) finalAnswer = deterministicSynthesis(question, observations);
  trace.push({
    step: trace.length + 1,
    phase: "answer",
    label: "Synthesized grounded answer",
    status: "completed",
    detail: `Used ${observations.length} tool observation${observations.length === 1 ? "" : "s"}.`,
    elapsedMs: Date.now() - startedAt,
  });

  return { answer: finalAnswer, trace, toolCalls: observations.length, durationMs: Date.now() - startedAt };
}

async function planNextAction(question: string, page: string, history: unknown[], observations: Observation[]): Promise<AgentAction> {
  const modelAction = await askModelForAction(question, page, history, observations).catch(() => null);
  if (modelAction) return modelAction;
  return deterministicAction(question, observations);
}

async function askModelForAction(question: string, page: string, history: unknown[], observations: Observation[]): Promise<AgentAction | null> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? (process.env.NODE_ENV === "development" ? "http://127.0.0.1:11434" : "");
  if (!baseUrl) return null;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    signal: AbortSignal.timeout(25000),
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL ?? "qwen3:8b",
      stream: false,
      format: "json",
      system: `You are Eight, an autonomous but bounded defensive-security agent. Decide the next action from the tool list. Use tools to gather evidence before answering. Never invent tool results. Tools are read-only. Return exactly one JSON object: {"action":"tool","tool":"name","arguments":{},"reason":"why"} or {"action":"final","answer":"clear useful answer"}. Available tools: ${JSON.stringify(toolDefinitions)}`,
      prompt: JSON.stringify({ question, currentPage: page, recentHistory: history.slice(-6), observations }, null, 2).slice(0, MAX_OBSERVATION_CHARS),
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.response) return null;
  const parsed = JSON.parse(body.response) as Record<string, unknown>;
  if (parsed.action === "final" && typeof parsed.answer === "string") return { action: "final", answer: parsed.answer };
  if (parsed.action === "tool" && isToolName(parsed.tool)) {
    return { action: "tool", tool: parsed.tool, arguments: isRecord(parsed.arguments) ? parsed.arguments : {}, reason: String(parsed.reason ?? "") };
  }
  return null;
}

function deterministicAction(question: string, observations: Observation[]): AgentAction {
  const used = new Set(observations.map((item) => item.tool));
  const lower = question.toLowerCase();
  if (!used.has("site_overview")) return { action: "tool", tool: "site_overview", reason: "Establish available capabilities and tools." };
  if (/research|learn|article|prompt|llm|zero.day|cve/.test(lower) && !used.has("search_research")) return { action: "tool", tool: "search_research", arguments: { query: question }, reason: "Retrieve relevant research evidence." };
  const matchedTool = tools.find((tool) => lower.includes(tool.slug) || lower.includes(tool.name.toLowerCase()));
  if (matchedTool && !used.has("inspect_security_tool")) return { action: "tool", tool: "inspect_security_tool", arguments: { slug: matchedTool.slug }, reason: "Inspect the requested tool in detail." };
  if (!used.has("build_security_workflow")) return { action: "tool", tool: "build_security_workflow", arguments: { objective: question }, reason: "Build an actionable workflow from available capabilities." };
  return { action: "final", answer: deterministicSynthesis(question, observations) };
}

function executeTool(name: AgentToolName, args: Record<string, unknown>, question: string) {
  if (name === "site_overview") return { ventures, capabilities, tools: tools.map(({ slug, name: toolName, status, category, maturity, bestFor }) => ({ slug, name: toolName, status, category, maturity, bestFor })) };
  if (name === "search_research") {
    const terms = String(args.query ?? question).toLowerCase().split(/\W+/).filter((term) => term.length > 3);
    return research.map((article) => ({ ...article, score: terms.filter((term) => JSON.stringify(article).toLowerCase().includes(term)).length })).filter((article) => article.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
  }
  if (name === "inspect_security_tool") {
    const slug = String(args.slug ?? "");
    return tools.find((tool) => tool.slug === slug) ?? { available: tools.map((tool) => ({ slug: tool.slug, name: tool.name })) };
  }
  const objective = String(args.objective ?? question).toLowerCase();
  const rankedTools = tools.map((tool) => ({ ...tool, score: objective.split(/\W+/).filter((term) => term.length > 3 && JSON.stringify(tool).toLowerCase().includes(term)).length })).sort((a, b) => b.score - a.score).slice(0, 3);
  return { objective: args.objective ?? question, workflow: rankedTools.map((tool, index) => ({ order: index + 1, tool: tool.name, href: `/tools/${tool.slug}`, purpose: tool.bestFor, steps: tool.workflow })), guardrails: ["Use only on assets you own or are authorized to test.", "Begin with passive checks and record evidence.", "Require human approval before state-changing or intrusive actions."] };
}

function deterministicSynthesis(question: string, observations: Observation[]) {
  const workflow = observations.find((item) => item.tool === "build_security_workflow")?.result as { workflow?: Array<{ tool: string; href: string; purpose: string }> } | undefined;
  const articles = observations.find((item) => item.tool === "search_research")?.result as Array<{ title: string; slug: string; summary: string }> | undefined;
  const lines = [`I autonomously reviewed the available Twenty Eight Labs capabilities for: “${question}”.`];
  if (workflow?.workflow?.length) {
    lines.push("\nRecommended execution path:", ...workflow.workflow.map((item, index) => `${index + 1}. ${item.tool} — ${item.purpose} (${item.href})`));
  }
  if (articles?.length) lines.push("\nRelevant research:", ...articles.map((item) => `• ${item.title} — ${item.summary} (/research/${item.slug})`));
  lines.push("\nI kept this run read-only. Any future active testing or state-changing action should require explicit authorization.");
  return lines.join("\n");
}

function summarizeResult(result: unknown) {
  if (Array.isArray(result)) return `Returned ${result.length} relevant record${result.length === 1 ? "" : "s"}.`;
  if (isRecord(result)) return `Observed ${Object.keys(result).slice(0, 5).join(", ")}.`;
  return "Observation captured.";
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function isToolName(value: unknown): value is AgentToolName { return toolDefinitions.some((tool) => tool.name === value); }
