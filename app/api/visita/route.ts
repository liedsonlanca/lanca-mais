import { NextResponse } from "next/server";
import { impressaoDoVisitante, registrarAcesso } from "@/lib/acessos";

// Onde as visitas do site são anotadas.
//
// ---------- Por que uma rota, e não um script de terceiro ----------
//
// Ver lib/acessos.ts. Em resumo: o dado é da agência, o painel lê direto, e
// não depende de alguém aceitar cookie para o número existir.
//
// ---------- O que entra, e o que nunca entra ----------
//
// Entra o caminho da página e o domínio de onde a pessoa veio. O endereço de
// rede e o navegador entram só no cálculo da impressão, e são descartados na
// mesma linha — o que chega ao banco é um hash de doze bytes que muda de dia.
//
// Não entra endereço completo de origem, só o domínio: o caminho inteiro de
// onde alguém veio costuma carregar termo de busca e identificador de
// campanha, e nada disso é preciso para dizer "vieram do Instagram".
//
// ---------- Por que falha em silêncio ----------
//
// Medir é acessório. Se o banco está fora, a resposta continua sendo 204 e o
// site segue — um erro aqui não pode virar erro no console de quem está
// lendo a página.
//
// ---------- Por que não é GET ----------
//
// GET é cacheável, e um intermediário que guardasse a resposta faria a visita
// seguinte nem chegar aqui. POST nunca é guardado por engano.

export const dynamic = "force-dynamic";

/** Caminhos que não são visita de público. */
function medivel(caminho: string) {
  if (!caminho.startsWith("/")) return false;
  // O painel é trabalho da agência; contá-lo inflaria o próprio número que a
  // agência abre o painel para ver.
  return !caminho.startsWith("/lncadmin") && !caminho.startsWith("/api");
}

/** Só o domínio de onde veio, e vazio quando foi o próprio site. */
function origem(referencia: string, anfitriao: string | null) {
  if (!referencia) return "";
  try {
    const url = new URL(referencia);
    if (anfitriao && url.host === anfitriao) return "";
    return url.host;
  } catch {
    return "";
  }
}

export async function POST(requisicao: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const caminho = typeof corpo.caminho === "string" ? corpo.caminho : "";
  const referencia =
    typeof corpo.referencia === "string" ? corpo.referencia : "";

  if (!medivel(caminho)) return new NextResponse(null, { status: 204 });

  const ip =
    requisicao.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requisicao.headers.get("x-real-ip") ||
    "desconhecido";
  const navegador = requisicao.headers.get("user-agent") ?? "";

  await registrarAcesso({
    caminho,
    visitante: await impressaoDoVisitante(ip, navegador),
    referencia: origem(referencia, requisicao.headers.get("host")),
  });

  // 204: não há nada para devolver, e o navegador não precisa esperar corpo.
  return new NextResponse(null, { status: 204 });
}
