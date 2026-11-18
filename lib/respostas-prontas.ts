// As respostas prontas da tela de conversas.
//
// ---------- Para que servem ----------
//
// Atendimento de chat é repetitivo: as mesmas seis perguntas chegam todo
// dia, e quem responde escreve a mesma coisa de novo — pior a cada vez, mais
// curta e mais seca, porque já cansou de escrever aquilo.
//
// Aqui o texto já está escrito, com calma, uma vez. Clicar cola no campo, e
// quem atende ajusta antes de enviar.
//
// ---------- Por que colam em vez de enviar ----------
//
// Porque resposta que sai sem ninguém reler é o que faz o cliente perceber
// que falou com um botão. O texto é um ponto de partida: trocar uma palavra
// para o caso daquela pessoa é o que separa isto de um robô — e é por isso
// que nenhum botão aqui envia nada sozinho.
//
// ---------- A relação com o assistente ----------
//
// Vêm da mesma verdade de lib/conhecimento.ts, dita como a equipe diria.
// Mudou o serviço? Mude os dois, senão o assistente diz uma coisa no chat e
// a equipe diz outra na mensagem seguinte.

export type RespostaPronta = { rotulo: string; texto: string };

export type GrupoDeRespostas = { grupo: string; itens: RespostaPronta[] };

export const RESPOSTAS_PRONTAS: GrupoDeRespostas[] = [
  {
    grupo: "Abertura",
    itens: [
      {
        rotulo: "Oi, cheguei",
        texto:
          "Oi! Aqui é da equipe da LANÇA+. Vi sua mensagem — me conta um " +
          "pouco do seu negócio e do momento da marca que eu já te ajudo.",
      },
      {
        rotulo: "Desculpa a demora",
        texto:
          "Oi! Desculpa a demora para responder. Já estou com sua mensagem " +
          "aqui — me conta o que você precisa que a gente resolve.",
      },
      {
        rotulo: "Fora do horário",
        texto:
          "Oi! Você escreveu fora do nosso horário de atendimento, por isso " +
          "a demora. Estou aqui agora — me conta o que você precisa.",
      },
    ],
  },

  {
    // O grupo mais usado, e o que mais muda a conversa.
    //
    // Antes de falar de serviço, de preço ou de qualquer coisa, a equipe
    // precisa saber quem é a pessoa e o que ela faz. Sem isso, toda resposta
    // vira folheto — e folheto não fecha negócio.
    grupo: "Descobrir",
    itens: [
      {
        rotulo: "Qual o nicho",
        texto:
          "Me conta: o que você faz, e há quanto tempo? Saber o segmento " +
          "muda bastante o caminho que a gente vai propor.",
      },
      {
        rotulo: "Como te chamo",
        texto: "Antes de continuar, como você se chama?",
      },
      {
        rotulo: "Isso é para mim?",
        texto:
          "Essa resposta depende do seu caso, e é exatamente por isso que a " +
          "gente começa pelo diagnóstico em vez de empurrar um pacote. Me " +
          "conta o que você faz e qual o seu objetivo agora — se não for " +
          "para você, eu te digo com a mesma sinceridade.",
      },
      {
        rotulo: "Qual o objetivo",
        texto:
          "O que você quer que mude nos próximos meses? Mais gente " +
          "conhecendo a marca, mais pedido chegando, ou passar a ser visto " +
          "de outro jeito? Cada um desses puxa uma estratégia diferente.",
      },
      {
        rotulo: "Quem cuida hoje",
        texto:
          "Hoje quem cuida da comunicação de vocês? Alguém de dentro, " +
          "agência, ou está parado? Pergunto porque isso define se o caminho " +
          "é consultoria ou gestão.",
      },
      {
        rotulo: "O que já tentaram",
        texto:
          "O que vocês já tentaram até aqui, e o que não funcionou? Saber o " +
          "que já foi feito evita eu te propor justamente aquilo.",
      },
      {
        rotulo: "Qual o Instagram",
        texto:
          "Me manda o @ do Instagram? Quero dar uma olhada antes de te " +
          "responder, para falar do seu caso e não no genérico.",
      },
    ],
  },

  {
    grupo: "O que fazemos",
    itens: [
      {
        rotulo: "As frentes",
        texto:
          "A LANÇA+ trabalha em oito frentes: Marketing Pessoal, Marketing " +
          "Empresarial, Consultoria, Audiovisual, Tráfego Pago, Identidade " +
          "Visual, Desenvolvimento Web e Arquitetura. O ponto é que elas " +
          "conversam entre si, em vez de cada uma vir de um fornecedor " +
          "diferente.",
      },
      {
        rotulo: "Marketing Pessoal",
        texto:
          "O Marketing Pessoal é para quem é a própria marca — médico, " +
          "advogado, arquiteto, qualquer profissional cujo nome é o que o " +
          "cliente procura. Entram posicionamento, linha editorial, " +
          "calendário mensal e a produção com você no centro, organizada " +
          "para caber na sua agenda.",
      },
      {
        rotulo: "Marketing Empresarial",
        texto:
          "O Marketing Empresarial é para a empresa parar de postar por " +
          "postar e passar a se posicionar: posicionamento de marca, linha " +
          "editorial, calendário, produção e relatório do que funcionou.",
      },
      {
        rotulo: "Consultoria",
        texto:
          "Se você já tem quem execute, o caminho é a Consultoria: a gente " +
          "entra com diagnóstico, estratégia e olhar externo, e quem executa " +
          "continua sendo o seu time. Começa com uma auditoria do perfil.",
      },
      {
        rotulo: "Tráfego pago",
        texto:
          "No tráfego pago a gente cuida de público, criativo e otimização, " +
          "em Meta Ads e Google. O objetivo é oportunidade real de negócio, " +
          "e não volume de clique.",
      },
      {
        rotulo: "Audiovisual",
        texto:
          "No audiovisual a gente vai do roteiro à edição final — vídeo " +
          "pensado para prender nos primeiros segundos e comunicar o valor " +
          "da marca até o fim.",
      },
      {
        rotulo: "Identidade visual",
        texto:
          "Na identidade visual entram naming, conceito, logotipo, paleta, " +
          "tipografia e as aplicações. A ideia é a marca ser lembrada, e não " +
          "confundida com a vizinha.",
      },
      {
        rotulo: "Site",
        texto:
          "A gente faz site institucional e página de captura, rápidos e " +
          "feitos para converter — a experiência digital no mesmo nível do " +
          "resto da marca.",
      },
      {
        rotulo: "Arquitetura",
        texto:
          "Sim, a gente também faz arquitetura: projeto arquitetônico e de " +
          "interiores, para quem entra no seu espaço sentir a mesma marca " +
          "que viu nas redes.",
      },
    ],
  },

  {
    grupo: "Como funciona",
    itens: [
      {
        rotulo: "O diagnóstico",
        texto:
          "O primeiro passo é o diagnóstico gratuito, que fica aqui no site: " +
          "são perguntas sobre o seu negócio, o momento da marca e o que já " +
          "foi tentado. A gente lê, estuda e volta com uma leitura do cenário " +
          "e um caminho — não é orçamento automático nem e-mail de robô.",
      },
      {
        rotulo: "Atende meu nicho?",
        texto:
          "Atendemos, sim — o trabalho não é fechado por nicho. O que muda é " +
          "a estratégia, e é justamente isso que o diagnóstico levanta.",
      },
      {
        rotulo: "Preciso aparecer?",
        texto:
          "No Marketing Pessoal sim, porque a marca é você e o conteúdo " +
          "perde força sem a sua presença. Nas outras frentes não " +
          "necessariamente: dá para trabalhar com equipe, cliente, produto " +
          "ou locução.",
      },
      {
        rotulo: "Onde ficam",
        texto:
          "A gente fica em João Pessoa, na Paraíba, e atende cliente de " +
          "outras cidades e estados — reunião por chamada é rotina, e " +
          "gravação presencial a gente combina conforme o projeto.",
      },
    ],
  },

  {
    grupo: "Preço e prazo",
    itens: [
      {
        rotulo: "Antes de falar valor",
        texto:
          "Sobre valor: a gente prefere não jogar um número no ar antes de " +
          "entender o tamanho do que você precisa, porque o número mudaria " +
          "depois e ninguém gosta disso. Me conta o momento da marca e o que " +
          "você quer alcançar que eu te trago uma proposta de verdade.",
      },
      {
        rotulo: "Sobre prazo",
        texto:
          "O prazo depende do ponto de partida e do que entra no escopo. " +
          "Assim que a gente alinhar o que você precisa, eu te passo uma " +
          "data firme — chutar agora não ajudaria você a se planejar.",
      },
      {
        rotulo: "Vou montar a proposta",
        texto:
          "Perfeito. Vou montar a proposta com o que a gente conversou e te " +
          "mando aqui e no seu WhatsApp. Qualquer coisa que você lembrar " +
          "nesse meio tempo, pode mandar que eu incluo.",
      },
    ],
  },

  {
    grupo: "Encerrar",
    itens: [
      {
        rotulo: "Vou te chamar no WhatsApp",
        texto:
          "Vou te chamar no WhatsApp para a gente continuar por lá, que " +
          "fica mais prático para mandar material e marcar uma conversa. " +
          "Até já!",
      },
      {
        rotulo: "Fico à disposição",
        texto:
          "Fico à disposição! Se surgir qualquer outra dúvida, é só chamar " +
          "aqui ou no (83) 99106-0691.",
      },
      {
        rotulo: "Marcar uma conversa",
        texto:
          "Que tal marcarmos uma conversa de uns vinte minutos para eu " +
          "entender melhor o seu caso? Me diz dois horários que funcionam " +
          "para você e eu confirmo.",
      },
      {
        rotulo: "Antes de encerrar",
        texto:
          "Consegui te ajudar com o que você precisava? Se sim, vou encerrar " +
          "por aqui — e qualquer coisa é só chamar de novo.",
      },
    ],
  },
];
