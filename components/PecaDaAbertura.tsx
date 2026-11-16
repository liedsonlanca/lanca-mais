"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
import { type PecaVitrine } from "@/lib/showcase";

// Uma peça do carrossel da abertura, em qualquer das três posições.
//
// ---------- Por que é um componente só, e não dois ----------
//
// Antes havia dois: um player para a peça do meio e uma capa desfocada para as
// laterais. Parecia arrumado e tinha um defeito visível: ao girar, o cartão
// trocava de componente, o React desmontava o <video> da lateral e montava
// outro no centro. Elemento novo não tem quadro decodificado, então pintava
// preto até o primeiro quadro chegar — e o reinício em zero, que é o
// comportamento pedido, caía justamente nesse buraco e o alargava.
//
// Aqui o mesmo <video> atravessa as três posições. O que muda é o estilo e
// quem comanda: a do meio conta os cinco segundos e manda girar, as laterais
// só tocam. Sem desmontar, não há o que decodificar de novo, e o reinício
// acontece num elemento que já tem imagem — instantâneo, sem buraco.
//
// É por isso que este arquivo não decide "capa ou vídeo" pela posição. Peça
// com vídeo é sempre <video>, em qualquer posição. Usar a capa nas laterais
// economizaria dado, mas traria de volta a troca de elemento na promoção, que
// é exatamente o defeito que ele existe para não ter.
//
// ---------- Quanto custa, e para quem ----------
//
// Três vídeos tocando ao mesmo tempo é triplicar o dado de quem abre o site
// num celular com pacote. Foi uma escolha do cliente, para que a abertura
// tenha movimento nos três cartões e não só no do meio.
//
// Quem pediu menos movimento no sistema, e quem está com economia de dados
// ligada, vê um quadro parado: nesses casos só o cabeçalho do arquivo é
// baixado, e o vídeo é posicionado num décimo de segundo — e não em zero,
// porque muito vídeo abre com um quadro preto.
//
// Sem vídeo nenhum cadastrado, mostra a imagem da vitrine.

type Props = {
  peca: PecaVitrine;
  /** Distância até a peça em exibição: 0 é o centro, ±1 as vizinhas. */
  d: number;
  /** Quantas peças há na roda, para o giro dar a volta. */
  total: number;
  indice: number;
  aoTrocar: (proximo: number) => void;
};

/** Quanto tempo cada imagem fica, quando não há vídeo. */
const TEMPO_IMAGEM_MS = 4200;

/**
 * Quantos segundos de cada vídeo a abertura mostra.
 *
 * Antes cada peça tocava até o fim, e um vídeo de um minuto segurava a
 * abertura inteira nele: quem chegasse na hora errada via um pedaço do meio,
 * sem começo nem contexto, e nunca chegava a saber que havia outros. A vitrine
 * aqui é amostra, não sessão de cinema.
 */
const TEMPO_VIDEO_S = 5;

/** Onde parar o vídeo parado. Zero costuma cair num quadro preto. */
const PRIMEIRO_QUADRO = 0.1;

function economizarDados() {
  if (typeof navigator === "undefined") return false;
  const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection;
  return conexao?.saveData === true;
}

export default function PecaDaAbertura({
  peca,
  d,
  total,
  indice,
  aoTrocar,
}: Props) {
  const reduzir = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);

  // Economia de dados só existe no navegador. useSyncExternalStore dá o valor
  // certo em cada lado: falso no servidor, o de verdade depois de hidratar,
  // sem o HTML do servidor divergir do primeiro desenho.
  const semDados = useSyncExternalStore(
    // A preferência raramente muda durante uma visita; não há o que assinar.
    () => () => {},
    economizarDados,
    () => false
  );
  const parado = Boolean(reduzir) || semDados;

  const centro = d === 0;
  const sozinho = total <= 1;
  const ehVideo = peca.tipo === "video" && Boolean(peca.video);

  const avancar = useCallback(() => {
    aoTrocar((indice + 1) % total);
  }, [aoTrocar, indice, total]);

  // Imagem troca por tempo de relógio. Só a do meio manda.
  useEffect(() => {
    if (!centro || ehVideo || sozinho || parado) return;
    const t = setTimeout(avancar, TEMPO_IMAGEM_MS);
    return () => clearTimeout(t);
  }, [centro, ehVideo, sozinho, parado, avancar]);

  // Chegou ao meio, começa do começo.
  //
  // A peça já vinha tocando na lateral, e entraria no centro pelo ponto em que
  // estava — a pessoa veria o fim de algo que nunca viu começar, que é o mesmo
  // problema que o corte de cinco segundos resolve no resto do trilho.
  //
  // Como o elemento é o mesmo que já estava em cena, ele chega com imagem
  // decodificada: voltar para zero aqui é instantâneo, e não pisca.
  useEffect(() => {
    const v = ref.current;
    if (!v || !centro) return;
    v.currentTime = 0;
    if (!parado) v.play().catch(() => {});
  }, [centro, parado, peca.video]);

  // Parado, o vídeo mostra um quadro em vez de nada.
  //
  // `loadedmetadata` é o primeiro momento em que dá para posicionar: antes
  // disso o navegador ainda não sabe a duração, e a busca é descartada.
  useEffect(() => {
    const v = ref.current;
    if (!v || !parado) return;

    function posicionar() {
      const alvo = ref.current;
      if (alvo && alvo.currentTime < PRIMEIRO_QUADRO) {
        alvo.currentTime = PRIMEIRO_QUADRO;
      }
    }

    if (v.readyState >= 1) posicionar();
    v.addEventListener("loadedmetadata", posicionar);
    return () => v.removeEventListener("loadedmetadata", posicionar);
  }, [parado, peca.video]);

  // Aba escondida não precisa tocar: pausa, e volta quando a pessoa voltar.
  useEffect(() => {
    function aoMudarVisibilidade() {
      const v = ref.current;
      if (!v) return;
      if (document.hidden) v.pause();
      else if (!parado) v.play().catch(() => {});
    }
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () =>
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  }, [parado]);

  // A trava da troca, guardada por índice.
  //
  // O evento de tempo dispara umas quatro vezes por segundo, e a peça passa
  // dos cinco segundos antes de a troca acontecer. Guardar QUAL peça já pediu,
  // e não um simples sim ou não, é o que impede o pedido duplo — e impede
  // também que a peça que sai queime a vez da que entra.
  const quemJaPediu = useRef(-1);

  function aoAndarOTempo(video: HTMLVideoElement) {
    if (!centro || sozinho || quemJaPediu.current === indice) return;
    if (video.currentTime < TEMPO_VIDEO_S) return;
    quemJaPediu.current = indice;
    avancar();
  }

  const pintura = centro
    ? "absolute inset-0 h-full w-full object-cover"
    : "absolute inset-0 h-full w-full scale-110 object-cover blur-[6px] brightness-75";

  if (ehVideo && peca.video) {
    return (
      <video
        ref={ref}
        src={peca.video}
        poster={peca.src || undefined}
        muted
        playsInline
        autoPlay={!parado}
        // A do meio não repete: ela conta cinco segundos e passa a vez, e o
        // fim do arquivo é a rede de segurança para a peça mais curta que o
        // corte. As laterais repetem, porque lateral que acaba e congela vira
        // o retângulo parado que este componente veio consertar.
        loop={sozinho || !centro}
        preload={parado ? "metadata" : "auto"}
        onTimeUpdate={(e) => aoAndarOTempo(e.currentTarget)}
        onEnded={() => {
          if (!centro || sozinho || quemJaPediu.current === indice) return;
          quemJaPediu.current = indice;
          avancar();
        }}
        aria-hidden={!centro}
        tabIndex={centro ? undefined : -1}
        aria-label={centro ? (peca.legenda ?? peca.alt) : undefined}
        className={pintura}
      />
    );
  }

  if (!peca.src) return null;

  return (
    <Image
      src={peca.src}
      alt={centro ? peca.alt : ""}
      aria-hidden={!centro}
      fill
      priority={centro && indice === 0}
      sizes={centro ? "(max-width: 1024px) 80vw, 380px" : "220px"}
      className={
        centro
          ? "object-cover"
          : "scale-110 object-cover blur-[6px] brightness-75"
      }
    />
  );
}
