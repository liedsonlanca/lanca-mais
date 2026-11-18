import { NextResponse } from "next/server";
import { avaliarConversa } from "@/lib/conversas";
import { origemDaRequisicao, podeTentar, registrarFalha } from "@/lib/tentativas";

// A avaliação do atendimento.
//
// ---------- Por que ela é pedida no fim, e não depois por e-mail ----------
//
// Pesquisa que chega no dia seguinte mede quem ainda estava com raiva ou
// quem ficou encantado — o meio-termo, que é a maioria, nunca responde. No
// fim da conversa a pessoa ainda está ali, e são duas estrelas de distância.
//
// ---------- Por que o comentário é opcional ----------
//
// Porque exigir texto reduz a amostra a quem tinha o que reclamar. A nota
// sozinha já diz o suficiente para comparar semanas; o comentário é bônus de
// quem quis explicar.

const TETO_POR_ENDERECO = 10;

export async function POST(requisicao: Request) {
  const origem = origemDaRequisicao(requisicao);

  if (!(await podeTentar("chat-nota", origem, TETO_POR_ENDERECO)).permitido) {
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

  const nota = Number(corpo.nota);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    return NextResponse.json({ ok: false, motivo: "nota" }, { status: 400 });
  }

  const comentario =
    typeof corpo.comentario === "string" ? corpo.comentario.trim() : "";

  await registrarFalha("chat-nota", origem);

  // `false` quando já havia nota: a resposta continua sendo `ok`, porque do
  // lado de quem avaliou não há nada a corrigir — a avaliação dela está
  // registrada, só não é a desta vez.
  const gravou = await avaliarConversa(chave, nota, comentario);

  return NextResponse.json({ ok: true, gravou });
}
