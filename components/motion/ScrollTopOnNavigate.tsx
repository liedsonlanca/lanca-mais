"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { rolarAoTopo, irAoTopoImediato } from "@/lib/scroll";

// Garante que toda navegação comece no topo, nos dois casos em que isso falha.
//
// 1. Link para a página em que você já está. O Next não navega, e sem
//    navegação nada devolve a rolagem ao topo: a pessoa clica em "Serviços"
//    estando no fim de /servicos e nada acontece. Aqui a rolagem é animada,
//    porque a pessoa continua na mesma página e o percurso faz sentido.
//
// 2. Link para outra página. O Next zera a rolagem sozinho, mas essa reposição
//    corre contra a montagem do conteúdo e contra a posição interna do Lenis.
//    Quando perde a corrida, a rolagem antiga reaparece sobre a página nova.
//    Aqui o topo é imediato, sem animação: ninguém quer ver a página nova
//    correndo de baixo para cima.
//
// O caso 1 é resolvido com um único ouvinte no documento, em vez de espalhar
// onClick por header, menu mobile e rodapé: assim qualquer link do site se
// comporta igual, inclusive os que vierem depois.
export default function ScrollTopOnNavigate() {
  const pathname = usePathname();
  const veioDoHistorico = useRef(false);

  // Voltar e avançar no navegador devem restaurar onde a pessoa estava, então
  // esses casos ficam de fora do reposicionamento.
  useEffect(() => {
    function aoVoltar() {
      veioDoHistorico.current = true;
    }
    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, []);

  useEffect(() => {
    if (veioDoHistorico.current) {
      veioDoHistorico.current = false;
      return;
    }
    // Link com âncora (#como-funciona) deve pular para a seção, não para o topo.
    if (window.location.hash) return;

    irAoTopoImediato();
  }, [pathname]);

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
