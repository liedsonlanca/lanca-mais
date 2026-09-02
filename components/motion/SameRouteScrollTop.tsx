"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { rolarAoTopo } from "@/lib/scroll";

// Clicar num link do menu para a página em que você já está não faz o Next
// navegar — e, sem navegação, nada devolve a rolagem ao topo: a pessoa clica
// em "Serviços" estando no fim de /servicos e nada acontece.
//
// Resolvemos com um único ouvinte no documento, em vez de espalhar onClick por
// header, menu mobile e rodapé: assim qualquer link do site passa a se
// comportar igual, inclusive os que vierem depois.
export default function SameRouteScrollTop() {
  const pathname = usePathname();

  useEffect(() => {
    function aoClicar(evento: MouseEvent) {
      // Só clique simples com o botão esquerdo. Ctrl/Cmd/Shift abrem em nova
      // aba ou janela e não podem ser sequestrados.
      if (
        evento.defaultPrevented ||
        evento.button !== 0 ||
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey ||
        evento.altKey
      ) {
        return;
      }

      const alvo = (evento.target as HTMLElement | null)?.closest("a");
      if (!alvo) return;

      // Deixa passar downloads, nova aba e links externos.
      if (alvo.target && alvo.target !== "_self") return;
      if (alvo.hasAttribute("download")) return;

      const href = alvo.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(alvo.href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      // Âncoras internas (#sobre-o-servico) devem continuar pulando para a seção.
      if (url.hash) return;

      // Só age quando o destino é exatamente a página atual.
      if (url.pathname !== pathname) return;

      evento.preventDefault();
      rolarAoTopo();
    }

    // Captura, e não bolha: o onClick do <Link> do Next roda antes de um
    // listener em bolha e já dispara a navegação — o preventDefault chegaria
    // tarde e o Next restauraria a posição anterior. Na captura chegamos
    // primeiro, e o next/link desiste ao ver defaultPrevented.
    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, [pathname]);

  return null;
}
