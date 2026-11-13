"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Counter from "@/components/motion/Counter";
import HeroVideos from "@/components/HeroVideos";
import { type Depoimento, type Numero } from "@/lib/conteudo";
import { type PecaVitrine } from "@/lib/showcase";
import { ehProvisorio } from "@/lib/provisorio";
import { nichos, services } from "@/lib/site-config";

// Abertura da home, desde 18/09/2026.
//
// É um painel claro, de cantos arredondados, pousado sobre o site escuro, com
// a composição da referência que o cliente escolheu: marca grande à esquerda,
// bloco salmão à direita com os vídeos da LANÇA+ saindo por cima dele, cards
// flutuando em volta e uma fileira de nichos embaixo.
//
// A classe tema-claro redefine as cores do tema só aqui dentro, então tinta,
// fundo e cartão já saem certos para o claro sem nenhum componente saber.
//
// Onde a referência tem prova social que aqui seria inventada, entra a versão
// verdadeira, porque esta é a parte mais vista do site:
//   - nota com estrelas: não existe nota; o depoimento aparece sozinho quando
//     houver um real, e sem estrelas;
//   - bolhas de conversa de cliente: viram as frentes de serviço;
//   - card de produto com preço: vira o card "Nossos cards", que folheia as
//     peças estáticas da vitrine e leva à página de serviços;
//   - logos de clientes: viram os nichos, que a agência pode afirmar.
// O card de vidro diz de qual cliente é o vídeo que está passando.
type Props = {
  numeros: Numero[];
  vitrine: PecaVitrine[];
  depoimentos: Depoimento[];
  /** A marca na versão escura, que é a que vale sobre este fundo claro. */
  marca: { src: string; alt: string };
};

const FACIL: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** De quanto em quanto tempo o card pequeno troca de post. */
const TEMPO_POST_MS = 3800;

// Escritas por extenso porque o Tailwind lê as classes no código: montada com
// template, `sm:grid-cols-${n}` não existiria na folha de estilo.
const COLUNAS_NUMEROS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

/** Depoimento só entra se for real: os provisórios têm colchetes. */
function depoimentoReal(lista: Depoimento[]) {
  return lista.find((d) => !ehProvisorio(d.citacao, d.nome, d.cargo));
}

function Seta({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function SetaDiagonal({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 17L17 7M8 7h9v9" />
    </svg>
  );
}

/**
 * A capa de um cartão lateral do carrossel.
 *
 * Era um <Image src={peca.src}> direto, e isso partia do princípio de que
 * toda peça tem capa. Em produção nenhuma tinha: os <img> saíam com src
 * vazio e naturalWidth 0, e o que sobrava era o bg-preto do cartão — três
 * retângulos pretos nas laterais da abertura. O do meio aparecia porque toca
 * o vídeo, e não a capa, e foi por isso que o defeito passou batido.
 *
 * Sem capa, a lateral mostra o primeiro quadro do próprio vídeo. É
 * `preload="metadata"`, e não o arquivo inteiro: o navegador baixa só o
 * cabeçalho e o começo, o bastante para pintar um quadro. Custa muito menos
 * que tocar, e entrega a coisa certa em vez de um buraco.
 *
 * Quando houver capa cadastrada no painel, ela volta a ser usada e isto
 * aqui não custa nada.
 */
function CapaDaVizinha({
  peca,
  parado,
}: {
  peca: PecaVitrine;
  parado: boolean;
}) {
  const pintura =
    "absolute inset-0 h-full w-full scale-110 object-cover blur-[6px] brightness-75";

  // Capa cadastrada no painel ganha de tudo: é um arquivo pequeno, e já é
  // exatamente o quadro que a agência escolheu mostrar.
  if (peca.src) {
    return (
      <Image
        src={peca.src}
        alt=""
        fill
        sizes="220px"
        className="scale-110 object-cover blur-[6px] brightness-75"
      />
    );
  }

  if (!peca.video) return null;

  // Sem capa, é o próprio vídeo que aparece aqui.
  //
  // Quem pediu menos movimento vê um quadro parado, e só o cabeçalho do
  // arquivo é baixado. O #t=0.1 existe porque muito vídeo abre com um
  // quadro preto — que era justamente o sintoma que este componente veio
  // consertar.
  if (parado) {
    return (
      <video
        src={`${peca.video}#t=0.1`}
        muted
        playsInline
        preload="metadata"
        aria-hidden
        tabIndex={-1}
        className={pintura}
      />
    );
  }

  // Tocando, em laço e sem som.
  //
  // Custa três vídeos no ar ao mesmo tempo, e o custo é real: triplica o
  // dado de quem abre o site num celular com pacote. Foi uma escolha do
  // cliente, de propósito, para que a abertura tenha movimento nos três
  // cartões e não só no do meio.
  //
  // Em laço porque uma lateral que termina e congela volta a ser o
  // retângulo parado que estávamos consertando.
  return (
    <video
      src={peca.video}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
      tabIndex={-1}
      className={pintura}
    />
  );
}

export default function Hero({ numeros, vitrine, depoimentos, marca }: Props) {
  const reduzir = useReducedMotion();

  // Os vídeos que a agência produziu, do banco da vitrine, na ordem de lá.
  // Sem nenhum vídeo cadastrado, as imagens da vitrine seguram o lugar, para
  // a abertura nunca ficar com um buraco.
  const pecas = useMemo(() => {
    const videos = vitrine.filter((p) => p.tipo === "video" && p.video);
    if (videos.length > 0) return videos;
    return vitrine.filter((p) => p.src && p.tipo !== "video").slice(0, 6);
  }, [vitrine]);

  const [indice, setIndice] = useState(0);
  const aoTrocar = useCallback((proximo: number) => setIndice(proximo), []);
  const atual = pecas[indice];

  // A roda de peças: onde cada uma está, em relação à que está passando.
  //
  // A distância é com sinal e pelo caminho mais curto do anel: 0 é a do
  // meio, -1 a que acabou de sair pela esquerda, +1 a que espera à direita.
  // É esse par que define o sentido do giro — a seguinte sobe da direita
  // para o meio, e a do meio desce para a esquerda.
  //
  // Nada entra nem sai de cena. Isto aqui já foi um <AnimatePresence> com
  // três cartões, e não funcionava: o motion segurava cada cartão que saía
  // e nunca o removia, então as seis peças iam se empilhando na borda
  // esquerda, três delas opacas, tapando o lugar da vizinha. O conserto não
  // foi insistir na saída, foi não ter saída nenhuma.
  //
  // As peças a partir da distância 2 ficam montadas no mesmo lugar da
  // vizinha, porém invisíveis. Assim a que chega não aparece do nada: ela
  // já estava ali, parada, e só acende. E a que sai apaga sem sair do
  // lugar. O que o `layout` anima é só o percurso de quem muda de slot.
  //
  // Fica montado o que está a duas casas de distância, e não a lista toda:
  // com seis peças dá no mesmo, mas a vitrine cresce com o uso do painel.
  const aoRedor = useMemo(() => {
    const n = pecas.length;
    if (n === 0) return [];
    return pecas
      .map((peca, i) => {
        let d = (i - indice + n) % n;
        if (d > n / 2) d -= n;
        return { peca, d, chave: peca.src };
      })
      .filter(({ d }) => Math.abs(d) <= 2);
  }, [pecas, indice]);

  // Os dois textos do card de vidro, vindos dos dois campos do painel.
  //
  // Legenda é o nome da peça ("Forte Energy"); Descrição da imagem é o que
  // se vê nela. A descrição existe primeiro para leitor de tela, e aparecer
  // no card é ganho de graça: quem olha passa a saber do que é o vídeo, e
  // não só de quem ele é.
  //
  // Sem legenda, a descrição sobe e vira o título, para o card nunca ficar
  // com um vão no lugar do nome.
  const legendaDaPeca = atual?.legenda?.trim() ?? "";
  const altDaPeca = atual?.alt?.trim() ?? "";
  const tituloDaPeca = legendaDaPeca || altDaPeca;
  const descricaoDaPeca = altDaPeca && altDaPeca !== tituloDaPeca ? altDaPeca : "";

  // Duas frentes nas bolhas, como as duas mensagens da referência, e a
  // terceira bolha, a de "digitando", vira o atalho para todas as outras.
  const frentes = ["marketing-pessoal", "marketing-empresarial"]
    .map((slug) => services.find((s) => s.slug === slug))
    .filter((s): s is (typeof services)[number] => Boolean(s));

  // Os posts do card pequeno: capas de carrossel, estáticos e trincas, na
  // ordem do painel.
  //
  // Imagem, nunca vídeo: o vídeo grande ao lado já está baixando, e um segundo
  // tocando aqui dobraria o peso da abertura num celular com pacote de dados.
  const posts = useMemo(
    () => vitrine.filter((p) => p.src && p.tipo !== "video"),
    [vitrine]
  );

  const [indicePost, setIndicePost] = useState(0);

  // Trocam sozinhos, num compasso diferente do vídeo grande, para os dois não
  // virarem na mesma hora e a composição inteira piscar de uma vez.
  useEffect(() => {
    if (posts.length <= 1 || reduzir) return;
    const t = setInterval(
      () => setIndicePost((i) => (i + 1) % posts.length),
      TEMPO_POST_MS
    );
    return () => clearInterval(t);
  }, [posts.length, reduzir]);

  // A lista pode encolher quando o painel muda, e aí o índice antigo sobra
  // apontando para fora. O resto evita o card sumir nesse intervalo.
  const post = posts[indicePost % (posts.length || 1)];
  const tituloDoPost = post?.legenda?.trim() || post?.alt?.trim() || "";

  const depoimento = depoimentoReal(depoimentos);

  // Flutuar devagar, como coisa solta em cima do vídeo. Quem pediu menos
  // movimento recebe tudo parado.
  const flutuar = (atraso: number) =>
    reduzir
      ? {}
      : {
          animate: { y: [0, -7, 0] },
          transition: {
            duration: 5.5,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: atraso,
          },
        };

  const entrada = (atraso: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay: atraso, ease: FACIL },
  });

  const surgir = (atraso: number, x = 0) => ({
    initial: { opacity: 0, x, y: x === 0 ? 14 : 0 },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { duration: 0.75, delay: atraso, ease: FACIL },
  });

  return (
    // O fundo desta section é o escuro do site: é ele que aparece em volta do
    // painel, na margem.
    <section className="bg-fundo px-2.5 pt-2.5 sm:px-4 sm:pt-4">
      <div className="tema-claro relative flex flex-col overflow-hidden rounded-[26px] bg-fundo lg:min-h-[calc(100svh-2rem)] lg:rounded-[32px]">
        <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-5 pb-10 pt-28 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-6 lg:px-12 lg:pb-8 lg:pt-28">
          {/* ---------- Texto ---------- */}
          <div>
            <motion.span
              {...entrada(0.05)}
              className="inline-flex items-center gap-2.5 rounded-full bg-cartao py-2 pl-2.5 pr-4 text-[13px] text-tinta/75 shadow-[var(--sombra-cartao)]"
            >
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full bg-salmon/15"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-salmon" fill="currentColor">
                  <rect x="2" y="9" width="2.6" height="5" rx="1" />
                  <rect x="6.7" y="5.5" width="2.6" height="8.5" rx="1" />
                  <rect x="11.4" y="2" width="2.6" height="12" rx="1" />
                </svg>
              </span>
              Agência de marketing completa
            </motion.span>

            {/* A marca e a frase-problema são um título só. O leitor de tela
                ouve "LANÇA+. Sua marca tem qualidade..." em sequência, pelo
                alt do logo, e o Google lê a marca junto da proposta. */}
            <h1 className="mt-7">
              <motion.span {...entrada(0.15)} className="block">
                {/* O logo de verdade, em alta (2855px de largura), e não o nome
                    digitado: é a marca que a agência usa em tudo. Entra inteiro
                    em preto, porque o + dele é desenhado junto da barra do A e
                    não dá para pintar só ele sem mexer no desenho da marca. */}
                <Image
                  src={marca.src}
                  alt={marca.alt}
                  width={2855}
                  height={796}
                  priority
                  sizes="(max-width: 1024px) 85vw, 520px"
                  className="h-auto w-[min(88%,420px)] sm:w-[440px] lg:w-[clamp(340px,36vw,520px)]"
                />
              </motion.span>

              <motion.span
                {...entrada(0.3)}
                className="mt-6 block max-w-xl text-[clamp(1.45rem,5.6vw,2.25rem)] font-medium leading-[1.14] tracking-[-0.025em] text-tinta/80 lg:text-[clamp(1.6rem,2.35vw,2.25rem)]"
              >
                Sua marca tem qualidade. Sua presença digital mostra isso?
              </motion.span>
            </h1>

            <motion.p
              {...entrada(0.42)}
              className="mt-5 max-w-lg text-[16px] leading-relaxed text-tinta/65 sm:text-[17px]"
            >
              A LANÇA+ transforma negócios com bons produtos e serviços em marcas
              com posicionamento sólido: estratégia documentada, conteúdo
              consistente e resultado medido mês a mês.
            </motion.p>

            {depoimento && (
              <motion.figure {...entrada(0.5)} className="mt-6 flex max-w-md items-center gap-3.5">
                {depoimento.foto ? (
                  <Image
                    src={depoimento.foto}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-salmon/15 font-semibold text-destaque"
                  >
                    {depoimento.nome.trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <div>
                  <blockquote className="line-clamp-2 text-sm leading-snug text-tinta/75">
                    &ldquo;{depoimento.citacao}&rdquo;
                  </blockquote>
                  <figcaption className="mt-1 text-xs text-tinta/55">
                    {depoimento.nome}
                    {depoimento.cargo && `, ${depoimento.cargo}`}
                  </figcaption>
                </div>
              </motion.figure>
            )}

            {/* Só no computador, por pedido do cliente. No celular a abertura
                segue direto para os números e os vídeos, e o menu já leva aos
                serviços. O pedido de orçamento continua no botão do menu. */}
            <motion.div {...entrada(0.58)} className="mt-8 hidden lg:flex">
              <Link
                href="/servicos"
                className="group inline-flex min-h-11 items-center gap-2 font-medium text-tinta"
              >
                Conhecer serviços
                <Seta className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </motion.div>

            {/* Grade, e não uma fileira que quebra: a referência tem três
                números e o painel pode ter quatro ou mais. Em fileira livre o
                quarto caía para baixo, fora da tela, e a contagem dele nem
                começava. Na grade as colunas dividem o espaço.

                A divisória vai à esquerda de quem não abre linha: no celular a
                grade tem duas colunas, então só os ímpares; a partir do sm,
                todos menos o primeiro. */}
            {numeros.length > 0 && (
              <motion.dl
                {...entrada(0.7)}
                className={`mt-10 grid grid-cols-2 gap-y-6 ${
                  COLUNAS_NUMEROS[Math.min(numeros.length, 4)] ?? "sm:grid-cols-4"
                }`}
              >
                {numeros.map((n, i) => (
                  <div
                    key={n.rotulo}
                    className={`border-contorno pr-4 ${i % 2 === 1 ? "border-l pl-5" : ""} ${
                      i > 0 && i % 2 === 0 ? "sm:border-l sm:pl-5" : ""
                    }`}
                  >
                    <dt className="sr-only">{n.rotulo}</dt>
                    <dd className="text-[1.75rem] font-bold leading-none tracking-[-0.03em] text-tinta sm:text-3xl">
                      <Counter valor={n.valor} prefixo={n.prefixo} sufixo={n.sufixo} />
                    </dd>
                    <dd aria-hidden className="mt-1.5 text-[13px] text-tinta/55">
                      {n.rotulo}
                    </dd>
                  </div>
                ))}
              </motion.dl>
            )}
          </div>

          {/* ---------- Vídeos ----------
              Posições medidas na referência: o bloco vai de 9% a 73% da
              largura, o vídeo sai por cima dele, o card de vidro cruza a borda
              esquerda a 24% da altura, as bolhas cruzam a direita a 20% e o
              card de serviço a 46%. */}
          {/* Duas composições, um só conjunto de peças.

              Do tablet para cima é a colagem da referência: cada peça
              posicionada em cima da outra, com o vídeo saindo do bloco
              salmão e os cards cruzando as bordas.

              No celular isso não cabe. Cinco camadas sobrepostas em 390
              pixels de largura viravam colisão: as bolhas das frentes
              saíam pela direita, os dois cards se espremiam em metade da
              largura cada e nada tinha hierarquia. Era bonito na tela
              grande e bagunçado no telefone.

              Então no celular vira pilha: o vídeo primeiro, a legenda de
              quem é embaixo, as frentes no pé. Um assunto de cada vez.

              Os dois invólucros abaixo existem só para o celular. Em
              sm:contents eles somem do layout, e as peças voltam a se
              posicionar contra este contêiner como sempre fizeram — sem
              duplicar nenhuma delas no JSX. */}
          <div className="mx-auto flex w-full max-w-[420px] flex-col gap-4 sm:relative sm:block sm:h-[560px] sm:max-w-[520px] lg:h-[600px] lg:max-w-none">
            {/* O recorte existe só no celular.

                Os vizinhos avançam para fora da caixa de propósito, para
                sobrar só a tira de cada lado. Sem recorte eles seguiam até a
                borda da tela e o conjunto deixava de ter forma: a composição
                virava uma faixa de imagens correndo de ponta a ponta.

                Do tablet para cima o invólucro some (sm:contents) e o recorte
                vai junto — lá os cards precisam cruzar as bordas. */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-[26px] sm:contents">
            {/* O bloco salmão, só quando não há peça nenhuma.

                Ele existia para preencher o espaço em volta do vídeo. Com
                os vizinhos ocupando as laterais, passou a aparecer apenas
                como sobra de cor nas bordas — e cor sobrando sem função é
                o que faz uma composição parecer montada no susto.

                Continua de pé para o dia em que a vitrine estiver vazia:
                aí ele segura o lugar com o sinal da marca, em vez de
                deixar um buraco na abertura. */}
            {pecas.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.25, ease: FACIL }}
                className="absolute inset-x-0 bottom-[6%] top-[6%] rounded-[26px] bg-salmon sm:inset-x-auto sm:bottom-[2%] sm:left-[9%] sm:right-[27%] sm:top-[9%]"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center font-heading text-[12rem] font-bold leading-none text-preto/15"
                >
                  +
                </span>
              </motion.div>
            )}

            {/* O carrossel: os mesmos cartões trocando de lugar.

                Não é o do meio que troca de conteúdo — são os mesmos
                elementos andando de posição. O do meio desce para a
                esquerda, o da direita sobe para o meio, e a seguinte toma o
                lugar vago à direita. Por isso cada cartão é identificado
                pela peça, e nunca pela posição: assim o React reaproveita o
                mesmo elemento quando ele muda de lugar, e há o que animar.

                Quem anima é o `layout` do motion: ele mede a caixa antes e
                depois e percorre a diferença. É por isso que as posições
                aqui são left/right/top e nunca translate — transform do CSS
                briga com o transform que o próprio motion usa para o
                percurso, e o cartão chega torto.

                As de fora são imagem parada e desfocada. Três <video>
                tocando ao mesmo tempo seria triplicar o dado de quem abre o
                site no celular para enfeitar duas tiras de 50 pixels — e a
                capa já é o primeiro quadro do vídeo. */}
            {aoRedor.map(({ peca, d, chave }) => (
              <motion.div
                key={chave}
                layout
                aria-hidden={d !== 0}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                /* A opacidade é do CSS, e não do motion.

                   Com ela no `animate`, o motion escrevia `opacity: 0` em
                   todos os cartões e nunca voltava atrás: a abertura ficava
                   invisível depois da primeira volta. Ele continua cuidando
                   do percurso, que é o que o `layout` sabe fazer e o CSS
                   não; o acender e o apagar viram uma transição simples,
                   que não depende de ciclo de animação nenhum e já vem
                   certa do servidor. */
                className={`absolute overflow-hidden rounded-[22px] bg-preto transition-opacity duration-500 ${
                  d === 0
                    ? "left-[17%] top-[3%] aspect-[9/16] h-[94%] shadow-[0_40px_80px_-30px_rgba(10,10,8,0.55)] sm:top-0 sm:h-[96%]"
                    : d < 0
                      ? "left-0 top-[10%] aspect-[9/16] h-[80%] sm:top-[9%] sm:h-[82%]"
                      : "right-0 top-[10%] aspect-[9/16] h-[80%] sm:top-[9%] sm:h-[82%]"
                } ${
                  d === 0
                    ? "z-[2] opacity-100"
                    : Math.abs(d) === 1
                      ? "z-[1] opacity-100"
                      : "z-0 opacity-0"
                }`}
              >
                {d === 0 ? (
                  <HeroVideos pecas={pecas} indice={indice} aoTrocar={aoTrocar} />
                ) : (
                  <CapaDaVizinha peca={peca} parado={Boolean(reduzir)} />
                )}
              </motion.div>
            ))}

            </div>

            {/* As informações. No celular sobem por cima do pé do vídeo; do
                tablet para cima este invólucro some e elas voltam a flutuar
                sobre a colagem.

                A margem negativa é o que cria a sobreposição: encostada
                abaixo, a legenda parecia um bloco solto depois da imagem;
                montada em cima dela, as duas viram uma peça só. */}
            <div className="-mt-20 flex flex-col gap-3 sm:mt-0 sm:contents">

            {/* Card de vidro: de quem é o vídeo que está passando. */}
            {atual && (
              // No celular o card vai para o canto de baixo: a 24% da altura ele
              // cobria metade do vídeo, e o miolo do vídeo é onde está o assunto.
              <motion.div
                {...surgir(0.9, -16)}
                className="relative z-10 w-full sm:absolute sm:bottom-auto sm:left-0 sm:top-[24%] sm:w-auto"
              >
                {/* Duas montagens do mesmo card.

                    No celular é uma linha só: barrinhas, textos e seta lado
                    a lado. Com o ícone numa linha própria em cima, o card
                    ficava alto demais para um lugar onde ele monta por cima
                    do vídeo — e a altura ali é tudo.

                    Do tablet para cima volta ao desenho de antes: ícone e
                    seta em cima, textos embaixo. Ali o card é estreito, e
                    nome de cliente ao lado da seta sobrava 90px e cortava
                    "Brazauto Cajazeiras" no meio.

                    A virada é por ordem e quebra, sem repetir o conteúdo:
                    em sm o conjunto passa a quebrar linha, a seta recebe
                    ml-auto e os textos tomam a largura toda, caindo para a
                    segunda linha. */}
                <motion.div
                  {...flutuar(0)}
                  className="w-full rounded-2xl border border-branco/70 bg-cartao/70 p-3.5 shadow-[0_24px_50px_-26px_rgba(10,10,8,0.5)] backdrop-blur-xl sm:w-[220px] sm:p-4"
                >
                  <div className="flex items-center gap-3 sm:flex-wrap sm:items-start sm:gap-0">
                    <span
                      aria-hidden
                      className="flex shrink-0 items-end gap-[3px] sm:order-1 sm:pt-1"
                    >
                      <span className="h-2.5 w-[5px] rounded-sm bg-salmon/55" />
                      <span className="h-4 w-[5px] rounded-sm bg-salmon/75" />
                      <span className="h-6 w-[5px] rounded-sm bg-salmon" />
                    </span>

                    <div className="min-w-0 flex-1 sm:order-3 sm:w-full sm:flex-none">
                  {/* Três degraus, e cada um vem de um lugar:

                        Agora passando  ... o estado, dado pelo tipo da peça
                        Forte Energy    ... a Legenda, do painel
                        Vídeo institu…  ... a Descrição da imagem, do painel

                      O rótulo subiu para o topo. Antes ele fechava o card, e
                      com uma terceira linha embaixo dele a leitura embaralhava:
                      rótulo no meio de dois textos não diz a qual dos dois
                      pertence.

                      A descrição só aparece se existir e se for diferente da
                      legenda, senão o card repetiria a mesma frase duas vezes
                      em corpos diferentes. Campo vazio chega como texto vazio,
                      e não como ausente, por isso os trim(). */}
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-tinta/50 sm:mt-3">
                    {atual.tipo === "video" ? "Agora passando" : "Do nosso trabalho"}
                  </p>

                      {tituloDaPeca && (
                        <p className="mt-1 line-clamp-2 text-[17px] font-bold leading-tight tracking-[-0.01em] text-tinta sm:mt-1.5">
                          {tituloDaPeca}
                        </p>
                      )}

                      {descricaoDaPeca && (
                        <p className="mt-1 line-clamp-2 text-xs leading-snug text-tinta/60 sm:mt-1.5">
                          {descricaoDaPeca}
                        </p>
                      )}
                    </div>

                    <Link
                      href="/#nosso-trabalho"
                      aria-label="Ver todo o trabalho"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-tinta/15 text-tinta transition-colors duration-500 hover:bg-tinta hover:text-fundo sm:-mr-1.5 sm:-mt-1.5 sm:order-2 sm:ml-auto"
                    >
                      <SetaDiagonal />
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Bolhas: duas frentes e a de "digitando", que leva às outras.

                Fora do celular. Em coluna encostadas à direita elas saíam
                pela borda e cobriam o vídeo; deitadas sob a legenda,
                quebravam em duas linhas e só acrescentavam ruído a uma
                abertura que já diz o que precisa. As oito frentes estão
                logo abaixo, nos cards de serviço. */}
            <div className="hidden sm:absolute sm:right-0 sm:top-[20%] sm:z-10 sm:flex sm:flex-col sm:items-start sm:gap-2.5">
              {frentes.map((s, i) => (
                <motion.div key={s.slug} {...surgir(1.05 + i * 0.12, 16)}>
                  <motion.span
                    {...flutuar(0.5 + i * 0.4)}
                    className="flex items-center gap-2 rounded-full bg-cartao py-1.5 pl-1.5 pr-3.5 text-xs font-medium text-tinta shadow-[0_14px_34px_-20px_rgba(10,10,8,0.5)] sm:gap-2.5 sm:pr-4 sm:text-[13px]"
                  >
                    <span
                      aria-hidden
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-salmon/15 sm:h-7 sm:w-7"
                    >
                      <span className="h-2 w-2 rounded-full bg-salmon" />
                    </span>
                    {s.name}
                  </motion.span>
                </motion.div>
              ))}
              <motion.div {...surgir(1.3, 16)}>
                <Link
                  href="/servicos"
                  aria-label="Ver todas as frentes"
                  className="flex h-11 items-center gap-1 rounded-full bg-cartao px-4 shadow-[0_14px_34px_-20px_rgba(10,10,8,0.5)]"
                >
                  {[0, 1, 2].map((p) => (
                    <motion.span
                      key={p}
                      aria-hidden
                      animate={reduzir ? undefined : { opacity: [0.3, 1, 0.3] }}
                      transition={
                        reduzir
                          ? undefined
                          : { duration: 1.2, repeat: Infinity, delay: p * 0.18 }
                      }
                      className="h-1.5 w-1.5 rounded-full bg-tinta"
                    />
                  ))}
                </Link>
              </motion.div>
            </div>

            {/* Card de serviço, no lugar do card de produto da referência. */}
            {post && (
              <motion.div
                {...surgir(1.2, 16)}
                // Fora do celular: dois mostruários girando na mesma tela de
                // telefone competem entre si, e o trilho de "Nosso trabalho"
                // logo abaixo já mostra as peças. Na tela grande ele cabe e
                // compõe.
                className="hidden sm:absolute sm:bottom-auto sm:right-[2%] sm:top-[46%] sm:z-10 sm:block sm:w-[196px]"
              >
                <motion.div
                  {...flutuar(1.1)}
                  className="rounded-2xl bg-cartao p-3.5 shadow-[0_28px_60px_-28px_rgba(10,10,8,0.55)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold leading-tight text-tinta">
                        Nossos cards
                      </p>
                      {/* O nome do post que está na vez: a Legenda do painel,
                          ou a Descrição da imagem quando não houver legenda.
                          Duas linhas no máximo, porque o card tem 196px e um
                          nome longo empurraria a imagem para fora. */}
                      {tituloDoPost && (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-tinta/60">
                          {tituloDoPost}
                        </p>
                      )}
                    </div>
                    <span
                      aria-hidden
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-contorno"
                    >
                      <span className="h-2 w-2 rounded-full bg-salmon" />
                    </span>
                  </div>

                  {/* A imagem troca junto com o nome acima. A chave é o que faz
                      o React trocar o arquivo em vez de reaproveitar o mesmo
                      elemento, e é o que permite o esmaecer entre um post e o
                      seguinte.

                      alt vazio de propósito: a linha acima já diz qual post é,
                      e o trilho de "Nosso trabalho" descreve cada peça uma vez.
                      Repetir aqui faria o leitor de tela ler a mesma coisa duas
                      vezes na mesma tela. */}
                  {post && (
                    <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl bg-fundo-alt">
                      <AnimatePresence initial={false}>
                        <motion.div
                          key={post.src}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.6, ease: FACIL }}
                          className="absolute inset-0"
                        >
                          <Image
                            src={post.src}
                            alt=""
                            fill
                            sizes="170px"
                            className="object-cover"
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[15px] font-bold text-tinta">Serviços</span>
                    <Link
                      href="/servicos"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-tinta px-3.5 text-xs font-medium text-fundo"
                    >
                      Ver
                      <Seta className="h-3 w-3" />
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            )}
            </div>
          </div>
        </div>

        {/* ---------- Fileira de baixo ----------
            Na referência, logos de clientes. Aqui, os nichos: logo de cliente a
            LANÇA+ ainda não pode mostrar, e nicho é afirmação que ela pode
            fazer. Correm devagar, como uma fileira de marcas. */}
        <motion.div
          {...entrada(0.9)}
          className="mx-5 flex flex-col gap-5 border-t border-contorno py-6 sm:mx-8 lg:mx-12 lg:flex-row lg:items-center lg:gap-10"
        >
          <span className="shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-tinta/60">
            Nichos que atendemos
          </span>

          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-fundo to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-fundo to-transparent" />
            {/* O mesmo espaço dentro e fora de cada item: é o que deixa a
                estrela no meio exato entre dois nichos, e a emenda do laço
                igual às outras. */}
            <div className="animate-marquee flex w-max items-center gap-10">
              {[...nichos, ...nichos].map((nicho, i) => (
                <span
                  key={i}
                  // A segunda volta é cópia para o laço não ter emenda: quem
                  // usa leitor de tela ouve a lista uma vez só.
                  aria-hidden={i >= nichos.length}
                  className="flex items-center gap-10 whitespace-nowrap text-lg font-bold tracking-[-0.02em] text-tinta/70"
                >
                  {nicho}
                  {/* A estrela da faixa antiga, a pedido do cliente. Salmão da
                      marca, e não o destaque do tema: é enfeite, e o destaque
                      escurece dentro do painel claro. */}
                  <span aria-hidden className="text-sm text-salmon">
                    ✦
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4 lg:justify-end">
            {/* A primeira tela também precisa oferecer o degrau de baixo:
                quem nunca rola não chega ao diagnóstico que está no meio
                da página. O orçamento continua no menu, sempre à vista. */}
            <p className="max-w-[210px] text-[13px] leading-snug text-tinta/60">
              Diagnóstico gratuito da sua marca, em 2 minutos.
            </p>
            <Link
              href="/diagnostico"
              aria-label="Fazer o diagnóstico gratuito"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tinta text-fundo transition-transform duration-500 hover:rotate-45"
            >
              <SetaDiagonal />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
