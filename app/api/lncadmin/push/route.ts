import { NextResponse } from "next/server";
import { painelLiberado } from "@/lib/admin";
import { chavePublica, esquecerAparelho, guardarAparelho } from "@/lib/push";

// Cadastro dos aparelhos da equipe para receber avisos do chat.
//
// Só com o painel liberado: um aparelho cadastrado recebe nome e trecho da
// mensagem de cada visitante, então cadastrar é coisa de quem já pode ler as
// conversas.

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await painelLiberado())) return new NextResponse(null, { status: 401 });
  return NextResponse.json({ chave: await chavePublica() });
}

function inscricaoValida(valor: unknown): valor is {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  const v = valor as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  return (
    typeof v?.endpoint === "string" &&
    v.endpoint.startsWith("https://") &&
    v.endpoint.length < 1000 &&
    typeof v.keys?.p256dh === "string" &&
    typeof v.keys?.auth === "string"
  );
}

export async function POST(requisicao: Request) {
  if (!(await painelLiberado())) return new NextResponse(null, { status: 401 });
  try {
    const corpo = await requisicao.json();
    if (!inscricaoValida(corpo)) return new NextResponse(null, { status: 400 });
    await guardarAparelho(corpo);
    return NextResponse.json({ ok: true });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}

export async function DELETE(requisicao: Request) {
  if (!(await painelLiberado())) return new NextResponse(null, { status: 401 });
  try {
    const corpo = (await requisicao.json()) as { endpoint?: unknown };
    if (typeof corpo.endpoint === "string") await esquecerAparelho(corpo.endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}
