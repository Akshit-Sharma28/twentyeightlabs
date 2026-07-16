"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type EightMessage = {
  role: "user" | "eight";
  text: string;
  trace?: AgentTraceStep[];
};

type AgentTraceStep = {
  step: number;
  phase: "plan" | "tool" | "answer";
  label: string;
  status: "completed" | "failed";
  detail: string;
  elapsedMs: number;
};

export default function EightAssistant() {
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<EightMessage[]>([
    {
      role: "eight",
      text: "I’m Eight — your autonomous security agent. Give me an objective and I’ll plan the work, inspect the right resources, and return a grounded execution path.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const openAssistant = () => setOpen(true);
    window.addEventListener("twentyeight:open-assistant", openAssistant);
    return () => window.removeEventListener("twentyeight:open-assistant", openAssistant);
  }, []);

  const pageContext = useMemo(
    () =>
      typeof window === "undefined"
        ? "site"
        : `${window.location.pathname}${window.location.search}`,
    []
  );

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim()) return;

    const question = input.trim();
    setInput("");
    setError("");
    setLoading(true);
    setMessages((current) => [...current, { role: "user", text: question }]);

    try {
      const response = await fetch("/api/atomix/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phrase,
          objective: question,
          context: { page: pageContext },
          history: messages.slice(-8),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Eight could not answer.");
      }

      setMessages((current) => [
        ...current,
        { role: "eight", text: String(data.answer ?? "Agent run completed."), trace: Array.isArray(data.trace) ? data.trace : [] },
      ]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Eight failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[80]">
      {open && (
        <section className="mb-4 w-[min(420px,calc(100vw-2.5rem))] overflow-hidden rounded-3xl border border-cyan-300/30 bg-black/95 shadow-[0_0_80px_rgba(34,211,238,0.2)] backdrop-blur">
          <div className="relative overflow-hidden border-b border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.24),transparent_36%),linear-gradient(135deg,rgba(8,47,73,0.86),rgba(0,0,0,0.96))] p-5">
            <div className="eight-starfield pointer-events-none absolute inset-0" />
            <div className="relative flex items-center gap-4">
              <EightOrb size="lg" />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">
                  Agentic security layer
                </p>
                <h2 className="text-2xl font-black text-white">Eight</h2>
                <p className="text-xs text-gray-300">
                  Plans · uses tools · verifies · answers
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-auto p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl border p-3 text-sm leading-relaxed ${
                  message.role === "eight"
                    ? "border-cyan-300/20 bg-cyan-950/30 text-gray-100"
                    : "ml-auto max-w-[86%] border-gray-800 bg-zinc-900 text-gray-300"
                }`}
              >
                <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">
                  {message.role === "eight" ? "Eight" : "You"}
                </p>
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.trace && message.trace.length > 0 && (
                  <details className="mt-3 border-t border-cyan-300/10 pt-2">
                    <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      Agent trace · {message.trace.filter((step) => step.phase === "tool").length} tools
                    </summary>
                    <ol className="mt-2 space-y-2">
                      {message.trace.map((step) => (
                        <li key={step.step} className="flex gap-2 text-[11px] text-gray-400">
                          <span className={step.status === "completed" ? "text-emerald-400" : "text-red-400"}>{step.status === "completed" ? "✓" : "!"}</span>
                          <span><strong className="text-gray-200">{step.label}</strong> · {step.detail}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="space-y-3 border-t border-gray-800 p-4">
            <input
              value={phrase}
              onChange={(event) => setPhrase(event.target.value)}
              placeholder="Enter AI Security Code"
              required
              className="w-full rounded-xl border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-400"
            />
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Give Eight an objective..."
                required
                className="min-w-0 flex-1 rounded-xl border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Running…" : "Run"}
              </button>
            </div>
            {error && <p className="text-xs text-red-300">{error}</p>}
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex items-center gap-3 rounded-full border border-cyan-300/40 bg-black/90 px-4 py-3 shadow-[0_0_40px_rgba(34,211,238,0.22)] backdrop-blur transition hover:border-cyan-200 hover:bg-cyan-950/70"
        aria-label={open ? "Close Eight assistant" : "Open Eight assistant"}
      >
        <EightOrb size="sm" />
        <span className="pr-1 text-sm font-bold text-cyan-100">
          {open ? "Close Eight" : "Run Eight"}
        </span>
      </button>
    </div>
  );
}

function EightOrb({ size }: { size: "sm" | "lg" }) {
  const dimensions = size === "lg" ? "h-16 w-16" : "h-11 w-11";
  const text = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div
      className={`${dimensions} eight-orb relative grid shrink-0 place-items-center rounded-2xl border border-cyan-300/50 bg-black`}
    >
      <span className={`relative z-10 font-black text-cyan-100 ${text}`}>8</span>
      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-black bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
      <span className="eight-ring absolute inset-1 rounded-xl border border-cyan-300/20" />
    </div>
  );
}
