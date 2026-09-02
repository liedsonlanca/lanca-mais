import Image from "next/image";
import Link from "next/link";
import { siteConfig, stats, testimonials, faq } from "@/lib/site-config";
import { blogPosts } from "@/lib/blog-posts";
import { caseStudies } from "@/lib/portfolio";
import Hero from "@/components/Hero";
import NicheMarquee from "@/components/NicheMarquee";
import ServiceRows from "@/components/ServiceRows";
import SloganBand from "@/components/SloganBand";
import MethodSteps from "@/components/MethodSteps";
import WorkShowcase from "@/components/WorkShowcase";
import ClientLogos from "@/components/ClientLogos";
import SectionHeading from "@/components/SectionHeading";
import FaqJsonLd from "@/components/FaqJsonLd";
import Reveal from "@/components/motion/Reveal";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";
import Counter from "@/components/motion/Counter";

// Um ícone por sintoma: preço que não bate com a percepção, publicação em
// piloto automático e ausência de medição.
const iconesSintoma: React.ReactNode[] = [
  <>
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.8A2 2 0 0 1 4.8 2.8H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8Z" key="a" />
    <circle cx="7.5" cy="7.5" r="1.2" key="b" />
  </>,
  <>
    <path d="M3 12a9 9 0 0 1 15.3-6.4M21 12a9 9 0 0 1-15.3 6.4" key="a" />
    <path d="M18 2.5v4h-4M6 21.5v-4h4" key="b" />
  </>,
  <>
    <path d="M4 20V12M10 20v-5M16 20v-9" key="a" />
    <path d="M2 20h20" key="b" />
    <path d="M19.5 3.2a2 2 0 0 1 2.3 3c-.4.5-1 .7-1.3 1.1-.3.4-.3.8-.3 1.2" key="c" />
    <circle cx="20.2" cy="10.6" r="0.6" fill="currentColor" key="d" />
  </>,
];

const sintomas = [
  {
    titulo: "O feed não parece o preço",
    descricao:
      "A entrega é excelente, mas a comunicação mostra um negócio menor. E o público precifica pelo que vê.",
  },
  {
    titulo: "Publicar virou tarefa, não estratégia",
    descricao:
      "Sem linha editorial, cada post nasce solto e nenhum responde à pergunta básica: o que ele deveria vender?",
  },
  {
    titulo: "Ninguém sabe dizer o que funcionou",
    descricao:
      "Sem métrica acompanhada, a decisão do mês seguinte vira achismo e o investimento se repete sem aprendizado.",
  },
];

const metodo = [
  {
    step: "01",
    title: "Estruturação",
    description:
      "Pesquisa de mercado, persona, tom de voz e posicionamento. Antes de qualquer post, sua marca ganha uma estratégia documentada.",
  },
  {
    step: "02",
    title: "Implementação",
    description:
      "Calendário editorial, produção de conteúdo e publicação com consistência, cada peça com um objetivo claro dentro da estratégia.",
  },
  {
    step: "03",
    title: "Monitoramento",
    description:
      "Acompanhamento contínuo das métricas que importam para o seu objetivo: alcance, engajamento, leads e conversão.",
  },
  {
    step: "04",
    title: "Reajuste",
    description:
      "Revisão mensal da estratégia com base nos dados. O que funciona é ampliado; o que não funciona é corrigido, sem achismo.",
  },
];

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Ordem da home, e o porquê dela.
//
// O hero faz o gancho. Em seguida vem a parte comercial, na sequência que
// alguém avaliando a agência pergunta de fato: quem são vocês (sobre), o que
// vendem (serviços), como é o trabalho de vocês (vitrine), deu certo com quem
// (cases) e quem confirma isso (depoimentos e logos).
//
// Só depois entram as seções de argumentação — diagnóstico do problema e
// método. Elas convencem quem já se interessou; na frente, atrasavam a resposta
// a "o que vocês vendem?".
//
// Atenção ao mexer nesta ordem: os fundos alternam papel/areia e duas seções
// vizinhas nunca repetem. Inserir ou remover uma seção inverte a paridade de
// tudo que vem abaixo, e o fundo dos cards precisa acompanhar — seção branca
// pede card areia, seção areia pede card branco (ver README).
export default function Home() {
  return (
    <>
      <FaqJsonLd />

      <Hero />
      <NicheMarquee />

      {/* ---------- Quem somos ---------- */}
      <section className="relative overflow-hidden bg-papel">
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-36">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <SectionHeading
                eyebrow="Sobre a LANÇA+"
                alinhamento="esquerda"
                titulo={[
                  { texto: "Uma agência inteira" },
                  { texto: "debaixo do mesmo teto.", acento: true },
                ]}
                lead="Estratégia, audiovisual, tráfego, identidade visual, web e arquitetura. Sem terceirização, sem ruído entre quem pensa e quem executa."
              />

              <Reveal delay={0.2}>
                <div className="mt-10 grid grid-cols-2 gap-8 border-t border-preto/10 pt-10">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <span className="font-heading block text-4xl font-semibold text-preto">
                        <Counter
                          valor={stat.valor}
                          prefixo={stat.prefixo}
                          sufixo={stat.sufixo}
                        />
                      </span>
                      <span className="mt-1 block text-sm text-preto/68">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={0.3}>
                <Link
                  href="/sobre"
                  className="group mt-10 inline-flex items-center gap-2 rounded-full border border-preto/20 px-7 py-3.5 font-medium text-preto transition-colors duration-500 hover:border-preto"
                >
                  Conhecer a equipe
                  <span
                    aria-hidden
                    className="transition-transform duration-500 group-hover:translate-x-1.5"
                  >
                    →
                  </span>
                </Link>
              </Reveal>
            </div>

            <Reveal distance={40}>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative aspect-[3/4] overflow-hidden rounded-3xl">
                  <Image
                    src="/images/team/equipe-1.jpg"
                    alt="Equipe da LANÇA+"
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-[1.2s] hover:scale-105"
                  />
                </div>
                <div className="relative mt-10 aspect-[3/4] overflow-hidden rounded-3xl">
                  <Image
                    src="/images/team/equipe-2.jpg"
                    alt="Equipe da LANÇA+ nos bastidores"
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-[1.2s] hover:scale-105"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- 1. Serviços ---------- */}
      <section className="relative overflow-hidden bg-areia">
        <div className="glow-salmon pointer-events-none absolute -left-32 bottom-0 h-[480px] w-[480px] opacity-25 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-36">
          <SectionHeading
            eyebrow="O que fazemos"
            alinhamento="esquerda"
            titulo={[
              { texto: "Sete frentes que" },
              { texto: "conversam entre si.", acento: true },
            ]}
            lead="Contrate uma frente ou todas. Juntas, mantêm estratégia, conteúdo, tráfego e identidade na mesma direção."
          />

          <ServiceRows />

          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-col items-start gap-4 border-t border-linha pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-preto/62">Precisa de algo específico?</p>
              <Link
                href="/contato"
                className="group inline-flex items-center gap-2 text-sm font-medium text-salmon-texto"
              >
                Solicitar orçamento
                <span
                  aria-hidden
                  className="transition-transform duration-500 group-hover:translate-x-1.5"
                >
                  →
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- 2. Vitrine de trabalhos ---------- */}
      <section className="relative overflow-hidden bg-papel">
        <div className="mx-auto max-w-7xl px-6 pt-28 lg:px-10 lg:pt-36">
          <SectionHeading
            eyebrow="Nosso trabalho"
            titulo={[
              { texto: "Cada peça que sai daqui" },
              { texto: "tem um porquê.", acento: true },
            ]}
            lead="Nada sobe por subir. Todo conteúdo responde a um objetivo da estratégia."
          />
        </div>

        <div className="pb-28 pt-16 lg:pb-36">
          <WorkShowcase />
        </div>
      </section>

      {/* ---------- 3. Cases ---------- */}
      <section className="relative overflow-hidden bg-areia">
        <div className="relative mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-36">
          <SectionHeading
            eyebrow="Cases"
            alinhamento="esquerda"
            titulo={[
              { texto: "Marcas que" },
              { texto: "mudaram de patamar.", acento: true },
            ]}
          />

          <Stagger className="mt-16 grid gap-5 md:grid-cols-2">
            {caseStudies.map((caso) => (
              <StaggerItem key={caso.slug}>
                {/* No claro o texto sai de cima da foto e vai para o card:
                    sobre a imagem ele exigiria um véu escuro em toda peça. */}
                <article className="group h-full overflow-hidden rounded-3xl border border-linha bg-branco shadow-[var(--sombra-cartao)] transition-all duration-500 hover:-translate-y-1 hover:border-salmon/45 hover:shadow-[0_28px_60px_-38px_rgba(10,10,8,0.5)]">
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <Image
                      src={caso.image}
                      alt={caso.client}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover grayscale transition-all duration-[1.2s] group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </div>

                  <div className="p-8">
                    <span className="eyebrow text-salmon-texto">{caso.niche}</span>
                    <h3 className="mt-3 text-xl font-semibold text-preto">
                      {caso.client}
                    </h3>
                    <p className="mt-3 leading-relaxed text-preto/72">
                      {caso.summary}
                    </p>
                    <p className="mt-6 border-t border-linha pt-5 text-sm font-medium text-salmon-texto">
                      {caso.result}
                    </p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.2}>
            <div className="mt-12 text-center">
              <Link
                href="/portfolio"
                className="group inline-flex items-center gap-2 rounded-full border border-preto/20 px-7 py-3.5 font-medium text-preto transition-colors duration-500 hover:border-salmon hover:text-salmon-texto"
              >
                Ver todos os cases
                <span
                  aria-hidden
                  className="transition-transform duration-500 group-hover:translate-x-1.5"
                >
                  →
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- 4. Depoimentos ---------- */}
      <section className="relative overflow-hidden bg-papel">
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-36">
          <SectionHeading
            eyebrow="Depoimentos"
            titulo={[
              { texto: "Quem já" },
              { texto: "trabalha com a gente.", acento: true },
            ]}
          />

          <Stagger className="mt-16 grid gap-5 md:grid-cols-3">
            {testimonials.map((depoimento, i) => (
              <StaggerItem
                // Os depoimentos ainda são placeholders com o mesmo nome; o índice
                // garante chave única até entrarem os depoimentos reais.
                key={i}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-linha bg-areia p-8 shadow-[var(--sombra-cartao)] transition-all duration-500 hover:-translate-y-1.5 hover:border-salmon/50 hover:bg-branco"
              >
                {/* Faixa de acento no topo do card: cresce ao passar o mouse. */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 w-0 bg-salmon transition-all duration-700 group-hover:w-full"
                />

                <span
                  aria-hidden
                  className="font-heading block text-7xl leading-[0.6] text-salmon"
                >
                  &ldquo;
                </span>

                <p className="mt-7 flex-1 text-[17px] leading-relaxed text-preto/85">
                  {depoimento.quote}
                </p>

                <div className="mt-8 flex items-center gap-4 border-t border-linha pt-6">
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-salmon/15 text-sm font-semibold text-salmon-texto"
                  >
                    {depoimento.name.replace(/[^A-Za-zÀ-ÿ ]/g, '').trim().charAt(0).toUpperCase() || '•'}
                  </span>
                  <span>
                    <span className="block font-semibold text-preto">
                      {depoimento.name}
                    </span>
                    <span className="block text-sm text-preto/60">
                      {depoimento.role}
                    </span>
                  </span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Prova social visual, logo depois de quem fala por escrito. Divide o
          fundo com os depoimentos de propósito: a borda superior da faixa já
          separa os dois, e assim a paridade papel/areia continua valendo mesmo
          quando não há logos cadastrados e a faixa não renderiza nada. */}
      <ClientLogos />

      {/* ---------- 5. O problema ---------- */}
      <section className="relative overflow-hidden bg-areia">
        <div className="glow-salmon pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] opacity-30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-36">
          <SectionHeading
            eyebrow="O problema que resolvemos"
            titulo={[
              { texto: "Negócios muito bons" },
              { texto: "que parecem medianos no digital.", acento: true },
            ]}
            lead="Não é falta de qualidade. É falta de tradução: a marca entrega um nível que a comunicação ainda não mostra."
          />

          <Stagger className="mt-16 grid gap-5 md:grid-cols-3">
            {sintomas.map((sintoma, i) => (
              <StaggerItem
                key={sintoma.titulo}
                className="group relative h-full overflow-hidden rounded-3xl border border-linha bg-branco p-8 shadow-[var(--sombra-cartao)] transition-all duration-500 hover:-translate-y-1 hover:border-salmon/45 hover:shadow-[0_28px_60px_-38px_rgba(10,10,8,0.5)] lg:p-9"
              >
                {/* Régua de lançamento, como nas abas de serviço e no método. */}
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-0 w-[3px] bg-salmon transition-all duration-700 ease-out group-hover:h-full"
                />

                <span
                  aria-hidden
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-salmon/15 text-salmon-texto transition-colors duration-500 group-hover:bg-salmon group-hover:text-preto"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    {iconesSintoma[i]}
                  </svg>
                </span>

                <h3 className="mt-6 text-xl font-semibold leading-snug text-preto">
                  {sintoma.titulo}
                </h3>
                <p className="mt-3 leading-relaxed text-preto/70">
                  {sintoma.descricao}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- 6. Método ---------- */}
      <section className="relative overflow-hidden bg-papel">
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-36">
          <SectionHeading
            eyebrow="Nosso método"
            alinhamento="esquerda"
            titulo={[
              { texto: "Quatro etapas que tiram" },
              { texto: "a marca do improviso.", acento: true },
            ]}
            lead="Um ciclo que não termina na publicação: ele recomeça a cada mês, com dado na mesa."
          />

          <MethodSteps etapas={metodo} />
        </div>
      </section>

      <SloganBand />

      {/* ---------- 7. Blog ---------- */}
      <section className="relative overflow-hidden bg-papel">
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-36">
          <SectionHeading
            eyebrow="Insights"
            alinhamento="esquerda"
            titulo={[
              { texto: "O que a gente" },
              { texto: "pensa sobre marca.", acento: true },
            ]}
          />

          <Stagger className="mt-16 grid gap-5 md:grid-cols-3">
            {blogPosts.slice(0, 3).map((post) => (
              <StaggerItem key={post.slug} className="h-full">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-linha bg-areia p-8 shadow-[var(--sombra-cartao)] transition-all duration-500 hover:-translate-y-1.5 hover:border-salmon/50 hover:bg-branco hover:shadow-[0_28px_60px_-38px_rgba(10,10,8,0.5)]"
                >
                  {/* Categoria vira etiqueta: dá um ponto de cor ao card e
                      separa a leitura do tempo estimado. */}
                  <div className="flex items-center gap-3">
                    <span className="eyebrow rounded-full bg-salmon/15 px-3 py-1.5 text-salmon-texto">
                      {post.category}
                    </span>
                    <span className="text-xs text-preto/55">{post.readingTime}</span>
                  </div>

                  <h3 className="mt-6 text-xl font-semibold leading-snug text-preto transition-colors duration-500 group-hover:text-salmon-texto">
                    {post.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-preto/70">
                    {post.excerpt}
                  </p>

                  <span className="mt-7 flex items-center justify-between border-t border-linha pt-5">
                    <span className="text-xs uppercase tracking-widest text-preto/50">
                      {formatarData(post.date)}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-linha text-preto/60 transition-all duration-500 group-hover:border-salmon group-hover:bg-salmon group-hover:text-preto">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- 8. FAQ ---------- */}
      <section className="relative overflow-hidden bg-areia">
        <div className="mx-auto max-w-3xl px-6 py-28 lg:py-36">
          <SectionHeading
            eyebrow="Dúvidas frequentes"
            titulo={[
              { texto: "O que você precisa saber" },
              { texto: "antes de começar.", acento: true },
            ]}
          />

          <Stagger className="mt-14 space-y-3">
            {faq.map((item) => (
              <StaggerItem key={item.question}>
                <details className="group rounded-2xl border border-linha bg-branco shadow-[var(--sombra-cartao)] px-6 py-5 transition-colors duration-500 open:border-salmon/40">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-preto [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span
                      aria-hidden
                      className="shrink-0 text-xl text-salmon-texto transition-transform duration-500 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-preto/72">
                    {item.answer}
                  </p>
                </details>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------- CTA final ---------- */}
      <section className="relative overflow-hidden bg-papel">
        <div className="glow-salmon pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 opacity-40 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 py-32 text-center lg:py-40">
          <h2 className="font-heading text-4xl font-semibold leading-[1.06] text-preto md:text-6xl">
            Pronto para lançar sua marca
            <span className="block text-salmon-texto">para o próximo nível?</span>
          </h2>
          <Reveal delay={0.15}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-preto/72">
              Fale com a equipe da {siteConfig.name} e receba um diagnóstico
              inicial da sua presença digital, sem compromisso.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <Link
              href="/contato"
              className="mt-10 inline-block rounded-full bg-salmon px-9 py-4 font-medium text-preto shadow-[0_0_40px_-8px_var(--color-salmon)] transition-all duration-500 hover:shadow-[0_0_64px_-4px_var(--color-salmon)]"
            >
              Solicitar diagnóstico
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
