"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Atraso em segundos — use para escalonar irmãos manualmente. */
  delay?: number;
  /** Distância em px que o elemento sobe ao entrar. */
  distance?: number;
  as?: "div" | "section" | "li" | "article" | "span";
};

// Entrada padrão de todo bloco do site: sobe, desfoca de leve e ganha nitidez.
export default function Reveal({
  children,
  className,
  delay = 0,
  distance = 28,
  as = "div",
}: Props) {
  const Componente = motion[as];

  const variants: Variants = {
    oculto: { opacity: 0, y: distance, filter: "blur(6px)" },
    visivel: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.9,
        delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <Componente
      className={className}
      variants={variants}
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
    >
      {children}
    </Componente>
  );
}
