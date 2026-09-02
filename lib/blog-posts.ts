export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  category: string;
  content: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "linha-editorial-60-30-10",
    title: "O que é a linha editorial 60/30/10 e por que ela evita conteúdo aleatório",
    excerpt:
      "Toda marca que posta sem estratégia comete o mesmo erro: não sabe o que cada conteúdo deveria vender. Entenda como estruturar as três linhas editoriais.",
    date: "2026-06-02",
    readingTime: "6 min",
    category: "Estratégia",
    content: [
      "A maior parte das marcas que não crescem no digital não tem um problema de qualidade de conteúdo, tem um problema de propósito. Cada post é pensado isoladamente, sem responder a uma pergunta simples: o que esse conteúdo deveria vender?",
      "Na LANÇA+, toda estratégia de conteúdo é dividida em três linhas editoriais, cada uma com um objetivo diferente dentro do funil de marca.",
      "A linha primária responde por 60% do conteúdo do feed. Ela não vende o serviço, vende a transformação que o serviço entrega. Uma ginecologista não vende consulta, vende saúde da mulher. É aqui que a marca constrói autoridade e educa o público.",
      "A linha secundária, com 30% do conteúdo, constrói o posicionamento que a marca quer ocupar além do óbvio. É o espaço para se tornar referência em um tema específico, não apenas mais um perfil do nicho.",
      "A linha terciária, com os 10% restantes, é onde a venda acontece de forma direta: ofertas, depoimentos, chamadas para ação. Sem essa linha, a marca educa mas não converte. Com ela em excesso, o público se cansa.",
      "O erro mais comum é inverter essa proporção: encher o feed de conteúdo comercial e tratar a educação como coadjuvante. O resultado é engajamento baixo e descolamento entre marca e público.",
    ],
  },
  {
    slug: "primeiros-90-dias-presenca-digital",
    title: "Os primeiros 90 dias de uma presença digital estruturada",
    excerpt:
      "Da pesquisa de mercado à primeira publicação: por que pular etapas do onboarding compromete todo o resultado dos meses seguintes.",
    date: "2026-05-14",
    readingTime: "5 min",
    category: "Processos",
    content: [
      "Toda marca nova que entra em um processo de gestão de marketing quer ver resultado imediato. Mas presença digital sólida não nasce da pressa, nasce de etapas bem executadas em sequência.",
      "As primeiras semanas são dedicadas a entender o cenário: quem é o público, quem são os concorrentes diretos e indiretos, e onde está o espaço real de diferenciação. Pular essa etapa é como definir um posicionamento no escuro.",
      "Só depois disso a estratégia é estruturada: tom de voz, calendário editorial, pilares de conteúdo. É essa estrutura que evita o conteúdo aleatório e garante consistência mesmo quando quem produz o conteúdo muda.",
      "A primeira publicação não é o início do trabalho, é a consequência de um processo bem feito. E é a partir dela que o verdadeiro ciclo de marketing começa: publicar, medir, ajustar, repetir.",
    ],
  },
  {
    slug: "quando_a_marca_precisa_de_um_reposicionamento",
    title: "Como saber se sua marca precisa de um reposicionamento",
    excerpt:
      "Nem toda marca que não performa bem no digital precisa de mais conteúdo. Às vezes o problema é a estratégia por trás dele.",
    date: "2026-04-22",
    readingTime: "4 min",
    category: "Marca",
    content: [
      "É comum uma marca aumentar a frequência de postagens na esperança de reverter resultados fracos, e continuar sem crescer. Quando isso acontece, o problema raramente é volume: é posicionamento.",
      "Alguns sinais de que é hora de repensar o posicionamento: o público não entende o que a marca vende ao visitar o perfil, os concorrentes diretos comunicam de forma muito mais clara, ou a marca fala com todo mundo e não se conecta com ninguém em especial.",
      "Reposicionar não significa recomeçar do zero. Significa revisitar os 3Ds da persona (dor, desejo e dificuldade) e realinhar a comunicação a partir deles, com um diagnóstico honesto do que está funcionando e do que precisa mudar.",
    ],
  },
];

export function getPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
