import Link from "next/link";
import type { Metadata } from "next";
import { estadoDoAdmin } from "@/lib/admin";
import LoginAdmin from "@/components/admin/LoginAdmin";
import SairDoAdmin from "@/components/admin/SairDoAdmin";

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
const SECOES = [
  { href: "/admin/vitrine", rotulo: "Nosso trabalho" },
  { href: "/admin/depoimentos", rotulo: "Depoimentos" },
  { href: "/admin/cases", rotulo: "Cases" },
  { href: "/admin/logos", rotulo: "Logos" },
  { href: "/admin/numeros", rotulo: "Números" },
  { href: "/admin/blog", rotulo: "Blog" },
  { href: "/admin/seguranca", rotulo: "Segurança" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const estado = await estadoDoAdmin();

  if (estado !== "liberado") {
    return (
      <div className="pagina-admin flex min-h-screen items-center justify-center bg-areia px-6">
        <div className="w-full max-w-sm text-center">
          <p className="font-heading text-3xl font-semibold text-preto">
            Painel <span className="text-salmon-texto">LANÇA+</span>
          </p>

          {estado === "sem-senha" ? (
            <p className="mt-6 leading-relaxed text-preto/70">
              O painel ainda não foi configurado. Falta criar a variável de
              ambiente <code className="text-salmon-texto">ADMIN_SENHA</code> no
              projeto da Vercel e publicar de novo.
            </p>
          ) : (
            <div className="mt-8 flex justify-center">
              <LoginAdmin />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pagina-admin min-h-screen bg-areia">
      {/* Cabeçalho pensado para o dedo.
          Cada destino é uma pastilha de 44px de altura, que é o alvo mínimo
          recomendado no toque: antes eram links de 20px enfileirados, e no
          celular era fácil errar o vizinho. No computador nada muda além de um
          respiro a mais. */}
      <header className="border-b border-linha bg-branco">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/admin"
              className="font-heading flex min-h-11 items-center text-lg font-semibold text-preto"
            >
              Painel <span className="ml-1.5 text-salmon-texto">LANÇA+</span>
            </Link>

            <div className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                target="_blank"
                className="flex min-h-11 items-center rounded-full px-3 text-preto/55 transition-colors duration-300 hover:text-preto"
              >
                Ver o site
              </Link>
              <SairDoAdmin />
            </div>
          </div>

          {/* Rola de lado no celular em vez de quebrar em várias fileiras. */}
          <nav className="sem-barra -mx-4 mt-1 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {SECOES.map((secao) => (
              <Link
                key={secao.href}
                href={secao.href}
                className="flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-sm text-preto/65 transition-colors duration-300 hover:bg-areia hover:text-salmon-texto"
              >
                {secao.rotulo}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
