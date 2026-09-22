"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type PecaVitrine } from "@/lib/showcase";

// Os vídeos da abertura da home.
//
// Tocam um de cada vez, cinco segundos cada, e passam para o próximo. Um só carrega
// por vez, e é por isso que a troca é feita por chave, e não montando todos e
// escondendo: cada <video> montado baixaria o seu arquivo, e a abertura é a
// parte mais vista do site, aberta num celular com pacote de dados.
//
// Moram no R2, que não cobra pela banda entregue, então o problema de custo que
// estourou a cota do Blob em setembro não se repete aqui. O que continua
// pesando é o dado de quem abre, e para isso há duas saídas:
//
//   - quem pediu menos movimento no sistema vê o primeiro quadro, parado;
//   - quem está com economia de dados ligada também.
//
// Sem nenhum vídeo cadastrado, mostra as imagens da vitrine, trocando sozinhas.
// Sem imagem nenhuma, o bloco salmão fica sozinho com o sinal de mais da marca.
type Props = {
  pecas: PecaVitrine[];
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
 * aqui é amostra, não sessão de cinema. Quem quiser ver inteiro tem o trilho
 * de "Nosso trabalho" logo abaixo.
 */
const TEMPO_VIDEO_S = 5;

function economizarDados() {
  if (typeof navigator === "undefined") return false;
  const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection;
  return conexao?.saveData === true;
}

export default function HeroVideos({ pecas, indice, aoTrocar }: Props) {
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

  const atual = pecas[indice];
  const ehVideo = atual?.tipo === "video" && Boolean(atual.video);
  const sozinho = pecas.length <= 1;

  const avancar = useCallback(() => {
    aoTrocar((indice + 1) % pecas.length);
  }, [aoTrocar, indice, pecas.length]);

  // Imagem troca por tempo de relógio.
  useEffect(() => {
    if (!atual || ehVideo || sozinho || parado) return;
    const t = setTimeout(avancar, TEMPO_IMAGEM_MS);
    return () => clearTimeout(t);
  }, [atual, ehVideo, sozinho, parado, avancar]);

  // Vídeo troca por tempo tocado, e não por relógio.
  //
  // A diferença aparece em celular com rede ruim: um cronômetro correria
  // durante o carregamento e trocaria a peça antes de ela ter mostrado
  // alguma coisa. Contando pelo currentTime, os cinco segundos são cinco
  // segundos vistos.
  //
  // A trava evita a troca dupla: o evento de tempo dispara umas quatro vezes
  // por segundo, e sem ela o quadro seguinte poderia pular duas peças.
  const jaAvancou = useRef(false);
  useEffect(() => {
    jaAvancou.current = false;
  }, [indice]);

  function aoAndarOTempo(video: HTMLVideoElement) {
    if (sozinho || jaAvancou.current) return;
    if (video.currentTime < TEMPO_VIDEO_S) return;
    jaAvancou.current = true;
    avancar();
  }

  // Aba escondida não precisa tocar: pausa, e volta quando a pessoa voltar.
  useEffect(() => {
    function aoMudarVisibilidade() {
      const v = ref.current;
      if (!v) return;
      if (document.hidden) v.pause();
      else if (!parado) v.play().catch(() => {});
    }
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  }, [parado]);

  if (!atual) return null;

  // "#t=0.1" pinta um quadro sem tocar: um décimo, e não zero, porque muito
  // vídeo abre com um quadro preto.
  const enderecoVideo =
    ehVideo && atual.video
      ? atual.video.includes("#")
        ? atual.video
        : `${atual.video}#t=0.1`
      : null;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={indice}
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        {enderecoVideo ? (
          <video
            ref={ref}
            src={enderecoVideo}
            poster={atual.src || undefined}
            muted
            playsInline
            autoPlay={!parado}
            loop={sozinho}
            preload={parado ? "metadata" : "auto"}
            onTimeUpdate={(e) => aoAndarOTempo(e.currentTarget)}
            // Rede de segurança, para a peça mais curta que o corte: um vídeo
            // de três segundos nunca chegaria aos cinco do contador.
            onEnded={() => {
              if (sozinho || jaAvancou.current) return;
              jaAvancou.current = true;
              avancar();
            }}
            aria-label={atual.legenda ?? atual.alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={atual.src}
            alt={atual.alt}
            fill
            priority={indice === 0}
            sizes="(max-width: 1024px) 80vw, 380px"
            className="object-cover"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
