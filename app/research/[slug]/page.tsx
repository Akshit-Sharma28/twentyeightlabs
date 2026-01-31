import Header from "../../components/Header";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ResearchArticlePage({ params }: PageProps) {
  const { slug } = await params;

  const filePath = path.join(
    process.cwd(),
    "content",
    "research",
    `${slug}.mdx`
  );

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const { default: Content } = await import(
    `../../../content/research/${slug}.mdx`
  );

  return (
    <main className="bg-black text-white min-h-screen">
      <Header />

      <article className="pt-40 pb-24 px-8 max-w-3xl mx-auto prose prose-invert prose-lg">
        <Content />
      </article>
    </main>
  );
}
