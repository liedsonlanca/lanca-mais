import { NextResponse, after } from "next/server";
import { impressaoDoVisitante } from "@/lib/acessos";
import { gravarMensagem } from "@/lib/conversas";
import { guardarAnexo } from "@/lib/upload";
import { avisarEquipe } from "@/lib/push";
import { estaBarrado } from "@/lib/atendimento";
import { sql, garantirEsquema } from "@/lib/db";
import { origemDaRequisicao, podeTentar, registrarFalha } from "@/lib/tentativas";

// O visitante manda uma imagem ou um PDF (a logo da empresa, um print, um
// briefing).
//
// Só com a conversa na equipe: o assistente não lê arquivo, e um anexo
// mandado a ele ficaria sem resposta. O chat só mostra o clipe nesse estado,
// e esta conferência garante o mesmo para quem chama a rota direto.

/** Dez arquivos por endereço a cada quinze minutos. */
const TETO_POR_ENDERECO = 10;

export async function POST(requisicao: Request) {
  const origem = origemDaRequisicao(requisicao);
  if (!(await podeTentar("chat-anexo", origem, TETO_POR_ENDERECO)).permitido) {
    return NextResponse.json(
      { ok: false, erro: "Muitos arquivos seguidos. Tente daqui a pouco." },
      { status: 429 }
    );
  }

  let dados: FormData;
  try {
    dados = await requisicao.formData();
  } catch {
    return NextResponse.json({ ok: false, erro: "Envio inválido." }, { status: 400 });
  }

  const chave = String(dados.get("chave") ?? "").replace(/[^a-f0-9]/g, "");
  const arquivo = dados.get("arquivo");
  if (chave.length !== 32 || !(arquivo instanceof File)) {
    return NextResponse.json({ ok: false, erro: "Envio inválido." }, { status: 400 });
  }

  if (!sql) return NextResponse.json({ ok: false }, { status: 503 });
  await garantirEsquema();
  const linhas = (await sql.query(
    "SELECT id, nome, estado FROM conversas WHERE chave = $1",
    [chave]
  )) as Array<{ id: number; nome: string; estado: string }>;
  const conversa = linhas[0];

  if (!conversa || conversa.estado !== "equipe") {
    return NextResponse.json(
      { ok: false, erro: "Arquivos podem ser enviados quando a equipe está na conversa." },
      { status: 400 }
    );
  }

  const visitante = await impressaoDoVisitante(
    origem,
    requisicao.headers.get("user-agent") ?? ""
  );
  if (await estaBarrado(chave, visitante)) return NextResponse.json({ ok: true });

  await registrarFalha("chat-anexo", origem);

  // Dez arquivos por conversa: o bastante para logo, prints e um briefing,
  // e um teto para quem quisesse usar o chat como depósito.
  const jaEnviados = (await sql.query(
    "SELECT count(*)::int AS n FROM mensagens WHERE conversa = $1 AND anexo_url <> ''",
    [conversa.id]
  )) as Array<{ n: number }>;
  if ((jaEnviados[0]?.n ?? 0) >= 10) {
    return NextResponse.json(
      { ok: false, erro: "Limite de arquivos desta conversa atingido. Se precisar mandar mais, use o WhatsApp." },
      { status: 400 }
    );
  }

  const guardado = await guardarAnexo(arquivo);
  if ("erro" in guardado) {
    return NextResponse.json({ ok: false, erro: guardado.erro }, { status: 400 });
  }

  const nomeDoArquivo = (arquivo.name || "arquivo").slice(0, 120);
  const id = await gravarMensagem(conversa.id, "cliente", nomeDoArquivo, {
    anexoUrl: guardado.url,
    anexoTipo: guardado.tipo,
  });

  after(() =>
    avisarEquipe({
      titulo: `${(conversa.nome || "Visitante").split(/\s+/)[0]} enviou um arquivo`,
      texto: nomeDoArquivo,
      url: `/lncadmin/conversas/${conversa.id}`,
      tag: `conversa-${conversa.id}`,
    })
  );

  return NextResponse.json({
    ok: true,
    mensagem: {
      id,
      autor: "cliente",
      texto: nomeDoArquivo,
      quando: new Date().toISOString(),
      anexoUrl: guardado.url,
      anexoTipo: guardado.tipo,
    },
  });
}
