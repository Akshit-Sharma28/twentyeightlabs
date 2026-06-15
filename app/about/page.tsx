import Header from "../components/Header";
import { capabilities, ventures } from "../data";

export default function AboutPage() {
  return (
    <main className="bg-black text-white min-h-screen">
      <Header />

      {/* =========================
          HERO
         ========================= */}
      <section className="pt-40 pb-24 px-8 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          About
        </h1>

        <p className="text-gray-400 max-w-3xl text-lg leading-relaxed">
          Twenty Eight Labs is the parent company behind Atomix and an
          independent research studio focused on AI security, application
          attack surfaces, and products that turn security research into useful
          systems.
        </p>
      </section>

      {/* =========================
          DIVIDER
         ========================= */}
      <div className="max-w-7xl mx-auto px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-24" />
      </div>

      {/* =========================
          CONTENT
         ========================= */}
      <section className="max-w-7xl mx-auto px-8 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-10">
          <div>
            <h2 className="text-xl font-semibold mb-3">
              Purpose
            </h2>
            <p className="text-gray-400 leading-relaxed">
              As software systems increasingly incorporate autonomous decision
              making, large language models, and complex distributed
              architectures, traditional security assumptions no longer hold.
              Twenty Eight Labs exists to explore these gaps through hands-on,
              research-driven analysis.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">
              Research Philosophy
            </h2>
            <p className="text-gray-400 leading-relaxed">
              The work at Twenty Eight Labs prioritizes real-world exploitability
              over theoretical risk. Research focuses on how systems fail in
              practice, how attackers adapt, and how defensive controls can be
              meaningfully improved.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">
              Independence
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Research topics are selected based on technical relevance and
              emerging risk. Product work, including Atomix, is built from that
              research loop rather than treated as a separate track.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5">
          <div className="border border-gray-800 rounded-lg p-8 bg-zinc-950/70 backdrop-blur">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-6">
              Focus Areas
            </h3>

            <ul className="space-y-4 text-sm text-gray-300">
              {capabilities.map((capability) => (
                <li key={capability.title}>• {capability.title}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 pb-24">
        <h2 className="text-xl font-semibold mb-8">Company Portfolio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {ventures.map((venture) => (
            <div
              key={venture.name}
              className="border border-gray-800 rounded-lg p-6 bg-zinc-950/70"
            >
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                {venture.label}
              </p>
              <h3 className="text-lg font-semibold mb-3">{venture.name}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {venture.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================
          FOOTER NOTE
         ========================= */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <p className="text-xs text-gray-500 max-w-2xl">
          Twenty Eight Labs keeps research, experimentation, and product
          building close together so the same technical loop can inform public
          writing, internal tooling, and Atomix.
        </p>
      </section>
    </main>
  );
}
