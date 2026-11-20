import { NextResponse } from "next/server";
import { clienteDigitando } from "@/lib/conversas";

// O visitante está digitando.
//
// O navegador chama no máximo a cada três segundos enquanto a pessoa
// escreve, e só com a conversa na equipe — é o que faz aparecer o
// "digitando…" no painel, e o que faz quem atende esperar a frase terminar
// em vez de responder por cima.
//
// Sem freio por endereço: a chave é sorteada e impossível de adivinhar, o
// pior que um abuso consegue é acender o próprio "digitando…", e a consulta
// é um UPDATE por chave primária.

export async function POST(requisicao: Request) {
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
