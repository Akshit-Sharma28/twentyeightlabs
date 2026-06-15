"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { tools } from "../data";

const categories = ["All", ...Array.from(new Set(tools.map((tool) => tool.category)))];

export default function ToolExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("maturity");

  const visibleTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tools
      .filter((tool) => {
        const matchesCategory = category === "All" || tool.category === category;
        const haystack = [
          tool.name,
          tool.status,
          tool.category,
          tool.description,
          tool.bestFor,
          ...tool.capabilities,
          ...tool.useCases,
        ]
          .join(" ")
          .toLowerCase();

        return matchesCategory && haystack.includes(normalizedQuery);
      })
      .sort((first, second) => {
        if (sort === "name") {
          return first.name.localeCompare(second.name);
        }

        return second.maturity - first.maturity;
      });
  }, [category, query, sort]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 rounded-lg border border-gray-800 bg-zinc-950/70 p-4">
        <label className="lg:col-span-6">
          <span className="text-xs uppercase tracking-wider text-gray-500">
            Search
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search prompt injection, API, threat model..."
            className="mt-2 w-full rounded-md border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-400"
          />
        </label>

        <label className="lg:col-span-3">
          <span className="text-xs uppercase tracking-wider text-gray-500">
            Category
          </span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-2 w-full rounded-md border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="lg:col-span-3">
          <span className="text-xs uppercase tracking-wider text-gray-500">
            Sort
          </span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="mt-2 w-full rounded-md border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            <option value="maturity">Most developed</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {visibleTools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="group block border border-gray-800 rounded-lg p-6 bg-zinc-950/70 hover:border-cyan-500 transition"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-cyan-300">
                  {tool.category}
                </span>
                <h2 className="text-lg font-semibold mt-1">{tool.name}</h2>
              </div>
              <span className="text-xs text-gray-500">{tool.status}</span>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed">
              {tool.description}
            </p>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Build maturity</span>
                <span>{tool.maturity}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{ width: `${tool.maturity}%` }}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {tool.capabilities.slice(0, 3).map((capability) => (
                <span
                  key={capability}
                  className="text-[11px] text-gray-400 border border-gray-800 rounded-full px-3 py-1"
                >
                  {capability}
                </span>
              ))}
            </div>

            <div className="mt-6 inline-flex rounded-md border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition group-hover:bg-cyan-400/10">
              Open {tool.name} →
            </div>
          </Link>
        ))}
      </div>

      {visibleTools.length === 0 && (
        <div className="rounded-lg border border-gray-800 bg-zinc-950/70 p-8 text-center text-sm text-gray-400">
          No tools match that search yet.
        </div>
      )}
    </div>
  );
}
