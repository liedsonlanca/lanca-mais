import Image from "next/image";
import Link from "next/link";
import { services, SERVICOS_EM_DESTAQUE } from "@/lib/site-config";
import {
  sintomas,
  metodo,
  entregaveis,
  FOTO_PROBLEMA,
  FOTO_EQUIPE,
  FOTO_CHAMADA,
} from "@/lib/home";
import { lerVitrine, lerDepoimentos, lerCases, lerNumeros } from "@/lib/conteudo";
import { servicePages } from "@/lib/service-pages";
import { ehProvisorio } from "@/lib/provisorio";
import Hero from "@/components/Hero";
import WorkShowcase from "@/components/WorkShowcase";
import ClientLogos from "@/components/ClientLogos";
import DepoimentosCarrossel from "@/components/DepoimentosCarrossel";
import ServicosDestaque from "@/components/ServicosDestaque";
import FaqServicos, { type AbaFaq } from "@/components/home/FaqServicos";
import { Rotulo, Titulo, Botao, LinkSeta } from "@/components/home/Pecas";
import Reveal from "@/components/motion/Reveal";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";

// A home, desde 21/09/2026.
//
// ---------- O que ela responde, e em quantas telas ----------
//
// Ela precisa responder nove perguntas e, ao mesmo tempo, não dar nada para
// ler. As duas coisas brigam, e a saída é responder em fragmento em vez de
// em frase: onde havia um parágrafo explicando o sintoma, ficou o sintoma;
// onde havia um parágrafo por etapa, ficou o nome da etapa.
//
// A versão anterior tinha 8.006px de altura a 1280, dez telas de rolagem, com
// um título de duas linhas em corpo enorme e um parágrafo de apoio embaixo de
// cada um dos seis blocos. Quem chega para contratar marketing não lê isso.
//
//   Abertura ..... qual é o problema, quem é a LANÇA+, números, vídeos, nichos
//   Problema ..... os três sintomas, e a faixa que diz quem resolve
//   Serviços ..... o que fazemos, e pra quem cada um é
//   Método ....... como fazemos, e o que você recebe
//   Trabalho ..... a prova, que se vê sem ler
//   Cases e depoimentos, quando forem reais
//   Fecho ........ quem está por trás, e o botão
//
// O painel "Pra quem fazemos" saiu: os dois perfis já estão na linha de
// resumo de cada serviço, e os nichos correm na faixa da abertura. Ele
// custava mil pixels para repetir o que a página já tinha dito.
//
// ---------- Por que tudo aqui é painel ----------
//
// A abertura sempre foi um retângulo de cantos arredondados, recuado das
// bordas, pousado sobre o fundo escuro. O resto era faixa chapada de ponta a
// ponta, e a home parecia dois sites colados, com a metade de baixo dissolvida
// no escuro. Agora cada seção é um painel igual ao da abertura, e o escuro em
// volta virou moldura em vez de vazio.
//
// Os painéis alternam claro e escuro, e a alternância é calculada pela posição
// em que o painel de fato aparece: com cases e depoimentos escondidos, uma
// ordem fixa deixaria dois painéis da mesma cor colados.

const FIO = "border-contorno";

/**
 * Um painel da home: o mesmo recuo, o mesmo raio e a mesma borda da abertura.
 *
 * `claro` troca o tema só dentro dele. `ultimo` fecha o recuo embaixo, para o
 * último painel não encostar no rodapé.
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

  // As duvidas dos tres servicos em evidencia, uma aba para cada. Servico sem
  // pergunta cadastrada nao vira aba vazia: some.
  const abasFaq: AbaFaq[] = destaques.flatMap((s) => {
    const pagina = servicePages[s.slug];
    if (!pagina || pagina.faq.length === 0) return [];

    return [
      {
        slug: s.slug,
        nome: s.name,
        perguntas: pagina.faq.map((d) => ({
          pergunta: d.question,
          resposta: d.answer,
        })),
      },
    ];
  });

  // ---------- Os painéis depois da abertura ----------
  const secoes: Array<(claro: boolean) => React.ReactNode> = [];

  // 2. O problema, e a virada.
  //
  // Só os três sintomas, lado a lado, sem a explicação embaixo de cada um: o
  // sintoma já é a frase inteira, e quem se reconhece nele não precisa de um
  // parágrafo confirmando. A explicação continua viva nas páginas de serviço,
  // para quem quiser.
  //
  // A faixa salmão é o único lugar do site com a cor da marca ocupando tudo,
  // e é o ponto em que a pessoa acabou de se reconhecer no problema.
  secoes.push((claro) => (
    <Painel key="problema" claro={claro}>
      <Miolo className="pt-12 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-14">
          <div>
            <Rotulo>O que trava a sua marca</Rotulo>
            <Titulo
              linhas={[
                { texto: "Bom negócio, presença mediana.", acento: "mediana." },
              ]}
            />

            <Stagger className={`mt-9 border-t ${FIO}`}>
              {sintomas.map((sintoma, i) => (
                <StaggerItem key={sintoma.titulo}>
                  <div
                    className={`group relative flex items-baseline gap-5 border-b ${FIO} py-5`}
                  >
                    <span
                      aria-hidden
                      className="absolute -bottom-px left-0 h-px w-0 bg-salmon transition-all duration-[900ms] ease-out group-hover:w-full"
                    />
                    <span className="numeral-fantasma text-sm text-tinta/30 transition-colors duration-500 group-hover:text-destaque">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-heading text-xl font-semibold leading-[1.2] tracking-[-0.025em] text-tinta lg:text-[1.45rem]">
                      {sintoma.titulo}
                    </h3>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          {/* O retrato. Figura andando, que é o que a marca diz de si na
              assinatura: somos movimento. Fica alto e colado no texto, do
              tamanho da coluna inteira, e não como uma miniatura decorando
              o canto. */}
          <Reveal distance={40}>
            <div className="relative h-full min-h-[360px] overflow-hidden rounded-[22px] lg:min-h-[460px]">
              <Image
                src={FOTO_PROBLEMA.src}
                alt={FOTO_PROBLEMA.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover object-[50%_25%]"
              />
            </div>
          </Reveal>
        </div>
      </Miolo>

      {/* A virada, de ponta a ponta do painel, numa linha só. */}
      <Reveal delay={0.1}>
        <div className="relative mt-12 bg-salmon text-preto lg:mt-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-7 px-6 py-9 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-12 lg:py-10">
            <p className="font-heading max-w-2xl text-[1.6rem] font-semibold leading-[1.12] tracking-[-0.03em] lg:text-[2.1rem]">
              Uma agência inteira, num teto só, resolvendo isso.
            </p>

            <div className="shrink-0">
              <Botao href="/contato" variante="contraste">
                Receber um diagnóstico
              </Botao>
            </div>
          </div>
        </div>
      </Reveal>
    </Painel>
  ));

  // 3. Serviços em evidência.
  //
  // A linha de resumo de cada card diz pra quem aquele serviço é, então o
  // painel responde "o que fazemos" e "pra quem" de uma vez, sem um segundo
  // bloco só para isso.
  secoes.push((claro) => (
    <Painel key="servicos" claro={claro}>
      <Miolo className="py-12 lg:py-16">
        <Rotulo>O que fazemos</Rotulo>
        <Titulo
          linhas={[{ texto: "Três formas de lançar.", acento: "lançar." }]}
        />

        <ServicosDestaque itens={destaques} />

        {/* Os outros serviços, numa linha só. Em lista, eram cinco itens
            ocupando duas alturas de texto para dizer o que cabe numa. */}
        {outros.length > 0 && (
          <Reveal delay={0.15}>
            <div
              className={`mt-10 flex flex-col gap-5 border-t ${FIO} pt-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10`}
            >
              <p className="text-tinta/50">
                <span className="text-tinta/35">Também fazemos </span>
                {outros.map((s, i) => (
                  <span key={s.slug}>
                    <Link
                      href={`/servicos/${s.slug}`}
                      className="text-tinta/65 transition-colors duration-500 hover:text-destaque"
                    >
                      {s.name}
                    </Link>
                    {i < outros.length - 1 && (
                      <span aria-hidden className="px-2 text-salmon/50">
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </p>

              <div className="shrink-0">
                <Botao
                  href="/servicos"
                  variante={claro ? "contraste" : "vazado"}
                >
                  Ver todos
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
  // As quatro etapas em fileira, só o nome: o ciclo se entende pela ordem, e
  // a descrição de cada uma custava uma altura de parágrafo por etapa. Os
  // entregáveis em três colunas logo abaixo, no mesmo painel, porque método
  // sem entregável é discurso.
  secoes.push((claro) => (
    <Painel key="metodo" claro={claro}>
      <Miolo className="py-12 lg:py-16">
        <Rotulo>Como fazemos</Rotulo>
        <Titulo
          linhas={[
            { texto: "Quatro etapas, zero improviso.", acento: "improviso." },
          ]}
        />

        <Stagger className={`mt-10 grid border-t ${FIO} sm:grid-cols-2 lg:grid-cols-4`}>
          {metodo.map((etapa, i) => (
            <StaggerItem key={etapa.numero}>
              <div
                className={`group relative flex h-full items-baseline gap-4 border-b ${FIO} py-6 lg:border-b-0 ${
                  i < metodo.length - 1 ? `lg:border-r ${FIO}` : ""
                } ${i > 0 ? "lg:pl-7" : ""} lg:pr-7`}
              >
                <span className="numeral-fantasma text-sm text-tinta/30 transition-colors duration-500 group-hover:text-destaque">
                  {etapa.numero}
                </span>
                <h3 className="font-heading text-xl font-semibold tracking-[-0.025em] text-tinta">
                  {etapa.titulo}
                </h3>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.15}>
          <div className={`mt-10 border-t ${FIO} pt-7`}>
            <span className="eyebrow text-destaque">
              O que você recebe, todo mês
            </span>

            <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {entregaveis.map((item) => (
                <li key={item} className="flex items-baseline gap-3">
                  <span aria-hidden className="text-salmon">
                    ✦
                  </span>
                  <span className="text-tinta/70">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Miolo>
    </Painel>
  ));

  // 5. Nosso trabalho.
  //
  // O único painel sem nada para ler, de propósito: é a resposta visual, e é
  // onde a pessoa que não leu nada até aqui decide se gosta.
  //
  // O id é o destino do "Ver todo o trabalho" da abertura.
  secoes.push((claro) => (
    <Painel key="trabalho" claro={claro} id="nosso-trabalho">
      <Miolo className="pt-12 lg:pt-16">
        <Rotulo>Nosso trabalho</Rotulo>
        <Titulo
          linhas={[{ texto: "Peça por peça, com porquê.", acento: "porquê." }]}
        />
      </Miolo>

      <div className="pb-12 pt-9 lg:pb-16 lg:pt-10">
        <WorkShowcase vitrine={vitrine} />
      </div>
    </Painel>
  ));

  // 6. Cases, só os reais, e só dois: a home mostra a prova, o portfólio conta
  // a história inteira.
  if (casosReais.length > 0) {
    secoes.push((claro) => (
      <Painel key="cases" claro={claro}>
        <Miolo className="py-12 lg:py-16">
          <Rotulo>Resultado</Rotulo>
          <Titulo
            linhas={[
              { texto: "Marcas que mudaram de patamar.", acento: "patamar." },
            ]}
          />

          <Stagger className="mt-10 grid gap-6 md:grid-cols-2">
            {casosReais.slice(0, 2).map((caso) => (
              <StaggerItem key={caso.slug}>
                <article className="group h-full">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[22px]">
                    <Image
                      src={caso.image}
                      alt={caso.client}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover grayscale transition-all duration-[1.2s] group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </div>

                  <div
                    className={`mt-5 flex items-baseline justify-between gap-6 border-t ${FIO} pt-4`}
                  >
                    <h3 className="font-heading text-xl font-semibold tracking-[-0.025em] text-tinta">
                      {caso.client}
                    </h3>
                    <span className="shrink-0 text-sm text-destaque">
                      {caso.result}
                    </span>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.15}>
            <div className="mt-8">
              <LinkSeta href="/portfolio">Ver todos os cases</LinkSeta>
            </div>
          </Reveal>
        </Miolo>
      </Painel>
    ));
  }

  // 7. Depoimentos, só os reais
  if (depoimentosReais.length > 0) {
    secoes.push((claro) => (
      <Painel key="depoimentos" claro={claro}>
        <Miolo className="py-12 lg:py-16">
          <Rotulo>Depoimentos</Rotulo>
          <Titulo
            linhas={[
              { texto: "Quem já trabalha com a gente.", acento: "gente." },
            ]}
          />
          <DepoimentosCarrossel itens={depoimentosReais} />
        </Miolo>
      </Painel>
    ));
  }

  // 8. As dúvidas dos três serviços, em abas.
  //
  // Fica perto do fim, e não no meio: pergunta frequente é objeção, e objeção
  // só interessa a quem já quer. Quem chegou até aqui passou pelos serviços,
  // pelo método e pelo trabalho, e o que falta é a dúvida que ele não fez em
  // voz alta. Cada serviço tem as suas, e as quinze numa lista só obrigariam a
  // garimpar as que são dele.
  if (abasFaq.length > 0) {
    secoes.push((claro) => (
      <Painel key="faq" claro={claro}>
        <Miolo className="py-12 lg:py-16">
          <Rotulo>Antes de falar com a gente</Rotulo>
          <Titulo
            linhas={[
              { texto: "As dúvidas que todo mundo tem.", acento: "dúvidas" },
            ]}
          />

          <FaqServicos abas={abasFaq} />
        </Miolo>
      </Painel>
    ));
  }

  // 9. Quem está por trás, e a chamada final no mesmo painel.
  //
  // Juntos porque separados eram dois blocos magros em sequência, e a página
  // acabava com um título solto no escuro.
  secoes.push((claro) => (
    <Painel key="fecho" claro={claro} ultimo>
      <Miolo className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
          <div>
            <Rotulo>Quem é a LANÇA+</Rotulo>
            <Titulo
              linhas={[
                { texto: "Agência inteira, mesmo teto.", acento: "teto." },
              ]}
            />
            <Reveal delay={0.15}>
              <p className="mt-5 max-w-md leading-relaxed text-tinta/60">
                Estratégia, audiovisual, tráfego, identidade, web e arquitetura,
                em Cajazeiras, com equipe própria.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-7">
                <LinkSeta href="/sobre">Conhecer a equipe</LinkSeta>
              </div>
            </Reveal>
          </div>

          {/* Uma foto grande, e não duas pequenas desencontradas. Quando a
              pergunta é "quem é a LANÇA+", a resposta é o time inteiro, em
              tamanho que dê para ver a cara de cada um. */}
          <Reveal distance={40}>
            <div className="group relative aspect-[5/4] overflow-hidden rounded-[22px]">
              <Image
                src={FOTO_EQUIPE.src}
                alt={FOTO_EQUIPE.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top transition-transform duration-[1.4s] group-hover:scale-[1.04]"
              />
            </div>
          </Reveal>
        </div>
      </Miolo>

      {/* A chamada final, ainda dentro do mesmo painel. */}
      {/* A chamada final sobre foto, e não sobre cor chapada.

          O véu escuro é pesado de propósito: a foto entra como textura, para
          o último bloco ter matéria em vez de vazio, e não como retrato que
          disputa a atenção com a frase.

          As cores aqui são fixas, e não do tema: o painel do fecho pode cair
          claro na alternância, e texto de tema claro sobre foto escurecida
          sumiria. */}
      <div className="relative isolate overflow-hidden border-t border-contorno">
        <Image
          src={FOTO_CHAMADA.src}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="-z-10 object-cover object-[50%_28%]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-preto/82" />
        <div className="glow-salmon pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 opacity-40 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center lg:py-24">
          <span className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-bege/25 px-4 py-2 text-bege/70">
            <span aria-hidden className="h-1 w-1 rounded-full bg-salmon" />
            O próximo passo
          </span>

          <h2 className="font-heading mt-7 text-[2.1rem] font-semibold leading-[1.04] tracking-[-0.035em] text-bege sm:text-5xl lg:text-[3.4rem]">
            Pronto para lançar a sua{" "}
            <span className="text-salmon">marca?</span>
          </h2>

          <p className="mx-auto mt-5 max-w-md leading-relaxed text-bege/65">
            Conte o momento da sua marca e a gente devolve uma proposta, com o
            ponto de partida que faz sentido para ela.
          </p>

          <div className="mt-9 flex justify-center">
            <Botao href="/contato">Pedir orçamento</Botao>
          </div>
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
