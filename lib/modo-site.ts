import { neon } from "@neondatabase/serverless";

// Estado do site: aberto, em breve ou em manutenção.
//
// Este arquivo é lido pelo porteiro (proxy.ts), que roda no runtime de borda a
// cada visita. Por isso ele não importa lib/db: cria a própria conexão, sem
// arrastar junto o esquema e as leituras de conteúdo.
export type ModoSite = "publico" | "em-breve" | "manutencao";

export type ConfigSite = {
  modo: ModoSite;
  /** Data e hora do lançamento, em ISO. Nulo quando não há contagem. */
  lancamento: string | null;
};

export const CHAVE_MODO = "site:modo";
export const CHAVE_LANCAMENTO = "site:lancamento";

export const CONFIG_PADRAO: ConfigSite = { modo: "em-breve", lancamento: null };

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
  for (const [nome, valor] of Object.entries(process.env)) {
    if (nome.endsWith("_URL") && valor?.startsWith("postgres")) return valor;
  }
  return "";
}

// Cache curto na memória da instância.
//
// Sem ele haveria uma consulta ao banco em cada página aberta por cada
// visitante. Com trinta segundos, a mudança feita no painel aparece quase na
// hora e o banco quase não é tocado.
const VALIDADE_MS = 30_000;
let cache: { em: number; valor: ConfigSite } | null = null;

export async function lerConfigSite(): Promise<ConfigSite> {
  if (cache && Date.now() - cache.em < VALIDADE_MS) return cache.valor;

  const url = acharUrl();
  if (!url) return CONFIG_PADRAO;

  try {
    const sql = neon(url);
    const linhas = (await sql.query(
      "SELECT chave, valor FROM meta WHERE chave = ANY($1)",
      [[CHAVE_MODO, CHAVE_LANCAMENTO]]
    )) as Array<{ chave: string; valor: string }>;

    const mapa = new Map(linhas.map((l) => [l.chave, l.valor]));
    const bruto = mapa.get(CHAVE_MODO);

    const valor: ConfigSite = {
      modo:
        bruto === "publico" || bruto === "manutencao" || bruto === "em-breve"
          ? bruto
          : CONFIG_PADRAO.modo,
      lancamento: mapa.get(CHAVE_LANCAMENTO) || null,
    };

    cache = { em: Date.now(), valor };
    return valor;
  } catch {
    // Banco fora do ar não pode derrubar o site inteiro. Se já houve uma
    // leitura boa, ela vale; senão, cai no padrão, que é o estado fechado.
    return cache?.valor ?? CONFIG_PADRAO;
  }
}

/**
 * O site está aberto ao público neste instante?
 *
 * A contagem regressiva abre sozinha: passada a hora marcada, "em breve" vira
 * público sem ninguém precisar mexer no painel. É isso que faz o lançamento
 * acontecer na hora certa mesmo de madrugada.
 */
export function siteAberto(config: ConfigSite, agora = Date.now()) {
  if (config.modo === "publico") return true;
  if (config.modo === "manutencao") return false;

  if (!config.lancamento) return false;
  const alvo = Date.parse(config.lancamento);
  return Number.isFinite(alvo) && agora >= alvo;
}

/** Zera o cache depois de uma alteração no painel. */
export function esquecerConfig() {
  cache = null;
}
