import Image from "next/image";
import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import FormularioAcesso from "@/components/FormularioAcesso";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "600", "700"],
  style: ["normal", "italic"],
  variable: "--fonte-em-breve-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--fonte-em-breve-texto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Em manutenção",
  description: `${siteConfig.name} volta em instantes.`,
  robots: { index: false, follow: false },
};

// Página de manutenção.
//
// Mora numa rota própria, e não como variação da Em breve, porque as duas
// dizem coisas diferentes: "em breve" promete uma novidade e pede paciência;
// manutenção avisa que algo já existente saiu do ar por pouco tempo. Misturar
// as duas confundiria quem já conhece o site.
//
// Por isso ela é mais curta e mais sóbria: ninguém quer ler uma página bonita
// quando só queria entrar.
export default function ManutencaoPage() {
  return (
    <section
      data-lenis-prevent
      className={`${cormorant.variable} ${jakarta.variable} pagina-em-breve noise fixed inset-0 z-[100] overflow-y-auto bg-[#0D0D0B] text-[#E8E4D9]`}
      style={{ fontFamily: "var(--fonte-em-breve-texto), system-ui, sans-serif" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0B] via-[#141412] to-[#0D0D0B]" />

      <div className="relative mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <Image
          src="/images/logo-1.png"
          alt={siteConfig.name}
          width={220}
          height={62}
          priority
          className="h-9 w-auto sm:h-11"
        />

        {/* Três pontos pulsando, em vez de um ícone de engrenagem: o site não
            está quebrado, está trabalhando. */}
        <span aria-hidden className="mt-12 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-pulse rounded-full bg-[#D97B45]"
              style={{ animationDelay: `${i * 0.25}s`, animationDuration: "1.4s" }}
            />
          ))}
        </span>

        <h1
          className="mt-10 text-[clamp(2.25rem,8vw,3.5rem)] font-semibold leading-tight"
          style={{ fontFamily: "var(--fonte-em-breve-display), Georgia, serif" }}
        >
          Voltamos <em className="text-[#D97B45]">em instantes.</em>
        </h1>

        <p className="mt-6 max-w-md leading-relaxed text-[#E8E4D9]/70">
          Estamos fazendo uma manutenção rápida no site. Se precisar de algo
          agora, a equipe continua respondendo pelos canais de sempre.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href={`https://wa.me/${siteConfig.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#D97B45] px-7 py-3.5 font-medium text-[#0D0D0B] transition-opacity duration-300 hover:opacity-90"
          >
            Falar no WhatsApp
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="rounded-full border border-[#E8E4D9]/20 px-7 py-3.5 font-medium text-[#E8E4D9] transition-colors duration-300 hover:border-[#D97B45]"
          >
            {siteConfig.email}
          </a>
        </div>

        <div className="mt-14">
          <FormularioAcesso />
        </div>
      </div>
    </section>
  );
}
