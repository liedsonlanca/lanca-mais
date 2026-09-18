"use client";

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type PecaVitrine } from "@/lib/showcase";

// Os vídeos da abertura da home.
//
// Tocam um de cada vez e passam para o próximo quando terminam. Um só carrega
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

  // Imagem troca por tempo; vídeo troca quando termina (onEnded, abaixo).
  useEffect(() => {
    if (!atual || ehVideo || sozinho || parado) return;
    const t = setTimeout(() => aoTrocar((indice + 1) % pecas.length), TEMPO_IMAGEM_MS);
    return () => clearTimeout(t);
  }, [atual, ehVideo, sozinho, parado, indice, pecas.length, aoTrocar]);

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
            onEnded={() => aoTrocar((indice + 1) % pecas.length)}
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
