"use client";

import Image from "next/image";
import { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { pararRolagem, retomarRolagem } from "@/lib/scroll";
import type { PecaVitrine } from "@/lib/showcase";

type Props = {
  pecas: PecaVitrine[];
  /** Índice da peça aberta, ou null com o overlay fechado. */
  indice: number | null;
  aoFechar: () => void;
  aoNavegar: (novoIndice: number) => void;
};

export default function Lightbox({ pecas, indice, aoFechar, aoNavegar }: Props) {
  const aberto = indice !== null;
  const peca = aberto ? pecas[indice] : null;

  const anterior = useCallback(() => {
    if (indice === null) return;
    aoNavegar((indice - 1 + pecas.length) % pecas.length);
  }, [indice, pecas.length, aoNavegar]);

  const proxima = useCallback(() => {
    if (indice === null) return;
    aoNavegar((indice + 1) % pecas.length);
  }, [indice, pecas.length, aoNavegar]);

  // Teclado: Esc fecha, setas navegam.
  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") aoFechar();
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") proxima();
    }

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, aoFechar, anterior, proxima]);

  // Trava a página atrás do overlay: o overflow do body sozinho não segura o Lenis.
  useEffect(() => {
    if (!aberto) return;

    pararRolagem();
    document.body.style.overflow = "hidden";

    return () => {
      retomarRolagem();
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <AnimatePresence>
      {aberto && peca && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={peca.legenda ?? peca.alt}
          onClick={aoFechar}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-abismo/92 p-4 backdrop-blur-xl sm:p-8"
        >
          {/* Fechar */}
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-borda text-bege/85 transition-colors duration-300 hover:border-salmon hover:text-salmon sm:right-6 sm:top-6"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {pecas.length > 1 && (
            <>
              <BotaoNavegacao
                lado="esquerda"
                rotulo="Peça anterior"
                aoClicar={anterior}
              />
              <BotaoNavegacao
                lado="direita"
                rotulo="Próxima peça"
                aoClicar={proxima}
              />
            </>
          )}

          {/* O clique dentro do conteúdo não deve fechar o overlay. */}
          <motion.div
            key={indice}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-full w-full max-w-[min(92vw,560px)] flex-col items-center"
          >
            <div className="relative w-full overflow-hidden rounded-3xl border border-borda bg-grafite">
              {peca.tipo === "video" && peca.video ? (
                <video
                  src={peca.video}
                  poster={peca.src}
                  controls
                  autoPlay
                  playsInline
                  className="h-auto max-h-[78vh] w-full"
                />
              ) : (
                <Image
                  src={peca.src}
                  alt={peca.alt}
                  width={1000}
                  height={1250}
                  sizes="(max-width: 640px) 92vw, 560px"
                  className="h-auto max-h-[78vh] w-full object-contain"
                />
              )}
            </div>

            {peca.legenda && (
              <p className="mt-5 max-w-md text-center text-sm text-bege/78">
                {peca.legenda}
              </p>
            )}

            <p className="mt-3 text-xs uppercase tracking-widest text-bege/50">
              {(indice ?? 0) + 1} / {pecas.length}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BotaoNavegacao({
  lado,
  rotulo,
  aoClicar,
}: {
  lado: "esquerda" | "direita";
  rotulo: string;
  aoClicar: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      onClick={(e) => {
        e.stopPropagation();
        aoClicar();
      }}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-borda bg-abismo/70 text-bege/85 transition-colors duration-300 hover:border-salmon hover:text-salmon ${
        lado === "esquerda" ? "left-3 sm:left-6" : "right-3 sm:right-6"
      }`}
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
        {lado === "esquerda" ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  );
}
