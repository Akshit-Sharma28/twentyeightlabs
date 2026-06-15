import Header from "../../components/Header";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolRunner from "../../components/ToolRunner";
import { research, tools } from "../../data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;

  const tool = tools.find((t) => t.slug === slug);

  if (!tool) {
    notFound();
  }

  const relatedResearch = research.filter((item) =>
    item.relatedTools.includes(tool.slug)
  );

  return (
    <main className="bg-black text-white min-h-screen">
      <Header />

      <section className="pt-40 pb-24 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <p className="text-xs uppercase tracking-wider text-cyan-300 mb-3">
              {tool.category}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {tool.name}
            </h1>

            <p className="text-sm text-gray-500 mb-6">
              Status: {tool.status} / Best for: {tool.bestFor}
            </p>

            <p className="text-gray-300 leading-relaxed text-lg">
              {tool.description}
            </p>
          </div>

          <aside className="lg:col-span-5 rounded-lg border border-gray-800 bg-zinc-950/70 p-6">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">
              Tool Snapshot
            </p>
            <div className="space-y-4">
              {tool.metrics.map((metric) => (
                <div key={metric.label} className="flex justify-between gap-4">
                  <span className="text-sm text-gray-500">{metric.label}</span>
                  <span className="text-sm text-gray-200 text-right">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Build maturity</span>
                <span>{tool.maturity}%</span>
              </div>
              <div className="h-2 rounded-full bg-black overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{ width: `${tool.maturity}%` }}
                />
              </div>
            </div>
          </aside>
        </div>

        <ToolRunner slug={tool.slug} />

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="rounded-lg border border-gray-800 bg-zinc-950/70 p-6">
            <h2 className="text-lg font-semibold mb-5">Inputs</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              {tool.inputs.map((input) => (
                <li key={input}>• {input}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-gray-800 bg-zinc-950/70 p-6">
            <h2 className="text-lg font-semibold mb-5">Outputs</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              {tool.outputs.map((output) => (
                <li key={output}>• {output}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-gray-800 bg-zinc-950/70 p-6">
            <h2 className="text-lg font-semibold mb-5">Use Cases</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              {tool.useCases.map((useCase) => (
                <li key={useCase}>• {useCase}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-8 rounded-lg border border-gray-800 bg-zinc-950/70 p-6">
          <h2 className="text-lg font-semibold mb-6">Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {tool.workflow.map((step, index) => (
              <div
                key={step}
                className="rounded-md border border-gray-800 bg-black/50 p-4"
              >
                <p className="text-cyan-300 text-sm font-semibold mb-3">
                  0{index + 1}
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="rounded-lg border border-gray-800 bg-zinc-950/70 p-6">
            <h2 className="text-lg font-semibold mb-5">
              Current Capability Set
            </h2>
            <ul className="space-y-3 text-sm text-gray-300">
              {tool.capabilities.map((capability) => (
                <li key={capability}>• {capability}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-gray-800 bg-zinc-950/70 p-6">
            <h2 className="text-lg font-semibold mb-5">Related Research</h2>
            <div className="space-y-4">
              {relatedResearch.map((item) => (
                <Link
                  key={item.slug}
                  href={`/research/${item.slug}`}
                  className="block rounded-md border border-gray-800 bg-black/50 p-4 hover:border-cyan-400/40 transition"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.tag} / {item.readTime}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}
