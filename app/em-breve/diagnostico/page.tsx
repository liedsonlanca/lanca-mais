import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

// O diagnóstico dentro da tela de espera.
//
// ---------- Por que uma rota, e não um parâmetro ----------
//
// A primeira versão era `/em-breve?diagnostico=1`: a mesma página decidia o
// que mostrar pelo parâmetro. Lia bem no servidor e não funcionava no
// navegador — clicar no botão não mudava nem o endereço. O roteador do App
// Router não refaz a tela quando só o parâmetro muda e o caminho é o mesmo.
//
// Caminho próprio não tem esse caso de borda: é outra rota, e o roteador
// navega. De quebra o "Voltar" vira um link comum, o botão de voltar do
// navegador funciona, e nada aqui depende de JavaScript.
//
// O portão de pré-lançamento deixa passar: o filtro dele exclui tudo que
// começa com `em-breve` (ver proxy.ts), e isto começa.
//
// ---------- Por que embutido, e não um link para fora ----------
//
// Abrir o fluxo noutra aba tirava a pessoa do endereço da agência e a punha
// num domínio que ela não reconhece, sem nada em volta dizendo de quem é.
// Aqui ela não sai do lugar, e a saída é explícita na faixa de cima.
//
// A página /diagnostico do site não serve para isto: ela mostra o menu, e com
// o site fechado cada item desse menu devolveria a pessoa para a tela de
// espera — beco em todo link.

export const metadata: Metadata = {
  title: "Diagnóstico",
  robots: { index: false, follow: false },
};

export default function DiagnosticoEmBrevePage() {
  return (
    // pagina-em-breve é o gancho que esconde cabeçalho, rodapé e o botão
    // flutuante do site (ver globals.css): aqui a tela é só o fluxo.
    <section className="pagina-em-breve fixed inset-0 z-[100] flex flex-col bg-abismo">
      <div className="flex shrink-0 items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link
          href="/em-breve"
          className="group inline-flex min-h-11 items-center gap-2.5 text-sm font-medium text-bege/70 transition-colors duration-500 hover:text-bege"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 transition-transform duration-500 group-hover:-translate-x-1"
          >
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Voltar
        </Link>

        {/* Texto, e não a marca: o fluxo traz o próprio logo, e dois LANÇA+ a
            poucos centímetros é o mesmo problema que a página /diagnostico
            teve. */}
        <span className="text-xs text-bege/40 sm:text-sm">
          Diagnóstico gratuito
        </span>
      </div>

      <iframe
        src={siteConfig.diagnosticoUrl}
        title="Diagnóstico LANÇA+"
        className="block w-full flex-1 border-0"
      />
    </section>
  );
}
