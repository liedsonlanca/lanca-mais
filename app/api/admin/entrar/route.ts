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

// Abre a sessão do painel, em duas etapas quando o segundo fator está ativo:
// primeiro a senha, depois o código de seis dígitos do aplicativo.
//
// Antes as duas viajavam juntas e a recusa não dizia qual das duas errou, para
// não confirmar uma senha a quem estivesse adivinhando. O preço disso apareceu
// na prática: quem esquece a senha fica sem saber se o problema é ela ou o
// código, e gasta o freio inteiro tentando descobrir.
//
// Agora a senha é conferida sozinha. Isso de fato confirma a senha a quem
// acertar, mas o custo de tentar continua o mesmo de antes: oito erros por
// endereço a cada quinze minutos, e o código de seis dígitos ainda barra a
// entrada. O que muda é só quem já sabe a senha saber que sabe.

/** Aviso de tentativas restantes, só quando começa a ficar perto do limite. */
function comSaldo(base: string, restantes: number) {
  return restantes <= 3
    ? `${base} ${
        restantes === 1 ? "Resta 1 tentativa." : `Restam ${restantes} tentativas.`
      }`
    : base;
}

/** Quanto falta para a janela do freio vencer, em texto. */
function esperaEmTexto(ate: number) {
  const minutos = Math.ceil((ate - Date.now()) / 60_000);
  if (!Number.isFinite(minutos) || minutos <= 1) return "1 minuto";
  return `${minutos} minutos`;
}

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
        erro: `Muitas tentativas. Tente de novo em ${esperaEmTexto(freio.ate)}.`,
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
  const restantes = Math.max(0, freio.restantes - 1);

  // ---------- Etapa 1: a senha ----------
  //
  // Conferida em tempo constante. Comparar com !== para na primeira letra
  // diferente, e o tempo revela quantos caracteres estavam certos.
  if (!comparaSegura(senha, senhaCorreta)) {
    await registrarFalha("admin", origem);
    // Atraso curto, que atrapalha a tentativa manual sem travar o servidor.
    await new Promise((r) => setTimeout(r, 600));

    return NextResponse.json(
      { erro: comSaldo("Senha incorreta.", restantes), campo: "senha" },
      { status: 401 }
    );
  }

  // Senha certa e existe segundo fator: para aqui e pede o código. Nada de
  // cookie ainda, e nenhuma falha registrada — acertar não gasta tentativa.
  //
  // A senha volta no próximo envio e é conferida de novo, em vez de o servidor
  // guardar um passe de "já conferi". Sem passe não há passe para roubar, e a
  // etapa dois nunca vale sem a senha na mão.
  if (segredo && !codigo) {
    return NextResponse.json({ etapa: "codigo" });
  }

  // ---------- Etapa 2: o código ----------
  if (segredo && !(await codigoValido(segredo, codigo))) {
    await registrarFalha("admin", origem);
    await new Promise((r) => setTimeout(r, 600));

    return NextResponse.json(
      {
        erro: comSaldo(
          "Código incorreto. Ele muda a cada 30 segundos.",
          restantes
        ),
        campo: "codigo",
        etapa: "codigo",
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
