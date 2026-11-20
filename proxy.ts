import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { montarSessao, sessaoValida } from "@/lib/seguranca";
import { lerConfigSite, siteEstaAberto } from "@/lib/modo-site";

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

// O cookie leva "carimbo.assinatura", nunca a senha (ver lib/seguranca.ts).
export async function montarValorAcesso(senha: string) {
  return montarSessao(senha);
}

// Porteiro do site.
//
// Três estados, escolhidos no painel: público, em breve e manutenção. Quem
// tem a senha de pré-lançamento atravessa qualquer um deles, para poder
// conferir o site fechado.
//
// A contagem regressiva abre o site sozinha na hora marcada — o porteiro
// compara a data a cada visita, então o lançamento acontece mesmo sem
// ninguém por perto.
//
// SITE_PUBLICO=1 continua existindo como alavanca de emergência: ela vence
// tudo e não depende do banco, para o caso de o painel estar inacessível.
//
// No Next 16 o arquivo `middleware` foi renomeado para `proxy`.
export async function proxy(request: NextRequest) {
  // A leitura do banco fica para depois de propósito: SITE_PUBLICO responde
  // sem consultar nada, e essa é a razão de ela existir — vale quando o
  // banco, e portanto o painel, está fora do ar.
  const aberto = await siteEstaAberto();

  const senha = process.env.SENHA_PREVIA;
  const temSenha =
    Boolean(senha) &&
    (await sessaoValida(
      request.cookies.get(COOKIE_ACESSO)?.value,
      senha as string,
      JANELA_ACESSO_MS
    ));

  if (aberto || temSenha) {
    const resposta = NextResponse.next();

    // Renova a janela a cada página vista, para não expulsar quem está
    // navegando no meio da visita.
    if (temSenha && senha) {
      resposta.cookies.set({
        name: COOKIE_ACESSO,
        value: await montarValorAcesso(senha),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      // Um aviso legível pelo navegador de que esta pessoa está vendo o site
      // por dentro, pela senha de pré-visualização.
      //
      // Serve só para o chat aparecer para ela: com o site em "em breve", o
      // layout não sabe quem passou pelo porteiro, e o chat ficava escondido
      // justamente de quem está vendo o site de verdade. Não é credencial —
      // quem o forjasse veria só o balão do chat, e as rotas do chat já são
      // abertas. A credencial continua sendo o cookie acima, httpOnly.
      resposta.cookies.set({
        name: "lanca_previa",
        value: "1",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: Math.floor(JANELA_ACESSO_MS / 1000),
      });
    }

    return resposta;
  }

  // Reescreve, não redireciona: a URL original permanece na barra, então quem
  // tem o link de uma página interna volta direto para ela depois de entrar.
  const config = await lerConfigSite();
  const destino = config.modo === "manutencao" ? "/manutencao" : "/em-breve";
  return NextResponse.rewrite(new URL(destino, request.url));
}

export const config = {
  matcher: [
    // Tudo, menos as próprias páginas de espera, a rota que valida a senha,
    // os assets e o robots.txt (que precisa continuar respondendo para os
    // buscadores enquanto o site está fechado).
    //
    // As páginas legais também ficam de fora, e não por conveniência: o aviso
    // de cookies aparece na Em breve e é obrigado a apontar para elas. Atrás
    // do portão, clicar no link devolvia a pessoa para a própria Em breve, e
    // o consentimento deixava de ser informado — que é o requisito que o
    // aviso existe para cumprir.
    //
    // O painel também fica de fora: ele tem senha própria (ADMIN_SENHA) e não
    // deve exigir as duas. Ficar fora daqui não o expõe — sem a senha do
    // painel ele não abre, e essa continua sendo a única porta.
    //
    // O endereço dele não é "/admin" de propósito. Isso não é segurança: quem
    // souber o caminho continua chegando, e quem não souber continua parado na
    // senha. O ganho é tirar o painel da lista que os robôs varrem sozinhos, o
    // que reduz tentativa automática e limpa o registro de acessos.
    // E as rotas de API, todas elas — não só a da senha e a do painel.
    //
    // Reescrever uma API para uma página HTML não é fechar o site: é dar
    // resposta errada com status 200. Quem chamou esperava JSON e recebeu
    // "<!DOCTYPE html>", então o código do outro lado quebra sem entender.
    //
    // Na prática, com o site em "em breve" isso matava três coisas de uma
    // vez: o chat (a mensagem sumia e a pessoa via "a mensagem não foi"), o
    // formulário de orçamento, e a contagem de visitas — ou seja, a tela de
    // espera não aparecia nos números do painel justamente enquanto ela era
    // a única página que todo mundo via.
    //
    // Deixá-las de fora não abre nada: nenhuma delas serve conteúdo do site.
    // As que mexem em dado da agência têm portão próprio, e as públicas têm
    // teto por endereço.
    "/((?!em-breve|manutencao|lncadmin|politica-de-cookies|politica-de-privacidade|aviso-legal|termos-de-uso|api|robots.txt|_next/static|_next/image|images|fonts|favicon.ico).*)",
  ],
};
