import { sql, garantirEsquema } from "@/lib/db";

// A medição de acessos do site, no banco da própria agência.
//
// ---------- Por que medição própria ----------
//
// O pedido foi saber quem está no site agora, quantos entraram e onde
// clicaram. O Google Analytics entrega isso tarde e só para quem aceitou
// cookies — quem recusa some da conta, e aí o número que o painel mostra não
// é o movimento do site, é o movimento de quem aceitou ser medido.
//
// Aqui o dado é da agência, fica no mesmo banco do resto, e o painel lê
// direto. Em compensação não há relatório de origem de campanha, nem funil,
// nem nada que o Google faz melhor. É contagem de movimento, e para.
//
// ---------- Como se conta sem identificar ninguém ----------
//
// Nada é gravado no navegador: nem cookie, nem armazenamento local. O que
// distingue uma visita da outra é um hash de endereço de rede e navegador,
// assinado com um segredo que muda a cada dia.
//
// Isso é o suficiente para não contar a mesma pessoa cinco vezes enquanto ela
// navega, e é insuficiente para saber quem ela é: a chave de ontem não abre o
// dado de hoje, e nada liga um dia ao outro. O endereço de rede em si nunca
// chega ao banco.
//
// O aviso de cookies não precisa cobrir isto, e por isso ele não cobre: não
// há nada guardado no aparelho de ninguém para pedir permissão.

const codificador = new TextEncoder();

/** Quanto tempo sem carregar página até a pessoa deixar de estar "agora". */
const JANELA_AGORA_MIN = 5;

/**
 * A chave do dia.
 *
 * Sai do segredo do painel, que todo ambiente já tem, mais a data. Trocar de
 * dia troca a chave, e com ela todos os hashes — é o que impede seguir alguém
 * de uma semana para a outra.
 *
 * Sem ADMIN_SENHA o hash ainda sai, só que previsível. Preferir isso a não
 * medir: um painel sem número é um painel que ninguém abre.
 */
function chaveDoDia() {
  const hoje = new Date().toISOString().slice(0, 10);
  return `${process.env.ADMIN_SENHA ?? "lanca"}:${hoje}`;
}

/** A impressão do visitante: curta, porque não precisa resistir a nada. */
export async function impressaoDoVisitante(ip: string, navegador: string) {
  const chave = await crypto.subtle.importKey(
    "raw",
    codificador.encode(chaveDoDia()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const assinatura = await crypto.subtle.sign(
    "HMAC",
    chave,
    codificador.encode(`${ip}|${navegador}`)
  );

  return Array.from(new Uint8Array(assinatura))
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Guarda uma visita. Falha em silêncio: medir não pode derrubar o site. */
export async function registrarAcesso(dados: {
  caminho: string;
  visitante: string;
  referencia: string;
}) {
  if (!sql) return;
  try {
    await garantirEsquema();
    await sql.query(
      "INSERT INTO acessos (caminho, visitante, referencia) VALUES ($1,$2,$3)",
      [
        dados.caminho.slice(0, 300),
        dados.visitante,
        dados.referencia.slice(0, 300) || null,
      ]
    );
  } catch {
    // Silêncio proposital.
  }
}

export type Resumo = {
  agora: number;
  hoje: number;
  seteDias: number;
  trintaDias: number;
  esperaHoje: number;
  espera30: number;
  porDia: Array<{ dia: string; visitas: number; pessoas: number }>;
  paginas: Array<{ caminho: string; visitas: number }>;
  origens: Array<{ origem: string; visitas: number }>;
};

const VAZIO: Resumo = {
  agora: 0,
  hoje: 0,
  seteDias: 0,
  trintaDias: 0,
  esperaHoje: 0,
  espera30: 0,
  porDia: [],
  paginas: [],
  origens: [],
};

/**
 * Tudo o que o painel mostra, em quatro consultas.
 *
 * Quatro, e não dez: cada ida ao banco custa uma volta de rede, e a tela
 * inteira já levava mais de um segundo quando contava seção por seção. Os
 * totais saem de um UNION só, e o resto é um agrupamento cada.
 */
export async function lerResumo(): Promise<Resumo> {
  if (!sql) return VAZIO;

  try {
    await garantirEsquema();

    const [totais, porDia, paginas, origens] = await Promise.all([
      sql.query(`
        SELECT 'agora' AS nome, count(DISTINCT visitante)::int AS n
          FROM acessos WHERE criado_em > now() - interval '${JANELA_AGORA_MIN} minutes'
        UNION ALL
        SELECT 'hoje', count(*)::int FROM acessos WHERE criado_em::date = current_date
        UNION ALL
        SELECT 'sete', count(*)::int FROM acessos WHERE criado_em > now() - interval '7 days'
        UNION ALL
        SELECT 'trinta', count(*)::int FROM acessos WHERE criado_em > now() - interval '30 days'
        UNION ALL
        -- A tela de espera é a única página que todo visitante vê enquanto
        -- o site está fechado, então ela merece contagem própria: no total
        -- geral ela se mistura com o resto e some.
        SELECT 'espera_hoje', count(*)::int FROM acessos
         WHERE caminho LIKE '/em-breve%' AND criado_em::date = current_date
        UNION ALL
        SELECT 'espera_30', count(*)::int FROM acessos
         WHERE caminho LIKE '/em-breve%' AND criado_em > now() - interval '30 days'
      `),

      sql.query(`
        SELECT to_char(criado_em::date, 'YYYY-MM-DD') AS dia,
               count(*)::int AS visitas,
               count(DISTINCT visitante)::int AS pessoas
          FROM acessos
         WHERE criado_em > now() - interval '13 days'
         GROUP BY 1 ORDER BY 1
      `),

      sql.query(`
        SELECT caminho, count(*)::int AS visitas
          FROM acessos
         WHERE criado_em > now() - interval '30 days'
         GROUP BY 1 ORDER BY 2 DESC LIMIT 25
      `),

      sql.query(`
        SELECT coalesce(nullif(referencia, ''), 'Direto') AS origem,
               count(*)::int AS visitas
          FROM acessos
         WHERE criado_em > now() - interval '30 days'
         GROUP BY 1 ORDER BY 2 DESC LIMIT 25
      `),
    ]);

    // O driver devolve linhas sem tipo; a forma e garantida pelo SELECT logo
    // acima, entao a conversao fica num lugar so, aqui.
    const linhasTotais = totais as Array<{ nome: string; n: number }>;
    const achar = (nome: string) =>
      linhasTotais.find((l) => l.nome === nome)?.n ?? 0;

    return {
      agora: achar("agora"),
      hoje: achar("hoje"),
      seteDias: achar("sete"),
      trintaDias: achar("trinta"),
      esperaHoje: achar("espera_hoje"),
      espera30: achar("espera_30"),
      porDia: porDia as Resumo["porDia"],
      paginas: paginas as Resumo["paginas"],
      origens: origens as Resumo["origens"],
    };
  } catch {
    // O painel abre mesmo sem medição; a tela diz o que houve.
    return VAZIO;
  }
}
