import { NextResponse } from "next/server";
import { COOKIE_ACESSO, montarValorAcesso } from "@/proxy";

// Valida a senha de pré-lançamento e libera o site neste navegador.
export async function POST(request: Request) {
  const senhaCorreta = process.env.SENHA_PREVIA;

  if (!senhaCorreta) {
    return NextResponse.json(
      { erro: "Acesso de pré-lançamento não configurado." },
      { status: 503 }
    );
  }

  let enviada = "";
  try {
    const corpo = await request.json();
    enviada = typeof corpo?.senha === "string" ? corpo.senha : "";
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  if (enviada !== senhaCorreta) {
    // Atraso curto para desencorajar tentativa em massa.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  const resposta = NextResponse.json({ ok: true });

  resposta.cookies.set({
    name: COOKIE_ACESSO,
    value: montarValorAcesso(senhaCorreta),
    // httpOnly: o cookie não fica exposto a scripts da página.
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Sem maxAge nem expires: o cookie é de sessão e o navegador deveria
    // descartá-lo ao fechar. Como o Chrome restaura sessão e não descarta, o
    // prazo de verdade é o carimbo de tempo dentro do valor, conferido pelo
    // porteiro em proxy.ts.
  });

  return resposta;
}
