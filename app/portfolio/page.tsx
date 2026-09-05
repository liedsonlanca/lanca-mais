import Image from "next/image";
import type { Metadata } from "next";
import { lerCases } from "@/lib/conteudo";
import PageHero from "@/components/PageHero";
import CtaFinal from "@/components/CtaFinal";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";

export const metadata: Metadata = {
  title: "Portfólio",
  description:
    "Cases de marcas que trabalharam com a LANÇA+ em estratégia, conteúdo, tráfego pago e identidade visual.",
};

export default async function PortfolioPage() {
  const caseStudies = await lerCases();

  return (
    <>
      <PageHero
        eyebrow="Portfólio"
        titulo={[
          { texto: "Marcas que já lançamos" },
          { texto: "para o próximo nível.", acento: "nível." },
        ]}
        lead="Uma amostra de como a estratégia da LANÇA+ se adapta a nichos diferentes sem perder consistência de método."
      />

      <section className="relative overflow-hidden bg-areia">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:px-10 lg:py-16">
          <Stagger className="grid gap-6 sm:grid-cols-2">
            {caseStudies.map((item) => (
              <StaggerItem key={item.slug}>
                <article className="group h-full overflow-hidden rounded-3xl border border-linha bg-branco shadow-[var(--sombra-cartao)] transition-colors duration-500 hover:border-salmon/40">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={`Case ${item.niche}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover grayscale transition-all duration-[1.2s] group-hover:scale-105 group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-branco via-transparent to-transparent" />
                  </div>

                  <div className="p-8">
                    <span className="eyebrow text-salmon-texto">{item.niche}</span>
                    <h2 className="mt-3 text-xl font-semibold text-preto">
                      {item.client}
                    </h2>
                    <p className="mt-3 leading-relaxed text-preto/68">
                      {item.summary}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.services.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-linha px-3 py-1 text-xs text-preto/72"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <p className="mt-6 border-t border-linha pt-5 text-sm font-medium text-salmon-texto">
                      {item.result}
                    </p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>

          <p className="mt-10 text-center text-sm text-preto/50">
            Cases ilustrativos. Substitua pelos resultados reais de clientes
            antes de publicar o site.
          </p>
        </div>
      </section>

      <CtaFinal
        titulo="Quer ser o próximo"
        destaque="case de sucesso?"
        realce="sucesso?"
        lead="Fale com a equipe e receba um diagnóstico inicial da presença digital da sua marca."
      />
    </>
  );
}
