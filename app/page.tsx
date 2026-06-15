import Header from "./components/Header";
import CapabilityLab from "./components/CapabilityLab";
import RiskRadar from "./components/RiskRadar";
import { companyStats, ventures } from "./data";

const heroActions = [
  { label: "Atomix", href: "https://atomix.solutions" },
  { label: "AI Security", href: "/tools/ai-threat-modeler" },
  { label: "LLM Testing", href: "/tools/llm-prompt-tester" },
  { label: "AppSec", href: "/tools/webapp-quick-test" },
];

export default function Home() {
  return (
    <main className="bg-black text-white min-h-screen">
      <Header />

      {/* =========================
          HERO
         ========================= */}
      <section className="pt-36 pb-20 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-12 items-start">
          <div className="col-span-12 lg:col-span-7 relative">
            <div className="absolute left-[-24px] top-2 h-full w-px bg-gradient-to-b from-cyan-400/40 to-transparent" />

            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] mb-6">
              Twenty Eight Labs
              {" "}
              <span className="block text-gray-400 font-semibold text-3xl md:text-4xl mt-3">
                builds security research into AI products
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl mb-10">
              The parent company behind Atomix, focused on AI security,
              application research, and practical systems that help teams work
              with modern attack surfaces.
            </p>

            <div className="flex gap-3 flex-wrap">
              {heroActions.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  target={action.href.startsWith("http") ? "_blank" : undefined}
                  rel={action.href.startsWith("http") ? "noreferrer" : undefined}
                  className="px-4 py-2 text-sm border border-gray-700 rounded-full text-gray-300 hover:border-cyan-400/50 hover:text-white transition"
                >
                  {action.label} →
                </a>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="border border-gray-800 rounded-lg p-8 bg-zinc-950/70 backdrop-blur">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">
                Company Focus
              </p>

              <ul className="space-y-4 text-sm text-gray-300">
                <li>• Building Atomix as the flagship product</li>
                <li>• Researching AI misuse and adversarial workflows</li>
                <li>• Mapping modern application attack paths</li>
                <li>• Turning research into usable security tooling</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-800 pt-8">
          {companyStats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-black text-white mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-16" />
      </div>

      <section className="max-w-7xl mx-auto px-8 pb-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="text-xs uppercase tracking-wider text-cyan-300 mb-3">
              Portfolio
            </p>
            <h2 className="text-2xl md:text-3xl font-bold">
              Ventures and research tracks
            </h2>
          </div>
          <a
            href="/contact"
            className="text-sm text-cyan-300 hover:text-cyan-200 transition"
          >
            Start a brief →
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {ventures.map((venture) => (
            <article
              key={venture.name}
              className="border border-gray-800 rounded-lg p-6 bg-zinc-950/70 hover:border-cyan-400/40 transition"
            >
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    {venture.label}
                  </p>
                  <h3 className="text-2xl font-bold mt-1">{venture.name}</h3>
                </div>
                <span className="text-xs text-cyan-300 border border-cyan-400/30 rounded-full px-3 py-1">
                  {venture.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">
                {venture.description}
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                {venture.highlights.map((highlight) => (
                  <li key={highlight}>• {highlight}</li>
                ))}
              </ul>
              <a
                href={venture.ctaHref}
                target={venture.ctaHref.startsWith("http") ? "_blank" : undefined}
                rel={venture.ctaHref.startsWith("http") ? "noreferrer" : undefined}
                className="mt-6 inline-flex rounded-md border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
              >
                {venture.ctaLabel} →
              </a>
            </article>
          ))}
        </div>
      </section>

      <RiskRadar />

      <CapabilityLab />

      <footer className="border-t border-gray-800 px-6 py-10 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Twenty Eight Labs · Founded by Akshit Sharma
      </footer>
    </main>
  );
}
