"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { registrarLenis } from "@/lib/scroll";

// Rolagem com inércia — é o que dá a sensação de "suave" antes de qualquer
// animação de entrada. Desligada para quem pede menos movimento.
//
// ---------- E desligada no painel ----------
//
// O Lenis captura a roda do mouse na página inteira e rola o documento. Numa
// página de vitrine isso é o efeito desejado; numa ferramenta de trabalho é
// defeito: cada lista, cada cartão e cada caixa com rolagem própria deixava
// de rolar, e a página inteira rolava no lugar.
//
// Dá para marcar cada caixa com data-lenis-prevent, e era o que o site já
// fazia em alguns lugares — mas no painel isso seria marcar todas, inclusive
// as que ainda não existem. Mais honesto é não ligar a rolagem suave onde
// ela não deveria estar: o painel não é vitrine, e inércia ao rolar uma
// lista de conversas só atrapalha quem está trabalhando.
export default function SmoothScroll() {
  const caminho = usePathname();

  useEffect(() => {
    if (caminho.startsWith("/lncadmin")) return;

    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduzido.matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
    });

    registrarLenis(lenis);

    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      registrarLenis(null);
    };
    // Depende do caminho: entrar no painel precisa desmontar o Lenis que
    // estava rodando, e sair dele precisa montar de volta.
  }, [caminho]);

  return null;
}
