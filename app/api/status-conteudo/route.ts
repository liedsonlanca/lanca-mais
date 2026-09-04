import { NextResponse } from "next/server";
import { sql, bancoConfigurado, garantirEsquema } from "@/lib/db";
import { estadoDoAdmin } from "@/lib/admin";

// Diagnóstico do painel.
//
// Existe por causa de uma falha silenciosa: se a variável de conexão não
// chegar ao projeto, nada quebra — o site segue servindo o conteúdo estático e
// o painel parece simplesmente não gravar. Esta rota responde a pergunta de
// forma direta, sem ninguém precisar caçar variável no painel da Vercel.
//
// Exige sessão do painel.
//
// Antes contava só com o porteiro de pré-lançamento. Isso protegia enquanto o
// site estava fechado e deixava de proteger exatamente quando ele abrisse: com
// o site público o porteiro deixa tudo passar, e esta rota entregaria a
// qualquer visitante os nomes das tabelas, os nomes das colunas, a contagem de
// linhas e o texto cru dos erros do Postgres. É material de reconhecimento
// para quem estiver procurando por onde entrar.
//
// A senha do painel é o nível certo: é uma ferramenta de quem administra, não
// de quem visita. E ela não depende do banco para funcionar, então continua
// alcançável justamente quando o banco é o problema.
export const dynamic = "force-dynamic";

const TABELAS = [
  "vitrine",
  "depoimentos",
  "cases",
  "logos",
  "numeros",
  "posts",
] as const;

export async function GET() {
  if ((await estadoDoAdmin()) !== "liberado") {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  if (!bancoConfigurado || !sql) {
    return NextResponse.json({
      banco: false,
      diagnostico:
        "Nenhuma variável de conexão Postgres encontrada. O site está servindo o conteúdo estático de lib/. Confira se o banco do Neon está conectado ao projeto lanca-mais e se a variável (DATABASE_URL) aparece em Settings, Environment Variables. Depois de criar a variável é preciso um novo deploy.",
    });
  }

  try {
    await garantirEsquema();

    const contagem: Record<string, number> = {};
    for (const tabela of TABELAS) {
      const linhas = (await sql.query(
        `SELECT count(*)::int AS total FROM ${tabela}`
      )) as Array<{ total: number }>;
      contagem[tabela] = linhas[0]?.total ?? 0;
    }

    // Colunas de cada tabela. Uma coluna que não chegou (ALTER que não rodou)
    // faz a leitura falhar e o site cair para o conteúdo estático, sem erro
    // visível — foi o que sumiu com a faixa de logos.
    const colunas = (await sql.query(
      `SELECT table_name, string_agg(column_name, ', ' ORDER BY ordinal_position) AS campos
         FROM information_schema.columns
        WHERE table_schema = 'public'
        GROUP BY table_name`
    )) as Array<{ table_name: string; campos: string }>;

    // Roda as mesmas consultas que as páginas rodam, e guarda o erro de cada
    // uma. É a diferença entre "a tabela tem linhas" e "a página consegue ler".
    const leituras: Record<string, string> = {};
    const consultas: Array<[string, string]> = [
      ["logos", "SELECT nome, logo, escala FROM logos ORDER BY ordem, id"],
      ["depoimentos", "SELECT citacao, nome, cargo, foto FROM depoimentos ORDER BY ordem, id"],
      ["vitrine", "SELECT src, alt, tipo, video, legenda FROM vitrine ORDER BY ordem, id"],
    ];

    for (const [nome, consulta] of consultas) {
      try {
        const linhas = (await sql.query(consulta)) as unknown[];
        leituras[nome] = `ok, ${linhas.length} linhas`;
      } catch (erro) {
        leituras[nome] = `FALHOU: ${erro instanceof Error ? erro.message : String(erro)}`;
      }
    }

    return NextResponse.json({
      banco: true,
      tabelas: contagem,
      leituras,
      colunas: Object.fromEntries(colunas.map((c) => [c.table_name, c.campos])),
      diagnostico:
        "Banco conectado. 'tabelas' conta as linhas; 'leituras' roda as consultas que as páginas usam e mostra qual falha.",
    });
  } catch (erro) {
    return NextResponse.json(
      {
        banco: true,
        erro: erro instanceof Error ? erro.message : String(erro),
        diagnostico:
          "A variável de conexão existe, mas a consulta falhou. O site continua servindo o conteúdo estático.",
      },
      { status: 500 }
    );
  }
}
