import { NextResponse, after } from "next/server";
import { painelLiberado } from "@/lib/admin";
import { gravarMensagem } from "@/lib/conversas";
import { guardarAnexo } from "@/lib/upload";
import { atendenteAtual } from "@/lib/quem-atende";
import { avisarVisitantePorEmail } from "@/lib/email";
import { sql, garantirEsquema } from "@/lib/db";

// A equipe manda um arquivo na conversa (proposta em PDF, um exemplo de
// arte). Rota, e não ação de servidor: ação de servidor tem teto de 1 MB por
// padrão, e um PDF de proposta passa disso fácil.

export async function POST(
  requisicao: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await painelLiberado())) return new NextResponse(null, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0 || !sql) {
    return NextResponse.json({ ok: false, erro: "Conversa inválida." }, { status: 400 });
  }

  let dados: FormData;
  try {
    dados = await requisicao.formData();
  } catch {
    return NextResponse.json({ ok: false, erro: "Envio inválido." }, { status: 400 });
  }
  const arquivo = dados.get("arquivo");
  if (!(arquivo instanceof File)) {
    return NextResponse.json({ ok: false, erro: "Escolha um arquivo." }, { status: 400 });
  }

  await garantirEsquema();
  const linhas = (await sql.query("SELECT estado FROM conversas WHERE id = $1", [
    id,
  ])) as Array<{ estado: string }>;
  if (linhas[0]?.estado !== "equipe") {
    return NextResponse.json(
      { ok: false, erro: "A conversa precisa estar com a equipe." },
      { status: 400 }
    );
  }

  const guardado = await guardarAnexo(arquivo);
  if ("erro" in guardado) {
    return NextResponse.json({ ok: false, erro: guardado.erro }, { status: 400 });
  }

  const quem = await atendenteAtual();
  const nome = (arquivo.name || "arquivo").slice(0, 120);
  await gravarMensagem(id, "equipe", nome, {
    autorNome: quem,
    anexoUrl: guardado.url,
    anexoTipo: guardado.tipo,
  });

  after(() =>
    avisarVisitantePorEmail(id, `Enviamos um arquivo: ${nome}`, quem.split(/\s+/)[0] ?? "")
  );

  return NextResponse.json({ ok: true });
}
