"use client";

import { useEffect, useRef, useState } from "react";

// Vídeo do trilho, tocando sozinho — e gastando o mínimo de banda possível.
//
// O custo do Vercel Blob é por banda entregue, não por arquivo guardado: um
// vídeo no trilho custa a cada visita, e não uma vez. A franquia gratuita de
// 10 GB já foi estourada uma vez por causa disto, então cada byte aqui é
// deliberado.
//
// O que fazia o gasto explodir: o endereço do vídeo ficava no `src` desde o
// primeiro instante, e `preload="metadata"` somado ao marcador `#t=0.1` obriga
// o navegador a baixar um pedaço do arquivo para conseguir pintar aquele
// quadro. Como o trilho é renderizado duas vezes para o laço não ter emenda,
// eram dois downloads parciais por vídeo em toda visita, mesmo o de peças que
// ninguém chegava a ver.
//
// Agora o `src` só é preenchido quando o ladrilho se aproxima da tela. Fora
// dali o elemento existe, ocupa o lugar certo e não custa nada.
export default function VitrineVideo({
  src,
  poster,
  alt,
  legenda,
  className,
}: {
  src: string;
  poster?: string;
  alt: string;
  legenda?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  // Endereço só entra quando vale a pena baixar.
  const [endereco, setEndereco] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);

  // "#t=0.1" pede ao navegador que se posicione em um décimo de segundo, e é
  // isso que pinta um quadro sem precisar tocar. Um décimo, e não zero, porque
  // muitos vídeos abrem com um quadro preto.
  const comQuadro = src.includes("#") ? src : `${src}#t=0.1`;

  // ---------- Baixar só o que chega perto ----------
  useEffect(() => {
    const el = ref.current;
    if (!el || endereco) return;

    // A margem larga dá tempo de o arquivo chegar antes de o ladrilho entrar
    // na tela, sem baixar o trilho inteiro de antemão.
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setEndereco(comQuadro);
          observador.disconnect();
        }
      },
      { rootMargin: "400px" }
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, [comQuadro, endereco]);

  // ---------- Tocar só o que está à vista ----------
  useEffect(() => {
    const el = ref.current;
    if (!el || !endereco) return;

    // Quem pediu menos movimento não recebe vídeo rodando sozinho.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visivel = false;

    const decidir = () => {
      if (visivel && !document.hidden) {
        // play() devolve promessa que rejeita se o navegador recusar. Sem o
        // catch, vira erro não tratado no console a cada tentativa.
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    };

    const observador = new IntersectionObserver(
      ([entrada]) => {
        visivel = entrada.isIntersecting;
        decidir();
      },
      { threshold: 0.25 }
    );

    observador.observe(el);

    // Aba escondida não pode continuar puxando vídeo em laço: é banda gasta
    // para ninguém, e o laço faria isso pelo tempo que a aba ficasse aberta.
    document.addEventListener("visibilitychange", decidir);

    return () => {
      observador.disconnect();
      document.removeEventListener("visibilitychange", decidir);
    };
  }, [endereco]);

  // ---------- Quando o arquivo não vem ----------
  //
  // Aconteceu de verdade: a franquia de banda do Blob acabou e o armazenamento
  // foi pausado, então todo vídeo passou a ser recusado e o trilho ficou com
  // retângulos vazios. Um ladrilho que falha agora mostra a legenda em vez de
  // um buraco, e quem olha entende que ali havia uma peça.
  if (falhou) {
    return (
      <div className="absolute inset-0 flex items-end bg-areia p-4">
        <span className="font-heading text-sm leading-snug text-preto/45">
          {legenda || alt}
        </span>
      </div>
    );
  }

  return (
    <video
      ref={ref}
      src={endereco ?? undefined}
      poster={poster}
      muted
      loop
      playsInline
      onError={() => setFalhou(true)}
      // Nada é baixado por conta própria: quem decide é o observador acima.
      preload="none"
      aria-label={alt}
      draggable={false}
      // Fundo neutro por baixo: enquanto o quadro não chega, o ladrilho aparece
      // como espaço reservado, e não como um buraco branco num card branco.
      className={`bg-linha ${className ?? ""}`}
    />
  );
}
