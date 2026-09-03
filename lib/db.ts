import { neon } from "@neondatabase/serverless";

// Conexão com o Neon.
//
// O nome da variável depende do prefixo escolhido ao conectar a integração no
// painel da Vercel: DATABASE_URL com o prefixo "DATABASE", STORAGE_URL com o
// padrão, POSTGRES_URL nas integrações antigas. Errar o nome faria o site
// seguir servindo o conteúdo estático em silêncio, parecendo que o painel não
// grava nada — então procuramos por todos, na ordem de preferência.
function acharUrl() {
  const nomes = [
    "DATABASE_URL",
    "POSTGRES_URL",
    "STORAGE_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_PRISMA_URL",
  ];

  for (const nome of nomes) {
    const valor = process.env[nome];
    if (valor && valor.startsWith("post")) return valor;
  }

  // Última tentativa: qualquer variável que seja claramente uma string de
  // conexão Postgres. Cobre um prefixo personalizado que não previmos.
  for (const [nome, valor] of Object.entries(process.env)) {
    if (nome.endsWith("_URL") && valor?.startsWith("postgres")) return valor;
  }

  return "";
}

const url = acharUrl();

/** Falso enquanto o banco não foi criado. O site inteiro sabe lidar com isso. */
export const bancoConfigurado = url !== "";

export const sql = bancoConfigurado ? neon(url) : null;

// O esquema é criado sozinho na primeira consulta, em vez de exigir um passo de
// migração à parte. São todos CREATE TABLE IF NOT EXISTS: rodar de novo não
// custa nada e não destrói dado nenhum.
//
// A promessa fica guardada no módulo para que cada instância do servidor faça
// isso uma única vez, e não a cada requisição.
let criacao: Promise<void> | null = null;

const TABELAS = [
  // Controle interno. Guarda quais tabelas já foram semeadas com o conteúdo
  // que vivia nos arquivos, para que a semeadura aconteça uma vez só: sem
  // isso, apagar todos os depoimentos no painel faria os antigos voltarem no
  // deploy seguinte.
  `CREATE TABLE IF NOT EXISTS meta (
     chave TEXT PRIMARY KEY,
     valor TEXT NOT NULL DEFAULT '',
     em    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS vitrine (
     id         SERIAL PRIMARY KEY,
     src        TEXT NOT NULL,
     alt        TEXT NOT NULL DEFAULT '',
     tipo       TEXT NOT NULL DEFAULT 'imagem',
     video      TEXT,
     legenda    TEXT,
     ordem      INTEGER NOT NULL DEFAULT 0,
     criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS depoimentos (
     id         SERIAL PRIMARY KEY,
     citacao    TEXT NOT NULL,
     nome       TEXT NOT NULL,
     cargo      TEXT NOT NULL DEFAULT '',
     ordem      INTEGER NOT NULL DEFAULT 0,
     criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS cases (
     id         SERIAL PRIMARY KEY,
     slug       TEXT NOT NULL UNIQUE,
     cliente    TEXT NOT NULL,
     nicho      TEXT NOT NULL DEFAULT '',
     imagem     TEXT NOT NULL DEFAULT '',
     resumo     TEXT NOT NULL DEFAULT '',
     servicos   TEXT[] NOT NULL DEFAULT '{}',
     resultado  TEXT NOT NULL DEFAULT '',
     ordem      INTEGER NOT NULL DEFAULT 0,
     criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS logos (
     id         SERIAL PRIMARY KEY,
     nome       TEXT NOT NULL,
     logo       TEXT NOT NULL,
     ordem      INTEGER NOT NULL DEFAULT 0,
     criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS numeros (
     id         SERIAL PRIMARY KEY,
     prefixo    TEXT NOT NULL DEFAULT '',
     valor      INTEGER NOT NULL DEFAULT 0,
     sufixo     TEXT NOT NULL DEFAULT '',
     rotulo     TEXT NOT NULL,
     ordem      INTEGER NOT NULL DEFAULT 0
   )`,

  `CREATE TABLE IF NOT EXISTS posts (
     id            SERIAL PRIMARY KEY,
     slug          TEXT NOT NULL UNIQUE,
     titulo        TEXT NOT NULL,
     resumo        TEXT NOT NULL DEFAULT '',
     categoria     TEXT NOT NULL DEFAULT '',
     data          DATE NOT NULL DEFAULT CURRENT_DATE,
     tempo_leitura TEXT NOT NULL DEFAULT '',
     -- Um parágrafo por posição, na mesma forma do lib/blog-posts.ts atual.
     conteudo      TEXT[] NOT NULL DEFAULT '{}',
     publicado     BOOLEAN NOT NULL DEFAULT true,
     criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
];

export async function garantirEsquema() {
  if (!sql) return;

  if (!criacao) {
    criacao = (async () => {
      for (const comando of TABELAS) {
        await sql.query(comando);
      }
    })();
  }

  await criacao;
}

/** Marca um passo único (semeadura de uma tabela) como já feito. */
export async function marcarFeito(chave: string) {
  if (!sql) return;
  await sql.query(
    "INSERT INTO meta (chave, valor) VALUES ($1, '1') ON CONFLICT (chave) DO NOTHING",
    [chave]
  );
}

export async function jaFeito(chave: string) {
  if (!sql) return true;
  const linhas = (await sql.query("SELECT 1 FROM meta WHERE chave = $1", [
    chave,
  ])) as unknown[];
  return linhas.length > 0;
}

// Toda leitura de conteúdo passa por aqui.
//
// Se o banco não existe, ou se a consulta falhar (rede, banco dormindo, tabela
// ainda não criada), devolvemos o conteúdo estático em vez de derrubar a
// página. O site nunca fica no ar quebrado por causa do painel.
export async function lerDoBanco<T>(
  consulta: () => Promise<T>,
  reserva: T
): Promise<T> {
  if (!sql) return reserva;

  try {
    await garantirEsquema();
    return await consulta();
  } catch (erro) {
    console.error("[conteudo] leitura falhou, usando o conteúdo estático:", erro);
    return reserva;
  }
}
