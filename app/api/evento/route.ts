import { NextResponse } from "next/server";
import { impressaoDoVisitante } from "@/lib/acessos";
import { registrarEvento, tipoValido } from "@/lib/eventos";

// Onde os sinais de interesse são anotados.
//
// Mesma regra da rota de visitas: o endereço de rede entra só no cálculo da
// impressão e é descartado na mesma linha, e responde 204 sempre, porque
// avisar é acessório e um erro aqui não pode virar erro na tela de quem está
// lendo.
//
// A diferença é o tipo, e ele vem de uma lista fechada: sem isso, qualquer um
// poderia inventar um tipo e encher o painel da agência com aviso falso. Com
// a lista, o pior que se consegue é repetir um sinal que já existe — e isso
// o limite por origem segura.

export const dynamic = "force-dynamic";

export async function POST(requisicao: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const tipo = typeof corpo.tipo === "string" ? corpo.tipo : "";
  if (!tipoValido(tipo)) return new NextResponse(null, { status: 204 });

  // O painel não gera sinal: a agência olhando o próprio diagnóstico viraria
  // "alguém no diagnóstico agora", e o aviso perderia o sentido.
  const caminho = typeof corpo.caminho === "string" ? corpo.caminho : "";
  if (caminho.startsWith("/lncadmin")) {
    return new NextResponse(null, { status: 204 });
  }

  const ip =
    requisicao.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requisicao.headers.get("x-real-ip") ||
    "desconhecido";

  await registrarEvento({
    tipo,
    visitante: await impressaoDoVisitante(
      ip,
      requisicao.headers.get("user-agent") ?? ""
    ),
    caminho,
    detalhe: typeof corpo.detalhe === "string" ? corpo.detalhe : undefined,
  });

  return new NextResponse(null, { status: 204 });
}
