"use client";

import { useEffect } from "react";

export default function AtomicCursor() {
  useEffect(() => {
    // Disable on touch devices
    if ("ontouchstart" in window) return;

    const cursor = document.createElement("div");
    cursor.className = "atomic-cursor";
    document.body.appendChild(cursor);

    // Nucleus crosshair
    const nucleus = document.createElement("div");
    nucleus.className = "nucleus";
    cursor.appendChild(nucleus);

    // Electrons
    const electrons = Array.from({ length: 3 }).map(() => {
      const e = document.createElement("div");
      e.className = "electron";
      cursor.appendChild(e);
      return e;
    });

    let mouseX = 0;
    let mouseY = 0;
    let angle = 0;

    const move = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    };

    const animate = () => {
      angle += 0.04;
      electrons.forEach((el, i) => {
        const radius = 10 + i * 6;
        const x = Math.cos(angle + i * 2) * radius;
        const y = Math.sin(angle + i * 2) * radius;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", move);
    animate();

    return () => {
      window.removeEventListener("mousemove", move);
      document.body.removeChild(cursor);
    };
  }, []);

  return null;
}
