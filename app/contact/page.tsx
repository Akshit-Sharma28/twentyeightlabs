import Header from "../components/Header";
import ProjectBriefForm from "../components/ProjectBriefForm";

export default function ContactPage() {
  return (
    <main className="bg-black text-white min-h-screen">
      <Header />

      <section className="pt-40 pb-24 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <p className="text-xs uppercase tracking-wider text-cyan-300 mb-3">
              Contact
            </p>
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
              Send a focused security or product brief
            </h1>
            <p className="text-gray-400 max-w-xl leading-relaxed">
              Use the brief builder for AI product reviews, application
              security research, threat modeling, or tool collaboration around
              Atomix and Twenty Eight Labs research.
            </p>

            <div className="mt-10 border border-gray-800 rounded-lg p-6 bg-zinc-950/70">
              <h2 className="text-lg font-semibold mb-4">Good fits</h2>
              <ul className="space-y-3 text-sm text-gray-300">
                <li>• AI applications with external tools or agents</li>
                <li>• Products handling sensitive user or company data</li>
                <li>• Security workflows that could become Atomix modules</li>
                <li>• Research collaborations around LLM abuse patterns</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ProjectBriefForm />
          </div>
        </div>
      </section>
    </main>
  );
}
