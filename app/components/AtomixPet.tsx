"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getServerPetPersona,
  getServerPetPreference,
  type PetPersona,
  readPetPersona,
  readPetPreference,
  savePetPersona,
  savePetPreference,
  subscribeToPetPreference,
} from "./pet-preference";

const personas = {
  beacon: { name: "Beacon", icon: "✦", messages: ["Signal clear. You’re on course.", "Mission control has your back.", "Telemetry looks sharp, operator."] },
  orb: { name: "Orb", icon: "◉", messages: ["Curiosity is your best exploit.", "One finding at a time.", "Threat model synchronized."] },
  droid: { name: "Scout", icon: "⌁", messages: ["Perimeter scanned. Keep probing!", "Recon complete—you’ve got this.", "Trust, then verify."] },
  sentinel: { name: "Sentinel", icon: "◆", messages: ["All sectors calm. Continue the hunt.", "I found no anomalies—yet.", "Focus locked. Nice work, operator."] },
} as const;

export default function AtomixPet() {
  const enabled = useSyncExternalStore(subscribeToPetPreference, readPetPreference, getServerPetPreference);
  const persona = useSyncExternalStore(subscribeToPetPreference, readPetPersona, getServerPetPersona);
  const [settings, setSettings] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [message, setMessage] = useState("");
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef({ id: -1, x: 0, y: 0, ox: 0, oy: 0, moved: false, held: false });
  const holdTimer = useRef<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("twentyeight:pet-position") ?? "null");
        if (typeof saved?.x === "number" && typeof saved?.y === "number") setPosition(saved);
      } catch { /* use the default position */ }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let timer = window.setTimeout(() => setSleeping(true), 30000);
    const wake = () => {
      setSleeping(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setSleeping(true), 30000);
    };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((event) => window.addEventListener(event, wake, { passive: true }));
    return () => { window.clearTimeout(timer); events.forEach((event) => window.removeEventListener(event, wake)); };
  }, []);

  const openEight = () => window.dispatchEvent(new CustomEvent("twentyeight:open-assistant"));
  const speak = () => {
    const lines = personas[persona].messages;
    setMessage(lines[Math.floor(Math.random() * lines.length)]);
    window.setTimeout(() => setMessage(""), 2400);
  };

  if (!enabled) {
    return <button className="pet-restore" onClick={() => savePetPreference(true)} aria-label="Show companion">✦</button>;
  }

  return (
    <div className="pet-dock" style={position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined}>
      {settings && (
        <div className="pet-settings" role="dialog" aria-label="Companion settings">
          <div><strong>Atomix companion</strong><button onClick={() => setSettings(false)} aria-label="Close settings">×</button></div>
          <p>Choose your field companion.</p>
          <div className="pet-personas">
            {(Object.keys(personas) as PetPersona[]).map((value) => (
              <button key={value} className={persona === value ? "active" : ""} onClick={() => savePetPersona(value)}>
                <span>{personas[value].icon}</span>{personas[value].name}
              </button>
            ))}
          </div>
          <button className="pet-hide" onClick={() => savePetPreference(false)}>Hide companion</button>
        </div>
      )}
      <button className="pet-settings-trigger" onClick={() => setSettings((value) => !value)} aria-label="Companion settings">⚙</button>
      <button
        className={`atomix-pet atomix-pet-${persona} ${sleeping ? "sleeping" : ""} ${message ? "celebrate" : ""}`}
        aria-label={`${personas[persona].name}, draggable companion. Hold to open Eight.`}
        onPointerDown={(event) => {
          const box = event.currentTarget.parentElement!.getBoundingClientRect();
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, ox: event.clientX - box.left, oy: event.clientY - box.top, moved: false, held: false };
          event.currentTarget.setPointerCapture(event.pointerId);
          holdTimer.current = window.setTimeout(() => { drag.current.held = true; openEight(); }, 650);
        }}
        onPointerMove={(event) => {
          if (drag.current.id !== event.pointerId) return;
          if (Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) > 5) {
            drag.current.moved = true;
            if (holdTimer.current) clearTimeout(holdTimer.current);
            const next = { x: Math.max(8, Math.min(innerWidth - 100, event.clientX - drag.current.ox)), y: Math.max(8, Math.min(innerHeight - 100, event.clientY - drag.current.oy)) };
            setPosition(next); localStorage.setItem("twentyeight:pet-position", JSON.stringify(next));
          }
        }}
        onPointerUp={(event) => {
          if (holdTimer.current) clearTimeout(holdTimer.current);
          if (!drag.current.moved && !drag.current.held) speak();
          drag.current.id = -1;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
      >
        <span className={`pet-bubble ${message ? "visible" : ""}`}>{message || "Hold to ask Eight"}</span>
        <span className="pet-zzz">z z z</span>
        <span className="pet-aura" />
        <span className="pet-orbit orbit-a"><i /></span>
        <span className="pet-orbit orbit-b"><i /></span>
        <span className="pet-core">{personas[persona].icon}</span>
        <span className="pet-label">{personas[persona].name}</span>
      </button>
    </div>
  );
}
