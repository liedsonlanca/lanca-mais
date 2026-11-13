import type { Metadata } from "next";
import type { ReactNode } from "react";
import PageHero from "@/components/PageHero";
import CtaFinal from "@/components/CtaFinal";
import FormularioOrcamento from "@/components/FormularioOrcamento";
import Reveal from "@/components/motion/Reveal";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";
import { linkDoMapa } from "@/components/FooterMap";
import { siteConfig } from "@/lib/site-config";

// Onde falar com a LANÇA+.
//
// ---------- Por que os canais vêm antes do formulário ----------
//
// Houve aqui um formulário que foi removido, e com razão: montava uma
// mensagem e abria o WhatsApp, ou seja, era o WhatsApp com quatro campos
// na frente. Quem chega já decidido a falar não deve pagar pedágio numa
// porta que deveria estar aberta.
//
// O que voltou não é aquilo. Os canais continuam sendo a primeira coisa da
// página, cada um abrindo no lugar certo com um toque. O pedido de
// orçamento vem depois deles, como segunda porta para quem quer passar por
// ela — e porque orçamento, ao contrário de "oi", precisa de contexto para
// ser respondido de primeira.
//
// Quem ainda não decidiu tem o diagnóstico, que é o pedido do site inteiro
// e fecha esta página também.
//
// ---------- Por que o WhatsApp é maior que os outros ----------
//
// Não é estética: é o canal em que a agência de fato atende. Dar a ele o
// mesmo peso visual do TikTok seria desenhar uma mentira sobre como o
// atendimento funciona.

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a LANÇA+ pelo WhatsApp, Instagram ou e-mail. Agência de marketing em Cajazeiras, PB, atendendo o Brasil inteiro.",
  alternates: { canonical: "/contato" },
};

/** O @ sem a arroba, que é o que entra no endereço do perfil. */
const arroba = (valor: string) => valor.replace(/^@/, "");

const whatsapp = `https://wa.me/${siteConfig.whatsappNumber}`;
const instagram = `https://instagram.com/${arroba(siteConfig.instagram)}`;
const tiktok = `https://tiktok.com/@${arroba(siteConfig.tiktok)}`;

/** O número no formato que se lê, e não no que se disca. */
const telefoneLegivel = siteConfig.whatsappNumber.replace(
  /^55(\d{2})(\d{5})(\d{4})$/,
  "($1) $2-$3"
);

function Icone({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6"
    >
      {children}
    </svg>
  );
}

const CANAIS = [
  {
    nome: "WhatsApp",
    valor: telefoneLegivel,
    descricao: "O canal mais rápido. Respondemos em horário comercial.",
    href: whatsapp,
    destaque: true,
    largo: true,
    icone: (
      <Icone>
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.17c-.25.69-1.44 1.32-1.99 1.37-.53.05-1.02.24-3.44-.72-2.9-1.14-4.73-4.1-4.87-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.37.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.57.81 1.97.88 2.11.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.12.57.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.41.29.14.45.12.62-.07.17-.19.71-.83.9-1.12.19-.29.38-.24.64-.14.26.09 1.66.78 1.94.93.29.14.48.21.55.33.07.12.07.69-.18 1.38z" />
      </Icone>
    ),
  },
  {
    nome: "Instagram",
    valor: siteConfig.instagram,
    descricao: "O trabalho do dia a dia, e a prova dele.",
    href: instagram,
    icone: (
      <Icone>
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zm0 6.69a3.15 3.15 0 1 0 0 6.3 3.15 3.15 0 0 0 0-6.3zm0 5.2a2.05 2.05 0 1 1 0-4.1 2.05 2.05 0 0 1 0 4.1zm4.01-5.33a.74.74 0 1 1-1.47 0 .74.74 0 0 1 1.47 0z" />
      </Icone>
    ),
  },
  {
    nome: "TikTok",
    valor: siteConfig.tiktok,
    descricao: "Bastidores e formato curto.",
    href: tiktok,
    icone: (
      <Icone>
        <path d="M16.6 5.82a4.28 4.28 0 0 1-1.04-2.82h-3.1v12.4a2.6 2.6 0 0 1-2.6 2.5 2.6 2.6 0 1 1 .78-5.08V9.66a5.72 5.72 0 1 0 4.92 5.66V9.01a7.35 7.35 0 0 0 4.29 1.37V7.28a4.3 4.3 0 0 1-3.25-1.46z" />
      </Icone>
    ),
  },
  {
    nome: "E-mail",
    valor: siteConfig.email,
    descricao: "Para propostas, documentos e o que precisa ficar escrito.",
    href: `mailto:${siteConfig.email}`,
    // Largo porque sobraria sozinho na linha: são quatro canais, e o
    // WhatsApp já ocupa uma inteira.
    largo: true,
    icone: (
      <Icone>
        <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.24-7.47 4.67a1 1 0 0 1-1.06 0L4 8.24V6.4l8 5 8-5v1.84z" />
      </Icone>
    ),
  },
];

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        titulo={[
          { texto: "Estamos a um" },
          { texto: "toque de distância.", acento: "toque" },
        ]}
        lead="Escolha por onde prefere falar. Atendemos presencialmente em Cajazeiras e remotamente no Brasil inteiro."
      />

      <section className="relative overflow-hidden bg-fundo">
        <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10 lg:py-16">
          {/* O WhatsApp ocupa a linha inteira; os outros dividem a de baixo.
              A hierarquia é a do atendimento real, não a do alfabeto. */}
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {CANAIS.map((canal) => (
              <StaggerItem
                key={canal.nome}
                className={canal.largo ? "sm:col-span-2" : ""}
              >
                <a
                  href={canal.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex h-full items-center gap-5 rounded-3xl border p-6 transition-all duration-500 hover:-translate-y-1 lg:p-7 ${
                    canal.destaque
                      ? "border-salmon/45 bg-cartao hover:border-salmon"
                      : "border-contorno bg-cartao hover:border-salmon/50"
                  }`}
                >
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors duration-500 ${
                      canal.destaque
                        ? "bg-botao text-branco"
                        : "bg-salmon/12 text-destaque group-hover:bg-salmon/20"
                    }`}
                  >
                    {canal.icone}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="font-heading block text-lg font-semibold leading-tight tracking-[-0.02em] text-tinta">
                      {canal.nome}
                    </span>
                    <span className="mt-1 block text-[0.95rem] text-destaque">
                      {canal.valor}
                    </span>
                    <span className="mt-2 block text-sm leading-relaxed text-tinta/60">
                      {canal.descricao}
                    </span>
                  </span>

                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-contorno text-tinta/55 transition-all duration-500 group-hover:border-salmon group-hover:text-destaque"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    >
                      <path d="M7 17 17 7M9 7h8v8" />
                    </svg>
                  </span>
                </a>
              </StaggerItem>
            ))}
          </Stagger>

          {/* O endereço fecha a lista: é o único canal que não se abre com um
              toque, então vira texto com o mapa ao lado em vez de card. */}
          <Reveal delay={0.2}>
            <a
              href={linkDoMapa}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-4 flex items-center gap-5 rounded-3xl border border-contorno bg-fundo-alt p-6 transition-colors duration-500 hover:border-salmon/50 lg:p-7"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-salmon/12 text-destaque">
                <Icone>
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
                </Icone>
              </span>

              <span className="min-w-0">
                <span className="font-heading block text-lg font-semibold leading-tight tracking-[-0.02em] text-tinta">
                  Onde ficamos
                </span>
                <span className="mt-1 block text-[0.95rem] leading-relaxed text-tinta/70">
                  {siteConfig.address} — {siteConfig.city}
                </span>
              </span>
            </a>
          </Reveal>

          {/* A segunda porta: mais larga, e opcional. Fica depois dos
              canais de propósito — ver o comentário do topo. */}
          <Reveal delay={0.25}>
            <FormularioOrcamento />
          </Reveal>
        </div>
      </section>

      {/* Quem chegou aqui sem saber ainda o que pedir tem o mesmo degrau do
          resto do site. */}
      <CtaFinal
        titulo="Ainda não sabe"
        destaque="por onde começar?"
        realce="por onde começar?"
        lead="O diagnóstico é gratuito, leva 2 minutos e termina com um horário marcado."
      />
    </>
  );
}
