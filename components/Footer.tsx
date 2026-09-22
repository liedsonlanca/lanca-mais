import Image from "next/image";
import Link from "next/link";
import { navLinks, services, siteConfig } from "@/lib/site-config";
import FooterMap, { linkDoMapa } from "@/components/FooterMap";
import GerenciarConsentimento from "@/components/GerenciarConsentimento";

// O rodapé.
//
// Reescrito em 21/09/2026. Antes era uma parede: a marca curta de um lado
// deixando um vazio enorme embaixo, as oito frentes numa coluna só que fazia o
// bloco crescer sozinho, e uma faixa de mapa de 256px de altura com o endereço
// ao lado. Mais de mil pixels de altura para dizer o que cabe em menos da
// metade.
//
// Agora são três andares, e cada um faz uma coisa:
//
//   1. O convite: a assinatura da marca em corpo de display e o botão. É o
//      último lugar do site onde ainda dá para pedir a conversa;
//   2. As colunas: navegação, as oito frentes em duas colunas e o contato,
//      com o mapa pequeno. Três colunas de altura parecida, em vez de uma
//      curta encostada numa comprida;
//   3. A assinatura legal, numa linha só no desktop.
//
// Chegou a ter a marca em tamanho gigante, esmaecida, fechando embaixo de
// tudo. Saiu a pedido do cliente: no escuro ela virava um borrão sem leitura.

const socials = [
  {
    label: "WhatsApp",
    href: `https://wa.me/${siteConfig.whatsappNumber}`,
  },
  {
    label: "Instagram",
    href: `https://instagram.com/${siteConfig.instagram.replace("@", "")}`,
  },
  {
    label: "TikTok",
    href: `https://tiktok.com/${siteConfig.tiktok}`,
  },
];

/** Título de coluna. Num lugar só, para as três saírem idênticas. */
function Titulo({ children }: { children: React.ReactNode }) {
  return <h3 className="eyebrow text-bege/45">{children}</h3>;
}

/** Item de lista. Alvo de toque de 44px sem inchar a coluna. */
function ItemLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-11 items-center text-sm text-bege/75 transition-colors duration-500 hover:text-bege"
      >
        {children}
      </Link>
    </li>
  );
}

export default function Footer({
  marca,
}: {
  marca: { src: string; alt: string };
}) {
  return (
    <footer className="border-t border-borda bg-abismo text-bege">
      {/* ---------- 1. O convite ---------- */}
      <div className="mx-auto max-w-6xl px-6 pt-12 lg:pt-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="min-w-0">
            <Image
              src={marca.src}
              alt={marca.alt}
              width={140}
              height={39}
              className="h-7 w-auto"
            />

            {/* A assinatura da marca em corpo de display. Em corpo de texto
                era só mais uma linha cinza, e quebrava no meio do nome. */}
            <p className="font-heading mt-6 max-w-lg text-[1.5rem] font-semibold leading-[1.18] tracking-[-0.03em] text-bege lg:text-[1.9rem]">
              {siteConfig.slogan.slice(0, -1).join(" ")}{" "}
              <span className="text-salmon">{siteConfig.slogan.at(-1)}</span>
            </p>
          </div>

          <Link
            href="/contato"
            className="group inline-flex shrink-0 items-center gap-4 self-start rounded-full bg-bege py-2 pl-7 pr-2 font-medium text-preto transition-transform duration-500 hover:-translate-y-0.5"
          >
            Falar com a equipe
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-full bg-salmon text-preto transition-transform duration-500 group-hover:rotate-45"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        </div>
      </div>

      {/* ---------- 2. As colunas ---------- */}
      <div className="mx-auto max-w-6xl px-6 pt-10 lg:pt-14">
        <div className="grid gap-10 border-t border-borda pt-10 md:grid-cols-[0.8fr_1.4fr_1fr] md:gap-12">
          <nav aria-label="Navegação do rodapé">
            <Titulo>Navegação</Titulo>
            <ul className="mt-2">
              {navLinks.map((link) => (
                <ItemLink key={link.href} href={link.href}>
                  {link.label}
                </ItemLink>
              ))}
            </ul>
          </nav>

          <nav aria-label="Serviços">
            <Titulo>Serviços</Titulo>
            {/* Em duas colunas: as oito numa fileira só davam a esta coluna o
                dobro da altura das vizinhas, e era isso que desequilibrava o
                rodapé inteiro. */}
            <ul className="mt-2 grid gap-x-8 sm:grid-cols-2">
              {services.map((service) => (
                <ItemLink key={service.slug} href={`/servicos/${service.slug}`}>
                  {service.name}
                </ItemLink>
              ))}
            </ul>
          </nav>

          <div>
            <Titulo>Contato</Titulo>

            <ul className="mt-4 space-y-1 text-sm text-bege/75">
              <li>{siteConfig.email}</li>
              <li>{siteConfig.instagram}</li>
            </ul>

            <p className="mt-5 text-sm leading-relaxed text-bege/75">
              {siteConfig.address}
              <span className="block text-bege/50">{siteConfig.city}</span>
            </p>

            <div className="mt-4">
              <FooterMap />
            </div>

            <a
              href={linkDoMapa}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-salmon"
            >
              Abrir no Google Maps
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover:translate-x-1"
              >
                →
              </span>
            </a>

            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-full border border-borda px-4 text-xs font-medium text-bege/75 transition-colors duration-500 hover:border-salmon hover:text-salmon"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 3. A assinatura legal ---------- */}
      <div className="mx-auto max-w-6xl px-6 pt-8 lg:pt-12">
        <div className="flex flex-col gap-2 border-t border-borda py-5 text-xs text-bege/55 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <p className="flex flex-wrap items-center gap-x-2">
            <span>
              © {new Date().getFullYear()} {siteConfig.name}
            </span>
            <span aria-hidden className="text-bege/30">
              ·
            </span>
            <span>CNPJ {siteConfig.cnpj}</span>
          </p>

          <p className="flex flex-wrap items-center gap-x-2">
            <Link
              href="/politica-de-privacidade"
              className="flex min-h-11 min-w-11 items-center justify-center transition-colors duration-500 hover:text-salmon"
            >
              Privacidade
            </Link>
            <span aria-hidden className="text-bege/30">
              ·
            </span>
            <Link
              href="/politica-de-cookies"
              className="flex min-h-11 min-w-11 items-center justify-center transition-colors duration-500 hover:text-salmon"
            >
              Cookies
            </Link>
            <span aria-hidden className="text-bege/30">
              ·
            </span>
            <Link
              href="/aviso-legal"
              className="flex min-h-11 min-w-11 items-center justify-center transition-colors duration-500 hover:text-salmon"
            >
              Aviso legal
            </Link>
            <span aria-hidden className="text-bege/30">
              ·
            </span>
            <Link
              href="/termos-de-uso"
              className="flex min-h-11 min-w-11 items-center justify-center transition-colors duration-500 hover:text-salmon"
            >
              Termos
            </Link>
            <span aria-hidden className="text-bege/30">
              ·
            </span>
            <GerenciarConsentimento />
          </p>
        </div>
      </div>

    </footer>
  );
}
