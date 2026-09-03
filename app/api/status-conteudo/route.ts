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

    return NextResponse.json({
      banco: true,
      tabelas: contagem,
      diagnostico:
        "Banco conectado e tabelas criadas. Os números acima são as linhas de cada bloco editável.",
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
