import Header from "../components/Header";
import Link from "next/link";

const tools = [
  {
    slug: "llm-prompt-tester",
    name: "LLM Prompt Tester",
    status: "Experimental",
    description:
      "A framework for testing prompt injection, instruction leakage, and unsafe model behaviors across LLM deployments.",
  },
  {
    slug: "ai-threat-modeler",
    name: "AI Threat Modeler",
    status: "In Progress",
    description:
      "A structured approach for identifying threat surfaces in AI-enabled architectures, including agents and tool-using models.",
  },
  {
    slug: "api-attack-mapper",
    name: "API Attack Mapper",
    status: "Prototype",
    description:
      "Maps common API abuse patterns and misconfigurations in modern web and cloud-native applications.",
  },
];

export default function ToolsPage() {
  return (
    <main className="bg-black text-white min-h-screen">
      <Header />

      <section className="pt-40 pb-24 px-8 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Tools
        </h1>

        <p className="text-gray-400 max-w-2xl mb-12">
          Research tools and experimental frameworks developed by
          Twenty Eight Labs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="block border border-gray-800 rounded-xl p-6 bg-black/40 hover:border-cyan-500 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">
                  {tool.name}
                </h2>
                <span className="text-xs text-gray-500">
                  {tool.status}
                </span>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
