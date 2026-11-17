import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { lerConfigSite } from "@/lib/modo-site";
import { lerImagens, lerVitrine } from "@/lib/conteudo";
import { imagem } from "@/lib/imagens";
import { linkDoMapa } from "@/components/FooterMap";
import FormularioAcesso from "@/components/FormularioAcesso";
import ContagemRegressiva from "@/components/ContagemRegressiva";
import PecasEmBreve from "@/components/PecasEmBreve";

// A tela que o visitante vê enquanto o site está fechado.
//
// ---------- O desenho ----------
//
// Fundo com a imagem da marca mergulhando no preto, anúncio centralizado,
// contagem em linha com os números grandes, três peças do trabalho tocando
// logo abaixo e os canais em quadrados no pé.
//
// As três peças são o ponto. Uma tela de espera costuma provar o que promete
// com adjetivo — "algo à altura da sua marca" — e adjetivo não prova nada.
// Mostrando três vídeos reais da agência, quem chega vê o trabalho antes de o
// site existir, que é o único argumento que esta tela tem para dar.
//
// ---------- Por que ela usa a tipografia do site ----------
//
// Até pouco tempo esta página carregava Cormorant Garamond e Plus Jakarta
// Sans, com a justificativa de que trocar a fonte seria trocar a marca no meio
// do pré-lançamento. O argumento envelheceu: a marca passou os títulos para a
// sans em 18/09/2026, então quem estava fora de passo era esta página. Some de
// quebra a busca de duas famílias no Google Fonts durante o build — a mesma
// que derrubou um deploy em novembro.
//
// ---------- O que os vídeos custam, e por quê ----------
//
// Cada peça fica cinco segundos e dá lugar à próxima: a vitrine tem
// vídeo de mais de um minuto, e três deles inteiros lado a lado viram três
// filmes concorrendo, cada um pego num ponto aleatório do meio.
//
// Três vídeos tocando é banda, e esta é a primeira tela que todo visitante vê.
// Eles entram sem som, em laço, e com preload="metadata": o navegador pega o
// cabeçalho e começa, em vez de puxar os três arquivos inteiros de uma vez. O
// atributo poster mostra a capa enquanto o primeiro quadro não chega, então
// ninguém vê retângulo preto esperando.

export const metadata: Metadata = {
  title: "Em breve",
  description: `${siteConfig.name}. ${siteConfig.tagline}`,
  robots: { index: false, follow: false },
};

// A data vem do banco e muda pelo painel: nada de cache.
export const dynamic = "force-dynamic";

/** Quantos cards a fileira tem. As peças que passam por eles são todas. */
const QUANTOS_CARDS = 3;

/**
 * Intercala duas listas em blocos do tamanho da fileira.
 *
 * Com blocos de três: três do primeiro, três do segundo, três do primeiro, e
 * assim por diante. É o que faz cada volta da rotação ser de um tipo só.
 *
 * Quando um lado acaba, o resto do outro entra inteiro em seguida — forçar a
 * alternância até o fim exigiria inventar peça que não existe. É o mesmo
 * princípio do botão que organiza o trilho no painel.
 */
function alternarEmBlocos<T>(a: T[], b: T[], tamanho: number): T[] {
  const saida: T[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    saida.push(...a.slice(i, i + tamanho));
    i += tamanho;
    saida.push(...b.slice(j, j + tamanho));
    j += tamanho;
  }

  return [...saida, ...a.slice(i), ...b.slice(j)];
}

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
  // O quarto quadrado é o endereço, e não o TikTok.
  //
  // São quatro na referência, e com três a fileira fica manca. O TikTok seria
  // o candidato óbvio, mas o @ dele ainda é um palpite marcado como pendência
  // em site-config: link errado na primeira tela que o visitante vê é pior do
  // que fileira de três.
  {
    rotulo: "Onde ficamos",
    valor: siteConfig.city,
    href: linkDoMapa,
    externo: true,
    icone: (
      <>
        <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.6" />
      </>
    ),
  },
];

export default async function EmBrevePage() {
  const [{ lancamento }, imagens, vitrine] = await Promise.all([
    lerConfigSite(),
    lerImagens(),
    lerVitrine(),
  ]);

  const fundo = imagem(imagens, "em-breve-fundo");
  const marca = imagem(imagens, "marca-clara");

  // A fileira troca em bloco: três vídeos, três estáticos, três vídeos.
  //
  // Antes a lista era todos os vídeos e depois todas as imagens, e como a
  // rotação anda de três em três, o tipo só mudava quando os vídeos
  // acabavam — quem ficasse um minuto na tela via vídeo, vídeo, vídeo, e de
  // repente uma sequência inteira de imagem parada.
  //
  // Montando a lista em blocos do tamanho da fileira, cada volta inteira é de
  // um tipo só e a seguinte é do outro. O vídeo abre, porque é ele que prova
  // que a agência faz movimento.
  const comVideo = vitrine.filter((p) => p.tipo === "video" && p.video);
  const comImagem = vitrine.filter((p) => p.tipo !== "video" && p.src);
  const pecas = alternarEmBlocos(comVideo, comImagem, QUANTOS_CARDS);

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
      {/* O fundo ocupa a parte de cima e mergulha no preto.

          Antes vinha a 18% de opacidade sob um véu quase opaco, e o que
          sobrava era um ruído acinzentado que podia ser qualquer imagem. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[78vh]"
      >
        <Image
          src={fundo.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-abismo/30 via-abismo/85 to-abismo" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[22%] h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.22] blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, var(--color-salmon), transparent)",
        }}
      />

      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col items-center px-5 py-6 text-center sm:px-8 sm:py-8">
        {/* A barra do topo: marca no centro, ação à direita.

            A referência tem links à esquerda, e aqui eles não existem — o
            site está fechado, e link que não leva a lugar nenhum é pior que
            ausência. O vão à esquerda tem a largura do botão, só para a marca
            cair no centro de verdade e não no centro do que sobrou. */}
        <header className="flex w-full items-center justify-between gap-4">
          <span aria-hidden className="hidden w-[200px] shrink-0 sm:block" />

          {/* Só a marca, sem linha de apoio embaixo.

              A referência tem uma ali, e aqui ela dizia "Novo site em breve"
              — que é o título logo abaixo escrito de outro jeito, duas linhas
              antes de ele aparecer. Repetir o anúncio em corpo menor não
              reforça: só gasta a primeira leitura. */}
          <Image
            src={marca.src}
            alt={siteConfig.name}
            width={220}
            height={62}
            priority
            className="h-8 w-auto sm:h-9"
          />

          {/* O pedido da tela, no lugar do botão da referência.

              Aponta para o fluxo no CRM, e não para /diagnostico. A página
              interna está atrás do mesmo portão que fecha o site, e desde
              que ela passou a mostrar o menu, cada item desse menu levaria
              de volta a esta tela de espera — beco em todo link. O fluxo
              direto não tem esse problema, e é a mesma coisa que a página
              interna embute. */}
          <Link
            href="/em-breve/diagnostico"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-botao px-5 text-sm font-semibold text-branco transition-colors duration-500 hover:bg-salmon-escuro sm:w-[200px] sm:justify-center"
          >
            Fazer diagnóstico
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </header>

        {/* O título em dois níveis, como na referência: uma palavra grande, e
            a frase inteira numa linha menor logo abaixo. */}
        <h1 className="mt-10 sm:mt-14">
          <span className="font-heading block text-[clamp(3.25rem,14vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
            Em breve
          </span>
          <span className="mt-3 block text-[clamp(1.05rem,3.4vw,1.75rem)] font-light leading-snug text-bege/80 sm:mt-4">
            O novo site da{" "}
            <span className="font-medium text-salmon">{siteConfig.name}</span>{" "}
            está quase no ar.
          </span>
        </h1>

        {lancamento && (
          <div className="mt-10 w-full sm:mt-12">
            <ContagemRegressiva lancamento={lancamento} />
          </div>
        )}

        {/* As peças do trabalho, passando de cinco em cinco segundos.

            A fileira é a da referência: a central maior e levantada, as duas
            de fora um degrau atrás. O degrau é de escala e de brilho, e não
            de posição absoluta — assim continua sendo três colunas de grade,
            e não três caixas presas a coordenadas escritas à mão.

            Vão todas as peças cadastradas, e não as três primeiras: numa
            tela onde a pessoa está parada esperando, deixar o resto do
            portfólio guardado é desperdiçar o único argumento que esta tela
            tem. */}
        <PecasEmBreve pecas={pecas} slots={QUANTOS_CARDS} />

        {/* Uma linha, e não um parágrafo.

            A referência não tem bloco de texto entre as peças e os quadrados,
            e aqui ele empurrava os canais para fora da primeira tela. Mas
            "a equipe continua atendendo" é informação que uma tela de site
            fechado precisa dar, então ela fica — reduzida ao tamanho do que
            de fato diz. */}
        {/* A frase que diz o que fazer agora.

            Ela cita as duas saídas da tela e fica entre as duas: o
            diagnóstico, que é o botão lá de cima, e os canais, que são os
            quadrados logo abaixo. Sem ela, o botão do topo é só um botão e os
            quadrados são só ícones — nada liga uma coisa à outra. */}
        <p className="mt-9 max-w-xl text-sm leading-relaxed text-bege/60 sm:mt-12">
          O site está em obras, a equipe não.{" "}
          <Link
            href="/em-breve/diagnostico"
            className="font-medium text-salmon underline decoration-salmon/35 underline-offset-4 transition-colors duration-500 hover:decoration-salmon"
          >
            Faça um diagnóstico gratuito da sua marca
          </Link>{" "}
          ou fale com a gente por um dos canais abaixo.
        </p>

        {/* Os canais em quadrados, como na referência: ícone em cima, nome em
            negrito, um fio, e o valor como descrição. Dois por linha no
            celular — quatro de 80px num telefone truncariam o e-mail. */}
        <div className="mt-5 grid w-full grid-cols-2 gap-2.5 sm:mt-7 sm:grid-cols-4 sm:gap-4">
          {canais.map((canal) => (
            <a
              key={canal.rotulo}
              href={canal.href}
              target={canal.externo ? "_blank" : undefined}
              rel={canal.externo ? "noopener noreferrer" : undefined}
              className="group flex flex-col items-center rounded-2xl border border-bege/12 bg-bege/[0.03] px-3 py-5 transition-colors duration-500 hover:border-salmon/50 hover:bg-bege/[0.07] sm:py-6"
            >
              <span
                aria-hidden
                className="text-salmon transition-transform duration-500 group-hover:-translate-y-0.5"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                >
                  {canal.icone}
                </svg>
              </span>

              <span className="mt-3 block text-sm font-semibold text-bege">
                {canal.rotulo}
              </span>

              <span
                aria-hidden
                className="mt-2.5 block h-px w-8 bg-bege/15 transition-colors duration-500 group-hover:bg-salmon/60"
              />

              <span className="mt-2.5 block max-w-full truncate text-xs text-bege/55">
                {canal.valor}
              </span>
            </a>
          ))}
        </div>

        {/* mt-auto empurra a assinatura e a porta de serviço para o fim em
            tela alta, sem sobrepor nada em tela baixa. */}
        <div className="mt-auto w-full pt-12">
          {/* O slogan vem de siteConfig, onde o rodapé e a faixa da home já o
              leem. Duas cópias da assinatura da marca é uma a mais: a hora de
              descobrir que uma ficou para trás é sempre depois de alguém ler a
              errada. */}
          <p className="text-sm leading-relaxed text-bege/45">
            {siteConfig.slogan.map((linha, i) => (
              <span key={linha} className="block sm:inline">
                {i === siteConfig.slogan.length - 1 ? (
                  <span className="text-salmon/80">{linha}</span>
                ) : (
                  <>{linha} </>
                )}
              </span>
            ))}
          </p>

          <div className="mt-7 flex justify-center">
            <FormularioAcesso />
          </div>
        </div>
      </div>
    </section>
  );
}
