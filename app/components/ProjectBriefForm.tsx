"use client";

import { FormEvent, useState } from "react";

const projectTypes = [
  "AI product review",
  "AppSec research",
  "Threat modeling",
  "Tool collaboration",
];

export default function ProjectBriefForm() {
  const [type, setType] = useState(projectTypes[0]);
  const [email, setEmail] = useState("");
  const [context, setContext] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, email, context }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not submit the brief.");
      }

      setStatus("sent");
      setMessage("Brief received. We will review the fit and reply soon.");
      setEmail("");
      setContext("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Could not submit the brief."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-800 rounded-lg bg-zinc-950/70 p-6 md:p-8 space-y-5"
    >
      <div>
        <label htmlFor="project-type" className="text-sm font-medium">
          What should we look at?
        </label>
        <select
          id="project-type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="mt-2 w-full rounded-md border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
        >
          {projectTypes.map((projectType) => (
            <option key={projectType}>{projectType}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Reply email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="mt-2 w-full rounded-md border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-400"
        />
      </div>

      <div>
        <label htmlFor="context" className="text-sm font-medium">
          Short brief
        </label>
        <textarea
          id="context"
          required
          minLength={20}
          rows={6}
          value={context}
          onChange={(event) => setContext(event.target.value)}
          placeholder="Share the product, system, or research problem in a few lines."
          className="mt-2 w-full resize-none rounded-md border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-400"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-md bg-cyan-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Submitting..." : "Submit Security Brief"}
      </button>

      {message && (
        <div
          className={`rounded-md border p-4 text-sm ${
            status === "sent"
              ? "border-emerald-400/40 bg-emerald-950/20 text-emerald-200"
              : "border-red-400/40 bg-red-950/20 text-red-200"
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
}
