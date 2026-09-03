import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { lerPosts } from "@/lib/conteudo";
import CtaFinal from "@/components/CtaFinal";
import Reveal from "@/components/motion/Reveal";
import WordReveal from "@/components/motion/WordReveal";

export async function generateStaticParams() {
  const blogPosts = await lerPosts();
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = (await lerPosts()).find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      url: `/blog/${post.slug}`,
    },
  };
}

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = (await lerPosts()).find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <>
      {/* Cabeçalho escuro; o texto do artigo vem no claro, que lê melhor em
          bloco longo. */}
      <header className="superficie-escura noise relative overflow-hidden bg-abismo">
        <div className="glow-salmon pointer-events-none absolute left-1/2 top-0 h-[420px] w-[620px] -translate-x-1/2 opacity-30 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-6 pb-16 pt-36 lg:pt-44">
          <Reveal>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 text-sm text-bege/70 transition-colors hover:text-salmon"
            >
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover:-translate-x-1"
              >
                ←
              </span>
              Voltar para o blog
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-bege/62">
              <span className="text-salmon">{post.category}</span>
              <span aria-hidden>·</span>
              <span>{formatarData(post.date)}</span>
              <span aria-hidden>·</span>
              <span>{post.readingTime} de leitura</span>
            </div>
          </Reveal>

          <h1 className="font-heading mt-5 text-3xl font-semibold leading-[1.1] text-bege md:text-5xl">
            <WordReveal linhas={[{ texto: post.title }]} delay={0.2} />
          </h1>

        </div>
      </header>

      <article className="relative overflow-hidden bg-papel">
        <div className="mx-auto max-w-3xl px-6 py-20 lg:py-24">
          <div className="space-y-6 text-lg leading-relaxed text-preto/75">
            {post.content.map((paragraph, i) => (
              <Reveal key={i} delay={0.03 * i} distance={20}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </article>

      <CtaFinal
        titulo="Quer aplicar isso"
        destaque="na sua marca?"
        realce="marca?"
        lead="A gente escreve sobre isso porque faz isso todo dia. Conte o momento da sua marca e a equipe responde com o melhor ponto de partida."
        rotulo="Falar com a LANÇA+"
      />
    </>
  );
}
