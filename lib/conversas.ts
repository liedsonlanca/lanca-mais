import { sql, garantirEsquema } from "@/lib/db";

// O chat do site, do lado do banco.
//
// ---------- Por que as conversas ficam aqui, e não no CRM ----------
//
// O lead fechado vive no DGFLOW, e continua lá: é onde a agência trabalha.
// Mas uma dúvida de madrugada não é lead ainda — é alguém decidindo se vale
// mandar mensagem. Jogar isso no CRM encheria a lista de fichas vazias, e a
// primeira consequência de uma lista cheia de nada é que ninguém abre.
//
// Então o rascunho da conversa mora no banco do site, e vira ficha no CRM
// quando a pessoa se identifica e pede atendimento (ver app/api/chat).
//
// ---------- Como uma pessoa é reconhecida ----------
//
// Por `chave`: um sorteio criado no servidor na primeira mensagem e guardado
// pelo navegador. Quem fecha a aba e volta continua na mesma conversa; quem
// abre no celular começa outra. Os dois estão certos, e nenhum depende de
// saber quem a pessoa é.
//
// O `visitante` guardado ao lado é a impressão em hash dos acessos, que
// troca de dia (ver lib/acessos.ts). Serve para cruzar com o movimento do
// site no painel, e não serve para identificar ninguém.

export type Autor = "cliente" | "assistente" | "equipe";

export type Mensagem = {
  id: number;
  autor: Autor;
  texto: string;
  quando: string;
};

export type Conversa = {
  id: number;
  chave: string;
  nome: string;
  contato: string;
  email: string;
  estado: "assistente" | "equipe" | "fechada";
  /** A nota de 1 a 5, ou null enquanto ninguém avaliou. */
  nota: number | null;
  comentario: string;
  /** "equipe", "inatividade", ou vazio enquanto aberta. */
  fechadaPor: string;
  criadoEm: string;
  mexidoEm: string;
};

/**
 * O teto de mensagens por conversa.
 *
 * Não é desconfiança do visitante: é que cada resposta reenvia o histórico
 * ao modelo, então conversa que não acaba fica mais caro a cada rodada. Além
 * disto, trinta trocas sem resolver significa que o assistente não está
 * resolvendo, e o certo é chamar gente — que é exatamente o que o limite
 * faz ao ser atingido.
 */
export const TETO_DE_MENSAGENS = 60;

/** Quanto do histórico vai ao modelo. Mais do que isto não melhora resposta. */
const HISTORICO_PARA_O_MODELO = 16;

// O carimbo sai em UTC com Z no fim, e não com o deslocamento do Postgres:
// ele escreve "+00", de dois dígitos, e o JavaScript só aceita "+00:00" —
// o que chegava na tela era "Invalid Date".
const QUANDO = `to_char(criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;
const MEXIDO = `to_char(mexido_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

function autorValido(valor: string): Autor {
  return valor === "assistente" || valor === "equipe" ? valor : "cliente";
}

/** Uma chave de conversa: sorteada no servidor, impossível de adivinhar. */
export function novaChave() {
  return crypto.randomUUID().replace(/-/g, "");
}

/**
 * Acha a conversa daquela chave, ou abre uma.
 *
 * Devolve `null` quando não há banco configurado — o chat inteiro então se
 * desliga na tela, em vez de aceitar mensagem que não vai a lugar nenhum.
 */
export async function acharOuAbrir(chave: string, visitante: string) {
  if (!sql) return null;
  await garantirEsquema();

  // INSERT com ON CONFLICT em vez de "procura, e se não houver, cria": entre
  // a procura e a criação cabem duas requisições do mesmo visitante, e aí
  // nascem duas conversas com a mesma chave — ou um erro de unicidade na
  // cara de quem só mandou "oi".
  const linhas = (await sql.query(
    `INSERT INTO conversas (chave, visitante)
          VALUES ($1, $2)
     ON CONFLICT (chave) DO UPDATE SET mexido_em = now()
       RETURNING id, chave, nome, contato, email, estado, nota, comentario, fechada_por,
                 ${QUANDO} AS criado_em, ${MEXIDO} AS mexido_em`,
    [chave, visitante]
  )) as Array<{
    id: number;
    chave: string;
    nome: string;
    contato: string;
    email: string;
    estado: string;
    nota: number | null;
    comentario: string;
    fechada_por: string;
    criado_em: string;
    mexido_em: string;
  }>;

  const linha = linhas[0];
  if (!linha) return null;

  return {
    id: Number(linha.id),
    chave: linha.chave,
    nome: linha.nome,
    contato: linha.contato,
    email: linha.email,
    estado: linha.estado as Conversa["estado"],
    nota: linha.nota === null ? null : Number(linha.nota),
    comentario: linha.comentario ?? "",
    fechadaPor: linha.fechada_por ?? "",
    criadoEm: linha.criado_em,
    mexidoEm: linha.mexido_em,
  } satisfies Conversa;
}

/** Guarda uma mensagem e devolve o id dela. */
export async function gravarMensagem(
  conversa: number,
  autor: Autor,
  texto: string
) {
  if (!sql) return 0;
  await garantirEsquema();

  const linhas = (await sql.query(
    `INSERT INTO mensagens (conversa, autor, texto)
          VALUES ($1, $2, $3)
       RETURNING id`,
    [conversa, autor, texto.slice(0, 2000)]
  )) as Array<{ id: number }>;

  await sql.query("UPDATE conversas SET mexido_em = now() WHERE id = $1", [
    conversa,
  ]);

  return Number(linhas[0]?.id ?? 0);
}

/** Quantas mensagens a conversa já tem. Serve para o teto. */
export async function quantasMensagens(conversa: number) {
  if (!sql) return 0;
  const linhas = (await sql.query(
    "SELECT count(*)::int AS n FROM mensagens WHERE conversa = $1",
    [conversa]
  )) as Array<{ n: number }>;
  return linhas[0]?.n ?? 0;
}

/** As últimas mensagens da conversa, da mais antiga para a mais nova. */
export async function historico(conversa: number, limite = HISTORICO_PARA_O_MODELO) {
  if (!sql) return [];

  // Pega as últimas em ordem decrescente e inverte aqui: LIMIT com ORDER BY
  // crescente devolveria as primeiras da conversa, que são justamente as que
  // menos importam para a próxima resposta.
  const linhas = (await sql.query(
    `SELECT id, autor, texto, ${QUANDO} AS quando
       FROM mensagens
      WHERE conversa = $1
      ORDER BY id DESC
      LIMIT $2`,
    [conversa, limite]
  )) as Array<{ id: number; autor: string; texto: string; quando: string }>;

  return linhas
    .map((l) => ({
      id: Number(l.id),
      autor: autorValido(l.autor),
      texto: l.texto,
      quando: l.quando,
    }))
    .reverse() satisfies Mensagem[];
}

/**
 * O que apareceu depois da mensagem que o navegador já tem.
 *
 * É assim que a resposta da equipe chega a quem está com o chat aberto: a
 * página pergunta "tem coisa nova depois da número 12?" de tempo em tempo.
 * Perguntar por id, e não por horário, evita perder mensagem gravada no
 * mesmo segundo e evita repetir mensagem por causa de relógio adiantado.
 */
export async function mensagensDepois(chave: string, depoisDe: number) {
  const vazio = {
    estado: null as Conversa["estado"] | null,
    temFicha: false,
    temNome: false,
    avaliada: false,
    novas: [] as Mensagem[],
  };

  if (!sql) return vazio;
  await garantirEsquema();

  const linhas = (await sql.query(
    `SELECT m.id, m.autor, m.texto,
            to_char(m.criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS quando,
            c.estado,
            (c.nome <> '' AND c.contato <> '' AND c.email <> '') AS tem_ficha,
            (c.nota IS NOT NULL) AS avaliada
       FROM conversas c
       LEFT JOIN mensagens m ON m.conversa = c.id AND m.id > $2
      WHERE c.chave = $1
      ORDER BY m.id
      LIMIT 50`,
    [chave, depoisDe]
  )) as Array<{
    id: number | null;
    autor: string | null;
    texto: string | null;
    quando: string | null;
    estado: string;
    tem_ficha: boolean;
    tem_nome: boolean;
    avaliada: boolean;
  }>;

  if (linhas.length === 0) return vazio;

  const novas = linhas
    .filter((l) => l.id !== null)
    .map((l) => ({
      id: Number(l.id),
      autor: autorValido(l.autor ?? ""),
      texto: l.texto ?? "",
      quando: l.quando ?? "",
    }));

  return {
    estado: linhas[0].estado as Conversa["estado"],
    temFicha: Boolean(linhas[0].tem_ficha),
    temNome: Boolean(linhas[0].tem_nome),
    avaliada: Boolean(linhas[0].avaliada),
    novas,
  };
}

/** Passa a conversa para a equipe, guardando quem é a pessoa se ela disse. */
export async function passarParaEquipe(
  conversa: number,
  dados: { nome?: string; contato?: string; email?: string } = {}
) {
  if (!sql) return;
  await garantirEsquema();

  // COALESCE com NULLIF para não apagar o que já estava: a pessoa pode ter
  // preenchido a ficha antes e voltado com outra dúvida depois, e a segunda
  // gravação não deve zerar a primeira.
  await sql.query(
    `UPDATE conversas
        SET estado = 'equipe',
            nome    = COALESCE(NULLIF($2, ''), nome),
            contato = COALESCE(NULLIF($3, ''), contato),
            email   = COALESCE(NULLIF($4, ''), email),
            mexido_em = now()
      WHERE id = $1`,
    [
      conversa,
      (dados.nome ?? "").slice(0, 120),
      (dados.contato ?? "").slice(0, 40),
      (dados.email ?? "").slice(0, 160),
    ]
  );
}

/**
 * Abre uma conversa nova herdando os dados de quem já se identificou.
 *
 * ---------- Por que nova, e não a mesma reaberta ----------
 *
 * Atendimento encerrado é assunto encerrado. Quem volta uma semana depois
 * volta por outro motivo, e emendar isso na conversa antiga dá à equipe uma
 * linha do tempo que mistura dois assuntos — e, no painel, uma conversa que
 * nunca termina e cresce para sempre.
 *
 * ---------- Por que os dados vão junto ----------
 *
 * Porque a pessoa já os deu. Pedir nome, WhatsApp e e-mail de novo a quem
 * acabou de preencher a ficha é o jeito mais rápido de transformar um
 * cliente que voltou num cliente que desistiu.
 */
export async function recomecarConversa(anterior: Conversa, visitante: string) {
  if (!sql) return null;
  await garantirEsquema();

  const chave = novaChave();

  // Sem os dados da anterior, de propósito.
  //
  // Antes a conversa nova herdava nome, WhatsApp e e-mail, para a pessoa não
  // repetir. A agência preferiu o contrário: atendimento encerrado é assunto
  // encerrado, e a próxima conversa começa do zero, com dados novos — quem
  // escreve pode nem ser a mesma pessoa, num computador de família ou de
  // escritório. `anterior` continua no parâmetro para quem chama não mudar.
  void anterior;
  const linhas = (await sql.query(
    `INSERT INTO conversas (chave, visitante)
          VALUES ($1, $2)
       RETURNING id, chave, nome, contato, email, estado, nota, comentario, fechada_por,
                 ${QUANDO} AS criado_em, ${MEXIDO} AS mexido_em`,
    [chave, visitante]
  )) as Array<Record<string, unknown>>;

  const linha = linhas[0];
  if (!linha) return null;

  return {
    id: Number(linha.id),
    chave: String(linha.chave),
    nome: String(linha.nome ?? ""),
    contato: String(linha.contato ?? ""),
    email: String(linha.email ?? ""),
    estado: String(linha.estado) as Conversa["estado"],
    nota: linha.nota == null ? null : Number(linha.nota),
    comentario: String(linha.comentario ?? ""),
    fechadaPor: String(linha.fechada_por ?? ""),
    criadoEm: String(linha.criado_em),
    mexidoEm: String(linha.mexido_em),
  } satisfies Conversa;
}

/** A conversa em texto, para ir junto do lead ao CRM. */
export async function conversaEmTexto(conversa: number, limite = 20) {
  const mensagens = await historico(conversa, limite);

  // Quem abre a ficha no CRM precisa ver a pergunta, não só o nome: sem ela,
  // a equipe liga sem saber do que a pessoa estava falando, e a primeira
  // frase da ligação é "me conta de novo".
  return mensagens
    .map((m) => `${m.autor === "cliente" ? "Visitante" : "Atendimento"}: ${m.texto}`)
    .join("\n");
}

/**
 * Guarda a avaliação do atendimento.
 *
 * ---------- Por que pela chave, e não pelo id ----------
 *
 * Porque quem avalia é o visitante, e a chave é o que o navegador dele tem.
 * Id é número sequencial, adivinhável: aceitar id aqui seria aceitar que
 * alguém avaliasse a conversa dos outros.
 *
 * ---------- Por que a nota pode ser reescrita ----------
 *
 * Primeira versão travava na primeira nota — "quem avaliou, avaliou". Isso
 * quebrava a tela: a estrela grava na hora do clique, e o comentário chega
 * depois, num segundo envio que a trava recusava. O comentário se perdia, e
 * quem clicasse 3 e corrigisse para 5 ficava com 3.
 *
 * Reescrever é o comportamento certo, não uma concessão: a pessoa mudar de
 * ideia antes de fechar a janela é uso normal. E só quem tem a chave da
 * conversa consegue reescrever — ela é sorteada no servidor e não aparece em
 * endereço nenhum.
 */
export async function avaliarConversa(
  chave: string,
  nota: number,
  comentario: string
) {
  if (!sql) return false;
  await garantirEsquema();

  const linhas = (await sql.query(
    `UPDATE conversas
        SET nota = $2,
            -- Comentário vazio não apaga o que já estava: o segundo envio
            -- pode ser só a correção da estrela.
            comentario = COALESCE(NULLIF($3, ''), comentario)
      WHERE chave = $1
      RETURNING id`,
    [chave, nota, comentario.slice(0, 500)]
  )) as Array<{ id: number }>;

  return linhas.length > 0;
}

/** Marca a conversa como encerrada pela agência. */
export async function fecharConversa(
  conversa: number,
  por: "equipe" | "cliente" = "equipe"
) {
  if (!sql) return;
  await garantirEsquema();
  // A equipe (botão do painel ou barrar) ou o próprio visitante. O relógio
  // encerra por outro caminho, em `encerrarPorSilencio`, e marca o dele.
  await sql.query(
    `UPDATE conversas
        SET estado = 'fechada', fechada_por = $2, mexido_em = now()
      WHERE id = $1`,
    [conversa, por]
  );
}

export type ConversaNaLista = Conversa & {
  mensagens: number;
  ultima: string;
  ultimoAutor: Autor | null;
};

/** A lista do painel: conversa mais recente primeiro. */
export async function listarConversas(limite = 50): Promise<ConversaNaLista[]> {
  if (!sql) return [];

  try {
    await garantirEsquema();

    // Uma consulta só, com o resumo de cada conversa junto.
    //
    // O caminho óbvio — listar conversas e depois pedir a última mensagem de
    // cada — são cinquenta e uma idas ao banco para montar uma tela, e cada
    // ida é uma volta de rede. DISTINCT ON é do Postgres e resolve "a última
    // linha de cada grupo" sem subconsulta aninhada.
    const linhas = (await sql.query(
      `SELECT c.id, c.chave, c.nome, c.contato, c.email, c.estado, c.nota, c.comentario, c.fechada_por,
              to_char(c.criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS criado_em,
              to_char(c.mexido_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS mexido_em,
              coalesce(r.n, 0)::int AS mensagens,
              coalesce(r.texto, '') AS ultima,
              r.autor AS ultimo_autor
         FROM conversas c
         LEFT JOIN (
           SELECT DISTINCT ON (conversa)
                  conversa,
                  texto,
                  autor,
                  count(*) OVER (PARTITION BY conversa) AS n
             FROM mensagens
            ORDER BY conversa, id DESC
         ) r ON r.conversa = c.id
        ORDER BY c.mexido_em DESC
        LIMIT $1`,
      [limite]
    )) as Array<Record<string, unknown>>;

    return linhas.map((l) => ({
      id: Number(l.id),
      chave: String(l.chave),
      nome: String(l.nome ?? ""),
      contato: String(l.contato ?? ""),
      email: String(l.email ?? ""),
      estado: String(l.estado) as Conversa["estado"],
      nota: l.nota == null ? null : Number(l.nota),
      comentario: String(l.comentario ?? ""),
      fechadaPor: String(l.fechada_por ?? ""),
      criadoEm: String(l.criado_em),
      mexidoEm: String(l.mexido_em),
      mensagens: Number(l.mensagens ?? 0),
      ultima: String(l.ultima ?? ""),
      ultimoAutor: l.ultimo_autor ? autorValido(String(l.ultimo_autor)) : null,
    }));
  } catch {
    return [];
  }
}

/** Uma conversa inteira, para a tela do painel. */
export async function lerConversa(id: number) {
  if (!sql) return null;

  try {
    await garantirEsquema();

    const [cabeca, mensagens] = await Promise.all([
      sql.query(
        `SELECT id, chave, nome, contato, email, estado, nota, comentario, fechada_por,
                ${QUANDO} AS criado_em, ${MEXIDO} AS mexido_em
           FROM conversas WHERE id = $1`,
        [id]
      ),
      historico(id, 200),
    ]);

    const linha = (cabeca as Array<Record<string, unknown>>)[0];
    if (!linha) return null;

    return {
      conversa: {
        id: Number(linha.id),
        chave: String(linha.chave),
        nome: String(linha.nome ?? ""),
        contato: String(linha.contato ?? ""),
        email: String(linha.email ?? ""),
        estado: String(linha.estado) as Conversa["estado"],
        nota: linha.nota == null ? null : Number(linha.nota),
        comentario: String(linha.comentario ?? ""),
        fechadaPor: String(linha.fechada_por ?? ""),
        criadoEm: String(linha.criado_em),
        mexidoEm: String(linha.mexido_em),
      } satisfies Conversa,
      mensagens,
    };
  } catch {
    return null;
  }
}

/** Quantas conversas estão esperando a equipe. Vai no sino do painel. */
export async function conversasEsperando() {
  if (!sql) return 0;
  try {
    await garantirEsquema();
    const linhas = (await sql.query(
      "SELECT count(*)::int AS n FROM conversas WHERE estado = 'equipe'"
    )) as Array<{ n: number }>;
    return linhas[0]?.n ?? 0;
  } catch {
    return 0;
  }
}

/* ---------------- Encerramento por silêncio ---------------- */

/**
 * Quanto tempo de silêncio encerra cada tipo de conversa.
 *
 * ---------- A armadilha, e por que existem dois prazos ----------
 *
 * A regra ingênua seria "conversa parada há X horas, encerra". Ela perderia
 * dinheiro: uma conversa parada **esperando a equipe** é um lead que ninguém
 * atendeu ainda, e encerrá-la por tempo é apagar o pedido de quem procurou a
 * agência. Quanto mais tempo ela espera, pior — e a regra ingênua fecharia
 * justamente as mais esquecidas.
 *
 * Então o que decide não é o tempo parado: é **quem falou por último**.
 *
 * - Última fala do visitante, ou do assistente passando a bola: alguém da
 *   LANÇA+ deve uma resposta. Nunca encerra, por mais que demore.
 * - Última fala da equipe: a agência fez a parte dela e a pessoa não voltou.
 *   Aí sim, encerra.
 * - Última fala do assistente numa conversa que nunca saiu dele: a pessoa
 *   tirou a dúvida e foi embora. Também encerra.
 *
 * ---------- Por que meia hora ----------
 *
 * Escolha da agência em 20/11/2026: chat de site é conversa de agora. Quem
 * some por meia hora depois da resposta não está mais na página, e uma
 * conversa aberta por horas só enche o painel de linhas que ninguém vai
 * continuar. Se a pessoa voltar, começa outra — com a avaliação no meio.
 */
const SILENCIO_COM_ASSISTENTE = "30 minutes";
const SILENCIO_DEPOIS_DA_EQUIPE = "30 minutes";

/**
 * Encerra o que morreu de silêncio, e devolve quantas encerrou.
 *
 * ---------- Por que não há tarefa agendada ----------
 *
 * Isto roda quando alguém abre o painel e quando o chat pergunta por
 * mensagens novas — ou seja, no movimento normal do site. Uma tarefa
 * agendada seria mais uma peça para configurar, monitorar e esquecer, para
 * fazer o que duas consultas baratas fazem de carona.
 *
 * O efeito é o mesmo: ninguém vê uma conversa velha aberta, porque para ver
 * é preciso abrir a tela — e abrir a tela é o que limpa.
 */
/** Quando a faxina rodou pela última vez, nesta instância do servidor. */
let ultimaFaxina = 0;

export async function encerrarPorSilencio() {
  if (!sql) return 0;

  // No máximo uma vez por minuto.
  //
  // Ela pega carona em cada pergunta do chat por mensagens novas — e cada
  // chat aberto pergunta de 5 em 5 segundos. Sem este freio, cem pessoas no
  // site seriam vinte varreduras da tabela de mensagens por segundo, para
  // encerrar conversas cujo prazo se mede em horas. Um minuto de atraso no
  // encerramento não se nota; vinte varreduras por segundo, o banco nota.
  const agora = Date.now();
  if (agora - ultimaFaxina < 60_000) return 0;
  ultimaFaxina = agora;

  try {
    await garantirEsquema();

    const linhas = (await sql.query(
      `WITH ultima AS (
         SELECT DISTINCT ON (conversa) conversa, autor
           FROM mensagens
          ORDER BY conversa, id DESC
       )
       UPDATE conversas c
          SET estado = 'fechada',
              fechada_por = 'inatividade',
              mexido_em = now()
         FROM ultima u
        WHERE u.conversa = c.id
          AND c.estado <> 'fechada'
          -- Só quando a última palavra foi da LANÇA+: se foi do visitante,
          -- a agência deve resposta e a conversa não pode sumir.
          AND u.autor <> 'cliente'
          AND (
            (c.estado = 'assistente'
               AND u.autor = 'assistente'
               AND c.mexido_em < now() - interval '${SILENCIO_COM_ASSISTENTE}')
            OR
            (c.estado = 'equipe'
               AND u.autor = 'equipe'
               AND c.mexido_em < now() - interval '${SILENCIO_DEPOIS_DA_EQUIPE}')
          )
        RETURNING c.id`,
      []
    )) as Array<{ id: number }>;

    if (linhas.length === 0) return 0;

    // Uma despedida em cada uma.
    //
    // Sem isso, quem voltasse ao chat encontraria a conversa encerrada sem
    // nada explicando — e no painel o fio terminaria no meio, como se
    // alguém tivesse desligado na cara da pessoa.
    await sql.query(
      `INSERT INTO mensagens (conversa, autor, texto)
       SELECT id, 'assistente',
              'Vou encerrar este atendimento por aqui, já que ficamos um tempo sem falar. Se precisar de qualquer coisa, é só escrever de novo — começamos uma conversa nova.'
         FROM conversas WHERE id = ANY($1::bigint[])`,
      [linhas.map((l) => Number(l.id))]
    );

    return linhas.length;
  } catch {
    // Faxina é acessório: falhar aqui não pode derrubar quem só queria ler a
    // lista de conversas.
    return 0;
  }
}

/** Guarda o nome dito no começo da conversa, sem apagar o que já havia. */
export async function definirNome(conversa: number, nome: string) {
  if (!sql || !nome) return;
  try {
    await sql.query(
      `UPDATE conversas
          SET nome = COALESCE(NULLIF(nome, ''), $2)
        WHERE id = $1`,
      [conversa, nome.slice(0, 120)]
    );
  } catch {
    // O nome é conveniência; a conversa vale mais do que ele.
  }
}
