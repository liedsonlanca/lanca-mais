import Link from "next/link";
import Image from "next/image";
import Avisos from "@/components/admin/Avisos";
import type { Metadata } from "next";
import { estadoDoAdmin } from "@/lib/admin";
import LoginAdmin from "@/components/admin/LoginAdmin";
import SairDoAdmin from "@/components/admin/SairDoAdmin";
import MenuLateral from "@/components/admin/MenuLateral";
import AtualizacaoViva from "@/components/admin/AtualizacaoViva";
import Notificacoes from "@/components/admin/Notificacoes";
import { lerNotificacoes } from "@/lib/eventos";
import { lerImagens } from "@/lib/conteudo";
import { imagem } from "@/lib/imagens";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

// O painel não é o site: cabeçalho, rodapé e botão do WhatsApp somem, pela
// classe pagina-admin (ver globals.css), do mesmo jeito que na Em breve.
//
// O portão fica aqui, no layout, e não em cada página: é um lugar só para
// conferir, e nenhuma tela do painel pode existir sem passar por ele. As
// Server Actions conferem de novo por conta própria, porque são alcançáveis
// por POST direto, sem passar por esta árvore.
//
// ---------- Por que o painel é claro, e o site escuro ----------
//
// São duas coisas diferentes. O site é vitrine, e o escuro é escolha de
// marca; o painel é ferramenta de trabalho, aberta por horas, e ali o claro
// cansa menos e mostra melhor a imagem que a pessoa está subindo — numa tela
// escura, toda foto parece mais clara do que vai ficar publicada.
//
// Não precisou de nenhuma cor nova: `tema-claro` redefine os mesmos nomes de
// token que o site já usa (ver globals.css), então `bg-cartao` e `text-tinta`
// continuam valendo em todas as telas e passam a dar claro. É por isso que
// esta mudança não tocou nas treze páginas do painel.
//
// ---------- Por que barra lateral, e não abas em cima ----------
//
// São onze seções. Em cima elas viravam uma fileira de pastilhas que rolava
// de lado no celular e quebrava em duas linhas no computador, e em nenhum dos
// dois casos dava para ver onde se está sem ler tudo. Na lateral cabem as
// onze de uma vez, com a atual marcada, e o conteúdo ganha a largura inteira.
//
// Abaixo do `lg` a lateral vira a fileira que rola, porque ali não há largura
// para as duas colunas.

// A tela do blog continua existindo e funcionando; ela só sai do menu
// enquanto BLOG_ATIVO for falso, para não oferecer a edição de uma seção que
// ninguém vê no site.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const estado = await estadoDoAdmin();

  // A versão escura da marca, porque o painel é claro.
  const [imagens, avisos] = await Promise.all([lerImagens(), lerNotificacoes()]);
  const marca = imagem(imagens, "marca-escura");

  if (estado !== "liberado") {
    return (
      <div className="tema-claro pagina-admin flex min-h-screen items-center justify-center bg-fundo-alt px-6">
        <div className="w-full max-w-sm text-center">
          <Image
            src={marca.src}
            alt="LANÇA+"
            width={220}
            height={62}
            priority
            className="mx-auto h-8 w-auto"
          />
          <p className="mt-3 text-sm text-tinta/55">Painel</p>

          {estado === "sem-senha" ? (
            <p className="mt-4 rounded-2xl border border-contorno bg-cartao p-5 text-sm leading-relaxed text-tinta/70">
              Falta a senha do painel no projeto. Defina a variável{" "}
              <span className="text-destaque">ADMIN_SENHA</span> na Vercel e
              recarregue esta página.
            </p>
          ) : (
            <div className="mt-8">
              <LoginAdmin />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tema-claro pagina-admin min-h-screen bg-fundo-alt text-tinta">
      {/* Sem largura máxima aqui: a lateral tem que encostar na borda da
          janela, como na referência. Com o conjunto centrado numa caixa de
          1400px, numa tela larga sobravam duzentos e tantos pixels de cada
          lado e a lateral ficava boiando no meio do nada.
          Quem ganha limite é só o conteúdo, lá dentro, porque linha de texto
          atravessando 1900px não se lê. */}
      <div className="flex w-full flex-col lg:flex-row">
        {/* ---------- Barra lateral ---------- */}
        {/* `lg:overflow-y-auto`: a lateral tem altura de tela cheia, e com
            treze seções ela passou a ser mais alta do que isso em notebook —
            o "Sair" lá embaixo empurrava a página inteira a rolar, mesmo nas
            telas que cabiam por conta própria.

            Agora ela rola por dentro quando não couber, e o resto do painel
            fica onde está. */}
        <aside className="border-b border-contorno bg-cartao lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 px-5 py-4 lg:py-6">
            <Link
              href="/lncadmin"
              className="flex min-h-11 items-center gap-2.5"
            >
              <Image
                src={marca.src}
                alt="LANÇA+"
                width={220}
                height={62}
                priority
                className="h-6 w-auto"
              />
              <span className="text-sm text-tinta/45">Painel</span>
            </Link>

            {/* No celular as duas ações moram aqui, ao lado da marca; do lg
                para cima descem para o pé da lateral, onde não disputam
                espaço com a lista. */}
            <div className="flex items-center gap-1 text-sm">
              {/* O sino fica em toda largura: é o aviso de que há alguém no
                  site agora, e isso não pode depender do tamanho da tela. */}
              <Notificacoes lista={avisos} />

              <div className="flex items-center gap-1 lg:hidden">
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener"
                  className="flex min-h-11 items-center rounded-full px-3 text-tinta/55 transition-colors duration-300 hover:text-tinta"
                >
                  Ver o site
                </Link>
                <SairDoAdmin />
              </div>
            </div>
          </div>

          {/* A ação principal no topo da lateral, como na referência.
              Lá é "Nova Venda"; aqui o que a pessoa mais faz depois de
              salvar é conferir no site, então é esse o lugar dele. */}
          <div className="px-3 pb-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-tinta px-4 text-sm font-medium text-fundo transition-opacity duration-300 hover:opacity-90"
            >
              Ver o site
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </Link>
          </div>

          <MenuLateral />

          <div className="mt-auto hidden border-t border-contorno px-3 py-3 lg:block">
            <Link
              href="/"
              target="_blank"
              rel="noopener"
              className="flex min-h-11 items-center rounded-xl px-3.5 text-sm text-tinta/55 transition-colors duration-300 hover:bg-fundo-alt hover:text-tinta"
            >
              Ver o site
            </Link>
            <SairDoAdmin />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-[1200px]">
            {children}
          </div>
        </main>
      </div>

      {/* O painel se reconsulta sozinho enquanto a aba estiver a vista.
          Mora aqui, no layout, para valer nas treze telas. */}
      <AtualizacaoViva />

      {/* Os recados das ações. Fixo no canto, por cima de tudo, então mora
          fora do <main> e não entra no fluxo de nenhuma tela. */}
      <Avisos />
    </div>
  );
}
