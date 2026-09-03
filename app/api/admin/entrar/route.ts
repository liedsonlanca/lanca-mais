import { NextResponse } from "next/server";
import { COOKIE_ADMIN, montarValorAdmin, segredoTotp } from "@/lib/admin";
import { comparaSegura } from "@/lib/seguranca";
import { codigoValido } from "@/lib/totp";
import {
  podeTentar,
  registrarFalha,
  limparTentativas,
  origemDaRequisicao,
} from "@/lib/tentativas";

// Abre a sessão do painel: senha e, se estiver ativada, o código de seis
// dígitos do aplicativo autenticador.
export async function POST(request: Request) {
  const senhaCorreta = process.env.ADMIN_SENHA;

  if (!senhaCorreta) {
    return NextResponse.json(
      { erro: "Painel não configurado. Falta a variável ADMIN_SENHA." },
      { status: 503 }
    );
  }

  const origem = origemDaRequisicao(request);
  const freio = await podeTentar("admin", origem);

  if (!freio.permitido) {
    return NextResponse.json(
      {
        erro: "Muitas tentativas. Espere 15 minutos antes de tentar de novo.",
      },
      { status: 429 }
    );
  }

  let senha = "";
  let codigo = "";
  try {
    const corpo = await request.json();
    senha = typeof corpo?.senha === "string" ? corpo.senha : "";
    codigo = typeof corpo?.codigo === "string" ? corpo.codigo : "";
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const segredo = await segredoTotp();

  // A senha é conferida em tempo constante, e a resposta não diz qual dos dois
  // errou: dizer "senha certa, código errado" confirmaria a senha a quem está
  // tentando adivinhar.
  const senhaBate = comparaSegura(senha, senhaCorreta);
  const codigoBate = segredo ? await codigoValido(segredo, codigo) : true;

  if (!senhaBate || !codigoBate) {
    await registrarFalha("admin", origem);
    // Atraso curto, que atrapalha a tentativa manual sem travar o servidor.
    await new Promise((r) => setTimeout(r, 600));

    const restantes = Math.max(0, freio.restantes - 1);

    return NextResponse.json(
      {
        // O aviso só aparece quando começa a ficar perto do limite, para não
        // ensinar o contador a quem está sondando.
        erro:
          restantes <= 3
            ? `Dados incorretos. Restam ${restantes} tentativas.`
            : "Dados incorretos.",
        // Diz à tela que existe segunda etapa, para ela mostrar o campo. Isso
        // não vaza nada: quem tem a senha descobriria no primeiro acerto.
        exigeCodigo: Boolean(segredo),
      },
      { status: 401 }
    );
  }

  await limparTentativas("admin", origem);

  const resposta = NextResponse.json({ ok: true });

  resposta.cookies.set({
    name: COOKIE_ADMIN,
    value: await montarValorAdmin(senhaCorreta),
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
