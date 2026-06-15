"use client";

import { useMemo, useState } from "react";
import { capabilities } from "../data";

const attackVectors = [
  { label: "Network", value: 0.85 },
  { label: "Adjacent", value: 0.62 },
  { label: "Local", value: 0.55 },
  { label: "Physical", value: 0.2 },
];

const impactLevels = [
  { label: "None", value: 0 },
  { label: "Low", value: 0.22 },
  { label: "High", value: 0.56 },
];

export default function CapabilityLab() {
  const [openCapability, setOpenCapability] = useState(capabilities[0].title);
  const [attackVector, setAttackVector] = useState(attackVectors[0].value);
  const [confidentiality, setConfidentiality] = useState(impactLevels[2].value);
  const [integrity, setIntegrity] = useState(impactLevels[1].value);
  const [availability, setAvailability] = useState(impactLevels[1].value);
  const [internetFacing, setInternetFacing] = useState(true);
  const [sensitiveData, setSensitiveData] = useState(true);
  const [adminActions, setAdminActions] = useState(false);
  const [thirdPartyIntegrations, setThirdPartyIntegrations] = useState(true);
  const [intranetOnly, setIntranetOnly] = useState(false);
  const [vendorApp, setVendorApp] = useState(false);
  const [outsideOrgAccess, setOutsideOrgAccess] = useState(true);
  const [adConnected, setAdConnected] = useState(false);

  const cvssScore = useMemo(() => {
    const impact =
      1 - (1 - confidentiality) * (1 - integrity) * (1 - availability);
    const exploitability = 8.22 * attackVector * 0.62 * 0.77 * 0.85;

    if (impact <= 0) {
      return 0;
    }

    return Math.min(10, Math.round((impact * 6.42 + exploitability) * 10) / 10);
  }, [attackVector, availability, confidentiality, integrity]);

  const architectureScore = useMemo(() => {
    const score =
      (internetFacing ? 22 : 0) +
      (outsideOrgAccess ? 18 : 0) +
      (sensitiveData ? 24 : 0) +
      (adminActions ? 20 : 0) +
      (adConnected ? 22 : 0) +
      (vendorApp ? 14 : 0) +
      (thirdPartyIntegrations ? 16 : 0) +
      (intranetOnly ? -8 : 10);

    return Math.max(0, Math.min(100, score));
  }, [
    adConnected,
    adminActions,
    internetFacing,
    intranetOnly,
    outsideOrgAccess,
    sensitiveData,
    thirdPartyIntegrations,
    vendorApp,
  ]);

  const architectureBand =
    architectureScore >= 70
      ? "High review priority"
      : architectureScore >= 40
        ? "Moderate review priority"
        : "Lower review priority";

  return (
    <section className="max-w-7xl mx-auto px-8 pb-24">
      <h2 className="text-xl font-semibold mb-8">Capabilities</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-3">
          {capabilities.map((capability) => {
            const isOpen = openCapability === capability.title;

            return (
              <div
                key={capability.title}
                className="border border-gray-800 rounded-lg bg-zinc-950/70"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenCapability(isOpen ? "" : capability.title)
                  }
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
                >
                  <span className="font-semibold">{capability.title}</span>
                  <span className="text-cyan-300">{isOpen ? "-" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">
                    {capability.text}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {capability.points.map((point) => (
                        <div
                          key={point}
                          className="rounded-md border border-gray-800 bg-black/50 p-3 text-xs"
                        >
                          {point}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-lg border border-gray-800 bg-zinc-950/70 p-6">
            <p className="text-xs uppercase tracking-wider text-cyan-300 mb-3">
              CVSS-Style Calculator
            </p>
            <p className="text-5xl font-black mb-2">{cvssScore}</p>
            <p className="text-sm text-gray-500 mb-5">
              Preliminary technical severity, not a final CVSS score.
            </p>

            <label className="block mb-4">
              <span className="text-sm text-gray-300">Attack vector</span>
              <select
                value={attackVector}
                onChange={(event) => setAttackVector(Number(event.target.value))}
                className="mt-2 w-full rounded-md border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                {attackVectors.map((item) => (
                  <option key={item.label} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                ["Confidentiality", confidentiality, setConfidentiality],
                ["Integrity", integrity, setIntegrity],
                ["Availability", availability, setAvailability],
              ].map(([label, value, setter]) => (
                <label key={String(label)} className="block">
                  <span className="text-xs text-gray-500">{String(label)}</span>
                  <select
                    value={Number(value)}
                    onChange={(event) =>
                      (setter as (value: number) => void)(
                        Number(event.target.value)
                      )
                    }
                    className="mt-2 w-full rounded-md border border-gray-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                  >
                    {impactLevels.map((item) => (
                      <option key={item.label} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-800 bg-zinc-950/70 p-6">
            <p className="text-xs uppercase tracking-wider text-cyan-300 mb-3">
              Architecture Risk Profile
            </p>
            <p className="text-5xl font-black mb-2">{architectureScore}</p>
            <p className="text-sm text-gray-500 mb-5">{architectureBand}</p>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Scores rise when exposure crosses public users, vendors,
              identity infrastructure, privileged actions, or sensitive data.
              Intranet-only scope lowers exposure but does not remove review
              priority.
            </p>

            <div className="space-y-3">
              {[
                ["Internet-facing", internetFacing, setInternetFacing],
                [
                  "Accessible by people outside the org",
                  outsideOrgAccess,
                  setOutsideOrgAccess,
                ],
                ["Vendor or third-party managed app", vendorApp, setVendorApp],
                ["Connected to AD or identity infra", adConnected, setAdConnected],
                ["Contains sensitive data", sensitiveData, setSensitiveData],
                ["Can perform admin actions", adminActions, setAdminActions],
                [
                  "Uses third-party integrations",
                  thirdPartyIntegrations,
                  setThirdPartyIntegrations,
                ],
                ["Intranet-only deployment", intranetOnly, setIntranetOnly],
              ].map(([label, checked, setter]) => (
                <label
                  key={String(label)}
                  className="flex items-center justify-between gap-4 rounded-md border border-gray-800 bg-black/40 px-4 py-3 text-sm text-gray-300"
                >
                  {String(label)}
                  <input
                    type="checkbox"
                    checked={Boolean(checked)}
                    onChange={(event) =>
                      (setter as (value: boolean) => void)(event.target.checked)
                    }
                    className="accent-cyan-300"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
