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

// Enquanto um overlay em tela cheia está aberto, a rolagem da página precisa
// parar de verdade — só travar o overflow do body não segura o Lenis.
export function pararRolagem() {
  instancia?.stop();
}

export function retomarRolagem() {
  instancia?.start();
}
