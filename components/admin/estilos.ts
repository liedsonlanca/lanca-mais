// Classes repetidas pelas telas do painel, num lugar só.
//
// Não são componentes de propósito: o painel é feito de <form> nativo, para
// funcionar sem JavaScript no navegador, e envolver cada input num componente
// só atrapalharia isso.

export const campo =
  "min-h-11 w-full rounded-xl border border-linha bg-branco px-4 py-2.5 text-sm text-preto outline-none transition-colors duration-300 focus:border-salmon";

export const rotulo =
  "block text-xs font-medium uppercase tracking-wider text-preto/50";

export const ajuda = "mt-2 text-xs leading-relaxed text-preto/50";

// min-h-11: mesmo alvo minimo de toque das setas.
export const botao =
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors duration-300";

export const botaoPrimario = `${botao} bg-salmon-texto text-branco hover:bg-salmon-escuro`;

export const botaoSecundario = `${botao} border border-preto/20 text-preto hover:border-preto`;

export const botaoDiscreto =
  "text-sm text-preto/45 transition-colors duration-300 hover:text-salmon-texto";

export const cartao =
  "rounded-3xl border border-linha bg-branco p-6 shadow-[var(--sombra-cartao)]";

export const arquivo =
  "mt-2 block w-full text-sm text-preto/70 file:mr-4 file:rounded-full file:border-0 file:bg-salmon/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-salmon-texto";

// min-h-11 e o alvo minimo recomendado no toque (44px). Com py-1 as setas
// ficavam com 26px e erravam o vizinho no celular.
export const setaOrdem =
  "flex min-h-11 min-w-11 items-center justify-center rounded-full border border-linha text-sm text-preto/60 transition-colors hover:border-salmon disabled:opacity-30";
