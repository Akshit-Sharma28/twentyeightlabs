"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { research } from "../data";

const tags = ["All", ...Array.from(new Set(research.map((item) => item.tag)))];

export default function ResearchLibrary() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");

  const visibleResearch = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return research.filter((item) => {
      const matchesTag = tag === "All" || item.tag === tag;
      const haystack = [
        item.title,
        item.tag,
        item.status,
        item.summary,
        item.audience,
        ...item.topics,
        ...item.takeaways,
      ]
        .join(" ")
        .toLowerCase();

      return matchesTag && haystack.includes(normalizedQuery);
    });
  }, [query, tag]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 rounded-lg border border-gray-800 bg-zinc-950/70 p-4">
        <label className="lg:col-span-8">
          <span className="text-xs uppercase tracking-wider text-gray-500">
            Search Research
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search agents, prompt injection, trust boundaries..."
            className="mt-2 w-full rounded-md border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-400"
          />
        </label>

        <label className="lg:col-span-4">
          <span className="text-xs uppercase tracking-wider text-gray-500">
            Track
          </span>
          <select
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            className="mt-2 w-full rounded-md border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            {tags.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-8">
        {visibleResearch.map((item) => (
          <Link
            key={item.slug}
            href={`/research/${item.slug}`}
            className="block border border-gray-800 rounded-lg p-6 bg-zinc-950/70 hover:border-cyan-400/40 transition"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs uppercase tracking-wider text-cyan-300">
                    {item.tag}
                  </span>
                  <span className="text-xs text-gray-600">/</span>
                  <span className="text-xs text-gray-500">{item.readTime}</span>
                  <span className="text-xs text-gray-600">/</span>
                  <span className="text-xs text-gray-500">{item.status}</span>
                </div>
                <h2 className="text-xl font-semibold">{item.title}</h2>
              </div>
              <span className="text-xs text-gray-500">{item.date}</span>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
              {item.summary}
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              {item.takeaways.map((takeaway) => (
                <div
                  key={takeaway}
                  className="rounded-md border border-gray-800 bg-black/40 p-3 text-xs text-gray-400 leading-relaxed"
                >
                  {takeaway}
                </div>
              ))}
            </div>

            <span className="text-xs text-cyan-400 mt-5 inline-block">
              Open research →
            </span>
          </Link>
        ))}
      </div>

      {visibleResearch.length === 0 && (
        <div className="rounded-lg border border-gray-800 bg-zinc-950/70 p-8 text-center text-sm text-gray-400">
          No research notes match that search yet.
        </div>
      )}
    </div>
  );
}
