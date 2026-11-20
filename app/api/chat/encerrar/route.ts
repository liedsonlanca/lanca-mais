import { NextResponse } from "next/server";
import { sql, garantirEsquema } from "@/lib/db";
import { fecharConversa, gravarMensagem } from "@/lib/conversas";
import { origemDaRequisicao, podeTentar, registrarFalha } from "@/lib/tentativas";

// O visitante encerra a própria conversa.
//
// Sem isto, só a equipe ou o relógio encerravam — e quem já tinha tirado a
// dúvida ficava com uma conversa "aberta" que nunca terminava do lado dele,
// sem a avaliação e sem o recomeço limpo que vêm depois do encerramento.
//
// A chave é o segredo da conversa (32 caracteres aleatórios, guardados só no
// navegador de quem conversa); sem ela não se encerra a conversa de ninguém.

const TETO_POR_ENDERECO = 10;

export async function POST(requisicao: Request) {
  const origem = origemDaRequisicao(requisicao);

  if (!(await podeTentar("chat-encerrar", origem, TETO_POR_ENDERECO)).permitido) {
    return NextResponse.json({ ok: false, motivo: "limite" }, { status: 429 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, motivo: "corpo" }, { status: 400 });
  }

  const chave = String(corpo.chave ?? "").replace(/[^a-f0-9]/g, "");
  if (chave.length !== 32) {
    return NextResponse.json({ ok: false, motivo: "chave" }, { status: 400 });
  }

  if (!sql) {
    return NextResponse.json({ ok: false, motivo: "config" }, { status: 503 });
  }

  await garantirEsquema();
  const linhas = (await sql.query(
    "SELECT id, estado FROM conversas WHERE chave = $1",
    [chave]
  )) as Array<{ id: number; estado: string }>;

  const conversa = linhas[0];
  if (!conversa) {
    return NextResponse.json({ ok: false, motivo: "chave" }, { status: 404 });
  }

  await registrarFalha("chat-encerrar", origem);

  if (conversa.estado !== "fechada") {
    // Uma linha no fio, para quem abre no painel saber que a pessoa saiu por
    // vontade própria, e não que a conversa morreu no meio.
    await gravarMensagem(
      Number(conversa.id),
      "assistente",
      "Atendimento encerrado pelo visitante."
    );
    await fecharConversa(Number(conversa.id), "cliente");
  }

  return NextResponse.json({ ok: true });
}
