"use client";

import { useEffect, useRef } from "react";

// Vídeo do trilho, tocando sozinho.
//
// Só toca enquanto está visível. Sem isso, todos os vídeos da vitrine — que é
// renderizada duas vezes para o laço não ter emenda — tocariam ao mesmo tempo,
// baixando e decodificando tudo de uma vez. Com o observador, roda apenas o
// punhado que está na tela.
//
// muted é o que torna a reprodução automática possível: navegador nenhum
// aceita som sem gesto da pessoa. playsInline evita que o iPhone abra o vídeo
// em tela cheia por conta própria.
export default function VitrineVideo({
  src,
  poster,
  alt,
  className,
}: {
  src: string;
  poster?: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Quem pediu menos movimento não recebe vídeo rodando sozinho.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          // play() devolve promessa que rejeita se o navegador recusar. Sem o
          // catch, vira erro não tratado no console a cada tentativa.
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.25 }
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      // Sem preload automático: o arquivo só desce quando o ladrilho chega
      // perto da tela, e não no carregamento da página.
      preload="metadata"
      aria-label={alt}
      draggable={false}
      className={className}
    />
  );
}
