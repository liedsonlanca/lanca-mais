import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const COOKIE_ACESSO = "lanca_acesso";

// Janela de inatividade do acesso de pré-lançamento.
//
// O cookie já é de sessão (sem maxAge), mas isso não basta: o Chrome com
// "Continuar de onde você parou" restaura cookies de sessão ao reabrir, e o
// site voltava aberto. Confiar no navegador descartar não funciona, então o
// prazo passa a ser conferido aqui, no servidor.
//
// É uma janela deslizante: cada página vista renova o cookie, então quem está
// navegando não é interrompido. Parou de usar por mais tempo que isto, a senha
// é pedida de novo.
export const JANELA_ACESSO_MS = 30 * 60 * 1000;

// O valor do cookie é "<senha>.<emitidoEm>". Não é assinado de propósito:
// forjar exigiria conhecer a senha, que já é o segredo do portão, então uma
// assinatura não acrescentaria nada.
export function montarValorAcesso(senha: string) {
  return `${senha}.${Date.now()}`;
}

export function lerValorAcesso(valor: string | undefined) {
  if (!valor) return null;

  // Último ponto, e não o primeiro: a senha pode conter pontos.
  const corte = valor.lastIndexOf(".");
  if (corte === -1) return null;

  const emitidoEm = Number(valor.slice(corte + 1));
  if (!Number.isFinite(emitidoEm)) return null;

  return { senha: valor.slice(0, corte), emitidoEm };
}

// Porteiro do site em pré-lançamento.
//
// Por padrão todo visitante cai na página "Em breve". Quem acerta a senha
// (SENHA_PREVIA) recebe um cookie e passa a ver o site. Para abrir ao público,
// defina SITE_PUBLICO=1.
//
// No Next 16 o arquivo `middleware` foi renomeado para `proxy`.
export function proxy(request: NextRequest) {
  // Falha fechado de propósito: o site só abre ao público quando alguém liga
  // SITE_PUBLICO explicitamente. Assim um deploy novo, sem variáveis, nasce em
  // pré-lançamento, e não expondo por acidente o conteúdo ainda de exemplo.
  if (process.env.SITE_PUBLICO === "1") return NextResponse.next();

  const senha = process.env.SENHA_PREVIA;
  const guardado = lerValorAcesso(request.cookies.get(COOKIE_ACESSO)?.value);

  const liberado =
    Boolean(senha) &&
    guardado !== null &&
    guardado.senha === senha &&
    Date.now() - guardado.emitidoEm < JANELA_ACESSO_MS;

  if (liberado) {
    // Renova a janela a cada página vista, para não expulsar quem está
    // navegando no meio da visita.
    const resposta = NextResponse.next();
    resposta.cookies.set({
      name: COOKIE_ACESSO,
      value: montarValorAcesso(senha as string),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return resposta;
  }

  // Reescreve, não redireciona: a URL original permanece na barra, então quem
  // tem o link de uma página interna volta direto para ela depois de entrar.
  return NextResponse.rewrite(new URL("/em-breve", request.url));
}

export const config = {
  matcher: [
    // Tudo, menos a própria página Em breve, a rota que valida a senha,
    // os assets e o robots.txt (que precisa continuar respondendo para os
    // buscadores enquanto o site está fechado).
    "/((?!em-breve|api/acesso|robots.txt|_next/static|_next/image|images|fonts|favicon.ico).*)",
  ],
};
