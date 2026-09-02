import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const COOKIE_ACESSO = "lanca_acesso";

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
  const liberado = Boolean(senha) && request.cookies.get(COOKIE_ACESSO)?.value === senha;
  if (liberado) return NextResponse.next();

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
