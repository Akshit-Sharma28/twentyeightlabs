import Header from "../../components/Header";
import { notFound } from "next/navigation";

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

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;

  const tool = tools.find((t) => t.slug === slug);

  if (!tool) {
    notFound();
  }

  return (
    <main className="bg-black text-white min-h-screen">
      <Header />

      <section className="pt-40 pb-24 px-8 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {tool.name}
        </h1>

        <p className="text-sm text-gray-500 mb-6">
          Status: {tool.status}
        </p>

        <p className="text-gray-300 leading-relaxed">
          {tool.description}
        </p>
      </section>
    </main>
  );
}
