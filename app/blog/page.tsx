import Link from "next/link";
import type { Metadata } from "next";
import { blogPosts } from "@/lib/blog-posts";
import PageHero from "@/components/PageHero";
import CtaFinal from "@/components/CtaFinal";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Estratégia, marketing de conteúdo e posicionamento de marca, escritos pela equipe da LANÇA+.",
};

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        titulo={[
          { texto: "Estratégia de marca," },
          { texto: "sem enrolação.", acento: "enrolação." },
        ]}
        lead="Reflexões e processos reais da LANÇA+ sobre marketing de conteúdo, posicionamento e crescimento digital."
      />

      <section className="relative overflow-hidden bg-areia">
        <div className="mx-auto max-w-4xl px-6 py-20 lg:py-28">
          <Stagger className="flex flex-col divide-y divide-linha">
            {blogPosts.map((post) => (
              <StaggerItem key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block py-10 first:pt-0"
                >
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-preto/55">
                    <span className="text-salmon-texto">{post.category}</span>
                    <span aria-hidden>·</span>
                    <span>{formatarData(post.date)}</span>
                    <span aria-hidden>·</span>
                    <span>{post.readingTime} de leitura</span>
                  </div>

                  <h2 className="font-heading mt-4 text-2xl font-semibold leading-snug text-preto transition-colors duration-500 group-hover:text-salmon-texto md:text-3xl">
                    {post.title}
                  </h2>
                  <p className="mt-4 leading-relaxed text-preto/68">
                    {post.excerpt}
                  </p>

                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-salmon-texto">
                    Ler artigo
                    <span
                      aria-hidden
                      className="transition-transform duration-500 group-hover:translate-x-1.5"
                    >
                      →
                    </span>
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <CtaFinal
        titulo="Quer esse tipo de estratégia"
        destaque="aplicada à sua marca?"
        realce="marca?"
        lead="Fale com a equipe da LANÇA+ e receba um diagnóstico inicial, sem compromisso."
      />
    </>
  );
}
