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
  const ehTrinca = peca?.tipo === "trinca";

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
            // A trinca precisa de largura, e não da caixa estreita das outras.
            //
            // As demais peças são do formato do feed, em pé, e 560px já as
            // mostram maiores do que qualquer celular. A trinca é o contrário:
            // são três quadros lado a lado, perto de 2,4 por 1. Presa naquela
            // largura ela viraria uma tirinha de dois centímetros de altura, e
            // o que a peça tem de melhor é justamente a largura.
            className={`flex max-h-full w-full flex-col items-center ${
              ehTrinca ? "max-w-[min(96vw,1400px)]" : "max-w-[min(92vw,560px)]"
            }`}
          >
            {ehCarrossel ? (
              <Carrossel
                paginas={paginas}
                pagina={pagina}
                aoTrocar={setPagina}
                alt={peca.alt}
              />
            ) : (
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
                    // As medidas dizem ao navegador a proporção esperada, e
                    // é isso que reserva o espaço certo antes de a imagem
                    // chegar. Com as da peça em pé, a trinca abriria alta e
                    // encolheria de repente ao carregar.
                    width={ehTrinca ? 2400 : 1000}
                    height={ehTrinca ? 1000 : 1250}
                    sizes={
                      ehTrinca
                        ? "(max-width: 640px) 96vw, 1400px"
                        : "(max-width: 640px) 92vw, 560px"
                    }
                    priority
                    className="h-auto max-h-[78vh] w-full object-contain"
                  />
                )}
              </div>
            )}

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
            {/* Dizer que é carrossel, e que dá para arrastar.

                As vizinhas espiando sugerem, mas sugestão não é instrução: a
                pessoa precisa saber que o gesto existe antes de arriscá-lo. O
                trilho da home usa a mesma frase, e repetir o vocabulário é o
                que faz o site parecer um só. */}
            {ehCarrossel && (
              <p className="eyebrow mt-4 shrink-0 text-bege/45">
                Carrossel · arraste para ver as {paginas.length} páginas
              </p>
            )}

            {ehCarrossel && (
              <div className="mt-3 flex shrink-0 items-center">
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

/**
 * As páginas de um carrossel, com as vizinhas espiando dos lados.
 *
 * As três ficam empilhadas em posição absoluta e cada uma anima para o próprio
 * lugar: a atual no centro, inteira; as vizinhas deslocadas, encolhidas e
 * apagadas. Trocar de página anima as três de uma vez, e é isso que substitui
 * a troca seca de antes — a imagem nova entra vindo do lado, e não aparecendo
 * do nada.
 *
 * O contêiner tem proporção fixa porque os filhos são absolutos e não lhe dão
 * altura. 4:5 é o formato do feed, que é o que a agência produz e o que o
 * painel pede no envio.
 *
 * O arrasto move o grupo inteiro com o dedo, e não só troca a página no fim:
 * sem esse acompanhamento o gesto parece um botão escondido, e é justamente o
 * que fazia a navegação parecer bruta.
 */
function Carrossel({
  paginas,
  pagina,
  aoTrocar,
  alt,
}: {
  paginas: string[];
  pagina: number;
  aoTrocar: (nova: number) => void;
  alt: string;
}) {
  // Mola, e não duração fixa: o movimento desacelera como coisa com massa, e
  // é o que separa "suave" de "lento".
  const molejo = { type: "spring" as const, stiffness: 260, damping: 34 };

  return (
    <motion.div
      drag="x"
      dragElastic={0.14}
      dragMomentum={false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        // Decide por distância ou por velocidade: um empurrão curto e rápido
        // vale tanto quanto um arrasto longo e lento, que é como o dedo
        // espera que funcione.
        const distancia = info.offset.x;
        const impulso = info.velocity.x;
        const passou = Math.abs(distancia) > 60 || Math.abs(impulso) > 380;
        if (!passou) return;

        const destino = distancia < 0 ? pagina + 1 : pagina - 1;
        if (destino >= 0 && destino < paginas.length) aoTrocar(destino);
      }}
      className="relative w-full cursor-grab touch-pan-y active:cursor-grabbing"
      style={{ aspectRatio: "4 / 5", maxHeight: "72vh" }}
    >
      {paginas.map((endereco, i) => {
        const distancia = i - pagina;

        // Só a atual e as duas vizinhas existem no documento. Um carrossel de
        // doze páginas não precisa manter dez imagens fora da tela.
        if (Math.abs(distancia) > 1) return null;

        const atual = distancia === 0;

        return (
          <motion.div
            key={endereco}
            initial={false}
            animate={{
              x: `${distancia * 68}%`,
              scale: atual ? 1 : 0.86,
              opacity: atual ? 1 : 0.3,
            }}
            transition={molejo}
            style={{ zIndex: atual ? 2 : 1 }}
            className="absolute inset-0 overflow-hidden rounded-3xl border border-borda bg-grafite"
          >
            <Image
              src={endereco}
              alt={
                atual ? `${alt} — página ${i + 1} de ${paginas.length}` : ""
              }
              fill
              sizes="(max-width: 640px) 92vw, 560px"
              priority={atual}
              // draggable falso: sem isso o navegador inicia o arrasto nativo
              // da imagem e o gesto do carrossel morre no meio.
              draggable={false}
              className="object-cover"
            />
          </motion.div>
        );
      })}
    </motion.div>
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
