import Header from "../components/Header";
import ResearchLibrary from "../components/ResearchLibrary";
import { research } from "../data";

export default function ResearchPage() {
  return (
    <main className="bg-black text-white min-h-screen">
      <Header />

      <section className="pt-40 pb-24 px-8 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Research
        </h1>

        <p className="text-gray-400 max-w-2xl mb-10">
          Published research and ongoing work from Twenty Eight Labs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { label: "Published Notes", value: research.length },
            {
              label: "Research Tracks",
              value: new Set(research.map((item) => item.tag)).size,
            },
            {
              label: "Methods Captured",
              value: research.reduce(
                (total, item) => total + item.methods.length,
                0
              ),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-gray-800 bg-zinc-950/70 p-5"
            >
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs uppercase tracking-wider text-gray-500 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <ResearchLibrary />
      </section>
    </main>
  );
}
