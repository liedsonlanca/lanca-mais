import type Lenis from "lenis";

// O Lenis vive dentro do <SmoothScroll />. Guardamos a instância aqui para que
// qualquer componente cliente possa pedir uma rolagem que respeite a inércia,
// em vez de brigar com ela via window.scrollTo.
let instancia: Lenis | null = null;

export function registrarLenis(lenis: Lenis | null) {
  instancia = lenis;
}

export function rolarAoTopo() {
  const reduzido =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (instancia && !reduzido) {
    instancia.scrollTo(0, { duration: 0.9 });
    return;
  }

  // Sem Lenis (o caso de movimento reduzido) a rolagem nativa resolve.
  window.scrollTo({ top: 0, behavior: reduzido ? "auto" : "smooth" });
}

// Topo imediato, sem animação: é o que se espera ao trocar de página.
//
// Quem chama isto é a troca de rota. O Next zera a rolagem por conta própria,
// mas essa reposição corre contra a montagem do conteúdo novo e contra a
// posição que o Lenis guarda internamente. Quando o Next perde a corrida, a
// rolagem antiga é reaplicada sobre a página nova: saindo do fim da home e
// indo para uma página alta, a pessoa aterrissa no fim dela.
//
// Zeramos os dois: o Lenis (que é quem manda enquanto está ativo) e a rolagem
// nativa (para o caso de movimento reduzido, em que o Lenis nem existe).
export function irAoTopoImediato() {
  instancia?.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
}

// Enquanto um overlay em tela cheia está aberto, a rolagem da página precisa
// parar de verdade — só travar o overflow do body não segura o Lenis.
export function pararRolagem() {
  instancia?.stop();
}

export function retomarRolagem() {
  instancia?.start();
}
