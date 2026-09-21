// Conteúdo estendido das landing pages de serviço (/servicos/[slug]).
// Estrutura inspirada em páginas de serviço de agências de posicionamento:
// hero provocativo → entregáveis → manifesto → diferenciais → processo → resultados.

export type ServicePage = {
  slug: string;
  heroKicker: string;
  heroSubtitle: string;
  deliverables: string[];
  manifesto: {
    statement: string;
    body: string[];
  };
  features: { title: string; description: string }[];
  process: { title: string; description: string }[];
  results: string[];
  // Dúvidas específicas deste serviço. São as objeções que aparecem antes de
  // fechar, então respondem preço, prazo, escopo e limite — e nunca o passo a
  // passo interno do trabalho.
  faq: { question: string; answer: string }[];
  ctaLabel: string;
};

export const servicePages: Record<string, ServicePage> = {
  // Marketing Pessoal e Marketing Empresarial substituíram a Gestão de
  // Marketing em 18/09/2026. Textos escritos pela equipe do site a partir do
  // que a Gestão dizia, à espera da revisão da agência antes do lançamento.
  "marketing-pessoal": {
    slug: "marketing-pessoal",
    heroKicker: "Para quem é a própria marca",
    heroSubtitle:
      "Quando o profissional é a marca, o que as pessoas encontram de você no digital decide se elas marcam a consulta, fecham o contrato ou procuram outro.",
    deliverables: [
      "Posicionamento pessoal",
      "Linha editorial definida",
      "Calendário mensal",
      "Produção com você no centro",
      "Monitoramento de métricas",
      "Reajuste estratégico",
    ],
    manifesto: {
      statement: "Ninguém contrata um especialista que não conhece.",
      body: [
        "O seu trabalho pode ser excelente e ainda assim perder para quem aparece melhor. Antes de marcar, o paciente ou cliente pesquisa você, e decide pelo que encontra.",
        "O Marketing Pessoal da LANÇA+ existe para que o que aparece de você no digital esteja à altura do que você entrega: com estratégia, com constância e com a sua voz.",
      ],
    },
    features: [
      {
        title: "Você no centro, sem perder o dia",
        description:
          "Gravações e aprovações organizadas para caber na sua agenda. Você aparece, e o resto do trabalho é nosso.",
      },
      {
        title: "Autoridade, e não exposição",
        description:
          "O conteúdo mostra o que você sabe e como trabalha. A ideia é ser lembrado como referência, e não virar mais um perfil falando de tudo.",
      },
      {
        title: "Produção integrada",
        description:
          "Roteiro, gravação, edição, design e texto no mesmo time. A sua imagem fica coerente em todos os formatos.",
      },
      {
        title: "Dados, não achismo",
        description:
          "Relatórios com as métricas que importam para o seu objetivo, e reajuste mensal da estratégia com base neles.",
      },
    ],
    process: [
      {
        title: "Entrada e briefing",
        description:
          "Entendemos a sua trajetória, o seu público e como você quer ser visto.",
      },
      {
        title: "Estratégia",
        description:
          "Sua marca pessoal ganha uma direção definida e registrada, validada com você antes de qualquer publicação.",
      },
      {
        title: "Produção e publicação",
        description:
          "Gravamos, editamos e publicamos com constância, semana após semana.",
      },
      {
        title: "Leitura e ajuste",
        description:
          "Acompanhamos o desempenho e corrigimos a rota ciclo a ciclo: o que funciona ganha espaço.",
      },
    ],
    results: [
      "Ser reconhecido como referência na sua área",
      "Pacientes e clientes que chegam já confiando em você",
      "Um perfil que mostra o nível real do seu trabalho",
      "Presença constante sem tomar o seu dia",
      "Estratégia que evolui com dados, não com achismos",
      "Um time completo cuidando da sua imagem",
    ],
    faq: [
      {
        question:
          "Meu concorrente posta todo dia e eu não. É só isso que está faltando?",
        answer:
          "Frequência sem direção acelera o que já não estava funcionando. Antes do calendário vem decidir por qual assunto você quer ser lembrado e o que a sua marca defende. Com isso no lugar, a constância vira vantagem. Sem isso, vira volume.",
      },
      {
        question:
          "Como vocês constroem autoridade sem me transformar em influenciador?",
        answer:
          "Autoridade é ser lembrado como referência num assunto, e não ser conhecido por muita gente. O conteúdo parte do que você já faz e sabe, no seu vocabulário. Não entra trend, não entra dança e não entra opinião sobre assunto que não é seu.",
      },
      {
        question:
          "Minha profissão é regulada por conselho. Até onde dá para ir?",
        answer:
          "O conteúdo é planejado dentro das regras de publicidade do seu conselho, e o que a norma não permite não entra. Quando aparece um caso de dúvida, ele é levantado antes da produção e resolvido com você, e não depois de publicado.",
      },
      {
        question:
          "Em quanto tempo isso aparece na minha agenda?",
        answer:
          "Os primeiros sinais aparecem no alcance e nas conversas, e são medidos desde o primeiro mês. A agenda responde depois, porque depende de quanta gente já procurava o que você faz e de quanto a sua área demora entre descobrir e contratar. Quem promete data exata para isso está chutando.",
      },
      {
        question:
          "Se eu encerrar depois de alguns meses, o que fica comigo?",
        answer:
          "Fica o posicionamento documentado, a linha editorial, o calendário e o conteúdo já publicado, que continua trabalhando. A audiência e a reputação são suas, não da agência. A destinação dos arquivos brutos é definida em contrato.",
      },
    ],
    ctaLabel: "Quero ser referência na minha área",
  },

  "marketing-empresarial": {
    slug: "marketing-empresarial",
    heroKicker: "Para a sua empresa",
    heroSubtitle:
      "Onde a empresa deixa de postar por postar e passa a se posicionar. No digital, ninguém escolhe o mais barato, escolhe-se quem parece mais preparado.",
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
        "O maior risco para a sua empresa no digital não é a concorrência, é a indiferença. Empresas que comunicam bem o que fazem não competem por preço: elas são escolhidas antes mesmo do primeiro contato.",
        "O Marketing Empresarial da LANÇA+ existe para transformar a presença digital da sua empresa em um ativo de autoridade, consistente, estratégico e orientado a resultado.",
      ],
    },
    features: [
      {
        title: "Estratégia documentada",
        description:
          "Sua empresa passa a ter uma direção registrada, e não improvisada. É esse documento que guia cada decisão de conteúdo.",
      },
      {
        title: "Linha editorial definida",
        description:
          "Educar, construir autoridade e vender entram na proporção certa. Cada post tem um objetivo claro dentro do funil da marca.",
      },
      {
        title: "Produção integrada",
        description:
          "Design, audiovisual e copywriting no mesmo time: a marca fala com uma voz só em todos os formatos e canais.",
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
          "Sua empresa ganha uma direção definida e registrada, validada com você antes de qualquer publicação.",
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
      "Empresa reconhecida como referência no seu segmento",
      "Feed que constrói percepção de valor antes do primeiro contato",
      "Presença digital consistente que trabalha por você todos os dias",
      "Conteúdo que converte seguidores em oportunidades reais",
      "Estratégia que evolui com dados, não com achismos",
      "Um time completo cuidando da sua marca de ponta a ponta",
    ],
    faq: [
      {
        question:
          "Já tenho alguém cuidando das redes. Por que trocar por uma agência?",
        answer:
          "Muitas vezes não é trocar. Uma pessoa sozinha faz estratégia, roteiro, foto, vídeo, design, texto, publicação e relatório, e alguma dessas pontas sempre cede. A agência entra onde a conta não fecha, e quem já está continua no que faz melhor.",
      },
      {
        question:
          "Como vocês provam que o conteúdo trouxe cliente, e não foi coincidência?",
        answer:
          "Definindo antes o que conta como resultado para a sua empresa e acompanhando isso todo mês: de onde veio o contato, o que ele viu antes de chegar, o que mudou em relação ao mês anterior. Não é prova de laboratório, mas é o contrário de achismo.",
      },
      {
        question:
          "Quem responde pela minha empresa no dia a dia?",
        answer:
          "Uma equipe fixa, com um ponto de contato só para você. Estratégia, audiovisual e design são da casa, então quem pensa e quem executa sentam na mesma mesa e nada se perde na tradução entre uma etapa e outra.",
      },
      {
        question:
          "E se a minha empresa vende para outras empresas, e não para o consumidor final?",
        answer:
          "Muda o conteúdo, não o método. Quando quem compra é outra empresa, o ciclo é mais longo e mais de uma pessoa decide, então o conteúdo trabalha reputação e prova em vez de impulso. O plano nasce dessa diferença.",
      },
      {
        question:
          "O que acontece no primeiro mês, antes de qualquer publicação?",
        answer:
          "O primeiro mês é de estruturação: leitura do negócio e do mercado, posicionamento, linha editorial e calendário. Publicar antes disso é gastar alcance para descobrir no escuro o que deveria ter sido decidido antes.",
      },
    ],
    ctaLabel: "Quero minha empresa como referência",
  },

  consultoria: {
    slug: "consultoria",
    heroKicker: "Direção estratégica para o seu time",
    heroSubtitle:
      "Sua equipe executa, a LANÇA+ direciona. Diagnóstico honesto, estratégia clara e um olhar externo especializado para destravar o crescimento da marca.",
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
    faq: [
      {
        question: "Qual a diferença entre consultoria e gestão?",
        answer:
          "Na gestão, a execução é nossa. Na consultoria, ela continua com o seu time e nós entramos com o diagnóstico, a direção e o acompanhamento para que esse time execute melhor.",
      },
      {
        question: "Preciso ter uma equipe de marketing?",
        answer:
          "Ao menos alguém responsável por executar. Sem isso, a gestão costuma ser o caminho mais eficiente, e a gente diz isso na primeira conversa.",
      },
      {
        question: "Serve para quem já tem agência?",
        answer:
          "Serve. Nesses casos a consultoria funciona como leitura externa: o que está funcionando, o que não está e onde a estratégia precisa mudar.",
      },
      {
        question: "Quanto tempo dura o acompanhamento?",
        answer:
          "Depende do tamanho do desafio. A duração e a frequência dos encontros ficam definidas na proposta, antes de começar.",
      },
      {
        question: "Recebo alguma coisa por escrito?",
        answer:
          "Sim. O diagnóstico e o plano de ação são registrados, com as prioridades na ordem que faz diferença primeiro.",
      },
    ],
    ctaLabel: "Quero um diagnóstico da minha marca",
  },

  audiovisual: {
    slug: "audiovisual",
    heroKicker: "Produção que para o scroll",
    heroSubtitle:
      "Do roteiro à edição final. Vídeos pensados para reter atenção nos primeiros segundos e comunicar o valor da marca até o último.",
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
    faq: [
      {
        question:
          "Eu travo na frente da câmera. Isso inviabiliza?",
        answer:
          "Não, e é o caso mais comum. A gravação é conduzida, com roteiro pronto e teleprompter quando ajuda, e os tropeços ficam na edição. Quem nunca gravou costuma precisar de mais tempo na primeira diária e de bem menos na segunda.",
      },
      {
        question:
          "Quantas peças saem de uma diária, e de que tipo?",
        answer:
          "Depende do formato e de quanto o roteiro pede de troca de cenário e de figurino. O número é fechado na proposta, antes da diária, junto com o que cada peça vai ser: vertical curto, institucional, depoimento ou corte para anúncio.",
      },
      {
        question:
          "Quantas rodadas de alteração estão incluídas?",
        answer:
          "O número entra no contrato, combinado antes de começar. Mas o que de fato economiza rodada é aprovar o roteiro antes de gravar: alteração cara é a que exige regravação, e ela quase sempre nasce de roteiro aprovado às pressas.",
      },
      {
        question:
          "Vocês editam material que eu mesmo gravei?",
        answer:
          "Editamos, desde que a captação tenha qualidade para isso. A gente avalia o material antes e diz com franqueza o que dá para salvar na edição e o que só se resolve gravando de novo.",
      },
      {
        question:
          "Em que formatos as peças são entregues?",
        answer:
          "Nos formatos de cada plataforma onde a peça vai rodar, cortados para isso e não redimensionados na pressa. O que muda entre um vertical de feed e um corte para anúncio é enquadramento e ritmo, e isso é decidido no roteiro.",
      },
    ],
    ctaLabel: "Quero vídeos profissionais",
  },

  "trafego-pago": {
    slug: "trafego-pago",
    heroKicker: "Performance com método",
    heroSubtitle:
      "Anúncio não é sorte nem mágica: é público certo, criativo certo e otimização constante. Campanhas que trazem oportunidades reais, não só cliques.",
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
    faq: [
      {
        question: "Qual o investimento mínimo em anúncios?",
        answer:
          "Depende do objetivo e da disputa no seu mercado. Na primeira conversa dizemos qual verba faz sentido para a meta que você tem, sem inflar expectativa.",
      },
      {
        question: "A verba de anúncio está incluída no valor?",
        answer:
          "Não. O investimento é pago por você diretamente às plataformas, e o nosso valor é o da gestão. Assim você enxerga exatamente para onde vai cada real.",
      },
      {
        question: "A partir de quando dá para saber se está funcionando?",
        answer:
          "As primeiras leituras aparecem nos primeiros dias. O ajuste fino leva algumas semanas, porque campanha boa se constrói com dado, e não com palpite.",
      },
      {
        question: "Vocês criam os anúncios ou eu envio?",
        answer:
          "Criamos. Se você já tiver material produzido, avaliamos junto o que vale aproveitar.",
      },
      {
        question: "Meu segmento pode anunciar?",
        answer:
          "Para a maioria, sim. Alguns segmentos têm restrição de anúncio nas plataformas, e nesses casos avisamos antes de você investir.",
      },
    ],
    ctaLabel: "Quero anunciar com estratégia",
  },

  "identidade-visual": {
    slug: "identidade-visual",
    heroKicker: "Marca que se reconhece de longe",
    heroSubtitle:
      "Logotipo, paleta, tipografia e aplicações que traduzem a essência do negócio, para a marca ser lembrada, não confundida.",
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
    faq: [
      {
        question: "Já tenho logo. Preciso refazer tudo?",
        answer:
          "Nem sempre. Avaliamos se o caso pede um redesenho completo ou apenas a construção do sistema visual em volta do que já existe.",
      },
      {
        question: "Quantas propostas de logo eu recebo?",
        answer:
          "Apresentamos um caminho, com a fundamentação da escolha. Marca não é gosto escolhido entre opções, é decisão de posicionamento.",
      },
      {
        question: "Posso pedir ajustes?",
        answer:
          "Pode, com rodadas de refinamento até a aprovação. O número delas fica combinado na proposta.",
      },
      {
        question: "O que recebo no fim?",
        answer:
          "Os arquivos em todos os formatos de uso e o manual com as regras de aplicação da marca.",
      },
      {
        question: "Vocês registram a marca no INPI?",
        answer:
          "O registro é feito por um profissional de propriedade industrial. Entregamos o material pronto para esse processo e indicamos parceiros de confiança.",
      },
    ],
    ctaLabel: "Quero construir minha marca",
  },

  "desenvolvimento-web": {
    slug: "desenvolvimento-web",
    heroKicker: "Seu melhor vendedor, 24 horas no ar",
    heroSubtitle:
      "Sites e landing pages rápidos, bonitos e feitos para converter, a experiência digital no mesmo nível da marca.",
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
    faq: [
      {
        question: "Quanto tempo leva para o site ficar pronto?",
        answer:
          "Depende do tamanho. Uma landing page sai em poucas semanas; um site institucional completo leva mais. O prazo fica definido na proposta, antes de começar.",
      },
      {
        question: "O site vai aparecer no Google?",
        answer:
          "Ele nasce com a estrutura técnica correta para isso. Chegar às primeiras posições, porém, também depende de conteúdo e de tempo, e esse trabalho a gente faz junto.",
      },
      {
        question: "Consigo editar o site depois?",
        answer:
          "Sim, quando o projeto prevê isso. Combinamos na proposta o que fica editável por você e o que segue sob nossa manutenção.",
      },
      {
        question: "Vocês cuidam do domínio e da hospedagem?",
        answer:
          "Cuidamos da configuração. O domínio e a hospedagem ficam em nome da sua empresa, então o site é seu de verdade.",
      },
      {
        question: "E depois que o site entra no ar?",
        answer:
          "Continuamos disponíveis para manutenção e evolução. Site parado envelhece rápido, e isso aparece para quem visita.",
      },
    ],
    ctaLabel: "Quero um site que converte",
  },

  arquitetura: {
    slug: "arquitetura",
    heroKicker: "A marca também se constrói no espaço",
    heroSubtitle:
      "Projetos arquitetônicos e de interiores que fazem o cliente sentir, ao entrar, a mesma marca que ele viu nas redes.",
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
    faq: [
      {
        question: "Vocês atendem obra nova e reforma?",
        answer:
          "Os dois. O que muda é o ponto de partida e o nível de intervenção que o espaço comporta.",
      },
      {
        question: "O projeto inclui acompanhamento da obra?",
        answer:
          "Inclui, com visitas técnicas para garantir que a execução siga o projeto. A frequência fica combinada na proposta.",
      },
      {
        question: "Vocês indicam fornecedores?",
        answer:
          "Indicamos e ajudamos na especificação. A contratação é sua, com liberdade total para comparar.",
      },
      {
        question: "Consigo ver como vai ficar antes?",
        answer:
          "Sim. O estudo preliminar existe justamente para você validar a direção antes do detalhamento técnico.",
      },
      {
        question: "Por que uma agência de marketing faz arquitetura?",
        answer:
          "Porque o ponto de venda é um canal da marca como qualquer outro. Quando o espaço fala a mesma língua do digital, a experiência do cliente não se quebra na porta.",
      },
    ],
    ctaLabel: "Quero projetar meu espaço",
  },
};
