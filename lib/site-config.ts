// Domínio de produção. Sobrescreva com NEXT_PUBLIC_SITE_URL no ambiente de deploy.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lancamais.com" // [CONFIRMAR] deduzido do e-mail contato@lancamais.com
).replace(/[/]+$/, "");

export const siteConfig = {
  name: "LANÇA+",
  url: siteUrl,
  // Slogan oficial da marca — assinatura, usada no rodapé e na faixa da home.
  slogan: ["Somos movimento.", "Somos ideia em ação.", "Somos LANÇA+"],
  tagline: "Marketing que lança marcas para o próximo nível.",
  description:
    "Agência completa de marketing: gestão de marketing, consultoria, audiovisual, tráfego pago, identidade visual, desenvolvimento web e arquitetura.",
  whatsappNumber: "5583991060691", // (83) 99106-0691
  email: "contato@lancamais.com",
  instagram: "@lanca.mais",
  address: "Rua Epifânio Sobreira, 74, 2º andar, Centro",
  city: "Cajazeiras, PB",
  cnpj: "65.709.672/0001-16",
  tiktok: "@lancamais", // [TIKTOK], substitua pelo @ real
};

export const navLinks = [
  { href: "/", label: "Início" },
  { href: "/servicos", label: "Serviços" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/sobre", label: "Sobre" },
  { href: "/blog", label: "Blog" },
  { href: "/contato", label: "Contato" },
];

// Números de prova social — substitua pelos dados reais da agência antes de publicar.
// O campo valor é contado de 0 até o número quando a seção entra em cena.
export const stats = [
  { prefixo: "+", valor: 40, sufixo: "", label: "marcas atendidas" }, // [AJUSTAR]
  { prefixo: "+", valor: 10, sufixo: "", label: "nichos diferentes" }, // [AJUSTAR]
  { prefixo: "+", valor: 300, sufixo: "", label: "conteúdos por mês" }, // [AJUSTAR]
  { prefixo: "", valor: 7, sufixo: "", label: "frentes integradas" },
];

// Depoimentos — substitua por depoimentos reais de clientes (com autorização).
export const testimonials = [
  {
    quote:
      "[Depoimento real do cliente sobre o resultado alcançado com a LANÇA+, ex: crescimento de seguidores, agenda cheia, reposicionamento da marca.]",
    name: "[Nome do cliente]",
    role: "[Nicho, ex: Clínica de estética]",
  },
  {
    quote:
      "[Depoimento real do cliente sobre o processo de trabalho, ex: organização, consistência do conteúdo, acompanhamento próximo.]",
    name: "[Nome do cliente]",
    role: "[Nicho, ex: Advocacia]",
  },
  {
    quote:
      "[Depoimento real do cliente sobre a diferença antes/depois de contratar a agência.]",
    name: "[Nome do cliente]",
    role: "[Nicho, ex: Imobiliária]",
  },
];

export const faq = [
  {
    question: "Em quanto tempo minha marca começa a publicar?",
    answer:
      "Cerca de 30 dias da assinatura à primeira publicação. Esse tempo é o que garante que a marca comece com direção definida e validada com você, em vez de sair no improviso. Presença digital sólida não nasce da pressa.",
  },
  {
    question: "Preciso contratar todos os serviços juntos?",
    answer:
      "Não. Cada frente pode ser contratada isoladamente, mas quando combinadas, garantimos que estratégia, conteúdo, tráfego e identidade andem alinhados, o que acelera o resultado.",
  },
  {
    question: "Como acompanho os resultados?",
    answer:
      "Você recebe relatórios periódicos de performance com as métricas que importam para o seu objetivo, e a estratégia é reajustada com base nesses dados, não em achismo.",
  },
  {
    question: "Vocês atendem meu nicho?",
    answer:
      "Atendemos negócios de todos os nichos: saúde, estética, direito, imóveis, gastronomia, moda, educação, fitness, varejo e mais. Cada segmento exige leitura própria de mercado, inclusive restrições regulatórias, e isso faz parte do nosso processo.",
  },
  {
    question: "O que acontece na primeira conversa?",
    answer:
      "Você conta o momento atual da sua marca e nós fazemos um diagnóstico inicial da sua presença digital, sem compromisso. A partir daí, recomendamos o melhor ponto de partida.",
  },
];

export type Service = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  bullets: string[];
};

export const services: Service[] = [
  {
    slug: "gestao-de-marketing",
    name: "Gestão de Marketing",
    shortDescription:
      "Estratégia e execução contínua da presença digital da sua marca.",
    description:
      "Cuidamos do planejamento, produção e publicação do conteúdo da sua marca de ponta a ponta, com linha editorial definida, calendário mensal e acompanhamento constante de resultados. Sua marca não posta por postar: cada conteúdo tem um objetivo dentro de uma estratégia maior.",
    bullets: [
      "Perfil estratégico completo da marca",
      "Calendário editorial mensal",
      "Produção de conteúdo para Instagram, TikTok e demais canais",
      "Monitoramento de métricas e reajuste contínuo de estratégia",
    ],
  },
  {
    slug: "consultoria",
    name: "Assessoria e Consultoria em Marketing",
    shortDescription:
      "Diagnóstico e direcionamento estratégico para times internos.",
    description:
      "Para marcas que já têm equipe própria mas precisam de direção estratégica, auditoria de presença digital e um olhar externo especializado para destravar resultados.",
    bullets: [
      "Auditoria completa de perfil e concorrência",
      "Diagnóstico de posicionamento e oportunidades",
      "Mentoria e direcionamento para equipes internas",
      "Planos de ação priorizados por impacto",
    ],
  },
  {
    slug: "audiovisual",
    name: "Audiovisual",
    shortDescription:
      "Produção de vídeo de ponta a ponta, do roteiro à edição final.",
    description:
      "Roteiro, captação e edição para Reels, vídeos institucionais, depoimentos e campanhas, sempre alinhados à linha editorial da marca.",
    bullets: [
      "Roteirização com e sem teleprompter",
      "Captação em estúdio ou externa",
      "Edição, motion graphics e trilha sonora",
      "Formatos otimizados para cada plataforma",
    ],
  },
  {
    slug: "trafego-pago",
    name: "Tráfego Pago",
    shortDescription:
      "Campanhas de performance com metas claras e otimização constante.",
    description:
      "Gestão de campanhas em Meta Ads, Google Ads e demais plataformas, com foco em geração de leads qualificados e retorno mensurável sobre o investimento.",
    bullets: [
      "Estruturação de campanhas e públicos",
      "Criativos pensados para conversão",
      "Otimização contínua com base em dados",
      "Relatórios de performance com recomendações",
    ],
  },
  {
    slug: "identidade-visual",
    name: "Identidade Visual",
    shortDescription: "Construção de marca sólida, do logotipo ao manual completo.",
    description:
      "Desenvolvimento de identidade visual completa, logotipo, paleta, tipografia e aplicações, para marcas que estão nascendo ou que precisam de reposicionamento.",
    bullets: [
      "Naming e conceito de marca",
      "Logotipo e sistema visual",
      "Manual de marca completo",
      "Aplicações para redes sociais, impresso e ambientes",
    ],
  },
  {
    slug: "desenvolvimento-web",
    name: "Desenvolvimento Web",
    shortDescription: "Sites e sistemas que traduzem a marca em experiência digital.",
    description:
      "Criação de sites institucionais, landing pages e sistemas sob medida, com foco em performance, conversão e consistência com a identidade da marca.",
    bullets: [
      "Sites institucionais e landing pages",
      "Landing pages de campanha e captação de leads",
      "Otimização de performance e SEO técnico",
      "Manutenção e evolução contínua",
    ],
  },
  {
    slug: "arquitetura",
    name: "Arquitetura",
    shortDescription: "Projetos que unem identidade de marca e espaço físico.",
    description:
      "Projetos arquitetônicos e de interiores para negócios que querem que o espaço físico comunique a mesma identidade construída nas redes, de consultórios a lojas e escritórios.",
    bullets: [
      "Projeto arquitetônico e de interiores",
      "Consultoria de identidade aplicada ao espaço físico",
      "Acompanhamento de obra e execução",
      "Projetos comerciais e corporativos",
    ],
  },
];
