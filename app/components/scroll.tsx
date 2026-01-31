"use client";

import { useEffect } from "react";

export default function ScrollWatcher() {
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 10) {
        document.body.classList.add("scrolled");
      } else {
        document.body.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
