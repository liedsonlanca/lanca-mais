import type { ReactNode } from "react";
import Link from "next/link";
import { siteEstaAberto } from "@/lib/modo-site";
import { siteConfig } from "@/lib/site-config";

// Moldura de leitura das páginas legais.
//
// Elas não competem com o resto do site: sem animação de entrada, sem acento
// de cor a cada parágrafo, medida de linha curta. Quem abre uma política está
// procurando uma informação específica, e o que ajuda ali é hierarquia clara e
// linha curta, não personalidade.
//
// Antes do lançamento ela muda de moldura. Estas páginas atravessam o portão
// de propósito, porque o aviso de cookies da Em breve precisa apontar para
// elas — só que, chegando aqui, a pessoa encontrava o menu do site inteiro, e
// clicar em qualquer item devolvia para a Em breve. Com o site fechado, o menu
// e o rodapé somem (ver globals.css) e entra uma saída que leva a algum lugar.
export async function PaginaLegal({
  atualizadoEm,
  children,
}: {
  /** Data da última revisão, no formato que a pessoa lê. */
  atualizadoEm: string;
  children: ReactNode;
}) {
  const aberto = await siteEstaAberto();

  return (
    <section
      className={`relative overflow-hidden bg-papel ${
        aberto ? "" : "pagina-legal-fechada"
      }`}
    >
      <div className="mx-auto max-w-2xl px-6 py-12 lg:py-16">
        <p className="eyebrow text-preto/45">
          Atualizada em {atualizadoEm}
        </p>
        <div className="mt-10 space-y-10">{children}</div>

        {!aberto && (
          <div className="mt-16 border-t border-linha pt-8">
            <p className="text-sm text-preto/60">
              O site ainda não abriu ao público. Enquanto isso, a equipe da{" "}
              {siteConfig.name} continua atendendo normalmente.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="flex min-h-11 items-center rounded-full border border-linha px-5 text-sm text-preto/75 transition-colors duration-300 hover:border-salmon hover:text-salmon-texto"
              >
                Voltar
              </Link>
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center rounded-full bg-salmon-texto px-5 text-sm font-medium text-branco transition-opacity duration-300 hover:opacity-90"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold text-preto">
        {titulo}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-preto/72">
        {children}
      </div>
    </div>
  );
}

export function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="space-y-3">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            aria-hidden
            className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-salmon"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
