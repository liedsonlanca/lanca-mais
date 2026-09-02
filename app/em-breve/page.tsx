import Image from "next/image";
import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import FormularioAcesso from "@/components/FormularioAcesso";

// A página Em breve mantém a tipografia e as cores da versão que já está no ar:
// ela é a face pública da marca hoje e não deve mudar de cara na migração.
// Por isso usa Cormorant Garamond e Plus Jakarta Sans, e não as fontes do site
// novo (Palmore e Google Sans).
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--fonte-em-breve-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--fonte-em-breve-texto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Em breve",
  description: `${siteConfig.name}. ${siteConfig.tagline}`,
  // O site ainda não está pronto: nada aqui deve ser indexado.
  robots: { index: false, follow: false },
};

const canais = [
  {
    rotulo: "WhatsApp",
    valor: "(83) 99106-0691",
    href: `https://wa.me/${siteConfig.whatsappNumber}`,
    externo: true,
    icone: (
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm4.52 14.15c-.21.58-1.21 1.11-1.68 1.18-.42.06-.96.09-1.55-.1-.35-.12-.81-.27-1.4-.52-2.46-1.07-4.07-3.54-4.19-3.71-.12-.16-1-1.32-1-2.52 0-1.2.63-1.79.86-2.04.23-.25.49-.31.66-.31h.48c.15.01.36-.05.56.43.21.5.71 1.73.77 1.85.06.12.1.26.02.43-.09.16-.13.27-.25.41-.12.14-.26.32-.37.43-.13.13-.25.26-.11.51.15.25.64 1.06 1.38 1.71.95.84 1.74 1.1 1.99 1.22.25.13.4.11.54-.06.14-.16.61-.72.78-.97.17-.25.33-.21.56-.13.23.09 1.45.69 1.7.81.25.12.42.18.48.28.06.1.06.6-.15 1.18Z" />
    ),
  },
  {
    rotulo: "E-mail",
    valor: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
    externo: false,
    icone: (
      <>
        <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
  },
  {
    rotulo: "Instagram",
    valor: siteConfig.instagram,
    href: `https://instagram.com/${siteConfig.instagram.replace("@", "")}`,
    externo: true,
    icone: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
      </>
    ),
  },
];

export default function EmBrevePage() {
  return (
    // A classe pagina-em-breve é o gancho que esconde header, rodapé e o botão
    // flutuante do WhatsApp: esta página é uma tela inteira, não uma seção.
    <section
      className={`${cormorant.variable} ${jakarta.variable} pagina-em-breve fixed inset-0 z-[100] overflow-y-auto bg-[#0D0D0B] text-[#E8E4D9]`}
      style={{ fontFamily: "var(--fonte-em-breve-texto), system-ui, sans-serif" }}
    >
      {/* Padrão da marca ao fundo, discreto como na versão atual. */}
      <Image
        src="/images/fundo-inicio.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-top opacity-[0.35]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0B]/80 via-[#0D0D0B]/90 to-[#0D0D0B]" />

      <div className="relative mx-auto flex min-h-full max-w-3xl flex-col items-center px-6 py-16 text-center sm:py-20">
        <Image
          src="/images/logo-1.png"
          alt={siteConfig.name}
          width={220}
          height={62}
          priority
          className="h-10 w-auto sm:h-12"
        />

        {/* Fio vertical separando a marca do anúncio. */}
        <span aria-hidden className="mt-10 block h-16 w-px bg-[#E8E4D9]/25" />

        <h1
          className="mt-10 text-[clamp(3.25rem,13vw,6rem)] font-semibold leading-[1.02]"
          style={{ fontFamily: "var(--fonte-em-breve-display), Georgia, serif" }}
        >
          em <em className="text-[#D97B45]">breve.</em>
        </h1>

        <p
          className="mt-6 text-xl italic text-[#E8E4D9]/60 sm:text-2xl"
          style={{ fontFamily: "var(--fonte-em-breve-display), Georgia, serif" }}
        >
          Nosso site oficial está a caminho.
        </p>

        <p className="mt-10 max-w-xl leading-relaxed text-[#E8E4D9]/72">
          Enquanto finalizamos nosso novo site, entre em contato com a nossa
          equipe pelos canais abaixo e{" "}
          <strong className="font-semibold text-[#E8E4D9]">
            solicite um orçamento para o seu negócio.
          </strong>
        </p>

        <p className="mt-5 max-w-xl leading-relaxed text-[#E8E4D9]/72">
          Será um prazer atender você e desenvolver uma solução estratégica para
          a sua marca.
        </p>

        <div className="mt-12 grid w-full gap-4 sm:grid-cols-3">
          {canais.map((canal) => (
            <a
              key={canal.rotulo}
              href={canal.href}
              target={canal.externo ? "_blank" : undefined}
              rel={canal.externo ? "noopener noreferrer" : undefined}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-[#E8E4D9]/12 bg-[#E8E4D9]/[0.04] px-5 py-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#D97B45]/50 hover:bg-[#E8E4D9]/[0.07]"
            >
              <span
                aria-hidden
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D97B45]/15 text-[#D97B45] transition-colors duration-300 group-hover:bg-[#D97B45] group-hover:text-[#0D0D0B]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  {canal.icone}
                </svg>
              </span>

              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E8E4D9]/50">
                {canal.rotulo}
              </span>
              <span className="font-medium text-[#E8E4D9]">{canal.valor}</span>
            </a>
          ))}
        </div>

        <FormularioAcesso />
      </div>
    </section>
  );
}
