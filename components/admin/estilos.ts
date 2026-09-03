// Classes repetidas pelas telas do painel, num lugar só.
//
// Não são componentes de propósito: o painel é feito de <form> nativo, para
// funcionar sem JavaScript no navegador, e envolver cada input num componente
// só atrapalharia isso.

export const campo =
  "w-full rounded-xl border border-linha bg-branco px-4 py-2.5 text-sm text-preto outline-none transition-colors duration-300 focus:border-salmon";

export const rotulo =
  "block text-xs font-medium uppercase tracking-wider text-preto/50";

export const ajuda = "mt-2 text-xs leading-relaxed text-preto/50";

export const botao =
  "rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300";

export const botaoPrimario = `${botao} bg-salmon text-preto hover:bg-salmon-escuro`;

export const botaoSecundario = `${botao} border border-preto/20 text-preto hover:border-preto`;

export const botaoDiscreto =
  "text-sm text-preto/45 transition-colors duration-300 hover:text-salmon-texto";

export const cartao =
  "rounded-3xl border border-linha bg-branco p-6 shadow-[var(--sombra-cartao)]";

export const arquivo =
  "mt-2 block w-full text-sm text-preto/70 file:mr-4 file:rounded-full file:border-0 file:bg-salmon/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-salmon-texto";

export const setaOrdem =
  "rounded-full border border-linha px-3 py-1 text-sm text-preto/60 transition-colors hover:border-salmon disabled:opacity-30";
