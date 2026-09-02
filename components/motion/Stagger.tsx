"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const container: Variants = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item: Variants = {
  oculto: { opacity: 0, y: 26, filter: "blur(6px)" },
  visivel: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

// Envolva uma lista com <Stagger> e cada filho com <StaggerItem> para que
// entrem em cascata em vez de todos de uma vez.
//
// StaggerItem é export nomeado, e não Stagger.Item: propriedade estática em
// componente client não sobrevive à fronteira com o server component que importa.
export default function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={container}
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}
