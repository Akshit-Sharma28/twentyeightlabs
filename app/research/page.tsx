import Header from "../components/Header";
import Link from "next/link";

const research = [
  {
    slug: "llm-security-basics",
    title: "Foundations of LLM Security",
    date: "2026-01",
    tag: "LLM Security",
    summary:
      "An overview of common attack surfaces in large language models, including prompt injection, data leakage, and misuse patterns.",
  },
  {
    slug: "ai-threat-modeling",
    title: "Threat Modeling AI Systems",
    date: "2026-01",
    tag: "AI Security",
    summary:
      "A practical approach to identifying and mitigating threats in AI-enabled architectures.",
  },
];

export default function ResearchPage() {
  return (
    <main className="bg-black text-white min-h-screen">
      <Header />

      <section className="pt-40 pb-24 px-8 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Research
        </h1>

        <p className="text-gray-400 max-w-2xl mb-8">
          Published research and ongoing work from Twenty Eight Labs.
        </p>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-12" />

        <div className="space-y-8">
          {research.map((item) => (
            <Link
              key={item.slug}
              href={`/research/${item.slug}`}
              className="block border border-gray-800 rounded-xl p-6 bg-black/40 hover:border-cyan-400/40 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">
                  {item.title}
                </h2>
                <span className="text-xs text-gray-500">
                  {item.date}
                </span>
              </div>

              <span className="text-xs uppercase tracking-wider text-gray-500">
                {item.tag}
              </span>

              <p className="text-sm text-gray-400 mt-3">
                {item.summary}
              </p>

              <span className="text-xs text-cyan-400 mt-4 inline-block">
                Read →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
