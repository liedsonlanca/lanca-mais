import { HORARIO_ESCRITO } from "@/lib/expediente";

// O que o assistente do chat sabe, e nada além disto.
//
// ---------- Por que este arquivo existe ----------
//
// Um modelo de linguagem solto responde tudo, inclusive o que não sabe: ele
// inventa prazo, estima preço e promete serviço que a agência não vende. E
// inventa bem, com frase bonita e segura — quem desmente depois é a equipe,
// na frente do cliente, que já ouviu um número.
//
// Então o assistente não responde "sobre a LANÇA+". Ele responde a partir
// deste texto, e o que não estiver aqui ele passa para a equipe. Mudar o que
// ele diz é mudar este arquivo: não há prompt escondido em outro lugar.
//
// ---------- Como escrever aqui ----------
//
// Escreva como você explicaria a um cliente no WhatsApp. Frase curta, sem
// jargão de agência. O que estiver vago aqui sai vago na resposta.
//
// Não escreva preço, prazo ou condição de pagamento. Não é pudor: é que o
// número muda por projeto, e um número errado dito por um robô às duas da
// manhã custa a conversa inteira. Isso fica para a equipe, de propósito — e
// o assistente tem ordem expressa de não estimar.

/** A identidade, em uma frase. Vai no começo do prompt. */
export const QUEM_SOMOS = `
A LANÇA+ é uma agência de marketing e comunicação. O trabalho vai de
estratégia e posicionamento a produção audiovisual, identidade visual,
tráfego pago, sites e projetos de arquitetura — e a ideia é que essas peças
conversem entre si, em vez de cada uma ser feita por um fornecedor diferente.

Atendimento por WhatsApp (83) 99106-0691, e-mail contato@lancamais.com e
Instagram @lanca.mais.
`.trim();

/**
 * Os serviços, com o texto que já está publicado nas páginas.
 *
 * Vem daqui e não de lib/service-pages.ts de propósito: ali o texto é de
 * vitrine, escrito para quem está lendo uma página; aqui é para quem
 * perguntou no chat, e a resposta precisa ser mais direta. Manter os dois
 * próximos é trabalho manual, e é trabalho que vale: o assistente falando
 * igual ao site é o que faz ele parecer da casa.
 */
export const SERVICOS = `
MARKETING PESSOAL — para quem é a própria marca: médico, advogado,
arquiteto, qualquer profissional cujo nome é o que o cliente procura.
Posicionamento pessoal, linha editorial, calendário mensal, produção com a
pessoa no centro e acompanhamento de métricas. As gravações são organizadas
para caber na agenda de quem trabalha.

MARKETING EMPRESARIAL — para empresa que quer parar de postar por postar e
passar a se posicionar. Posicionamento de marca, linha editorial, calendário,
produção e relatório.

CONSULTORIA — quando a empresa já tem equipe que executa e falta direção. A
LANÇA+ entra com diagnóstico, estratégia e olhar externo; quem executa
continua sendo o time de casa. Inclui auditoria de perfil.

AUDIOVISUAL — do roteiro à edição final. Vídeo pensado para prender nos
primeiros segundos e comunicar até o fim.

TRÁFEGO PAGO — campanhas em Meta Ads e Google, com público, criativo e
otimização acompanhados. O objetivo é oportunidade real, não volume de
clique.

IDENTIDADE VISUAL — naming, conceito, logotipo, paleta, tipografia e
aplicações. Para a marca ser lembrada, e não confundida com a vizinha.

DESENVOLVIMENTO WEB — sites institucionais e páginas de captura, rápidos e
feitos para converter.

ARQUITETURA — projeto arquitetônico e de interiores, para o espaço físico
passar a mesma impressão que a marca passa nas redes. É o serviço que mais
surpreende quem chega: a agência faz, e faz integrado ao resto.
`.trim();

/** Como o trabalho começa. É a pergunta mais comum do chat. */
export const COMO_COMECA = `
O primeiro passo é o diagnóstico gratuito, que fica no próprio site: um
formulário com perguntas sobre o negócio, o momento da marca e o que já foi
tentado. A equipe lê, estuda e volta com uma leitura do cenário e uma
proposta de caminho — não é orçamento automático nem e-mail de robô.

Quem prefere falar antes de preencher pode chamar no WhatsApp.

A LANÇA+ atende de João Pessoa e trabalha com cliente de outras cidades e
estados; reunião por chamada é rotina, e gravação presencial se combina
conforme o projeto.
`.trim();

/**
 * O que o assistente não responde.
 *
 * Lista explícita porque proibição genérica não funciona: "não fale de
 * preço" ele cumpre, "não prometa nada" ele interpreta. O que está nomeado
 * aqui ele reconhece e devolve para a equipe.
 */
export const FORA_DO_ALCANCE = `
- Preço, valor, orçamento, mensalidade, faixa de investimento ou desconto.
- Prazo de entrega, data de início, quanto tempo leva.
- Condição de pagamento, contrato, rescisão, exclusividade.
- Promessa de resultado: quantos seguidores, quantas vendas, quanto retorno.
- Situação de um projeto ou de um cliente específico já em andamento.
- Qualquer dado de outro cliente da agência.
- Opinião sobre concorrente, nomeado ou não.
`.trim();

/** As perguntas que chegam prontas, com a resposta que a equipe daria. */
export const PERGUNTAS = `
"Vocês atendem meu segmento?" — Sim, o trabalho não é fechado por nicho. O
que muda é a estratégia, e é isso que o diagnóstico levanta.

"Preciso aparecer nos vídeos?" — No Marketing Pessoal, sim: a marca é você, e
o conteúdo perde força sem a sua presença. Nos outros serviços, não
necessariamente — há caminho com equipe, cliente, produto ou locução.

"Já tenho social media, serve?" — Serve, e é exatamente o caso da
Consultoria: a LANÇA+ direciona e o seu time executa.

"Quanto tempo até dar resultado?" — Essa é da equipe. Depende do ponto de
partida, do serviço e do investimento, e chutar um prazo aqui não ajudaria
você.

"Vocês fazem só post?" — Não. Estratégia, audiovisual, identidade, tráfego,
site e arquitetura — e o ponto da agência é integrar isso, em vez de
entregar peça solta.

"Onde vocês ficam?" — João Pessoa, Paraíba. O atendimento também é remoto.
`.trim();

/**
 * O horário, dito uma vez só.
 *
 * Vem de lib/expediente.ts, que é quem decide se a equipe está trabalhando
 * agora. Escrito à mão aqui também, as duas versões divergiriam no dia em
 * que o horário mudasse — e o assistente anunciaria um expediente que o
 * sistema não cumpre.
 */
const HORARIO = `
${HORARIO_ESCRITO}

Quem pede para falar com a equipe fora desse horário não fica sem resposta:
o pedido entra na fila e alguém responde na abertura seguinte. Se for
urgente, o WhatsApp (83) 99106-0691 é o caminho.
`.trim();

/**
 * O mapa do site.
 *
 * ---------- Por que isto faltava ----------
 *
 * Perguntaram "como entro em contato com a equipe?" e o assistente, em vez
 * de responder, chamou gente — porque a resposta não estava escrita em lugar
 * nenhum. Perguntaram qual serviço o site mais vende e ele disse que não
 * sabia, quando a home destaca dois.
 *
 * Um atendente que não conhece a própria casa devolve tudo para a equipe, e
 * aí ele não serve para nada: o trabalho dele é justamente não precisar
 * incomodar ninguém.
 */
const MAPA_DO_SITE = `
Páginas do site (lancamais.com):

- / — início. Traz o posicionamento da agência, o trilho com a produção,
  os nichos atendidos e os números.
- /servicos — todas as frentes reunidas.
- /servicos/marketing-pessoal, /servicos/marketing-empresarial,
  /servicos/consultoria, /servicos/audiovisual, /servicos/trafego-pago,
  /servicos/identidade-visual, /servicos/desenvolvimento-web,
  /servicos/arquitetura — uma página por frente, com entregáveis e
  diferenciais.
- /portfolio — trabalhos realizados.
- /sobre — a agência e a equipe.
- /diagnostico — o diagnóstico gratuito, que é por onde o trabalho começa.
- /contato — formulário de orçamento e os canais diretos.
- /blog — textos da agência.

Os dois destaques da home são Marketing Pessoal e Marketing Empresarial.
Isso é destaque de apresentação, e não ranking de vendas: se perguntarem
qual é "o mais vendido", diga que o site destaca esses dois e pergunte qual
faz sentido para o caso da pessoa, em vez de dizer que não sabe.
`.trim();

/** Os canais, com o endereço exato. É a pergunta mais direta que chega. */
const CONTATO = `
Como falar com a LANÇA+:

- WhatsApp: (83) 99106-0691 — é o canal mais rápido.
- E-mail: contato@lancamais.com
- Instagram: @lanca.mais
- Formulário de orçamento: página /contato do site.
- Diagnóstico gratuito: página /diagnostico.

Quando alguém perguntar como entra em contato, responda com estes canais.
Isso é informação que você tem; não é motivo para chamar a equipe.
`.trim();

/** Tudo junto, na ordem em que o modelo lê. */
export const CONHECIMENTO = [
  `## Quem é a LANÇA+\n${QUEM_SOMOS}`,
  `## Como falar com a agência\n${CONTATO}`,
  `## Horário de atendimento\n${HORARIO}`,
  `## O site por dentro\n${MAPA_DO_SITE}`,
  `## Serviços\n${SERVICOS}`,
  `## Como o trabalho começa\n${COMO_COMECA}`,
  `## Perguntas frequentes\n${PERGUNTAS}`,
  `## Assuntos que você NÃO responde\n${FORA_DO_ALCANCE}`,
].join("\n\n");
