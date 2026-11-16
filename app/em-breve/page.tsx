import Image from "next/image";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { lerConfigSite } from "@/lib/modo-site";
import { lerImagens } from "@/lib/conteudo";
import { imagem } from "@/lib/imagens";
import FormularioAcesso from "@/components/FormularioAcesso";
import ContagemRegressiva from "@/components/ContagemRegressiva";

// A tela que o visitante vê enquanto o site está fechado.
//
// ---------- Por que ela usa a tipografia do site ----------
//
// Até aqui esta página carregava Cormorant Garamond e Plus Jakarta Sans, com
// a justificativa de que trocar a fonte seria trocar a marca no meio do
// pré-lançamento. O argumento envelheceu: a marca passou os títulos para a
// sans em 18/09/2026 (ver globais), então quem estava fora de passo era esta
// página, e não o site.
//
// Agora ela herda a fonte do site, que já vem servida do próprio domínio.
// Some de quebra a busca de duas famílias no Google Fonts durante o build —
// a mesma que derrubou um deploy em novembro.
//
// ---------- Por que o conteúdo é alinhado à esquerda ----------
//
// Tudo centralizado, um elemento embaixo do outro, é o desenho que toda tela
// de "em breve" tem — e é por isso que nenhuma parece de ninguém. Aqui a
// coluna encosta à esquerda a partir do desktop, com a foto respirando à
// direita: o mesmo arranjo assimétrico da abertura do site, que é justamente
// o que esta tela está prometendo.
//
// No celular não há largura para assimetria, então volta a ser uma coluna
// centrada — o que ali é o desenho certo, e não o default.
//
// ---------- Por que o slogan vem do config ----------
//
// Ele estava escrito à mão aqui, e já existe em siteConfig.slogan, que é o
// que o rodapé e a faixa da home usam. Duas cópias da assinatura da marca é
// uma a mais: a hora de descobrir que uma ficou para trás é sempre depois de
// alguém ler a errada.

export const metadata: Metadata = {
  title: "Em breve",
  description: `${siteConfig.name}. ${siteConfig.tagline}`,
  robots: { index: false, follow: false },
};

// A data vem do banco e muda pelo painel: nada de cache.
export const dynamic = "force-dynamic";

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
];

export default async function EmBrevePage() {
  const [{ lancamento }, imagens] = await Promise.all([
    lerConfigSite(),
    lerImagens(),
  ]);
  const fundo = imagem(imagens, "em-breve-fundo");
  const marca = imagem(imagens, "marca-clara");

  return (
    // A classe pagina-em-breve é o gancho que esconde header, rodapé e o botão
    // flutuante do WhatsApp: esta página é uma tela inteira, não uma seção.
    //
    // data-lenis-prevent devolve a rolagem nativa a este contêiner. Sem ele o
    // Lenis, que é global, captura a roda e o toque para rolar a janela — que
    // aqui está travada, então nada se moveria em tela baixa.
    <section
      data-lenis-prevent
      className="pagina-em-breve noise fixed inset-0 z-[100] overflow-y-auto bg-abismo text-bege"
    >
      {/* A foto não é textura de fundo: é a única coisa viva na tela.

          Antes vinha a 18% de opacidade sob um véu quase opaco, e o que
          sobrava era um ruído acinzentado que podia ser qualquer imagem. Aqui
          ela aparece de verdade no topo e mergulha no preto conforme desce,
          que é onde o texto precisa de silêncio. */}
      <Image
        src={fundo.src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-top opacity-45"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-abismo/35 via-abismo/90 to-abismo"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/3 h-[560px] w-[560px] rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(closest-side, var(--color-salmon), transparent)",
        }}
      />

      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-6 py-12 sm:px-10 sm:py-16">
        <Image
          src={marca.src}
          alt={siteConfig.name}
          width={220}
          height={62}
          priority
          className="h-9 w-auto self-center lg:h-10 lg:self-start"
        />

        {/* my-auto centra o bloco na sobra vertical, sem empurrar nada para
            fora quando a tela é baixa. */}
        <div className="my-auto max-w-2xl py-12 text-center lg:py-16 lg:text-left">
          <p className="text-sm leading-relaxed text-bege/55">
            Agência de marketing completa — {siteConfig.city}
          </p>

          <h1 className="font-heading mt-5 text-[clamp(2.4rem,8vw,4.25rem)] font-semibold leading-[1.03] tracking-[-0.035em]">
            O novo site da {siteConfig.name}
            <span className="block text-salmon">está quase no ar.</span>
          </h1>

          <p className="mt-6 max-w-lg leading-relaxed text-bege/70 lg:mt-7">
            Enquanto finalizamos, a equipe continua atendendo normalmente.{" "}
            <strong className="font-semibold text-bege">
              Fale com a gente e peça um orçamento
            </strong>{" "}
            — a primeira conversa é sem compromisso.
          </p>

          {lancamento && (
            <div className="mt-10 lg:mt-12">
              <p className="text-sm text-bege/45">O site entra no ar em</p>
              <div className="mt-4">
                <ContagemRegressiva lancamento={lancamento} />
              </div>
            </div>
          )}

          {/* Os canais em linha, e não em três cards.
              Eram três caixas com ícone, rótulo e valor, do tamanho de um
              botão principal cada — três convites competindo com a contagem,
              que é o assunto da tela. Em linha eles continuam a um toque de
              distância e param de disputar. */}
          <div className="mt-10 flex flex-wrap justify-center gap-2.5 lg:mt-12 lg:justify-start">
            {canais.map((canal) => (
              <a
                key={canal.rotulo}
                href={canal.href}
                target={canal.externo ? "_blank" : undefined}
                rel={canal.externo ? "noopener noreferrer" : undefined}
                className="group inline-flex min-h-11 items-center gap-2.5 rounded-full border border-bege/15 bg-bege/[0.04] px-4 text-sm text-bege/80 transition-colors duration-500 hover:border-salmon/55 hover:bg-bege/[0.08] hover:text-bege"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-salmon"
                >
                  {canal.icone}
                </svg>
                <span className="sr-only">{canal.rotulo}: </span>
                {canal.valor}
              </a>
            ))}
          </div>
        </div>

        {/* A assinatura e a porta de serviço fecham a tela. */}
        <div className="flex flex-col items-center gap-7 border-t border-bege/10 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <p className="text-center text-sm leading-relaxed text-bege/45 lg:text-left">
            {siteConfig.slogan.map((linha, i) => (
              <span key={linha} className="block">
                {i === siteConfig.slogan.length - 1 ? (
                  <span className="text-salmon/80">{linha}</span>
                ) : (
                  linha
                )}
              </span>
            ))}
          </p>

          <FormularioAcesso />
        </div>
      </div>
    </section>
  );
}
