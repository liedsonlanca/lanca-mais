import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import WordReveal, { type Linha } from "@/components/motion/WordReveal";
import type { Numero } from "@/lib/conteudo";

// Abertura em arco: as fotos da equipe abrindo em leque sobre o título.
//
// O desenho é o da referência que o cliente escolheu, com o conteúdo e as
// cores da LANÇA+. Funciona porque a agência tem uma sessão de estúdio inteira
// com a mesma direção de arte, fundo cinza e todo mundo de preto: em leque,
// cinco retratos assim dizem "somos um time" antes de qualquer frase.
//
// ---------- Como o arco é feito ----------
//
// Um ponto âncora invisível, embaixo do texto. Cada foto é posicionada nesse
// ponto e então girada, empurrada para fora pelo raio e desgirada em parte:
//
//   rotate(a) translateY(-raio) rotate(-a * 0.72)
//
// A última rotação é o que controla a inclinação final. Desgirar tudo deixaria
// as fotos de pé, como uma fileira curva; não desgirar nada deixaria cada uma
// deitada no sentido do arco, o que é tonto de ler. A 0,72 sobram uns graus de
// inclinação, que é o que dá o ar de fotos jogadas na mesa.
//
// O raio vive numa variável de CSS, então o arco encolhe junto com a tela sem
// nenhuma conta em JavaScript, e nada precisa ser remedido quando a janela
// muda de tamanho.

export type FotoDoArco = { src: string; alt: string };

/** Os ângulos, em graus, a partir do topo do arco. Cinco fotos, simétricas. */
const ANGULOS = [-68, -34, 0, 34, 68];

/** Quanto de cada rotação é desfeita. Ver o comentário do arco. */
const DESGIRO = 0.72;

export default function ArcoDeFotos({
  eyebrow,
  titulo,
  lead,
  botao,
  fotos,
  numeros,
}: {
  eyebrow: string;
  titulo: Linha[];
  lead?: string;
  botao?: { href: string; texto: string };
  fotos: FotoDoArco[];
  numeros?: Numero[];
}) {
  // Cinco é o que o arco comporta sem as pontas saírem da tela no celular.
  const emCena = fotos.slice(0, ANGULOS.length);

  return (
    <section className="superficie-escura noise relative overflow-hidden bg-abismo">
      <div className="glow-salmon pointer-events-none absolute left-1/2 top-0 h-[520px] w-[760px] -translate-x-1/2 opacity-30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-28 lg:pb-24 lg:pt-32">
        {/* --raio manda no tamanho do arco; --ancora é onde fica o centro
            dele, medido do topo deste bloco. */}
        <div className="relative [--ancora:calc(var(--raio)+3.5rem)] [--raio:170px] sm:[--raio:250px] lg:[--raio:330px]">
          {/* O fio tracejado do arco. Vive dentro de um recorte da altura da
              âncora, senão a metade de baixo do círculo passaria por cima do
              título. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[var(--ancora)] overflow-hidden"
          >
            <div className="absolute left-1/2 top-[var(--ancora)] h-[calc(var(--raio)*2)] w-[calc(var(--raio)*2)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-bege/25" />
          </div>

          {emCena.map((foto, i) => {
            const angulo = ANGULOS[i] ?? 0;
            const meio = angulo === 0;

            return (
              <div
                key={foto.src}
                className="absolute left-1/2 top-[var(--ancora)]"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angulo}deg) translateY(calc(var(--raio) * -1)) rotate(${
                    -angulo * DESGIRO
                  }deg)`,
                }}
              >
                <Reveal delay={0.08 * i} distance={20}>
                  {/* A do meio é maior: é o topo do arco, e o olho precisa de
                      um ponto de chegada. */}
                  <div
                    className={`relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_28px_60px_-30px_rgba(0,0,0,0.85)] ${
                      meio
                        ? "w-[88px] sm:w-[120px] lg:w-[148px]"
                        : "w-[76px] sm:w-[104px] lg:w-[128px]"
                    }`}
                  >
                    <Image
                      src={foto.src}
                      alt={foto.alt}
                      fill
                      sizes="(max-width: 640px) 90px, (max-width: 1024px) 120px, 150px"
                      className="object-cover object-top"
                    />
                  </div>
                </Reveal>
              </div>
            );
          })}

          {/* O texto, no vão sob as fotos. */}
          <div className="relative pt-[calc(var(--ancora)+0.5rem)] text-center">
            <Reveal>
              <span className="eyebrow inline-flex items-center gap-3 rounded-full border border-borda px-4 py-2 text-bege/75">
                <span aria-hidden className="h-1 w-1 rounded-full bg-salmon" />
                {eyebrow}
              </span>
            </Reveal>

            <h1 className="font-heading mt-7 text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.035em] text-bege sm:text-5xl lg:text-[3.6rem]">
              <WordReveal linhas={titulo} delay={0.2} />
            </h1>

            {lead && (
              <Reveal delay={0.32}>
                <p className="mx-auto mt-6 max-w-xl leading-relaxed text-bege/70">
                  {lead}
                </p>
              </Reveal>
            )}

            {botao && (
              <Reveal delay={0.4}>
                <div className="mt-9 flex justify-center">
                  <Link
                    href={botao.href}
                    className="group inline-flex items-center gap-4 rounded-full bg-bege py-2 pl-7 pr-2 font-medium text-preto transition-transform duration-500 hover:-translate-y-0.5"
                  >
                    {botao.texto}
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
              </Reveal>
            )}
          </div>
        </div>

        {/* Os números, em fileira, separados por fio. */}
        {numeros && numeros.length > 0 && (
          <Reveal delay={0.45}>
            <div className="mt-14 grid grid-cols-2 gap-y-8 border-t border-borda pt-10 sm:grid-cols-4 lg:mt-20">
              {numeros.map((numero, i) => (
                <div
                  key={numero.rotulo}
                  className={`px-4 text-center ${
                    i > 0 ? "sm:border-l sm:border-borda" : ""
                  }`}
                >
                  <p className="font-heading text-[2rem] font-semibold tracking-[-0.03em] text-bege lg:text-[2.6rem]">
                    {numero.prefixo}
                    {numero.valor}
                    {numero.sufixo}
                  </p>
                  <p className="mt-1.5 text-sm text-bege/55">{numero.rotulo}</p>
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
