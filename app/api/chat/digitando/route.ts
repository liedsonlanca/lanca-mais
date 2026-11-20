import { NextResponse } from "next/server";
import { clienteDigitando } from "@/lib/conversas";
import { freioRapido } from "@/lib/freio-rapido";
import { origemDaRequisicao } from "@/lib/tentativas";

// O visitante está digitando.
//
// O navegador chama no máximo a cada três segundos enquanto a pessoa
// escreve, e só com a conversa na equipe — é o que faz aparecer o
// "digitando…" no painel, e o que faz quem atende esperar a frase terminar
// em vez de responder por cima.
//
// Freio em memória (lib/freio-rapido.ts): o chat manda no máximo 20 por
// minuto; acima de 40 é script.

export async function POST(requisicao: Request) {
  if (!freioRapido("chat-digitando", origemDaRequisicao(requisicao), 40)) {
    return new NextResponse(null, { status: 429 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const chave =
    typeof corpo.chave === "string" ? corpo.chave.replace(/[^a-f0-9]/g, "") : "";
  if (chave.length !== 32) return new NextResponse(null, { status: 400 });

  await clienteDigitando(chave);
  return new NextResponse(null, { status: 204 });
}
