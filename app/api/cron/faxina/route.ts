import { NextResponse } from "next/server";
import { apagarConversasAntigas, encerrarPorSilencio } from "@/lib/conversas";

// A faxina diária, chamada pela Vercel (ver vercel.json).
//
// ---------- O que faz ----------
//
// Encerra o que morreu de silêncio e não foi visto por ninguém — o
// encerramento normal pega carona no movimento do site, e uma conversa
// esquecida num fim de semana sem visitas ficaria aberta até segunda — e
// apaga as conversas encerradas há mais de um ano, como a Política de
// Privacidade promete.
//
// ---------- Quem pode chamar ----------
//
// Com CRON_SECRET definida na Vercel, só quem traz o segredo: é o que a
// própria Vercel manda no cabeçalho. Sem ela, qualquer um pode chamar — e o
// pior que consegue é adiantar uma faxina que já ia acontecer.

export const dynamic = "force-dynamic";

export async function GET(requisicao: Request) {
  const segredo = process.env.CRON_SECRET;
  if (
    segredo &&
    requisicao.headers.get("authorization") !== `Bearer ${segredo}`
  ) {
    return new NextResponse(null, { status: 401 });
  }

  const encerradas = await encerrarPorSilencio(true);
  const apagadas = await apagarConversasAntigas();

  return NextResponse.json({ ok: true, encerradas, apagadas });
}
