"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

export type Etapa = {
  step: string;
  title: string;
  description: string;
};

// Um ícone por etapa do ciclo: estruturar, publicar, medir, reajustar.
const icones: React.ReactNode[] = [
  // Estruturação — camadas/planta
  <>
    <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" key="a" />
    <path d="M3 12.5 12 17l9-4.5M3 17 12 21.5 21 17" key="b" />
  </>,
  // Implementação — calendário
  <>
    <rect x="3" y="5" width="18" height="16" rx="2.5" key="a" />
    <path d="M3 10h18M8 3v4M16 3v4" key="b" />
  </>,
  // Monitoramento — gráfico
  <>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" key="a" />
  </>,
  // Reajuste — ciclo
  <>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" key="a" />
    <path d="M20 3v4h-4" key="b" />
  </>,
];

// Linha do tempo do método.
//
// As quatro etapas são um ciclo, não quatro caixas soltas — então elas ficam
// sobre um trilho que se preenche de salmão conforme a seção sobe na tela.
// O preenchimento guiado pela rolagem é o gesto próprio daqui: em vez de um
// enfeite estático, o processo se desenha enquanto a pessoa avança por ele.
export default function MethodSteps({ etapas }: { etapas: Etapa[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.6"],
  });

  // Suaviza o preenchimento para ele não pular junto com a rolagem.
  const avanco = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="relative mt-16">
      {/* Trilho: vertical no celular, horizontal a partir do desktop. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-8 top-8 h-[calc(100%-4rem)] w-px bg-linha lg:left-0 lg:top-8 lg:h-px lg:w-full"
      >
        <motion.div
          style={{ scaleY: avanco }}
          className="h-full w-full origin-top bg-salmon lg:hidden"
        />
        <motion.div
          style={{ scaleX: avanco }}
          className="hidden h-full w-full origin-left bg-salmon lg:block"
        />
      </div>

      <ol className="relative grid gap-8 lg:grid-cols-4 lg:gap-6">
        {etapas.map((etapa, i) => (
          <motion.li
            key={etapa.step}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            transition={{
              duration: 0.8,
              delay: i * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group relative flex gap-6 lg:block"
          >
            {/* Marcador que cruza o trilho */}
            <span className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-linha bg-areia shadow-[var(--sombra-cartao)] transition-all duration-500 group-hover:border-salmon group-hover:bg-salmon">
              <span className="numeral-fantasma text-xl text-salmon-texto transition-colors duration-500 group-hover:text-preto">
                {etapa.step}
              </span>
            </span>

            <div className="relative flex-1 overflow-hidden rounded-3xl border border-linha bg-areia p-7 shadow-[var(--sombra-cartao)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-salmon/45 group-hover:bg-branco group-hover:shadow-[0_28px_60px_-38px_rgba(10,10,8,0.5)] lg:mt-8 lg:p-8">
              {/* A mesma régua de lançamento das abas de serviço. */}
              <span
                aria-hidden
                className="absolute left-0 top-0 h-0 w-[3px] bg-salmon transition-all duration-700 ease-out group-hover:h-full"
              />

              <span
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-salmon/15 text-salmon-texto transition-colors duration-500 group-hover:bg-salmon group-hover:text-preto"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  {icones[i]}
                </svg>
              </span>

              <h3 className="mt-6 text-xl font-semibold text-preto">
                {etapa.title}
              </h3>
              <p className="mt-3 leading-relaxed text-preto/70">
                {etapa.description}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
