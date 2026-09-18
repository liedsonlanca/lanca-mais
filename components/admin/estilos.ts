// Classes repetidas pelas telas do painel, num lugar só.
//
// Não são componentes de propósito: o painel é feito de <form> nativo, para
// funcionar sem JavaScript no navegador, e envolver cada input num componente
// só atrapalharia isso.

export const campo =
  "min-h-11 w-full rounded-xl border border-contorno bg-cartao px-4 py-2.5 text-sm text-tinta outline-none transition-colors duration-300 focus:border-salmon";

export const rotulo =
  "block text-xs font-medium uppercase tracking-wider text-tinta/50";

export const ajuda = "mt-2 text-xs leading-relaxed text-tinta/50";

// min-h-11: mesmo alvo minimo de toque das setas.
export const botao =
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors duration-300";

export const botaoPrimario = `${botao} bg-destaque text-branco hover:bg-salmon-escuro`;

export const botaoSecundario = `${botao} border border-tinta/20 text-tinta hover:border-tinta`;

export const botaoDiscreto =
  "text-sm text-tinta/45 transition-colors duration-300 hover:text-destaque";

export const cartao =
  "rounded-3xl border border-contorno bg-cartao p-6 shadow-[var(--sombra-cartao)]";

// file:py-3: quem se toca aqui e o botao de dentro do campo, e nao o campo.
// Com file:py-2 ele ficava com 36px de altura, abaixo do alvo minimo, e no
// celular a pessoa errava para o texto ao lado.
export const arquivo =
  "mt-2 block w-full text-sm text-tinta/70 file:mr-4 file:rounded-full file:border-0 file:bg-salmon/15 file:px-5 file:py-3 file:text-sm file:font-medium file:text-destaque";

// min-h-11 e o alvo minimo recomendado no toque (44px). Com py-1 as setas
// ficavam com 26px e erravam o vizinho no celular.
export const setaOrdem =
  "flex min-h-11 min-w-11 items-center justify-center rounded-full border border-contorno text-sm text-tinta/60 transition-colors hover:border-salmon disabled:opacity-30";
