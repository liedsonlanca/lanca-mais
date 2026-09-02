// Conteúdo estendido das landing pages de serviço (/servicos/[slug]).
// Estrutura inspirada em páginas de serviço de agências de posicionamento:
// hero provocativo → entregáveis → manifesto → diferenciais → processo → resultados.

export type ServicePage = {
  slug: string;
  heroKicker: string;
  heroSubtitle: string;
  heroImage: string;
  deliverables: string[];
  manifesto: {
    statement: string;
    body: string[];
  };
  features: { title: string; description: string }[];
  process: { title: string; description: string }[];
  results: string[];
  ctaLabel: string;
};

export const servicePages: Record<string, ServicePage> = {
  "gestao-de-marketing": {
    slug: "gestao-de-marketing",
    heroKicker: "O carro-chefe da agência",
    heroSubtitle:
      "Onde a marca deixa de postar por postar e passa a se posicionar. No digital, ninguém escolhe o mais barato, escolhe-se quem parece mais preparado.",
    heroImage: "/images/team/LFF_0473_resized.jpg",
    deliverables: [
      "Posicionamento de marca",
      "Linha editorial definida",
      "Calendário mensal",
      "Produção de conteúdo",
      "Monitoramento de métricas",
      "Reajuste estratégico",
    ],
    manifesto: {
      statement:
        "Ser 'só mais um' no feed é o caminho mais rápido para ficar invisível.",
      body: [
        "O maior risco para o seu negócio no digital não é a concorrência, é a indiferença. Marcas que comunicam bem o que fazem não competem por preço: elas são escolhidas antes mesmo do primeiro contato.",
        "A Gestão de Marketing da LANÇA+ existe para transformar a presença digital da sua marca em um ativo de autoridade, consistente, estratégico e orientado a resultado.",
      ],
    },
    features: [
      {
        title: "Estratégia documentada",
        description:
          "Sua marca passa a ter uma direção registrada, e não improvisada. É esse documento que guia cada decisão de conteúdo.",
      },
      {
        title: "Linha editorial definida",
        description:
          "Educar, construir autoridade e vender entram na proporção certa. Cada post tem um objetivo claro dentro do funil da marca.",
      },
      {
        title: "Produção integrada",
        description:
          "Design, audiovisual e copywriting no mesmo time, a marca fala com uma voz só em todos os formatos e canais.",
      },
      {
        title: "Dados, não achismo",
        description:
          "Relatórios periódicos com as métricas que importam para o seu objetivo, e reajuste mensal da estratégia com base neles.",
      },
    ],
    process: [
      {
        title: "Entrada e briefing",
        description:
          "Entendemos o seu negócio, seus objetivos e onde a marca está hoje.",
      },
      {
        title: "Estratégia",
        description:
          "Sua marca ganha uma direção definida e registrada, validada com você antes de qualquer publicação.",
      },
      {
        title: "Produção e publicação",
        description:
          "O conteúdo entra no ar com consistência, semana após semana.",
      },
      {
        title: "Leitura e ajuste",
        description:
          "Acompanhamos o desempenho e corrigimos a rota ciclo a ciclo: o que funciona ganha espaço.",
      },
    ],
    results: [
      "Marca reconhecida como referência no seu segmento",
      "Feed que constrói percepção de valor antes do primeiro contato",
      "Presença digital consistente que trabalha por você todos os dias",
      "Conteúdo que converte seguidores em oportunidades reais",
      "Estratégia que evolui com dados, não com achismos",
      "Um time completo cuidando da sua marca de ponta a ponta",
    ],
    ctaLabel: "Quero minha marca como referência",
  },

  consultoria: {
    slug: "consultoria",
    heroKicker: "Direção estratégica para o seu time",
    heroSubtitle:
      "Sua equipe executa, a LANÇA+ direciona. Diagnóstico honesto, estratégia clara e um olhar externo especializado para destravar o crescimento da marca.",
    heroImage: "/images/team/LFF_0519_resized.jpg",
    deliverables: [
      "Auditoria de perfil",
      "Análise de concorrência",
      "Diagnóstico de posicionamento",
      "Plano de ação priorizado",
      "Mentoria da equipe",
    ],
    manifesto: {
      statement:
        "Equipe interna sem direção estratégica produz muito e cresce pouco.",
      body: [
        "O problema raramente é esforço: é produzir conteúdo sem saber o que cada peça deveria vender, para quem e por quê. É retrabalho disfarçado de rotina.",
        "A consultoria da LANÇA+ entrega o diagnóstico e a direção, e capacita o seu time para executar com autonomia e consistência.",
      ],
    },
    features: [
      {
        title: "Diagnóstico honesto",
        description:
          "Auditoria completa do perfil e da concorrência. Se algo está ruim, dizemos que está ruim, e explicamos o porquê e como corrigir.",
      },
      {
        title: "Plano priorizado por impacto",
        description:
          "Nada de lista genérica de boas práticas: um plano de ação ordenado pelo que move o ponteiro primeiro.",
      },
      {
        title: "Mentoria prática",
        description:
          "Acompanhamento do seu time na aplicação da estratégia, com revisões periódicas e correção de rota.",
      },
      {
        title: "Metodologia própria",
        description:
          "A mesma metodologia que aplicamos na gestão dos nossos clientes, adaptada para o seu time executar.",
      },
    ],
    process: [
      {
        title: "Imersão no negócio",
        description:
          "Entendemos o momento da empresa, os objetivos e como o time executa hoje.",
      },
      {
        title: "Diagnóstico",
        description:
          "Uma leitura técnica de onde a marca está e do que está travando o resultado.",
      },
      {
        title: "Plano de ação",
        description:
          "Você recebe as ações priorizadas, na ordem que faz diferença primeiro.",
      },
      {
        title: "Acompanhamento",
        description:
          "Encontros periódicos para revisar a execução e ajustar a rota.",
      },
    ],
    results: [
      "Time interno com direção clara e autonomia para executar",
      "Fim do conteúdo aleatório: cada post com objetivo definido",
      "Leitura precisa de onde a marca está e para onde vai",
      "Decisões de marketing baseadas em dados e método",
      "Retrabalho e desperdício de verba reduzidos",
    ],
    ctaLabel: "Quero um diagnóstico da minha marca",
  },

  audiovisual: {
    slug: "audiovisual",
    heroKicker: "Produção que para o scroll",
    heroSubtitle:
      "Do roteiro à edição final. Vídeos pensados para reter atenção nos primeiros segundos e comunicar o valor da marca até o último.",
    heroImage: "/images/team/LFF_0602_resized.jpg",
    deliverables: [
      "Roteirização",
      "Captação em estúdio e externa",
      "Reels e TikTok",
      "Vídeos institucionais",
      "Depoimentos",
      "Edição e motion",
    ],
    manifesto: {
      statement:
        "Vídeo sem roteiro é sorte. E sorte não é estratégia de conteúdo.",
      body: [
        "O algoritmo entrega o vídeo; o roteiro é o que faz o público assistir até o fim. Gancho, desenvolvimento, virada e chamada, cada segundo tem função.",
        "O audiovisual da LANÇA+ integra roteiro, captação e edição ao posicionamento da marca, para que cada vídeo construa autoridade além de visualizações.",
      ],
    },
    features: [
      {
        title: "Roteiro estruturado",
        description:
          "Gancho nos primeiros segundos, desenvolvimento direto e CTA claro, com versão para teleprompter ou roteiro cênico para quem improvisa.",
      },
      {
        title: "Captação profissional",
        description:
          "Gravação em estúdio ou no seu espaço, com direção de cena para quem não tem costume com câmera.",
      },
      {
        title: "Edição que segura atenção",
        description:
          "Cortes dinâmicos, legendas animadas, trilha e identidade visual, no padrão que cada plataforma pede.",
      },
      {
        title: "Alinhado à estratégia",
        description:
          "Cada vídeo nasce da linha editorial da marca, não é conteúdo solto, é posicionamento em movimento.",
      },
    ],
    process: [
      {
        title: "Pauta e roteiro",
        description:
          "Definimos o que o vídeo precisa comunicar antes de ligar a câmera.",
      },
      {
        title: "Pré-produção",
        description:
          "Agenda, locação e preparação de quem grava. Nada improvisado no dia.",
      },
      {
        title: "Captação",
        description:
          "Gravação com direção de cena, em estúdio ou externa, respeitando o seu tempo.",
      },
      {
        title: "Edição e entrega",
        description:
          "Finalização com uma rodada de revisão sua antes de publicar.",
      },
    ],
    results: [
      "Vídeos com cara profissional, sem parecer propaganda engessada",
      "Mais retenção: público que assiste até o final",
      "Banco de conteúdo audiovisual alinhado à marca",
      "Segurança na frente da câmera, mesmo para iniciantes",
      "Formatos otimizados para Instagram, TikTok e YouTube",
    ],
    ctaLabel: "Quero vídeos profissionais",
  },

  "trafego-pago": {
    slug: "trafego-pago",
    heroKicker: "Performance com método",
    heroSubtitle:
      "Anúncio não é sorte nem mágica: é público certo, criativo certo e otimização constante. Campanhas que trazem oportunidades reais, não só cliques.",
    heroImage: "/images/team/LFF_0551_resized.jpg",
    deliverables: [
      "Meta Ads",
      "Google Ads",
      "Públicos e segmentação",
      "Criativos de conversão",
      "Otimização contínua",
      "Relatórios de performance",
    ],
    manifesto: {
      statement:
        "Impulsionar post não é tráfego pago. É queimar verba com pressa.",
      body: [
        "Tráfego pago de verdade começa antes do anúncio: público mapeado, oferta clara, criativo pensado para conversão e uma página pronta para receber quem clica.",
        "Na LANÇA+, cada campanha tem meta definida, acompanhamento diário e otimização baseada em dados, o investimento vira aprendizado composto, não aposta.",
      ],
    },
    features: [
      {
        title: "Estrutura de campanha",
        description:
          "Funil completo: campanhas de reconhecimento, consideração e conversão trabalhando juntas, não anúncios soltos.",
      },
      {
        title: "Criativos que convertem",
        description:
          "Imagens, vídeos e copies produzidos pelo nosso time criativo, testados e substituídos quando saturam.",
      },
      {
        title: "Otimização diária",
        description:
          "Acompanhamento constante de CPL, CTR e ROAS, com realocação de verba para o que performa melhor.",
      },
      {
        title: "Relatório sem caixa-preta",
        description:
          "Você sabe exatamente quanto investiu, quanto voltou e o que vamos fazer diferente no próximo ciclo.",
      },
    ],
    process: [
      {
        title: "Diagnóstico e metas",
        description:
          "Definimos o objetivo, a verba e a métrica que decide se deu certo.",
      },
      {
        title: "Estruturação",
        description:
          "As campanhas são montadas nas plataformas certas para esse objetivo.",
      },
      {
        title: "Veiculação",
        description:
          "Os anúncios entram no ar e são testados até encontrarem o que responde melhor.",
      },
      {
        title: "Otimização e escala",
        description:
          "O que não performa sai, o que funciona ganha verba, com relatório claro a cada ciclo.",
      },
    ],
    results: [
      "Leads qualificados chegando com previsibilidade",
      "Custo por lead controlado e otimizado ciclo a ciclo",
      "Verba investida onde os dados mostram retorno",
      "Criativos renovados antes de saturar",
      "Clareza total sobre o retorno de cada real investido",
    ],
    ctaLabel: "Quero anunciar com estratégia",
  },

  "identidade-visual": {
    slug: "identidade-visual",
    heroKicker: "Marca que se reconhece de longe",
    heroSubtitle:
      "Logotipo, paleta, tipografia e aplicações que traduzem a essência do negócio, para a marca ser lembrada, não confundida.",
    heroImage: "/images/team/LFF_0691_resized.jpg",
    deliverables: [
      "Naming e conceito",
      "Logotipo",
      "Paleta e tipografia",
      "Manual de marca",
      "Aplicações digitais",
      "Materiais impressos",
    ],
    manifesto: {
      statement:
        "Identidade visual não é logotipo bonito. É decisão estratégica repetida em cada ponto de contato.",
      body: [
        "Uma marca sem sistema visual definido recomeça do zero a cada post, cartão ou fachada, e o público sente a inconsistência, mesmo sem saber nomear.",
        "A LANÇA+ constrói identidades com conceito, critério e manual de uso: a marca fica pronta para crescer sem se descaracterizar.",
      ],
    },
    features: [
      {
        title: "Conceito antes da forma",
        description:
          "O visual nasce do posicionamento: quem é a marca, para quem fala e como quer ser percebida.",
      },
      {
        title: "Sistema completo",
        description:
          "Logotipo, variações, paleta, tipografia, grafismos e regras de uso: tudo documentado em manual.",
      },
      {
        title: "Aplicações reais",
        description:
          "Templates para redes sociais, papelaria, uniforme, fachada, a identidade aplicada onde a marca vive.",
      },
      {
        title: "Feito para durar",
        description:
          "Identidade pensada para os próximos anos, não para a tendência do mês.",
      },
    ],
    process: [
      {
        title: "Imersão e briefing",
        description:
          "Entendemos o negócio, o público e o posicionamento que a marca quer ocupar.",
      },
      {
        title: "Conceito",
        description:
          "Definimos o território visual da marca, com fundamentação, antes de desenhar.",
      },
      {
        title: "Criação",
        description:
          "O sistema visual completo é desenvolvido e apresentado para você.",
      },
      {
        title: "Refinamento e entrega",
        description:
          "Ajustes até a aprovação, e a entrega com as regras de aplicação da marca.",
      },
    ],
    results: [
      "Marca com cara profissional em todos os pontos de contato",
      "Consistência visual que gera reconhecimento e confiança",
      "Manual que garante o uso certo por qualquer fornecedor",
      "Diferenciação clara em relação à concorrência",
      "Base visual pronta para redes, impressos e ambientes",
    ],
    ctaLabel: "Quero construir minha marca",
  },

  "desenvolvimento-web": {
    slug: "desenvolvimento-web",
    heroKicker: "Seu melhor vendedor, 24 horas no ar",
    heroSubtitle:
      "Sites e landing pages rápidos, bonitos e feitos para converter, a experiência digital no mesmo nível da marca.",
    heroImage: "/images/team/LFF_0655_resized.jpg",
    deliverables: [
      "Sites institucionais",
      "Landing pages",
      "E-commerce",
      "SEO técnico",
      "Performance",
      "Manutenção",
    ],
    manifesto: {
      statement:
        "Um site lento e confuso desfaz em segundos a confiança que a marca levou meses para construir.",
      body: [
        "O site é onde o interesse vira ação: é ali que o visitante decide se agenda, compra ou fecha a aba. Design, velocidade e clareza não são detalhes, são conversão.",
        "A LANÇA+ desenvolve sites integrados à identidade e à estratégia da marca, com foco em performance e em transformar visita em contato.",
      ],
    },
    features: [
      {
        title: "Design com identidade",
        description:
          "Nada de template genérico: o site traduz a identidade visual da marca em experiência digital.",
      },
      {
        title: "Feito para converter",
        description:
          "Arquitetura de página, CTAs e formulários pensados para guiar o visitante até a ação.",
      },
      {
        title: "Rápido e responsivo",
        description:
          "Performance otimizada e experiência impecável em qualquer tela, celular em primeiro lugar.",
      },
      {
        title: "Pronto para crescer",
        description:
          "SEO técnico, integração com WhatsApp e ferramentas de análise desde o primeiro dia.",
      },
    ],
    process: [
      {
        title: "Briefing e arquitetura",
        description:
          "Definimos objetivos, páginas e o caminho que o visitante deve percorrer.",
      },
      {
        title: "Design",
        description:
          "O layout de cada página é aprovado por você antes de virar código.",
      },
      {
        title: "Desenvolvimento",
        description:
          "Construção com foco em velocidade e em ser encontrado nas buscas.",
      },
      {
        title: "Lançamento e suporte",
        description:
          "Publicação, acompanhamento e evolução contínua do site no ar.",
      },
    ],
    results: [
      "Site profissional no nível da qualidade do seu negócio",
      "Mais contatos chegando pelo site e pelo WhatsApp",
      "Velocidade e experiência que seguram o visitante",
      "Encontrado no Google pelas buscas certas",
      "Autonomia para crescer sem refazer tudo do zero",
    ],
    ctaLabel: "Quero um site que converte",
  },

  arquitetura: {
    slug: "arquitetura",
    heroKicker: "A marca também se constrói no espaço",
    heroSubtitle:
      "Projetos arquitetônicos e de interiores que fazem o cliente sentir, ao entrar, a mesma marca que ele viu nas redes.",
    heroImage: "/images/team/LFF_0726_resized.jpg",
    deliverables: [
      "Projeto arquitetônico",
      "Design de interiores",
      "Identidade aplicada ao espaço",
      "Projetos comerciais",
      "Acompanhamento de obra",
    ],
    manifesto: {
      statement:
        "O cliente que chega pelo Instagram percebe na hora quando o espaço físico não conversa com a marca.",
      body: [
        "Consultório, loja ou escritório: o ambiente é um ponto de contato da marca tão importante quanto o feed, e é nele que a experiência acontece de verdade.",
        "A arquitetura da LANÇA+ projeta espaços que materializam o posicionamento da marca: estética, funcionalidade e identidade no mesmo projeto.",
      ],
    },
    features: [
      {
        title: "Marca aplicada ao espaço",
        description:
          "Cores, materiais e atmosfera derivados da identidade da marca, o espaço como extensão do posicionamento.",
      },
      {
        title: "Projetado para o uso real",
        description:
          "Fluxo de atendimento, conforto e funcionalidade pensados para o dia a dia do negócio.",
      },
      {
        title: "Instagramável por projeto",
        description:
          "Ambientes que rendem conteúdo: cenários pensados para foto e vídeo da própria marca.",
      },
      {
        title: "Do papel à entrega",
        description:
          "Acompanhamento de obra e especificação de fornecedores para o projeto sair como foi desenhado.",
      },
    ],
    process: [
      {
        title: "Briefing e medição",
        description:
          "Levantamento do espaço, das necessidades do negócio e da identidade da marca.",
      },
      {
        title: "Estudo preliminar",
        description:
          "Primeiras propostas de conceito para validar a direção com você.",
      },
      {
        title: "Projeto executivo",
        description:
          "O detalhamento técnico que permite executar a obra sem improviso.",
      },
      {
        title: "Acompanhamento de obra",
        description:
          "Visitas técnicas para garantir que a execução siga o projeto.",
      },
    ],
    results: [
      "Espaço físico alinhado à identidade da marca",
      "Experiência que impressiona o cliente já na chegada",
      "Ambiente funcional para a operação do dia a dia",
      "Cenários prontos para produção de conteúdo",
      "Projeto executado sem surpresas de obra",
    ],
    ctaLabel: "Quero projetar meu espaço",
  },
};
