"use client";

import { motion, type Variants } from "motion/react";

export type Linha = { texto: string; acento?: boolean };

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
      {linhas.map((linha, indiceLinha) => (
        <span key={indiceLinha} className="block">
          {linha.texto.split(" ").map((texto, indicePalavra) => (
            <span
              key={`${indiceLinha}-${indicePalavra}`}
              // A máscara precisa de overflow oculto e um respiro vertical para
              // não cortar acentos e descidas (ç, g, ã).
              className="inline-flex overflow-hidden pb-[0.12em] align-bottom"
            >
              <motion.span
                variants={palavra}
                className={linha.acento ? "acento" : undefined}
              >
                {texto}
                {indicePalavra < linha.texto.split(" ").length - 1 ? "\u00A0" : ""}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </motion.span>
  );
}
