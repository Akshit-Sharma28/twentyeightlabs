import Header from "./components/Header";

export default function Home() {
  return (
    <main className="bg-black text-white min-h-screen">
      <Header />

      {/* =========================
          HERO
         ========================= */}
      <section className="pt-36 pb-24 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-12 items-start">
          
          {/* LEFT */}
          <div className="col-span-12 lg:col-span-7 relative">
            {/* Vertical accent rail */}
            <div className="absolute left-[-24px] top-2 h-full w-px bg-gradient-to-b from-cyan-400/40 to-transparent" />

            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] mb-6">
              Security & AI Research
              <span className="block text-gray-400 font-semibold text-3xl md:text-4xl mt-3">
                for Modern Systems
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl mb-10">
              Twenty Eight Labs explores emerging attack surfaces across
              applications, infrastructure, and AI-powered systems.
            </p>

            <div className="flex gap-3 flex-wrap">
              {["AI Security", "LLM Testing", "AppSec"].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 text-sm border border-gray-700 rounded-full text-gray-300 hover:border-cyan-400/50 hover:text-white transition"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-span-12 lg:col-span-5">
            <div className="border border-gray-800 rounded-xl p-8 bg-black/40 backdrop-blur">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">
                Research Focus
              </p>

              <ul className="space-y-4 text-sm text-gray-300">
                <li>• AI misuse & adversarial workflows</li>
                <li>• LLM threat modeling</li>
                <li>• Modern application attack paths</li>
                <li>• Security engineering for AI systems</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          DETAIL STRIP
         ========================= */}
      <section className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-800 pt-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              Focus Area
            </p>
            <p className="text-sm text-gray-300">
              AI Security & LLM Threat Modeling
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              Approach
            </p>
            <p className="text-sm text-gray-300">
              Research-driven, exploit-focused, real-world systems
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              Status
            </p>
            <p className="text-sm text-gray-300">
              Independent · Ongoing Research
            </p>
          </div>
        </div>
      </section>

      {/* =========================
          DIVIDER
         ========================= */}
      <div className="max-w-7xl mx-auto px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-16" />
      </div>

      {/* =========================
          AREAS OF FOCUS
         ========================= */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <h2 className="text-xl font-semibold mb-12">Areas of Focus</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              title: "AI & LLM Security",
              text: "Prompt injection, model misuse, insecure AI workflows, and real-world exploitation paths in AI systems.",
            },
            {
              title: "Advanced Application Security",
              text: "Deep testing of modern web, API, and cloud-native applications with a focus on exploitability.",
            },
            {
              title: "Tooling & Frameworks",
              text: "Building internal tools and research frameworks to analyze new classes of vulnerabilities.",
            },
            {
              title: "Security Engineering",
              text: "Helping teams design and validate secure architectures for AI-enabled products.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="border border-gray-800 rounded-xl p-6 bg-black/40 hover:border-cyan-400/40 transition"
            >
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================
          FOOTER
         ========================= */}
      <footer className="border-t border-gray-800 px-6 py-10 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Twenty Eight Labs · Founded by Akshit Sharma
      </footer>
    </main>
  );
}
