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

  // "#t=0.1" pede ao navegador que posicione o vídeo em 0,1 segundo.
  //
  // Sem isso o ladrilho ficava branco até o vídeo começar: com preload
  // "metadata" o navegador baixa a ficha do arquivo mas não desenha quadro
  // nenhum, e um vídeo que ainda não entrou na tela nunca tinha o que mostrar.
  // Com o marcador de tempo, ele busca aquele instante e pinta esse quadro.
  //
  // 0,1s e não 0: muitos vídeos abrem com um quadro preto ou desbotado, e o
  // primeiro décimo já costuma trazer a imagem de verdade.
  const comQuadro = src.includes("#") ? src : `${src}#t=0.1`;

  return (
    <video
      ref={ref}
      src={comQuadro}
      poster={poster}
      muted
      loop
      playsInline
      // Sem preload automático: o arquivo só desce quando o ladrilho chega
      // perto da tela, e não no carregamento da página.
      preload="metadata"
      aria-label={alt}
      draggable={false}
      // Fundo neutro por baixo: se o quadro demorar a chegar numa conexão
      // ruim, o ladrilho aparece como um espaço reservado, e não como um
      // buraco branco dentro do card branco.
      className={`bg-linha ${className ?? ""}`}
    />
  );
}
