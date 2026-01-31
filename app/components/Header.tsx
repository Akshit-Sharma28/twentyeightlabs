"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navItem = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`relative transition ${
          active ? "text-white" : "text-gray-400 hover:text-white"
        }`}
      >
        {label}
        {active && (
          <span className="absolute left-0 -bottom-2 h-[2px] w-full bg-cyan-400 rounded-full" />
        )}
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur bg-black/80 border-b border-gray-800 header-scroll">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Brand (slightly left + bigger) */}
        <Link
          href="/"
          className="flex items-center gap-4 group relative -ml-2"
          aria-label="Go to homepage"
        >
          {/* 28 Glyph */}
          <div className="w-11 h-11 rounded-full border border-cyan-400/50 flex items-center justify-center text-[13px] font-semibold text-cyan-300 leading-none">
            28
          </div>

          {/* Brand Text */}
          <span className="text-[1.65rem] font-bold tracking-wide text-white leading-none relative top-[1px] group-hover:text-gray-200 transition">
            Twenty Eight Labs
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-10 text-base">
          {navItem("/", "Home")}
          {navItem("/research", "Research")}
          {navItem("/tools", "Tools")}
          {navItem("/about", "About")}
        </nav>
      </div>
    </header>
  );
}
