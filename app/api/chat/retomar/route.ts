import { NextResponse } from "next/server";
import { linkValido } from "@/lib/assinatura";
import { origemDaRequisicao, podeTentar, registrarFalha } from "@/lib/tentativas";

// Confere o link de "Continuar a conversa" antes de o chat adotar a chave
// que veio nele (ver lib/assinatura.ts). Link adulterado, vencido ou de
// outra conversa: o chat ignora e segue como estava.

export async function POST(requisicao: Request) {
  const origem = origemDaRequisicao(requisicao);
  if (!(await podeTentar("chat-retomar", origem, 20)).permitido) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ok = await linkValido(
    String(corpo.conversa ?? ""),
    String(corpo.t ?? ""),
    String(corpo.v ?? "")
  );
  if (!ok) await registrarFalha("chat-retomar", origem);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
