import { services } from "@/lib/site-config";

// As imagens fixas do site, num catálogo só.
//
// Existe desde 22/09/2026. Até aqui, toda foto que não vinha de uma lista
// editável (vitrine, equipe, cases, logos de cliente, depoimentos) estava
// escrita à mão dentro do JSX ou de um lib/. Trocar a foto de um card de
// serviço exigia abrir o editor de código e publicar de novo.
//
// ---------- Por que catálogo, e não mais uma tabela de lista ----------
//
// Estas imagens não são uma coleção: são posições. O card do Marketing Pessoal
// tem uma foto, não "de zero a várias". Uma tabela com id, ordem e botão de
// acrescentar deixaria a agência criar uma segunda foto para uma posição que
// só cabe uma, e o site teria que escolher qual ignorar.
//
// Então a posição vive aqui, em código, com nome e endereço: é o site que diz
// quais buracos existem. O banco guarda só o que foi trocado. Quem nunca foi
// trocada nem tem linha no banco — o padrão daqui continua valendo, e
// "restaurar o padrão" é apagar a linha, não reenviar arquivo nenhum.
//
// ---------- Por que cada posição descreve a própria moldura ----------
//
// O painel mostra uma prévia com a proporção e o recorte de verdade daquele
// lugar no site, e não um quadradinho genérico. Uma foto boa na horizontal
// pode perder a cabeça de alguém quando entra numa caixa em pé, e descobrir
// isso só depois de publicar é o tipo de erro que a prévia evita.
//
// Por isso `moldura` não é enfeite do painel: é a cópia fiel do que o JSX faz
// com a imagem. Mexeu no recorte de um lado, mexa no outro.

/** Como a prévia do painel imita o lugar de verdade. */
export type Moldura = {
  /** Proporção da caixa, no formato do CSS: "5 / 4". */
  proporcao: string;
  /** object-position aplicado no site. */
  recorte?: string;
  /** contain para marca, cover para foto. */
  encaixe?: "cover" | "contain";
  /** Fundo atrás da imagem, para conferir marca com transparência. */
  fundo?: "escuro" | "claro";
  /** Opacidade com que o site mostra a imagem, quando não for 1. */
  opacidade?: number;
  /** Véu que o site põe por cima, como classe de cor. */
  veu?: string;
  /** Arredondamento, quando for diferente do padrão da prévia. */
  raio?: string;
};

export type Posicao = {
  chave: string;
  /** O grupo onde ela é editada no painel. */
  grupo: string;
  rotulo: string;
  /** Onde exatamente, em português de quem não abre o código. */
  onde: string;
  padrao: { src: string; alt: string };
  moldura: Moldura;
  /**
   * Decorativa: entra como textura sob um véu, e não como retrato.
   *
   * Leitor de tela pula estas, e o painel não pede texto alternativo — pedir
   * seria convidar a descrever uma imagem que ninguém precisa ouvir descrita.
   */
  decorativa?: boolean;
  ajuda: string;
};

export type Grupo = {
  id: string;
  rotulo: string;
  descricao: string;
};

/* ---------------- As posições escritas à mão ---------------- */

const FIXAS: Posicao[] = [
  /* ----- Início: os três cards de serviço ----- */
  {
    chave: "home-servico-marketing-pessoal",
    grupo: "inicio",
    rotulo: "Card do Marketing Pessoal",
    onde: "O primeiro dos três cards de serviço, logo abaixo da abertura.",
    padrao: {
      src: "/images/team/LFF_0551_resized.jpg",
      alt: "Retrato de estúdio de integrante da equipe da LANÇA+",
    },
    moldura: { proporcao: "373 / 230", recorte: "top" },
    ajuda:
      "No computador aparece só a faixa de baixo do card, cortada pelo topo da foto. No celular a foto preenche o card inteiro, em pé, com o texto por cima da parte de baixo — então deixe o rosto na metade de cima e não ponha nada importante embaixo. JPG ou WEBP, 1200 pixels de largura ou mais.",
  },
  {
    chave: "home-servico-marketing-empresarial",
    grupo: "inicio",
    rotulo: "Card do Marketing Empresarial",
    onde: "O segundo dos três cards de serviço.",
    padrao: {
      src: "/images/team/LFF_0482_resized.jpg",
      alt: "Integrante da equipe da LANÇA+ em retrato de estúdio",
    },
    moldura: { proporcao: "373 / 230", recorte: "top" },
    ajuda:
      "Mesmo enquadramento do card anterior. Os três ficam lado a lado, então fotos da mesma sessão, com a mesma luz, funcionam melhor do que três imagens desencontradas.",
  },
  {
    chave: "home-servico-audiovisual",
    grupo: "inicio",
    rotulo: "Card do Audiovisual",
    onde: "O terceiro dos três cards de serviço.",
    padrao: {
      src: "/images/team/LFF_0602_resized.jpg",
      alt: "Câmera da LANÇA+ com a Canon em punho, em estúdio",
    },
    moldura: { proporcao: "373 / 230", recorte: "top" },
    ajuda:
      "Este é o card em que a foto pode dizer o serviço sozinha: câmera, set, gravação. É o único dos três em que um objeto funciona tão bem quanto um rosto.",
  },

  /* ----- Início: os blocos grandes ----- */
  {
    chave: "home-problema",
    grupo: "inicio",
    rotulo: "Reserva do bloco do problema",
    onde:
      'Ao lado de "Bom negócio, presença mediana." — aparece só enquanto não houver nenhum depoimento em vídeo cadastrado.',
    padrao: {
      src: "/images/team/LFF_0691_resized.jpg",
      alt: "Integrante da equipe da LANÇA+ caminhando em estúdio",
    },
    moldura: { proporcao: "7 / 6", recorte: "50% 25%" },
    ajuda:
      "Desde que esse espaço virou o dos depoimentos em vídeo, esta foto é a reserva: segura o lugar enquanto o primeiro vídeo não for enviado, e some assim que houver um. Caixa deitada, de 7 por 6, cortada pelo quarto de cima.",
  },
  {
    chave: "home-equipe",
    grupo: "inicio",
    rotulo: "Foto do fecho",
    onde: 'No último bloco, ao lado de "Conhecer a equipe".',
    padrao: {
      src: "/images/team/equipe-1.jpg",
      alt: "A equipe da LANÇA+ reunida em estúdio",
    },
    moldura: { proporcao: "5 / 4", recorte: "top" },
    ajuda:
      "É a resposta visual para a pergunta “quem é a LANÇA+”, então vale o time inteiro e em tamanho que dê para ver a cara de cada um. Deitada, cortada pelo topo. A imagem cresce devagar quando o visitante passa o mouse.",
  },
  {
    chave: "home-chamada",
    grupo: "inicio",
    rotulo: "Fundo da chamada final",
    onde: 'Atrás de "Pronto para lançar a sua marca?", no pé da página.',
    padrao: { src: "/images/team/LFF_0473_resized.jpg", alt: "" },
    moldura: { proporcao: "21 / 9", recorte: "50% 28%", veu: "bg-preto/82" },
    decorativa: true,
    ajuda:
      "Entra bem escurecida, quase só como textura: serve para o último bloco não terminar numa cor chapada. Não escolha por causa do assunto, escolha por causa da mancha — imagem de muito contraste deixa a frase mais difícil de ler mesmo por baixo do véu.",
  },

  /* ----- Sobre ----- */
  {
    chave: "sobre-missao",
    grupo: "sobre",
    rotulo: "Imagem da missão",
    onde:
      'Ao lado do texto "Transformar marca em posicionamento", na página Sobre.',
    padrao: { src: "/images/sobre.webp", alt: "Símbolo da LANÇA+" },
    moldura: { proporcao: "4 / 3" },
    ajuda:
      "No computador ela estica até a altura do texto ao lado; no celular vira uma caixa deitada de 4 por 3. Cortada pelo meio nos dois casos.",
  },

  /* ----- Telas de espera ----- */
  {
    chave: "em-breve-fundo",
    grupo: "espera",
    rotulo: "Fundo da tela “Em breve”",
    onde:
      "Atrás da contagem regressiva, na tela que o visitante vê enquanto o site está fechado.",
    padrao: { src: "/images/fundo-inicio.jpg", alt: "" },
    moldura: {
      proporcao: "16 / 9",
      recorte: "top",
      fundo: "escuro",
      opacidade: 0.18,
      veu: "bg-gradient-to-b from-[#0D0D0B] via-[#0D0D0B]/85 to-[#0D0D0B]",
    },
    decorativa: true,
    ajuda:
      "Aparece bem apagada, a 18% por cima do preto, e coberta por um degradê. É textura de fundo: padrão gráfico ou trama funcionam melhor que foto com rosto, que fica irreconhecível nessa opacidade.",
  },

  /* ----- Marca ----- */
  {
    chave: "marca-clara",
    grupo: "marca",
    rotulo: "Logo para fundo escuro",
    onde:
      "No menu do topo enquanto ele está transparente, no rodapé e nas telas de espera.",
    padrao: { src: "/images/logo-1.png", alt: "LANÇA+" },
    moldura: { proporcao: "140 / 39", encaixe: "contain", fundo: "escuro" },
    ajuda:
      "PNG ou WEBP com fundo transparente, na versão clara da marca. Confira na prévia se as bordas estão limpas: logo exportado com fundo branco aparece como um retângulo no meio do rodapé escuro.",
  },
  {
    chave: "marca-escura",
    grupo: "marca",
    rotulo: "Logo para fundo claro",
    onde:
      "No menu do topo depois que ele ganha fundo, e em tamanho grande na abertura da home.",
    padrao: { src: "/images/logo-2.png", alt: "LANÇA+" },
    moldura: { proporcao: "140 / 39", encaixe: "contain", fundo: "claro" },
    ajuda:
      "A mesma marca na versão escura, com fundo transparente. Esta é a que aparece gigante na primeira tela do site, então envie o arquivo em alta: a atual tem 2855 pixels de largura.",
  },
];

/* ---------------- O arco de cada página de serviço ---------------- */

/**
 * As cinco fotos do leque, por serviço.
 *
 * São exatamente cinco, e não "de zero a várias", porque o arco tem cinco
 * ângulos desenhados: -68, -34, 0, 34 e 68 graus. Uma sexta foto não teria
 * onde pousar, e com quatro o leque fica torto. Por isso elas são posições
 * fixas do catálogo, e não uma lista com botão de acrescentar — o painel não
 * oferece o que o desenho não comporta.
 *
 * A do meio é maior no site: é o topo do arco, onde o olho chega primeiro.
 */
const POSICAO_NO_ARCO = [
  { n: 1, onde: "Ponta esquerda do leque, a mais inclinada." },
  { n: 2, onde: "Segunda da esquerda." },
  { n: 3, onde: "A do meio, no topo do arco. É a maior das cinco." },
  { n: 4, onde: "Segunda da direita." },
  { n: 5, onde: "Ponta direita do leque, a mais inclinada." },
];

/**
 * As fotos que seguram o leque enquanto não houver peça de cliente.
 *
 * Vêm da sessão de estúdio da equipe, que é o único acervo próprio que o site
 * tem hoje. Cada serviço recebe um giro diferente da mesma lista, senão as
 * oito páginas abririam com o leque idêntico e a repetição saltaria aos olhos
 * de quem visita duas delas em seguida.
 */
const RESERVA_DO_ARCO = [
  "/images/team/LFF_0551_resized.jpg",
  "/images/team/LFF_0482_resized.jpg",
  "/images/team/LFF_0602_resized.jpg",
  "/images/team/LFF_0655_resized.jpg",
  "/images/team/LFF_0691_resized.jpg",
  "/images/team/LFF_0726_resized.jpg",
  "/images/team/LFF_0473_resized.jpg",
];

/** O identificador do grupo do arco de um serviço. */
export function grupoDoArco(slug: string) {
  return `arco-${slug}`;
}

/** A chave de uma das cinco fotos do arco de um serviço. */
export function chaveDoArco(slug: string, n: number) {
  return `arco-${slug}-${n}`;
}

const DO_ARCO: Posicao[] = services.flatMap((servico, indiceServico) =>
  POSICAO_NO_ARCO.map(({ n, onde }) => ({
    chave: chaveDoArco(servico.slug, n),
    grupo: grupoDoArco(servico.slug),
    rotulo: `Foto ${n} de 5`,
    onde,
    padrao: {
      // O giro por serviço: cada página começa num ponto diferente da lista.
      src: RESERVA_DO_ARCO[(indiceServico * 3 + n - 1) % RESERVA_DO_ARCO.length],
      alt: `Trabalho da LANÇA+ em ${servico.name}`,
    },
    moldura: { proporcao: "4 / 5", recorte: "top", raio: "1rem" },
    ajuda:
      n === 3
        ? "Esta é a do meio, e aparece maior que as outras quatro. Ponha aqui a melhor peça do serviço: é a que o olho encontra primeiro."
        : "Caixa em pé, de 4 por 5, cortada pelo topo. No leque ela aparece inclinada e pequena, então imagem com muito detalhe fino se perde — o que funciona é uma peça com um assunto claro.",
  }))
);

/* ---------------- O catálogo inteiro ---------------- */

export const POSICOES: Posicao[] = [...FIXAS, ...DO_ARCO];

export const GRUPOS: Grupo[] = [
  {
    id: "inicio",
    rotulo: "Página inicial",
    descricao: "Os cards de serviço, os blocos grandes e o fundo da chamada.",
  },
  {
    id: "sobre",
    rotulo: "Página Sobre",
    descricao: "A imagem que acompanha a missão.",
  },
  {
    id: "marca",
    rotulo: "Marca",
    descricao: "As duas versões do logo, no menu, no rodapé e na abertura.",
  },
  {
    id: "espera",
    rotulo: "Telas de espera",
    descricao: "O fundo da tela que aparece enquanto o site está fechado.",
  },
  ...services.map((servico) => ({
    id: grupoDoArco(servico.slug),
    rotulo: `Arco: ${servico.name}`,
    descricao: `As cinco fotos do leque que abre a página de ${servico.name}.`,
  })),
];

/** Mapa rápido por chave, para quem já sabe qual posição quer. */
export const POR_CHAVE = new Map(POSICOES.map((p) => [p.chave, p]));

/** As posições de um grupo, na ordem do catálogo. */
export function posicoesDoGrupo(id: string) {
  return POSICOES.filter((p) => p.grupo === id);
}

/** As chaves que o painel pode gravar. Nome vindo da rede passa por aqui. */
export function chaveValida(valor: string) {
  return POR_CHAVE.has(valor);
}

export type Imagem = { src: string; alt: string };
export type Imagens = Record<string, Imagem>;

/** Tudo no padrão de fábrica. É a reserva quando não há banco. */
export function imagensPadrao(): Imagens {
  const mapa: Imagens = {};
  for (const posicao of POSICOES) {
    mapa[posicao.chave] = { ...posicao.padrao };
  }
  return mapa;
}

/**
 * A imagem de uma posição, com o padrão como rede.
 *
 * Existe para que nenhuma página precise escrever `imagens[chave] ?? algo`:
 * uma chave digitada errado devolveria `undefined` e o `next/image` quebraria
 * a página inteira com "src is required". Aqui ela devolve o padrão, e o pior
 * caso vira uma foto desatualizada em vez de uma tela de erro.
 */
export function imagem(imagens: Imagens, chave: string): Imagem {
  return imagens[chave] ?? POR_CHAVE.get(chave)?.padrao ?? { src: "", alt: "" };
}

/** As cinco do arco de um serviço, já na ordem do leque. */
export function fotosDoArco(imagens: Imagens, slug: string) {
  return POSICAO_NO_ARCO.map(({ n }) => imagem(imagens, chaveDoArco(slug, n)));
}
