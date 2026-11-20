import { NextResponse } from "next/server";
import { painelLiberado } from "@/lib/admin";
import { sinaisDaConversa } from "@/lib/conversas";

// Os sinais de uma conversa, para a tela do painel perguntar a cada poucos
// segundos sem recarregar a página inteira: a última mensagem, se o
// visitante está digitando e se ele já viu a resposta.
//
// A tela só recarrega de verdade quando a última mensagem muda. É o que
// deixa o painel com cara de tempo real sem refazer, a cada três segundos,
// as consultas de lista, histórico e dados de contato.

export const dynamic = "force-dynamic";

export async function GET(
  _requisicao: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await painelLiberado())) {
    return new NextResponse(null, { status: 401 });
  }

  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) {
    return new NextResponse(null, { status: 400 });
  }

  return NextResponse.json(await sinaisDaConversa(numero), {
    headers: { "Cache-Control": "no-store" },
  });
}
