"use client";

import { motion, type Variants } from "motion/react";

// acento: `true` pinta a linha inteira, uma string pinta só aquele trecho.
// O destaque de uma palavra-chave é o padrão dos títulos de seção; a linha
// inteira ficou reservada ao hero, onde a frase toda é o gesto.
export type Linha = { texto: string; acento?: boolean | string };

// Índices das palavras que recebem a cor da marca.
//
// Compara palavra a palavra, e não por substring, para não pintar pedaço de
// palavra: procurar "arca" em "Marcas que" não deve casar.
function indicesAcentuados(texto: string, acento: Linha["acento"]) {
  const palavras = texto.split(" ");

  if (acento === true) return new Set(palavras.map((_, i) => i));
  if (typeof acento !== "string" || acento.trim() === "") return new Set<number>();

  const alvo = acento.trim().split(" ");

  for (let i = 0; i + alvo.length <= palavras.length; i += 1) {
    if (alvo.every((palavra, j) => palavras[i + j] === palavra)) {
      return new Set(alvo.map((_, j) => i + j));
    }
  }

  // Nada casou: melhor um título sem destaque do que a palavra errada pintada.
  return new Set<number>();
}

type Props = {
  linhas: Linha[];
  className?: string;
  /** Atraso antes da primeira palavra aparecer. */
  delay?: number;
  /** Anima assim que monta (hero) ou quando entra em cena (seções internas). */
  gatilho?: "imediato" | "scroll";
};

const container: Variants = {
  oculto: {},
  visivel: (delay: number) => ({
    transition: { staggerChildren: 0.075, delayChildren: delay },
  }),
};

// Cada palavra sobe de dentro de uma máscara — é o que dá o efeito cinematográfico
// da frase-problema se montando diante do visitante.
const palavra: Variants = {
  oculto: { y: "110%", opacity: 0 },
  visivel: {
    y: "0%",
    opacity: 1,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function WordReveal({
  linhas,
  className,
  delay = 0.15,
  gatilho = "imediato",
}: Props) {
  const animacao =
    gatilho === "imediato"
      ? { animate: "visivel" as const }
      : {
          whileInView: "visivel" as const,
          viewport: { once: true, margin: "0px 0px -80px 0px" },
        };

  return (
    <motion.span
      className={className}
      variants={container}
      custom={delay}
      initial="oculto"
      {...animacao}
    >
      {linhas.map((linha, indiceLinha) => {
        const palavras = linha.texto.split(" ");
        const acentuadas = indicesAcentuados(linha.texto, linha.acento);

        return (
          <span key={indiceLinha} className="block">
          {palavras.map((texto, indicePalavra) => (
            <span
              key={`${indiceLinha}-${indicePalavra}`}
              // A máscara precisa de overflow oculto e um respiro vertical para
              // não cortar acentos e descidas (ç, g, ã).
              className="inline-flex overflow-hidden pb-[0.12em] align-bottom"
            >
              <motion.span
                variants={palavra}
                className={acentuadas.has(indicePalavra) ? "acento" : undefined}
              >
                {texto}
                {indicePalavra < palavras.length - 1 ? "\u00A0" : ""}
              </motion.span>
            </span>
          ))}
          </span>
        );
      })}
    </motion.span>
  );
}
