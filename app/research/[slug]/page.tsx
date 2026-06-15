import Header from "../../components/Header";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { research, tools } from "../../data";
import { researchArticles } from "../articles";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export default async function ResearchArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const source = researchArticles[slug];
  const article = research.find((item) => item.slug === slug);

  if (!source || !article) {
    notFound();
  }

  const tableOfContents = getTableOfContents(source);
  const relatedTools = tools.filter((tool) =>
    article.relatedTools.includes(tool.slug)
  );

  return (
    <main className="bg-black text-white min-h-screen">
      <Header />

      <section className="pt-40 pb-12 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <p className="text-xs uppercase tracking-wider text-cyan-300 mb-3">
              {article.tag}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold mb-5">
              {article.title}
            </h1>
            <p className="text-gray-400 leading-relaxed text-lg max-w-3xl">
              {article.summary}
            </p>
          </div>

          <aside className="lg:col-span-4 rounded-lg border border-gray-800 bg-zinc-950/70 p-6">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">
              Research Brief
            </p>
            <dl className="space-y-4 text-sm">
              {[
                ["Status", article.status],
                ["Published", article.date],
                ["Reading Time", article.readTime],
                ["Audience", article.audience],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="text-gray-200 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <section className="px-8 max-w-7xl mx-auto pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {article.takeaways.map((takeaway) => (
            <div
              key={takeaway}
              className="rounded-lg border border-gray-800 bg-zinc-950/70 p-5 text-sm text-gray-300 leading-relaxed"
            >
              {takeaway}
            </div>
          ))}
        </div>
      </section>

      <section className="px-8 max-w-7xl mx-auto pb-24 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-lg border border-gray-800 bg-zinc-950/70 p-6 lg:sticky lg:top-28">
            <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-5">
              Contents
            </h2>
            <nav className="space-y-3">
              {tableOfContents.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={`block text-sm transition hover:text-cyan-300 ${
                    heading.level === 3
                      ? "pl-4 text-gray-500"
                      : "text-gray-300"
                  }`}
                >
                  {heading.title}
                </a>
              ))}
            </nav>
          </div>

          <div className="rounded-lg border border-gray-800 bg-zinc-950/70 p-6">
            <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-5">
              Methods Used
            </h2>
            <ul className="space-y-3 text-sm text-gray-300">
              {article.methods.map((method) => (
                <li key={method}>• {method}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-gray-800 bg-zinc-950/70 p-6">
            <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-5">
              Related Tools
            </h2>
            <div className="space-y-4">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="block rounded-md border border-gray-800 bg-black/50 p-4 hover:border-cyan-400/40 transition"
                >
                  <p className="text-sm font-medium">{tool.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {tool.category} / {tool.status}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <article className="lg:col-span-8 prose prose-invert prose-lg max-w-none">
          {renderMarkdown(source)}
        </article>
      </section>
    </main>
  );
}

export function generateStaticParams() {
  return research.map((item) => ({ slug: item.slug }));
}

function renderMarkdown(source: string) {
  const lines = source.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;
  let paragraph: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) {
      return;
    }

    nodes.push(
      <p key={`p-${nodes.length}`}>{renderInline(paragraph.join(" "))}</p>
    );
    paragraph = [];
  }

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    nodes.push(
      <ul key={`ul-${nodes.length}`}>
        {listItems.map((item) => (
          <li key={item}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      flushParagraph();
      flushList();

      if (inCode) {
        nodes.push(
          <pre key={`code-${nodes.length}`}>
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }

      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.trim() === "---") {
      flushParagraph();
      flushList();
      nodes.push(<hr key={`hr-${nodes.length}`} />);
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      const heading = line.slice(4);
      nodes.push(
        <h3 id={createHeadingId(heading)} key={`h3-${nodes.length}`}>
          {heading}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      const heading = line.slice(3);
      nodes.push(
        <h2 id={createHeadingId(heading)} key={`h2-${nodes.length}`}>
          {heading}
        </h2>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      nodes.push(<h1 key={`h1-${nodes.length}`}>{line.slice(2)}</h1>);
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2).trim());
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();

  return nodes;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

function getTableOfContents(source: string) {
  return source
    .split("\n")
    .filter((line) => line.startsWith("## ") || line.startsWith("### "))
    .map((line) => {
      const level = line.startsWith("### ") ? 3 : 2;
      const title = line.slice(level + 1);

      return {
        id: createHeadingId(title),
        level,
        title,
      };
    });
}

function createHeadingId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
