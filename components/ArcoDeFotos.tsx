import Link from "next/link";
import Arco, { type FotoDoArco } from "@/components/Arco";
import Reveal from "@/components/motion/Reveal";
import WordReveal, { type Linha } from "@/components/motion/WordReveal";
import type { Numero } from "@/lib/conteudo";

// Abertura em arco: as fotos abrindo em leque sobre o título.
//
// O desenho é o da referência que o cliente escolheu, com o conteúdo e as
// cores da LANÇA+. Funciona porque a agência tem uma sessão de estúdio inteira
// com a mesma direção de arte, fundo cinza e todo mundo de preto: em leque,
// cinco retratos assim dizem "somos um time" antes de qualquer frase.
//
// O leque em si mora em components/Arco: ele é usado também no bloco de
// entregáveis de cada página de serviço. Aqui ficam só a moldura escura, o
// título e os números.

export type { FotoDoArco };

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
  return (
    <section className="superficie-escura noise relative overflow-hidden bg-abismo">
      <div className="glow-salmon pointer-events-none absolute left-1/2 top-0 h-[520px] w-[760px] -translate-x-1/2 opacity-30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-28 lg:pb-24 lg:pt-32">
        <Arco fotos={fotos} tamanho="abertura" tom="escuro">
          {/* O texto, no vão sob as fotos. */}
          <div className="text-center">
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
        </Arco>

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
