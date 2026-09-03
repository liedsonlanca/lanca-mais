import { NextResponse } from "next/server";
import { COOKIE_ADMIN, montarValorAdmin } from "@/lib/admin";

// Valida a senha do painel e abre a sessão neste navegador.
export async function POST(request: Request) {
  const senhaCorreta = process.env.ADMIN_SENHA;

  if (!senhaCorreta) {
    return NextResponse.json(
      { erro: "Painel não configurado. Falta a variável ADMIN_SENHA." },
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
    name: COOKIE_ADMIN,
    value: montarValorAdmin(senhaCorreta),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return resposta;
}

// Sair do painel.
export async function DELETE() {
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set({
    name: COOKIE_ADMIN,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return resposta;
}
