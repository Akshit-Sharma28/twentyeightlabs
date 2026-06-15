"use client";

import { useMemo, useState } from "react";

const controls = [
  {
    key: "modelAccess",
    label: "Model access",
    low: "Internal",
    high: "Public",
  },
  {
    key: "toolUse",
    label: "Tool use",
    low: "Read-only",
    high: "Actions",
  },
  {
    key: "dataSensitivity",
    label: "Data sensitivity",
    low: "Public",
    high: "Restricted",
  },
  {
    key: "autonomy",
    label: "Autonomy",
    low: "Human-led",
    high: "Agentic",
  },
];

const weights = {
  modelAccess: 22,
  toolUse: 28,
  dataSensitivity: 26,
  autonomy: 24,
};

type ControlKey = keyof typeof weights;

export default function RiskRadar() {
  const [values, setValues] = useState<Record<ControlKey, number>>({
    modelAccess: 2,
    toolUse: 2,
    dataSensitivity: 3,
    autonomy: 2,
  });

  const score = useMemo(
    () =>
      Math.round(
        Object.entries(values).reduce(
          (total, [key, value]) =>
            total + (value / 5) * weights[key as ControlKey],
          0
        )
      ),
    [values]
  );

  const band =
    score >= 72 ? "High exposure" : score >= 45 ? "Elevated" : "Controlled";

  const recommendation =
    score >= 72
      ? "Prioritize agent permissions, prompt boundary tests, and data egress controls before launch."
      : score >= 45
        ? "Run targeted abuse testing and tighten monitoring around model-tool interactions."
        : "Maintain a lightweight review loop and document model, data, and tool boundaries.";

  return (
    <section className="max-w-7xl mx-auto px-8 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border border-gray-800 rounded-lg bg-zinc-950/70 p-6 md:p-8">
        <div className="lg:col-span-5">
          <p className="text-xs uppercase tracking-wider text-cyan-300 mb-3">
            Interactive Lab
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            AI Surface Risk Radar
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            A quick directional read on exposure across public access, tool
            permissions, sensitive data, and agent autonomy.
          </p>
        </div>

        <div className="lg:col-span-4 space-y-5">
          {controls.map((control) => (
            <label key={control.key} className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{control.label}</span>
                <span className="text-xs text-gray-500">
                  {values[control.key as ControlKey]}/5
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={values[control.key as ControlKey]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [control.key]: Number(event.target.value),
                  }))
                }
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>{control.low}</span>
                <span>{control.high}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="lg:col-span-3 border border-gray-800 rounded-lg p-6 bg-black">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">
            Exposure Score
          </p>
          <div className="text-6xl font-black tracking-tight text-white mb-2">
            {score}
          </div>
          <p className="text-sm text-cyan-300 mb-5">{band}</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            {recommendation}
          </p>
        </div>
      </div>
    </section>
  );
}
