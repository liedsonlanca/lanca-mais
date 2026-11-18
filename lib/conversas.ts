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
       RETURNING id, chave, nome, contato, email, estado,
                 ${QUANDO} AS criado_em, ${MEXIDO} AS mexido_em`,
    [chave, visitante]
  )) as Array<{
    id: number;
    chave: string;
    nome: string;
    contato: string;
    email: string;
    estado: string;
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
    novas: [] as Mensagem[],
  };

  if (!sql) return vazio;
  await garantirEsquema();

  const linhas = (await sql.query(
    `SELECT m.id, m.autor, m.texto,
            to_char(m.criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS quando,
            c.estado,
            (c.nome <> '' AND c.contato <> '' AND c.email <> '') AS tem_ficha
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

/** Marca a conversa como encerrada pela agência. */
export async function fecharConversa(conversa: number) {
  if (!sql) return;
  await garantirEsquema();
  await sql.query(
    "UPDATE conversas SET estado = 'fechada', mexido_em = now() WHERE id = $1",
    [conversa]
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
      `SELECT c.id, c.chave, c.nome, c.contato, c.email, c.estado,
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
        `SELECT id, chave, nome, contato, email, estado,
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
