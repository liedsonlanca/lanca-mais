import { NextResponse } from "next/server";
import { sql, bancoConfigurado, garantirEsquema } from "@/lib/db";

// Diagnóstico do painel.
//
// Existe por causa de uma falha silenciosa: se a variável de conexão não
// chegar ao projeto, nada quebra — o site segue servindo o conteúdo estático e
// o painel parece simplesmente não gravar. Esta rota responde a pergunta de
// forma direta, sem ninguém precisar caçar variável no painel da Vercel.
//
// Fica atrás do porteiro de pré-lançamento (o matcher em proxy.ts não a
// exclui), então só quem tem a senha alcança. Ainda assim, nunca devolve a
// string de conexão, apenas se ela existe e o que há nas tabelas.
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
