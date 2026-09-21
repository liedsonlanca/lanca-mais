import Image from "next/image";
import Link from "next/link";
import { siteConfig, services, nichos, SERVICOS_EM_DESTAQUE } from "@/lib/site-config";
import { sintomas, metodo, entregaveis, publicos } from "@/lib/home";
import { lerVitrine, lerDepoimentos, lerCases, lerNumeros } from "@/lib/conteudo";
import { ehProvisorio } from "@/lib/provisorio";
import Hero from "@/components/Hero";
import WorkShowcase from "@/components/WorkShowcase";
import ClientLogos from "@/components/ClientLogos";
import DepoimentosCarrossel from "@/components/DepoimentosCarrossel";
import ServicosDestaque from "@/components/ServicosDestaque";
import { Rotulo, Titulo, Lead, Botao, LinkSeta } from "@/components/home/Pecas";
import Reveal from "@/components/motion/Reveal";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";

// A home, desde 21/09/2026.
//
// ---------- O que ela precisa responder ----------
//
// Na ordem em que alguém pergunta, antes de contratar uma agência:
//
//   1. Abertura ....... qual é o meu problema, e quem é a LANÇA+
//   2. O problema ..... como ele aparece no meu negócio, e quem resolve
//   3. Serviços ....... o que vocês fazem, e quais são os principais
//   4. Método ......... como vocês fazem, e o que eu recebo
//   5. Pra quem ....... isso serve para o meu caso
//   6. Trabalho ....... me mostra, sem eu ter que ler
//   7. Cases .......... deu certo para alguém
//   8. Depoimentos .... alguém confirma
//   9. Fecho .......... quem está por trás, e como eu falo com vocês
//
// Cases e depoimentos só existem quando forem reais; os provisórios têm
// colchetes e ficam escondidos.
//
// ---------- Por que tudo aqui é painel ----------
//
// A abertura sempre foi um retângulo de cantos arredondados, recuado das
// bordas, pousado sobre o fundo escuro. O resto era faixa chapada de ponta a
// ponta, e a home parecia dois sites colados, com a metade de baixo dissolvida
// no escuro. Agora cada seção é um painel igual ao da abertura, e o escuro em
// volta virou moldura em vez de vazio.
//
// Os painéis alternam claro e escuro. O claro é o mesmo tema-claro da
// abertura: uma classe redefine as cores do tema só ali dentro. É a
// alternância que faz o painel escuro existir aos olhos, porque retângulo
// escuro sobre fundo escuro não tem borda nem sombra que o salve.
//
// A alternância é calculada pela posição em que o painel de fato aparece, e
// não fixa no código: com cases e depoimentos escondidos, uma ordem fixa
// deixaria dois painéis da mesma cor colados.
//
// ---------- Por que quase não há caixas ----------
//
// A versão anterior era um card atrás do outro: sempre o mesmo retângulo de
// borda fina, com um ícone em quadradinho no canto e três colunas iguais.
// Repetido em todo bloco, aquilo vira molde, e molde é o que faz um site
// parecer montado por máquina. Aqui quem separa um assunto do outro é fio e
// espaço, e quem hierarquiza é o corpo da letra. Caixa ficou para o que é
// mesmo objeto: os cards de serviço, as fotos e os cases.

const FIO = "border-contorno";

/**
 * Um painel da home: o mesmo recuo, o mesmo raio e a mesma borda da abertura.
 *
 * `claro` troca o tema só dentro dele. `ultimo` fecha o recuo embaixo, para o
 * último painel não encostar no rodapé.
 *
 * A textura de ruído tira o plástico do fundo chapado. É sutil de propósito:
 * a 3,5% de opacidade ela não se vê, mas some quando é retirada.
 */
function Painel({
  claro = false,
  ultimo = false,
  id,
  children,
}: {
  claro?: boolean;
  ultimo?: boolean;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-4 bg-fundo px-2.5 pt-2.5 sm:px-4 sm:pt-4 ${
        ultimo ? "pb-2.5 sm:pb-4" : ""
      }`}
    >
      <div
        className={`noise relative overflow-hidden rounded-[26px] border border-contorno lg:rounded-[32px] ${
          claro ? "tema-claro bg-fundo" : "bg-fundo-alt"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

/** A caixa de texto do painel: a mesma largura e o mesmo respiro em todos. */
function Miolo({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-7xl px-6 lg:px-12 ${className}`}>
      {children}
    </div>
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

  // ---------- Os painéis depois da abertura ----------
  const secoes: Array<(claro: boolean) => React.ReactNode> = [];

  // 2. O problema, e a virada.
  //
  // Os três sintomas são uma lista editorial: número apagado, título no corpo
  // grande, explicação ao lado, separados por fio. Em card, os três viravam
  // três retângulos idênticos, e ninguém lê três retângulos idênticos.
  //
  // A virada é uma faixa salmão de ponta a ponta do painel, e é o único lugar
  // do site com a cor da marca ocupando tudo: é o ponto em que a pessoa acabou
  // de se reconhecer no problema, e o único momento antes do fim em que pedir
  // o contato não soa apressado.
  secoes.push((claro) => (
    <Painel key="problema" claro={claro}>
      <Miolo className="pt-16 lg:pt-24">
        <Rotulo>O problema que resolvemos</Rotulo>
        <Titulo
          linhas={[
            { texto: "Negócios muito bons que" },
            { texto: "parecem medianos no digital.", acento: "medianos" },
          ]}
        />
        <Lead>
          Não é falta de qualidade. É falta de tradução: a marca entrega um
          nível que a comunicação ainda não mostra.
        </Lead>

        <Stagger className={`mt-16 border-t ${FIO} lg:mt-20`}>
          {sintomas.map((sintoma, i) => (
            <StaggerItem key={sintoma.titulo}>
              <div
                className={`group relative grid gap-3 border-b ${FIO} py-8 md:grid-cols-[3.5rem_1fr_1.15fr] md:items-baseline md:gap-8 lg:py-10`}
              >
                {/* O fio de baixo acende de salmão quando o ponteiro passa:
                    é a linha que já separa, e não um enfeite a mais. */}
                <span
                  aria-hidden
                  className="absolute -bottom-px left-0 h-px w-0 bg-salmon transition-all duration-[900ms] ease-out group-hover:w-full"
                />

                <span className="numeral-fantasma text-sm text-tinta/30 transition-colors duration-500 group-hover:text-destaque">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3 className="font-heading text-2xl font-semibold leading-[1.15] tracking-[-0.025em] text-tinta lg:text-[1.8rem]">
                  {sintoma.titulo}
                </h3>

                <p className="leading-relaxed text-tinta/55">
                  {sintoma.descricao}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Miolo>

      {/* A virada, de ponta a ponta do painel. */}
      <Reveal delay={0.1}>
        <div className="relative mt-16 bg-salmon text-preto lg:mt-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16 lg:px-12 lg:py-20">
            <div>
              <span className="eyebrow text-preto/60">
                A LANÇA+ existe para isso
              </span>

              <p className="font-heading mt-6 text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.03em] lg:text-[2.75rem]">
                Uma agência inteira, num teto só, cuidando de estratégia,
                conteúdo e imagem ao mesmo tempo.
              </p>
            </div>

            <div>
              <p className="leading-relaxed text-preto/75">
                Sem terceirizar, sem freela solto, sem ruído entre quem pensa e
                quem executa. Você trata com um time, e ele responde pelo
                resultado inteiro.
              </p>

              <div className="mt-8">
                <Botao href="/contato" variante="contraste">
                  Receber um diagnóstico
                </Botao>
              </div>

              <p className="mt-4 text-sm text-preto/60">
                Sem compromisso. Você conta o momento da marca e a gente diz por
                onde começar.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </Painel>
  ));

  // 3. Serviços em evidência
  //
  // Título à esquerda e o texto de apoio à direita, na mesma linha, para a
  // seção abrir larga e os cards entrarem logo em seguida.
  secoes.push((claro) => (
    <Painel key="servicos" claro={claro}>
      <Miolo className="py-16 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
          <div>
            <Rotulo>O que fazemos</Rotulo>
            <Titulo
              linhas={[
                { texto: "Três formas de" },
                { texto: "lançar a sua marca.", acento: "lançar" },
              ]}
            />
          </div>

          <Lead className="mt-0 lg:pb-3">
            Duas frentes de marketing e a produção audiovisual. Cada uma resolve
            um problema diferente, e as três andam juntas quando a marca precisa
            de tudo ao mesmo tempo.
          </Lead>
        </div>

        <ServicosDestaque itens={destaques} />

        {/* Os outros serviços. Em fio, e não em caixa: é rodapé do assunto,
            não um bloco novo. Os nomes ficam à vista para quem procura um
            deles não ter que clicar às cegas. */}
        {outros.length > 0 && (
          <Reveal delay={0.15}>
            <div
              className={`mt-14 flex flex-col gap-8 border-t ${FIO} pt-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16`}
            >
              <div className="min-w-0">
                <span className="eyebrow text-tinta/40">Também fazemos</span>
                <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-1">
                  {outros.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/servicos/${s.slug}`}
                        className="inline-flex min-h-11 items-center text-lg text-tinta/65 transition-colors duration-500 hover:text-destaque"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shrink-0">
                <Botao
                  href="/servicos"
                  variante={claro ? "contraste" : "vazado"}
                >
                  Conhecer todos
                </Botao>
              </div>
            </div>
          </Reveal>
        )}
      </Miolo>
    </Painel>
  ));

  // 4. Como fazemos, e o que você recebe.
  //
  // As duas perguntas no mesmo painel porque a resposta de uma sem a outra
  // fica no ar: método sem entregável é discurso, e entregável sem método é
  // lista de compras. A coluna da direita gruda na tela enquanto as etapas
  // passam, então o que se recebe continua à vista durante a explicação.
  secoes.push((claro) => (
    <Painel key="metodo" claro={claro}>
      <Miolo className="py-16 lg:py-24">
        <Rotulo>Como fazemos</Rotulo>
        <Titulo
          linhas={[
            { texto: "Quatro etapas que tiram" },
            { texto: "a marca do improviso.", acento: "improviso." },
          ]}
        />
        <Lead>
          Um ciclo que não termina na publicação: ele recomeça, com dado na
          mesa.
        </Lead>

        <div className="mt-16 grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:gap-20 xl:gap-28">
          <Stagger className={`border-t ${FIO}`}>
            {metodo.map((etapa) => (
              <StaggerItem key={etapa.numero}>
                <div
                  className={`group relative grid gap-3 border-b ${FIO} py-8 sm:grid-cols-[3.5rem_1fr] sm:gap-8 lg:py-10`}
                >
                  <span
                    aria-hidden
                    className="absolute -bottom-px left-0 h-px w-0 bg-salmon transition-all duration-[900ms] ease-out group-hover:w-full"
                  />

                  <span className="numeral-fantasma text-sm text-tinta/30 transition-colors duration-500 group-hover:text-destaque">
                    {etapa.numero}
                  </span>

                  <div className="min-w-0">
                    <h3 className="font-heading text-2xl font-semibold leading-[1.15] tracking-[-0.025em] text-tinta">
                      {etapa.titulo}
                    </h3>
                    <p className="mt-3 max-w-xl leading-relaxed text-tinta/55">
                      {etapa.descricao}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.15}>
            <div className="lg:sticky lg:top-28">
              <span className="eyebrow text-destaque">O que você recebe</span>
              <p className="mt-5 text-lg font-medium leading-relaxed text-tinta/75">
                Todo mês, e não uma vez só na assinatura do contrato.
              </p>

              <ul className={`mt-9 border-t ${FIO}`}>
                {entregaveis.map((item, i) => (
                  <li
                    key={item}
                    className={`flex items-baseline gap-5 border-b ${FIO} py-4`}
                  >
                    <span className="numeral-fantasma text-xs text-tinta/25">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-relaxed text-tinta/80">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Miolo>
    </Painel>
  ));

  // 5. Pra quem fazemos.
  //
  // Dois perfis, e não uma lista de nichos solta: a pessoa precisa se
  // encontrar em um dos dois em dois segundos, e cada um leva direto ao
  // serviço que é dele. Os nichos ficam embaixo, numa linha só, como
  // confirmação de que já passamos pelo dela.
  secoes.push((claro) => (
    <Painel key="publico" claro={claro}>
      <Miolo className="py-16 lg:py-24">
        <Rotulo>Pra quem fazemos</Rotulo>
        <Titulo
          linhas={[
            { texto: "Duas situações," },
            { texto: "dois caminhos.", acento: "caminhos." },
          ]}
        />

        <div className={`mt-16 grid border-t ${FIO} md:grid-cols-2`}>
          {publicos.map((publico, i) => {
            const servico = services.find((s) => s.slug === publico.servico);

            return (
              <Link
                key={publico.servico}
                href={`/servicos/${publico.servico}`}
                className={`group relative flex flex-col py-10 transition-colors duration-500 md:py-12 ${
                  i === 0
                    ? `border-b ${FIO} md:border-b-0 md:border-r md:pr-12 lg:pr-20`
                    : `md:pl-12 lg:pl-20`
                }`}
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-px w-0 bg-salmon transition-all duration-[900ms] ease-out group-hover:w-full"
                />

                <span className="numeral-fantasma text-sm text-tinta/30 transition-colors duration-500 group-hover:text-destaque">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3 className="font-heading mt-6 text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.03em] text-tinta lg:text-[2.4rem]">
                  {publico.titulo}
                </h3>

                <p className="mt-5 max-w-md text-lg leading-relaxed text-tinta/60">
                  {publico.descricao}
                </p>

                <ul className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-tinta/45">
                  {publico.exemplos.map((exemplo, j) => (
                    <li key={exemplo} className="flex items-center gap-4">
                      {exemplo}
                      {j < publico.exemplos.length - 1 && (
                        <span aria-hidden className="text-salmon/60">
                          ·
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <span className="mt-auto flex items-center gap-2.5 pt-10 font-medium text-destaque">
                  {servico?.name ?? "Conhecer"}
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
                </span>
              </Link>
            );
          })}
        </div>

        {/* Os nichos, numa linha corrida. A estrela separa, como na faixa da
            abertura. */}
        <Reveal delay={0.2}>
          <div className={`mt-14 border-t ${FIO} pt-10`}>
            <span className="eyebrow text-tinta/40">
              Nichos por onde a LANÇA+ já passou
            </span>
            <p className="font-heading mt-6 text-xl leading-[1.9] tracking-[-0.02em] text-tinta/55 lg:text-2xl">
              {nichos.map((nicho, i) => (
                <span key={nicho}>
                  {nicho}
                  {i < nichos.length - 1 && (
                    <span aria-hidden className="px-3.5 text-salmon">
                      ✦
                    </span>
                  )}
                </span>
              ))}
            </p>
          </div>
        </Reveal>
      </Miolo>
    </Painel>
  ));

  // 6. Nosso trabalho
  //
  // O id é o destino do "Ver todo o trabalho" da abertura.
  secoes.push((claro) => (
    <Painel key="trabalho" claro={claro} id="nosso-trabalho">
      <Miolo className="pt-16 lg:pt-24">
        <Rotulo>Nosso trabalho</Rotulo>
        <Titulo
          linhas={[
            { texto: "Cada peça que sai daqui" },
            { texto: "tem um porquê.", acento: "porquê." },
          ]}
        />
        <Lead>
          Nada sobe por subir. Todo conteúdo responde a um objetivo da
          estratégia.
        </Lead>
      </Miolo>

      <div className="pb-16 pt-12 lg:pb-24 lg:pt-16">
        <WorkShowcase vitrine={vitrine} />
      </div>
    </Painel>
  ));

  // 7. Cases, só os reais, e só dois: a home mostra a prova, o portfólio conta
  // a história inteira.
  if (casosReais.length > 0) {
    secoes.push((claro) => (
      <Painel key="cases" claro={claro}>
        <Miolo className="py-16 lg:py-24">
          <Rotulo>Resultado</Rotulo>
          <Titulo
            linhas={[
              { texto: "Marcas que" },
              { texto: "mudaram de patamar.", acento: "patamar." },
            ]}
          />

          <Stagger className="mt-16 grid gap-6 md:grid-cols-2">
            {casosReais.slice(0, 2).map((caso) => (
              <StaggerItem key={caso.slug}>
                <article className="group h-full">
                  <div className="relative aspect-[16/11] overflow-hidden rounded-[22px]">
                    <Image
                      src={caso.image}
                      alt={caso.client}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover grayscale transition-all duration-[1.2s] group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </div>

                  <div className={`mt-7 flex items-end justify-between gap-6 border-t ${FIO} pt-6`}>
                    <div className="min-w-0">
                      <span className="eyebrow text-destaque">
                        {caso.niche}
                      </span>
                      <h3 className="font-heading mt-3 text-2xl font-semibold tracking-[-0.025em] text-tinta">
                        {caso.client}
                      </h3>
                      <p className="mt-2 text-tinta/60">{caso.result}</p>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.15}>
            <div className="mt-12">
              <LinkSeta href="/portfolio">Ver todos os cases</LinkSeta>
            </div>
          </Reveal>
        </Miolo>
      </Painel>
    ));
  }

  // 8. Depoimentos, só os reais
  if (depoimentosReais.length > 0) {
    secoes.push((claro) => (
      <Painel key="depoimentos" claro={claro}>
        <Miolo className="py-16 lg:py-24">
          <Rotulo>Depoimentos</Rotulo>
          <Titulo
            linhas={[
              { texto: "Quem já" },
              { texto: "trabalha com a gente.", acento: "gente." },
            ]}
          />
          <DepoimentosCarrossel itens={depoimentosReais} />
        </Miolo>
      </Painel>
    ));
  }

  // 9. Quem está por trás, e a chamada final no mesmo painel.
  //
  // Separados, eram dois blocos magros em sequência e a página acabava com um
  // título solto no escuro. Juntos, quem chegou até aqui vê com quem vai falar
  // e o botão para falar, sem rolar de novo. Sem os números: a abertura já os
  // mostra.
  secoes.push((claro) => (
    <Painel key="fecho" claro={claro} ultimo>
      <Miolo className="pt-16 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-20">
          <div>
            <Rotulo>Quem é a LANÇA+</Rotulo>
            <Titulo
              linhas={[
                { texto: "Uma agência inteira" },
                { texto: "debaixo do mesmo teto.", acento: "teto." },
              ]}
            />
            <Lead>
              Estratégia, audiovisual, tráfego, identidade visual, web e
              arquitetura, em Cajazeiras, com equipe própria. Sem terceirização,
              sem ruído entre quem pensa e quem executa.
            </Lead>

            <Reveal delay={0.2}>
              <div className="mt-10">
                <LinkSeta href="/sobre">Conhecer a equipe</LinkSeta>
              </div>
            </Reveal>
          </div>

          <Reveal distance={40}>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[22px]">
                <Image
                  src="/images/team/equipe-1.jpg"
                  alt="Equipe da LANÇA+"
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-[1.2s] hover:scale-105"
                />
              </div>
              <div className="relative mt-12 aspect-[3/4] overflow-hidden rounded-[22px]">
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
      </Miolo>

      {/* A chamada final, ainda dentro do mesmo painel. O fio acima dela é o
          que diz que mudou de assunto, sem precisar de outro bloco. */}
      <div className={`relative mt-20 border-t ${FIO} lg:mt-28`}>
        <div className="glow-salmon pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center lg:py-24">
          <h2 className="font-heading text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.04em] text-tinta sm:text-6xl lg:text-[4.5rem]">
            Pronto para lançar
            <span className="block">
              a sua <span className="text-destaque">marca?</span>
            </span>
          </h2>

          <Reveal delay={0.15}>
            <p className="mx-auto mt-7 max-w-lg text-lg font-medium text-tinta/70">
              Fale com a equipe da {siteConfig.name} e receba uma proposta para
              a sua marca.
            </p>
          </Reveal>

          <Reveal delay={0.25}>
            <div className="mt-10 flex justify-center">
              <Botao href="/contato">Pedir orçamento</Botao>
            </div>
          </Reveal>
        </div>
      </div>
    </Painel>
  ));

  // O fecho é o último painel; a faixa de logos entra logo antes dele, e traz
  // fundo e fios próprios, então fica fora da alternância.
  const antesDoFecho = secoes.slice(0, -1);
  const fecho = secoes[secoes.length - 1];

  return (
    <>
      <Hero numeros={numeros} vitrine={vitrine} depoimentos={depoimentos} />

      {antesDoFecho.map((secao, i) => secao(i % 2 === 1))}

      <ClientLogos />

      {fecho(antesDoFecho.length % 2 === 1)}
    </>
  );
}
