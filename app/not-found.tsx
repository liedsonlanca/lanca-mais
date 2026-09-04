import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "@/components/motion/Reveal";
import WordReveal from "@/components/motion/WordReveal";
import { siteConfig, navLinks } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

// Página de erro 404.
//
// A que vinha por padrão era um "404: This page could not be found" em inglês,
// sobre fundo branco, sem nenhuma relação com o site. Quem chega aqui já errou
// o caminho uma vez; receber essa pessoa em outro idioma e sem saída é perdê-la
// de vez.
//
// Ela é escura como os topos das páginas internas, porque precisa se distinguir
// de uma página comum num relance: a pessoa entende que algo saiu do lugar
// antes mesmo de ler.
//
// robots: index falso, follow verdadeiro. Não faz sentido indexar um erro, mas
// os links daqui devem continuar sendo seguidos — é justamente por eles que a
// visita se recupera.
export default function NaoEncontrada() {
  return (
    <section className="superficie-escura noise relative overflow-hidden bg-abismo">
      <div className="glow-salmon pointer-events-none absolute left-1/2 top-1/3 h-[520px] w-[720px] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-3xl" />

      <div className="relative mx-auto flex min-h-[78vh] max-w-3xl flex-col items-center justify-center px-6 py-32 text-center">
        <Reveal>
          <span className="eyebrow inline-flex items-center gap-3 rounded-full border border-borda px-4 py-1.5 text-bege/78">
            <span className="h-1 w-1 rounded-full bg-salmon" />
            Erro 404
          </span>
        </Reveal>

        <h1 className="font-heading mt-7 text-4xl font-semibold leading-[1.06] text-bege md:text-6xl">
          <WordReveal
            linhas={[
              { texto: "Esta página" },
              { texto: "saiu do ar.", acento: "do ar." },
            ]}
            delay={0.2}
          />
        </h1>

        <Reveal delay={0.35}>
          <p className="mx-auto mt-7 max-w-md leading-relaxed text-bege/72">
            Pode ter mudado de endereço, ou o link que trouxe você até aqui pode
            estar desatualizado. O resto do site continua inteiro.
          </p>
        </Reveal>

        {/* Saídas, e não um botão só: quem errou o caminho não sabe
            necessariamente para onde queria ir. */}
        <Reveal delay={0.5}>
          <nav
            aria-label="Para onde ir"
            className="mt-10 flex flex-wrap items-center justify-center gap-2"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center rounded-full border border-borda px-5 text-sm text-bege/85 transition-colors duration-300 hover:border-salmon hover:text-salmon"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </Reveal>

        <Reveal delay={0.65}>
          <p className="mt-10 text-sm text-bege/55">
            Procurava algo específico?{" "}
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-salmon underline decoration-salmon/40 underline-offset-4 transition-colors duration-300 hover:decoration-salmon"
            >
              Fale com a equipe
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}
