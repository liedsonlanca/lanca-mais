"use client";

import { useEffect, useRef } from "react";

// Um dos três vídeos da tela de espera, em laço curto.
//
// ---------- Por que seis segundos, e não o arquivo inteiro ----------
//
// A vitrine tem peça de um minuto. Três delas tocando lado a lado numa tela de
// espera viram três filmes concorrendo, e quem chega pega cada uma num ponto
// aleatório do meio — sem começo, sem contexto, e sem nunca ver o começo de
// nenhuma. É a mesma razão do corte de cinco segundos na abertura do site.
//
// ---------- Por que isto precisa de JavaScript ----------
//
// Nada em HTML repete um trecho de vídeo. O fragmento de mídia "#t=0,6" marca
// um intervalo, mas o que acontece ao chegar no fim dele muda de navegador
// para navegador, e junto com `loop` costuma ser simplesmente ignorado: o
// vídeo volta ao zero do arquivo, não ao zero do trecho.
//
// Três linhas de relógio próprio fazem o que o atributo não faz, e fazem igual
// em todo lugar.
//
// ---------- O que ele não faz ----------
//
// Não decide se toca: isso é do atributo `autoPlay` e da preferência de
// movimento do sistema, que o navegador já respeita sozinho. Aqui dentro só
// existe a volta ao começo.

/** Quanto de cada peça a tela de espera mostra. */
const TRECHO_S = 6;

export default function PecaEmBreve({
  src,
  poster,
}: {
  src: string;
  poster?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  // Peça mais curta que o trecho nunca chega aos seis segundos: para ela quem
  // devolve ao começo é o `loop`, que fica ligado o tempo todo por isso.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    function aoAndar() {
      const alvo = ref.current;
      if (alvo && alvo.currentTime >= TRECHO_S) alvo.currentTime = 0;
    }

    v.addEventListener("timeupdate", aoAndar);
    return () => v.removeEventListener("timeupdate", aoAndar);
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      tabIndex={-1}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
