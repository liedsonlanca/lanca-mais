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
import Arco from "@/components/Arco";
import { lerImagens } from "@/lib/conteudo";
import { fotosDoArco } from "@/lib/imagens";

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

  // As cinco fotos do leque deste serviço. Vêm do painel, com a sessão de
  // estúdio como reserva, então a agência troca por peça de cliente sem
  // precisar de publicação nova.
  const leque = fotosDoArco(await lerImagens(), slug);

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
          {/* Seta para a direita, e não para a esquerda.

              O site ganhou um "Voltar" global no alto de toda página interna,
              e ele também é uma seta apontando para a esquerda. Empilhados,
              os dois liam como o mesmo botão repetido por engano.

              São coisas diferentes: o Voltar devolve a pessoa para onde ela
              parou, e este leva ao índice das oito frentes. Como este avança
              para outro lugar em vez de desfazer o caminho, a seta dele passa
              a apontar para a frente. */}
          <Reveal>
            <Link
              href="/servicos"
              className="group inline-flex min-h-11 items-center gap-2 text-sm text-bege/70 transition-colors hover:text-salmon"
            >
              Ver todos os serviços
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover:translate-x-1"
              >
                →
              </span>
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
                    className="rounded-full bg-destaque px-7 py-3.5 text-center font-medium text-preto shadow-[0_0_32px_-8px_var(--color-salmon)] transition-all duration-500 hover:shadow-[0_0_48px_-6px_var(--color-salmon)]"
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
      <section className="tema-claro relative overflow-hidden bg-fundo">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20">
          <Reveal>
            <h2 className="font-heading border-l-2 border-salmon pl-7 text-3xl font-semibold leading-snug text-tinta md:text-4xl">
              {page.manifesto.statement}
            </h2>
          </Reveal>

          <div className="space-y-5 leading-relaxed text-tinta/72">
            {page.manifesto.body.map((paragraph, i) => (
              <Reveal key={i} delay={0.05 * i} distance={20}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* A faixa de imagem que ficava aqui foi retirada: a foto era recortada
          numa proporção muito deitada e sobrava a parte errada do
          enquadramento, sem acrescentar nada ao argumento da página.

          O manifesto acima é bege e "Como funciona" abaixo é papel, então a
          alternância de fundos segue correta sem ela. */}

      {/* ---------- Como funciona ---------- */}
      <section
        id="como-funciona"
        className="relative scroll-mt-28 overflow-hidden bg-fundo"
      >
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
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
                <div className="group h-full rounded-3xl border border-contorno bg-fundo-alt p-7 transition-all duration-500 hover:-translate-y-1 hover:border-salmon/45 hover:bg-cartao hover:shadow-[0_28px_60px_-38px_rgba(10,10,8,0.5)]">
                  <span className="numeral-fantasma block text-4xl text-tinta/45 transition-colors duration-500 group-hover:text-destaque">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-tinta">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-tinta/68">
                    {step.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- O que você recebe ---------- */}
      <section className="tema-claro relative overflow-hidden bg-fundo">
        {/* items-center: as duas colunas têm alturas diferentes, e sem isso a
            nuvem de entregáveis ficava colada no topo com um vazio embaixo. */}
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10 lg:py-20">
          <SectionHeading
            eyebrow="Entregáveis"
            alinhamento="esquerda"
            titulo={[{ texto: "O que você" }, { texto: "recebe.", acento: true }]}
            lead="Entregas concretas, combinadas desde o começo, sem surpresa no meio do caminho."
          />

          {/* O leque de fotos deste serviço, e as etiquetas por baixo.

              Esta coluna era só a nuvem de etiquetas, e sobrava vazio em
              cima e embaixo dela: uma lista de seis palavras não enche meia
              tela. O leque é o mesmo desenho que abre a página de serviços,
              e aqui ele responde com imagem a pergunta que a coluna da
              esquerda faz com texto — o que você recebe.

              As fotos são por serviço, e não as mesmas oito vezes: quem
              contrata identidade visual precisa ver marca, e não gravação. */}
          <div>
            <Arco fotos={leque} tamanho="coluna" tom="claro" />

            <Stagger className="mt-10 flex flex-wrap content-start justify-center gap-3">
              {page.deliverables.map((item) => (
                <StaggerItem key={item}>
                  <span className="inline-block rounded-full border border-tinta/15 bg-cartao px-5 py-2.5 text-sm text-tinta/82 transition-colors duration-500 hover:border-salmon hover:text-tinta">
                    {item}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* ---------- Diferenciais ---------- */}
      <section className="relative overflow-hidden bg-fundo">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:px-10 lg:py-20">
          <SectionHeading
            eyebrow="Por que a LANÇA+"
            alinhamento="esquerda"
            titulo={[
              { texto: "O que torna esse" },
              { texto: "trabalho diferente.", acento: "diferente." },
            ]}
          />

          <Stagger className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-contorno bg-contorno sm:grid-cols-2">
            {page.features.map((feature) => (
              <StaggerItem
                key={feature.title}
                className="h-full bg-fundo-alt p-8 transition-colors duration-500 hover:bg-cartao"
              >
                <h3 className="text-lg font-semibold text-tinta">
                  {feature.title}
                </h3>
                <p className="mt-3 leading-relaxed text-tinta/72">
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
      <section className="tema-claro relative overflow-hidden bg-fundo">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
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
                  className="group flex h-full flex-col rounded-3xl border border-contorno bg-cartao shadow-[var(--sombra-cartao)] p-8 transition-all duration-500 hover:-translate-y-1 hover:border-salmon/50 hover:bg-salmon/[0.07]"
                >
                  <h3 className="text-lg font-semibold text-tinta transition-colors duration-500 group-hover:text-salmon">
                    {outro.name}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-tinta/68">
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
