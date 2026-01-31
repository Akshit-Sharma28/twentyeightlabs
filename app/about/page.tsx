import Header from "../components/Header";

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
          Twenty Eight Labs is an independent research initiative focused on
          understanding and securing modern systems at the intersection of
          application security, artificial intelligence, and emerging
          technologies.
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
              This is an independent initiative. Research topics are selected
              based on technical relevance and emerging risk, not commercial
              alignment. Findings are shared openly whenever possible.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5">
          <div className="border border-gray-800 rounded-xl p-8 bg-black/40 backdrop-blur">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-6">
              Focus Areas
            </h3>

            <ul className="space-y-4 text-sm text-gray-300">
              <li>• AI & LLM security research</li>
              <li>• Threat modeling for AI-enabled systems</li>
              <li>• Application & API attack surfaces</li>
              <li>• Cloud-native exploitation paths</li>
              <li>• Secure system design & validation</li>
            </ul>
          </div>
        </div>
      </section>

      {/* =========================
          FOOTER NOTE
         ========================= */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <p className="text-xs text-gray-500 max-w-2xl">
          Twenty Eight Labs is not a consultancy or product company. The focus
          remains on research, experimentation, and long-form analysis of
          security problems in modern systems.
        </p>
      </section>
    </main>
  );
}
