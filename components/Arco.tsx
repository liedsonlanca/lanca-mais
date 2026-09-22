"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// O leque de fotos girando, sozinho.
//
// Nasceu dentro do ArcoDeFotos, que é a abertura da página de serviços. Saiu
// de lá em 22/09/2026, quando o mesmo leque passou a abrir também o bloco de
// entregáveis de cada serviço: duas cópias do mesmo cálculo de ângulo é como
// se perde a simetria de um desenho depois de três ajustes num lado só.
//
// ---------- Como o arco é feito ----------
//
// Um ponto âncora invisível, na base. Cada foto é posicionada nesse ponto e
// então girada, empurrada para fora pelo raio e desgirada em parte:
//
//   rotate(a) translateY(-raio) rotate(-a * 0.72)
//
// A última rotação é o que controla a inclinação final. Desgirar tudo deixaria
// as fotos de pé, como uma fileira curva; não desgirar nada deixaria cada uma
// deitada no sentido do arco, o que é tonto de ler. A 0,72 sobram uns graus de
// inclinação, que é o que dá o ar de fotos jogadas na mesa.
//
// O raio vive numa variável de CSS, então o arco encolhe junto com a tela sem
// nenhuma conta em JavaScript, e nada precisa ser remedido quando a janela
// muda de tamanho.
//
// ---------- Por que ele gira, e por que dá a volta inteira ----------
//
// Parado, o leque dizia o que precisava, mas era um desenho. Girando, ele vira
// o que a referência mostra: um mostruário passando, que dá a entender que há
// mais trabalho do que cabe na tela.
//
// As fotos não vão e voltam: percorrem a circunferência inteira. Por isso a
// lista é repetida até fechar o círculo — com cinco fotos, dez cartões de 36
// em 36 graus. Cada foto aparece duas vezes no anel, mas em pontos opostos, e
// como só a metade de cima é visível nunca se vê a mesma duas vezes ao mesmo
// tempo.
//
// Quem sai por baixo não é cortado: some por opacidade antes de chegar lá. É
// mais suave que o corte seco, e é o que permite o cartão do topo seguir
// passando por cima da borda superior sem ser decepado por um recorte.
//
// A foto do meio continua sendo a maior — mas agora "a do meio" muda o tempo
// todo. Então o tamanho não é classe fixa: é escala pelo cosseno do ângulo,
// que cresce sozinha conforme o cartão sobe. Escala é transformação, custa
// quase nada, e a largura do elemento nunca muda.

export type FotoDoArco = { src: string; alt: string };

/** Quanto de cada rotação é desfeita. Ver o comentário do arco. */
const DESGIRO = 0.72;

/** Segundos para o anel dar uma volta completa. */
const VOLTA_S = 64;

/** Cartões no anel inteiro, para a metade de cima mostrar cinco. */
const CARTOES_NO_ANEL = 10;

/** Quanto a foto do topo cresce em relação às das pontas. */
const CRESCIMENTO = 0.2;

/** A quantos graus do topo o cartão começa a sumir, e onde sumiu de vez. */
const COMECA_A_SUMIR = 74;
const SUMIU = 96;

/**
 * Os dois tamanhos em que o leque existe.
 *
 * "abertura" é o da página de serviços, que ocupa a largura inteira e tem um
 * título embaixo. "coluna" é o da página de um serviço, onde ele divide a
 * linha com o texto dos entregáveis: mesmo desenho, raio menor, senão as
 * pontas saem da coluna.
 *
 * O raio de celular da coluna saiu de uma conta, e não do olho: a meia-abertura
 * do leque é raio vezes o seno do ângulo da ponta, mais meia foto, e isso
 * precisa caber na metade da coluna — que a 375px tem 163px.
 */
const TAMANHOS = {
  abertura: {
    raio: "[--raio:170px] sm:[--raio:250px] lg:[--raio:330px]",
    largura: "w-[76px] sm:w-[104px] lg:w-[128px]",
    tamanhos: "(max-width: 640px) 110px, (max-width: 1024px) 150px, 190px",
  },
  coluna: {
    raio: "[--raio:135px] sm:[--raio:185px] lg:[--raio:205px]",
    largura: "w-[58px] sm:w-[82px] lg:w-[90px]",
    tamanhos: "(max-width: 640px) 85px, 130px",
  },
} as const;

/** O fio tracejado muda de cor conforme o fundo em que o arco pousa. */
const FIO = {
  escuro: "border-bege/25",
  claro: "border-tinta/20",
} as const;

/** Traz um ângulo qualquer para a faixa de -180 a 180. */
function normalizar(graus: number) {
  return ((((graus + 180) % 360) + 360) % 360) - 180;
}

export default function Arco({
  fotos,
  tamanho = "abertura",
  tom = "escuro",
  children,
}: {
  fotos: FotoDoArco[];
  tamanho?: keyof typeof TAMANHOS;
  tom?: keyof typeof FIO;
  /** O que fica no vão sob as fotos. Vazio deixa só o leque. */
  children?: React.ReactNode;
}) {
  const uteis = fotos.filter((f) => Boolean(f.src));
  const medida = TAMANHOS[tamanho];

  const semMovimento = useReducedMotion();
  // O ângulo do anel vive num ref, e não em estado: ele muda a cada quadro,
  // e estado faria a página inteira ser redesenhada sessenta vezes por
  // segundo para mover cinco fotos.
  const giro = useRef(0);
  const palco = useRef<HTMLDivElement>(null);
  const cartoes = useRef<Array<HTMLDivElement | null>>([]);

  // Só gasta quadro quando está na tela. O leque fica no meio de uma página
  // longa, e girar um anel que ninguém está vendo é bateria de celular indo
  // embora à toa.
  const [aVista, setAVista] = useState(false);

  useEffect(() => {
    const el = palco.current;
    if (!el) return;

    const observador = new IntersectionObserver(
      ([entrada]) => setAVista(entrada.isIntersecting),
      { rootMargin: "120px" }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // Com uma ou duas fotos não há anel: elas dariam a volta lado a lado e a
  // mesma imagem apareceria duas vezes na metade visível. Aí o leque fica
  // parado, aberto como sempre foi.
  const gira = !semMovimento && uteis.length >= 3;

  const repeticoes = gira
    ? Math.max(1, Math.ceil(CARTOES_NO_ANEL / uteis.length))
    : 1;
  const noAnel = Array.from(
    { length: uteis.length * repeticoes },
    (_, i) => uteis[i % uteis.length]
  );

  // Girando, os cartões se espalham pelo círculo inteiro. Parados, abrem de
  // -68 a 68 graus, que é a abertura desenhada do leque.
  const passo = gira
    ? 360 / noAnel.length
    : noAnel.length > 1
      ? 136 / (noAnel.length - 1)
      : 0;
  const inicio = gira ? 0 : noAnel.length > 1 ? -68 : 0;

  /**
   * Escreve o transform de cada cartão direto no DOM.
   *
   * Não passa por estado do React de propósito: são dez elementos a sessenta
   * quadros por segundo, e mandar isso pela renderização seria redesenhar a
   * página inteira seiscentas vezes por segundo para mover cinco fotos.
   */
  function posicionar(volta: number) {
    for (let i = 0; i < noAnel.length; i++) {
      const el = cartoes.current[i];
      if (!el) continue;

      const angulo = normalizar(inicio + i * passo + volta);
      const distancia = Math.abs(angulo);

      // Cresce ao chegar no topo, encolhe ao descer para as pontas.
      const escala =
        1 + CRESCIMENTO * Math.max(0, Math.cos((angulo * Math.PI) / 180));

      // Some antes de cruzar a linha de baixo, em vez de ser cortado nela.
      const opacidade = Math.min(
        1,
        Math.max(0, (SUMIU - distancia) / (SUMIU - COMECA_A_SUMIR))
      );

      el.style.transform =
        `translate(-50%, -50%) rotate(${angulo}deg) ` +
        `translateY(calc(var(--raio) * -1)) ` +
        `rotate(${-angulo * DESGIRO}deg) scale(${escala})`;
      el.style.opacity = String(opacidade);
    }
  }

  // O laço de quadro é nosso, e não o do motion: precisamos do tempo real
  // decorrido para a volta levar sempre os mesmos segundos, em qualquer taxa
  // de quadros. O salto é limitado a 50ms para a aba que volta do segundo
  // plano não fazer o anel dar meia volta de uma vez.
  useEffect(() => {
    posicionar(giro.current);
    if (!gira || !aVista) return;

    let pedido = 0;
    let antes = performance.now();

    function quadro(agora: number) {
      const decorrido = Math.min(agora - antes, 50);
      antes = agora;
      giro.current = (giro.current + (decorrido / 1000) * (360 / VOLTA_S)) % 360;
      posicionar(giro.current);
      pedido = requestAnimationFrame(quadro);
    }

    pedido = requestAnimationFrame(quadro);
    return () => cancelAnimationFrame(pedido);
    // posicionar é redefinida a cada desenho, mas lê tudo de que precisa na
    // hora em que roda; incluí-la aqui reiniciaria o laço a cada desenho.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gira, aVista, noAnel.length, passo, inicio]);

  if (uteis.length === 0) return null;

  return (
    // --raio manda no tamanho do arco; --ancora é onde fica o centro dele,
    // medido do topo deste bloco.
    <div
      ref={palco}
      className={`relative [--ancora:calc(var(--raio)+3.5rem)] ${medida.raio}`}
    >
      {/* O fio tracejado do arco. Vive dentro de um recorte da altura da
          âncora, senão a metade de baixo do círculo passaria por cima do que
          estiver embaixo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[var(--ancora)] overflow-hidden"
      >
        <div
          className={`absolute left-1/2 top-[var(--ancora)] h-[calc(var(--raio)*2)] w-[calc(var(--raio)*2)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed ${FIO[tom]}`}
        />
      </div>

      {/* O anel entra de uma vez, e não cartão por cartão: com o leque
          girando, uma entrada escalonada brigaria com o próprio giro. */}
      <motion.div
        initial={semMovimento ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-0"
      >
        {noAnel.map((foto, i) => (
          <div
            key={`${foto.src}-${i}`}
            ref={(el) => {
              cartoes.current[i] = el;
            }}
            className="absolute left-1/2 top-[var(--ancora)] will-change-transform"
          >
            <div
              className={`relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_28px_60px_-30px_rgba(0,0,0,0.85)] ${medida.largura}`}
            >
              <Image
                src={foto.src}
                alt={foto.alt}
                fill
                // Maior que a caixa de propósito: o cartão do topo aparece
                // ampliado pela escala, e servir a imagem no tamanho parado
                // deixaria justo ele, o mais visto, borrado.
                sizes={medida.tamanhos}
                className="object-cover object-top"
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* O vão sob as fotos. Só reserva a altura quando há o que pôr nele. */}
      <div
        className={
          children
            ? "relative pt-[calc(var(--ancora)+0.5rem)]"
            : "h-[var(--ancora)]"
        }
      >
        {children}
      </div>
    </div>
  );
}
