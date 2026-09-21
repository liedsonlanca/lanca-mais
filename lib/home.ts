// O que a home precisa responder, num lugar só.
//
// Desde 21/09/2026 a home existe para responder, na ordem, as perguntas que
// alguém faz antes de contratar uma agência:
//
//   qual é o meu problema  →  quem resolve  →  o que fazem  →  como fazem  →
//   o que eu recebo  →  isso serve para mim?  →  dá resultado?  →  falo com quem
//
// Os textos vivem aqui, e não espalhados no JSX, porque quem escreve não é
// quem programa: a agência muda uma frase sem abrir a página.
//
// Os sintomas e as etapas do método são os textos aprovados que já estavam no
// site antes da reforma de 18/09. Não foram reescritos.

export type Sintoma = { titulo: string; descricao: string };
export type Etapa = { numero: string; titulo: string; descricao: string };
export type Publico = { titulo: string; descricao: string; exemplos: string[]; servico: string };

/* ---------------- Qual é a problemática ---------------- */

export const sintomas: Sintoma[] = [
  {
    titulo: "O feed não parece o preço",
    descricao:
      "A entrega é excelente, mas a comunicação mostra um negócio menor. E o público precifica pelo que vê.",
  },
  {
    titulo: "Publicar virou tarefa, não estratégia",
    descricao:
      "Sem linha editorial, cada post nasce solto e nenhum responde à pergunta básica: o que ele deveria vender?",
  },
  {
    titulo: "Ninguém sabe dizer o que funcionou",
    descricao:
      "Sem métrica acompanhada, a decisão do mês seguinte vira achismo e o investimento se repete sem aprendizado.",
  },
];

/* ---------------- Como resolvem ---------------- */

// As quatro etapas dizem a forma do trabalho, não a receita dele: o cliente
// precisa saber que existe um caminho e que ele funciona; o passo a passo
// interno é da casa.
export const metodo: Etapa[] = [
  {
    numero: "01",
    titulo: "Estruturação",
    descricao:
      "Antes de qualquer publicação, sua marca ganha uma direção definida e registrada. Nada sai no improviso.",
  },
  {
    numero: "02",
    titulo: "Implementação",
    descricao:
      "O conteúdo entra no ar com consistência, e cada peça nasce com um objetivo dentro dessa direção.",
  },
  {
    numero: "03",
    titulo: "Monitoramento",
    descricao:
      "Acompanhamos de perto o que o desempenho mostra sobre o objetivo da sua marca.",
  },
  {
    numero: "04",
    titulo: "Reajuste",
    descricao:
      "A rota é corrigida pelo que os números mostram. O que funciona ganha espaço, o que não funciona sai.",
  },
];

/* ---------------- O que fornecem ---------------- */

// [REVISAR] Montada a partir dos itens que já constavam em cada serviço, em
// lib/site-config.ts. Confirme com a agência se é exatamente isto que entra
// no contrato mensal antes de publicar: esta lista é uma promessa.
export const entregaveis: string[] = [
  "Posicionamento e perfil estratégico da marca",
  "Linha editorial e calendário do mês",
  "Produção de conteúdo: foto, vídeo e design",
  "Roteiro, captação e edição dos vídeos",
  "Publicação e acompanhamento diário",
  "Relatório de métricas e reajuste da estratégia",
];

/* ---------------- As fotos dos blocos ---------------- */

// A sessão de estúdio da equipe: fundo cinza, todo mundo de preto. É o ativo
// visual mais forte que o site tem, e é o que nenhum concorrente pode copiar.
//
// Estas são as tomadas que NÃO estão no trilho de "Nosso trabalho", que usa as
// sete fotos nomeadas. Assim nenhuma imagem aparece duas vezes na home.
//
// [SUBSTITUIR] quando houver peça de cliente: o card de cada serviço deve
// mostrar trabalho entregue, e não a equipe. Enquanto isso, retrato da casa é
// melhor do que desenho genérico.
export const FOTOS_SERVICO: Record<string, { src: string; alt: string }> = {
  // Mãos entrelaçadas, olhar direto: quando a pessoa é a marca, é a presença
  // dela que vende.
  "marketing-pessoal": {
    src: "/images/team/LFF_0551_resized.jpg",
    alt: "Retrato de estúdio de integrante da equipe da LANÇA+",
  },
  "marketing-empresarial": {
    src: "/images/team/LFF_0482_resized.jpg",
    alt: "Integrante da equipe da LANÇA+ em retrato de estúdio",
  },
  // Câmera na mão: o serviço inteiro numa imagem.
  audiovisual: {
    src: "/images/team/LFF_0602_resized.jpg",
    alt: "Câmera da LANÇA+ com a Canon em punho, em estúdio",
  },
};

/** A foto que acompanha o bloco do problema. Figura andando: movimento. */
export const FOTO_PROBLEMA = {
  src: "/images/team/LFF_0691_resized.jpg",
  alt: "Integrante da equipe da LANÇA+ caminhando em estúdio",
};

/** A foto do fecho: o time inteiro, porque a pergunta ali é quem somos. */
export const FOTO_EQUIPE = {
  src: "/images/team/equipe-1.jpg",
  alt: "A equipe da LANÇA+ reunida em estúdio",
};

/* ---------------- Pra quem fazem ---------------- */

export const publicos: Publico[] = [
  {
    titulo: "Quando você é a marca",
    descricao:
      "O cliente pesquisa a pessoa antes de marcar. O que ele encontra decide se procura você ou o concorrente.",
    exemplos: [
      "Médicos e dentistas",
      "Advogados",
      "Arquitetos",
      "Esteticistas",
      "Personal trainers",
    ],
    servico: "marketing-pessoal",
  },
  {
    titulo: "Quando a empresa é a marca",
    descricao:
      "A decisão acontece antes do primeiro contato, no perfil, no site e no que os outros falam.",
    exemplos: [
      "Clínicas e consultórios",
      "Escritórios",
      "Lojas e varejo",
      "Restaurantes",
      "Imobiliárias",
    ],
    servico: "marketing-empresarial",
  },
];
