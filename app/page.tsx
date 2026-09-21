import Image from "next/image";
import Link from "next/link";
import { siteConfig, services, SERVICOS_EM_DESTAQUE } from "@/lib/site-config";
import { lerVitrine, lerDepoimentos, lerCases, lerNumeros } from "@/lib/conteudo";
import { ehProvisorio } from "@/lib/provisorio";
import Hero from "@/components/Hero";
import WorkShowcase from "@/components/WorkShowcase";
import ClientLogos from "@/components/ClientLogos";
import SectionHeading from "@/components/SectionHeading";
import ServiceIcon from "@/components/ServiceIcon";
import Reveal from "@/components/motion/Reveal";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";
import DepoimentosCarrossel from "@/components/DepoimentosCarrossel";

// A home, desde 18/09/2026.
//
// Enxuta de propósito. Quem chega para contratar marketing não fica lendo: quer
// ver o que a agência faz, uma prova de que faz bem, e o botão de falar. A home
// tinha onze seções e as sete frentes uma embaixo da outra; agora são estas,
// nesta ordem:
//
//   1. Abertura: proposta, números, vídeos e nichos, tudo na primeira tela;
//   2. Os três serviços em evidência, e os outros atrás de um botão;
//   3. Nosso trabalho: as peças e os vídeos, que se veem sem ler;
//   4. Cases e 5. Depoimentos, só quando forem reais;
//   6. Sobre a agência, curto, com o convite para conhecer a equipe;
//   7. Logos de clientes, só quando houver;
//   8. A chamada final.
//
// O problema, o método e as perguntas saíram. O que eles diziam continua no
// site: a frase-problema abre a abertura, e cada página de serviço tem as suas
// etapas e perguntas. O "sobre" chegou a sair também, e voltou a pedido do
// cliente: sem ele a home era só oferta, sem dizer quem está por trás.
//
// Os fundos alternam sozinhos. Cases e depoimentos podem estar escondidos, e
// uma ordem fixa de fundos deixaria duas seções vizinhas da mesma cor quando
// um deles some. Por isso cada seção recebe o fundo pela posição em que de
// fato aparece.

const FUNDOS = ["bg-fundo", "bg-fundo-alt"] as const;

function Seta() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default async function Home() {
  // Conteúdo editável pelo painel. Sem banco configurado cada leitura devolve
  // o conteúdo estático de lib/, então a home nunca fica vazia.
  const [vitrine, depoimentos, cases, numeros] = await Promise.all([
    lerVitrine(),
    lerDepoimentos(),
    lerCases(),
    lerNumeros(),
  ]);

  const destaques = SERVICOS_EM_DESTAQUE.map((slug) =>
    services.find((s) => s.slug === slug)
  ).filter((s): s is (typeof services)[number] => Boolean(s));
  const outros = services.filter((s) => !SERVICOS_EM_DESTAQUE.includes(s.slug));

  // Prova social só entra verdadeira. Os provisórios têm colchetes.
  const casosReais = cases.filter(
    (c) => !ehProvisorio(c.client, c.niche, c.summary, c.result)
  );
  const depoimentosReais = depoimentos.filter(
    (d) => !ehProvisorio(d.citacao, d.nome, d.cargo)
  );

  // ---------- As seções depois da abertura ----------
  // Cada uma recebe o fundo pela posição em que aparece (ver o topo).
  const secoes: Array<(fundo: string) => React.ReactNode> = [];

  // 2. Serviços em evidência
  secoes.push((fundo) => (
    <section key="servicos" className={`relative overflow-hidden ${fundo}`}>
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
        <SectionHeading
          eyebrow="Serviços"
          alinhamento="esquerda"
          titulo={[
            { texto: "Três formas de" },
            { texto: "lançar a sua marca.", acento: "lançar" },
          ]}
        />

        {/* Cards numerados, como os da referência escura: o número em salmão
            diz a ordem de leitura sem precisar de texto. */}
        <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
          {destaques.map((s, i) => (
            <StaggerItem key={s.slug} className="h-full">
              <Link
                href={`/servicos/${s.slug}`}
                className="group relative flex h-full min-h-[300px] flex-col rounded-3xl border border-contorno bg-cartao p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-salmon/50 focus-visible:-translate-y-1.5 focus-visible:border-salmon focus-visible:outline-none sm:p-8 lg:min-h-[340px]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="numeral-fantasma text-5xl leading-none text-salmon">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    aria-hidden
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-salmon/12 text-salmon"
                  >
                    <ServiceIcon slug={s.slug} className="h-6 w-6" />
                  </span>
                </div>

                <div className="mt-auto pt-12">
                  <h3 className="text-2xl font-semibold tracking-[-0.02em] text-tinta">
                    {s.name}
                  </h3>
                  <p className="mt-3 leading-relaxed text-tinta/65">
                    {s.shortDescription}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-destaque">
                    Conhecer
                    <Seta />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Os outros serviços: nomes à vista, para quem procura um deles
            achar sem clicar às cegas, e o botão para a página com todos. */}
        {outros.length > 0 && (
          <Reveal delay={0.15}>
            <div className="mt-6 flex flex-col gap-5 rounded-3xl border border-contorno p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:p-7">
              <div className="min-w-0">
                <p className="text-sm text-tinta/55">Também fazemos</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {outros.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/servicos/${s.slug}`}
                        className="inline-flex min-h-11 items-center rounded-full border border-contorno px-4 text-sm text-tinta/80 transition-colors duration-500 hover:border-salmon hover:text-tinta"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/servicos"
                className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-tinta px-6 font-medium text-fundo transition-transform duration-500 hover:-translate-y-0.5"
              >
                Conhecer outros serviços
                <Seta />
              </Link>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  ));

  // 3. Nosso trabalho
  // O id é o destino do "Ver todo o trabalho" da abertura; scroll-mt desconta
  // o menu fixo, que senão cobriria o título ao chegar.
  secoes.push((fundo) => (
    <section
      key="trabalho"
      id="nosso-trabalho"
      className={`relative scroll-mt-20 overflow-hidden ${fundo}`}
    >
      <div className="mx-auto max-w-7xl px-6 pt-14 lg:px-10 lg:pt-20">
        <SectionHeading
          eyebrow="Nosso trabalho"
          titulo={[
            { texto: "Cada peça que sai daqui" },
            { texto: "tem um porquê.", acento: "porquê." },
          ]}
        />
      </div>

      <div className="pb-14 pt-10 lg:pb-20 lg:pt-12">
        <WorkShowcase vitrine={vitrine} />
      </div>
    </section>
  ));

  // 4. Cases, só os reais, e só dois: a home mostra a prova, o portfólio conta
  // a história inteira.
  if (casosReais.length > 0) {
    secoes.push((fundo) => (
      <section key="cases" className={`relative overflow-hidden ${fundo}`}>
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
          <SectionHeading
            eyebrow="Cases"
            alinhamento="esquerda"
            titulo={[
              { texto: "Marcas que" },
              { texto: "mudaram de patamar.", acento: "patamar." },
            ]}
          />

          <Stagger className="mt-12 grid gap-5 md:grid-cols-2">
            {casosReais.slice(0, 2).map((caso) => (
              <StaggerItem key={caso.slug}>
                <article className="group h-full overflow-hidden rounded-3xl border border-contorno bg-cartao shadow-[var(--sombra-cartao)] transition-all duration-500 hover:-translate-y-1 hover:border-salmon/45">
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <Image
                      src={caso.image}
                      alt={caso.client}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover grayscale transition-all duration-[1.2s] group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </div>
                  <div className="p-7 sm:p-8">
                    <span className="eyebrow text-destaque">{caso.niche}</span>
                    <h3 className="mt-3 text-xl font-semibold text-tinta">
                      {caso.client}
                    </h3>
                    <p className="mt-4 border-t border-contorno pt-4 text-sm font-medium text-destaque">
                      {caso.result}
                    </p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.15}>
            <div className="mt-10">
              <Link
                href="/portfolio"
                className="group inline-flex min-h-11 items-center gap-2 font-medium text-tinta"
              >
                Ver todos os cases
                <Seta />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    ));
  }

  // 5. Depoimentos, só os reais
  if (depoimentosReais.length > 0) {
    secoes.push((fundo) => (
      <section key="depoimentos" className={`relative overflow-hidden ${fundo}`}>
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
          <SectionHeading
            eyebrow="Depoimentos"
            titulo={[
              { texto: "Quem já" },
              { texto: "trabalha com a gente.", acento: "gente." },
            ]}
          />
          <DepoimentosCarrossel itens={depoimentosReais} />
        </div>
      </section>
    ));
  }

  // 6. Sobre a agência
  // Voltou a pedido do cliente, que sentiu falta de a home dizer quem está por
  // trás do trabalho. Fica logo antes da chamada final: quem chegou até aqui já
  // quer saber com quem vai falar. Sem os números, que a abertura já mostra.
  secoes.push((fundo) => (
    <section key="sobre" className={`relative overflow-hidden ${fundo}`}>
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Sobre a LANÇA+"
              alinhamento="esquerda"
              titulo={[
                { texto: "Uma agência inteira" },
                { texto: "debaixo do mesmo teto.", acento: "teto." },
              ]}
              lead="Estratégia, audiovisual, tráfego, identidade visual, web e arquitetura. Sem terceirização, sem ruído entre quem pensa e quem executa."
            />

            <Reveal delay={0.2}>
              <Link
                href="/sobre"
                className="group mt-9 inline-flex min-h-12 items-center gap-2 rounded-full border border-tinta/20 px-7 font-medium text-tinta transition-colors duration-500 hover:border-tinta"
              >
                Conhecer a equipe
                <Seta />
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
  ));

  // 7. Chamada final
  secoes.push((fundo) => (
    <section key="chamada" className={`relative overflow-hidden ${fundo}`}>
      <div className="glow-salmon pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 opacity-35 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-6 py-14 text-center lg:py-20">
        <h2 className="font-heading text-4xl font-semibold leading-[1.06] tracking-[-0.03em] text-tinta md:text-6xl">
          Pronto para lançar
          <span className="block">
            a sua <span className="text-destaque">marca?</span>
          </span>
        </h2>
        <Reveal delay={0.15}>
          <p className="mx-auto mt-5 max-w-md text-lg text-tinta/70">
            Fale com a equipe da {siteConfig.name} e receba uma proposta para a
            sua marca.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <Link
            href="/contato"
            className="group mt-9 inline-flex min-h-12 items-center gap-2 rounded-full bg-salmon px-8 font-medium text-preto shadow-[0_0_40px_-8px_var(--color-salmon)] transition-all duration-500 hover:shadow-[0_0_64px_-4px_var(--color-salmon)]"
          >
            Pedir orçamento
            <Seta />
          </Link>
        </Reveal>
      </div>
    </section>
  ));

  // A chamada final é a última; os logos entram logo antes dela, e trazem
  // fundo e fios próprios, então ficam fora da alternância.
  const antesDaChamada = secoes.slice(0, -1);
  const chamada = secoes[secoes.length - 1];

  return (
    <>
      <Hero numeros={numeros} vitrine={vitrine} depoimentos={depoimentos} />

      {antesDaChamada.map((secao, i) => secao(FUNDOS[i % 2]))}

      <ClientLogos />

      {chamada(FUNDOS[antesDaChamada.length % 2])}
    </>
  );
}
