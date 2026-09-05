"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
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

export default function Lightbox({
  pecas,
  indice,
  aoFechar,
  aoNavegar,
}: Props) {
  const aberto = indice !== null;
  const peca = aberto ? pecas[indice] : null;

  // Página aberta dentro de um carrossel. Nas outras peças fica em zero e
  // não faz diferença nenhuma.
  const [pagina, setPagina] = useState(0);

  const paginas = peca?.imagens ?? [];
  const ehCarrossel = peca?.tipo === "carrossel" && paginas.length > 1;

  // Trocar de peça recomeça a leitura. Sem isto, abrir um carrossel de três
  // páginas na terceira e passar para o próximo o abriria na terceira também
  // — ou num índice que ele nem tem.
  //
  // O ajuste é feito durante a renderização, e não num efeito: reiniciar
  // estado quando uma propriedade muda é derivação, não sincronização com o
  // mundo de fora. No efeito, a página errada chegaria a ser desenhada antes
  // da correção, e o leitor veria um pisca.
  const [pecaAnterior, setPecaAnterior] = useState(indice);
  if (indice !== pecaAnterior) {
    setPecaAnterior(indice);
    setPagina(0);
  }

  // As setas atravessam os dois níveis: folheiam as páginas do carrossel e,
  // ao chegar na ponta, passam para a peça vizinha. É a leitura contínua de
  // quem folheia uma revista, e evita o beco de uma seta que não faz nada.
  const anterior = useCallback(() => {
    if (indice === null) return;
    if (ehCarrossel && pagina > 0) {
      setPagina((p) => p - 1);
      return;
    }
    aoNavegar((indice - 1 + pecas.length) % pecas.length);
  }, [indice, pecas.length, aoNavegar, ehCarrossel, pagina]);

  const proxima = useCallback(() => {
    if (indice === null) return;
    if (ehCarrossel && pagina < paginas.length - 1) {
      setPagina((p) => p + 1);
      return;
    }
    aoNavegar((indice + 1) % pecas.length);
  }, [indice, pecas.length, aoNavegar, ehCarrossel, pagina, paginas.length]);

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
            {/* Vizinhas espiando dos lados.

                Não são navegáveis nem clicáveis: existem para dizer, num
                relance, que há mais páginas antes e depois. Sem elas o
                carrossel parece uma imagem só até alguém arriscar a seta.

                Ficam atrás da atual e para fora da caixa dela, encolhidas e
                apagadas, e são cortadas pela borda da tela — que é o que dá a
                sensação de continuidade. `pointer-events-none` para o clique
                atravessar e fechar o overlay, como em qualquer área vazia. */}
            <div className="relative w-full">
              {ehCarrossel &&
                [-1, 1].map((lado) => {
                  const vizinha = paginas[pagina + lado];
                  if (!vizinha) return null;

                  return (
                    <span
                      key={lado}
                      aria-hidden
                      className={`pointer-events-none absolute inset-y-0 w-full overflow-hidden rounded-3xl opacity-30 ${
                        lado === -1 ? "right-[62%]" : "left-[62%]"
                      }`}
                    >
                      <Image
                        src={vizinha}
                        alt=""
                        width={1000}
                        height={1250}
                        sizes="(max-width: 640px) 60vw, 360px"
                        className="h-full w-full scale-[0.88] object-cover"
                      />
                    </span>
                  );
                })}

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
                    key={ehCarrossel ? paginas[pagina] : peca.src}
                    src={ehCarrossel ? paginas[pagina] : peca.src}
                    alt={
                      ehCarrossel
                        ? `${peca.alt} — página ${pagina + 1} de ${paginas.length}`
                        : peca.alt
                    }
                    width={1000}
                    height={1250}
                    sizes="(max-width: 640px) 92vw, 560px"
                    priority
                    className="h-auto max-h-[78vh] w-full object-contain"
                  />
                )}
              </div>
            </div>

            {peca.legenda && (
              <p className="mt-5 max-w-md text-center text-sm text-bege/78">
                {peca.legenda}
              </p>
            )}

            {/* Pontos das páginas, no padrão que o trilho de depoimentos já
                usa. O respiro vive no padding de cada botão, e não num gap:
                assim a área de toque de um encosta na do vizinho, sem faixa
                morta no meio.

                shrink-0 porque a coluna que envolve isto tem altura limitada,
                e filho de flex encolhe por padrão: sem ele os botões perdiam
                2px e caíam abaixo do mínimo de toque. */}
            {ehCarrossel && (
              <div className="mt-4 flex shrink-0 items-center">
                {paginas.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPagina(i)}
                    aria-label={`Ir para a página ${i + 1}`}
                    aria-current={i === pagina}
                    className="flex h-11 items-center justify-center px-1"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-500 ${
                        i === pagina ? "w-6 bg-salmon" : "w-1.5 bg-bege/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}

            <p
              className={`text-xs uppercase tracking-widest text-bege/50 ${ehCarrossel ? "mt-1" : "mt-3"}`}
            >
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
        {lado === "esquerda" ? (
          <path d="M15 5l-7 7 7 7" />
        ) : (
          <path d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}
