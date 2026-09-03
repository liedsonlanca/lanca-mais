import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { services } from "@/lib/site-config";
import { servicePages } from "@/lib/service-pages";
import SectionHeading from "@/components/SectionHeading";
import CtaFinal from "@/components/CtaFinal";
import ServiceFaq from "@/components/ServiceFaq";
import FaqJsonLd from "@/components/FaqJsonLd";
import Reveal from "@/components/motion/Reveal";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";
import WordReveal from "@/components/motion/WordReveal";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  return {
    title: service.name,
    description: service.shortDescription,
    alternates: { canonical: `/servicos/${service.slug}` },
  };
}

export default async function ServicoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  const page = servicePages[slug];
  if (!service || !page) notFound();

  // Três serviços seguintes na lista, dando a volta no fim.
  const indice = services.findIndex((s) => s.slug === slug);
  const relacionados = [1, 2, 3].map(
    (passo) => services[(indice + passo) % services.length]
  );

  return (
    <>
      {/* Cada serviço concorre na busca com as suas próprias perguntas. */}
      <FaqJsonLd itens={page.faq} />

      {/* ---------- Hero + painel de benefícios ---------- */}
      <section className="superficie-escura noise relative overflow-hidden bg-abismo">
        <div className="glow-salmon pointer-events-none absolute -left-40 top-1/4 h-[520px] w-[520px] opacity-30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-32 lg:px-10 lg:pb-28 lg:pt-40">
          <Reveal>
            <Link
              href="/servicos"
              className="group inline-flex items-center gap-2 text-sm text-bege/70 transition-colors hover:text-salmon"
            >
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover:-translate-x-1"
              >
                ←
              </span>
              Todos os serviços
            </Link>
          </Reveal>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-16">
            <div>
              <Reveal>
                <span className="eyebrow inline-flex items-center gap-3 rounded-full border border-borda px-4 py-1.5 text-bege/78">
                  <span className="h-1 w-1 rounded-full bg-salmon" />
                  {page.heroKicker}
                </span>
              </Reveal>

              <h1 className="font-heading mt-7 text-4xl font-semibold leading-[1.04] text-bege md:text-6xl">
                <WordReveal
                  linhas={[{ texto: service.name, acento: true }]}
                  delay={0.2}
                />
              </h1>

              <Reveal delay={0.3}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-bege/78">
                  {page.heroSubtitle}
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/contato"
                    className="rounded-full bg-salmon px-7 py-3.5 text-center font-medium text-preto shadow-[0_0_32px_-8px_var(--color-salmon)] transition-all duration-500 hover:shadow-[0_0_48px_-6px_var(--color-salmon)]"
                  >
                    {page.ctaLabel}
                  </Link>
                  <a
                    href="#como-funciona"
                    className="rounded-full border border-bege/25 px-7 py-3.5 text-center font-medium text-bege transition-colors duration-500 hover:border-salmon hover:text-salmon"
                  >
                    Como funciona
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Painel de benefícios ao lado do título, como na referência. */}
            <Reveal delay={0.2} distance={40}>
              <div className="rounded-3xl border border-borda bg-grafite/70 p-8 lg:p-10">
                <p className="eyebrow text-bege/68">Benefícios</p>

                <ul className="mt-7 space-y-4">
                  {page.results.map((resultado) => (
                    <li key={resultado} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-salmon/15 text-[11px] text-salmon"
                      >
                        ✓
                      </span>
                      <span className="text-sm leading-relaxed text-bege/85">
                        {resultado}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Manifesto ---------- */}
      <section className="relative overflow-hidden bg-bege">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-32">
          <Reveal>
            <h2 className="font-heading border-l-2 border-salmon pl-7 text-3xl font-semibold leading-snug text-preto md:text-4xl">
              {page.manifesto.statement}
            </h2>
          </Reveal>

          <div className="space-y-5 leading-relaxed text-preto/72">
            {page.manifesto.body.map((paragraph, i) => (
              <Reveal key={i} delay={0.05 * i} distance={20}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Faixa de imagem ---------- */}
      <section className="relative overflow-hidden bg-bege">
        <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-10 lg:pb-32">
          <Reveal distance={40}>
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-linha sm:aspect-[21/9]">
              <Image
                src={page.heroImage}
                alt={service.name}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-top grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-abismo/70 via-transparent to-transparent" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Como funciona ---------- */}
      <section
        id="como-funciona"
        className="relative scroll-mt-28 overflow-hidden bg-papel"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <SectionHeading
            eyebrow="Como funciona"
            titulo={[
              { texto: "Como o trabalho" },
              { texto: "acontece.", acento: true },
            ]}
            lead="Um caminho estruturado, para que cada entrega chegue no padrão combinado."
          />

          <Stagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {page.process.map((step, i) => (
              <StaggerItem key={step.title} className="h-full">
                <div className="group h-full rounded-3xl border border-linha bg-areia p-7 transition-all duration-500 hover:-translate-y-1 hover:border-salmon/45 hover:bg-branco hover:shadow-[0_28px_60px_-38px_rgba(10,10,8,0.5)]">
                  <span className="numeral-fantasma block text-4xl text-preto/28 transition-colors duration-500 group-hover:text-salmon/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-preto">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-preto/68">
                    {step.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- O que você recebe ---------- */}
      <section className="relative overflow-hidden bg-bege text-preto">
        {/* items-center: as duas colunas têm alturas diferentes, e sem isso a
            nuvem de entregáveis ficava colada no topo com um vazio embaixo. */}
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10 lg:py-32">
          <SectionHeading
            eyebrow="Entregáveis"
            alinhamento="esquerda"
            titulo={[{ texto: "O que você" }, { texto: "recebe.", acento: true }]}
            lead="Entregas concretas, combinadas desde o começo, sem surpresa no meio do caminho."
          />

          <Stagger className="flex flex-wrap content-start gap-3">
            {page.deliverables.map((item) => (
              <StaggerItem key={item}>
                <span className="inline-block rounded-full border border-preto/15 bg-branco px-5 py-2.5 text-sm text-preto/82 transition-colors duration-500 hover:border-salmon hover:text-preto">
                  {item}
                </span>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- Diferenciais ---------- */}
      <section className="relative overflow-hidden bg-papel">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
          <SectionHeading
            eyebrow="Por que a LANÇA+"
            alinhamento="esquerda"
            titulo={[
              { texto: "O que torna esse" },
              { texto: "trabalho diferente.", acento: "diferente." },
            ]}
          />

          <Stagger className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-linha bg-linha sm:grid-cols-2">
            {page.features.map((feature) => (
              <StaggerItem
                key={feature.title}
                className="h-full bg-areia p-8 transition-colors duration-500 hover:bg-branco"
              >
                <h3 className="text-lg font-semibold text-preto">
                  {feature.title}
                </h3>
                <p className="mt-3 leading-relaxed text-preto/72">
                  {feature.description}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- Dúvidas deste serviço ----------
          Entra depois dos diferenciais e antes dos serviços relacionados: as
          objeções são respondidas enquanto a pessoa ainda pensa neste serviço,
          e não depois de já ter sido convidada a olhar outros.

          O fundo é areia, o terceiro tom da página. Papel colidiria com os
          diferenciais logo acima e bege com os relacionados logo abaixo. */}
      <ServiceFaq itens={page.faq} />

      {/* ---------- Serviços relacionados ---------- */}
      <section className="relative overflow-hidden bg-bege">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="Continue explorando"
            alinhamento="esquerda"
            titulo={[
              { texto: "Serviços" },
              { texto: "relacionados.", acento: true },
            ]}
          />

          <Stagger className="mt-14 grid gap-5 md:grid-cols-3">
            {relacionados.map((outro) => (
              <StaggerItem key={outro.slug} className="h-full">
                <Link
                  href={`/servicos/${outro.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-linha bg-branco shadow-[var(--sombra-cartao)] p-8 transition-all duration-500 hover:-translate-y-1 hover:border-salmon/50 hover:bg-salmon/[0.07]"
                >
                  <h3 className="text-lg font-semibold text-preto transition-colors duration-500 group-hover:text-salmon">
                    {outro.name}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-preto/68">
                    {outro.shortDescription}
                  </p>
                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-salmon">
                    Ver serviço
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
        titulo="Pronto para começar com"
        destaque={`${service.name}?`}
        lead="Fale com a equipe e receba uma proposta pensada para o momento da sua marca."
        rotulo={page.ctaLabel}
      />
    </>
  );
}
