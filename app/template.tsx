"use client";

import { motion } from "motion/react";

// template.tsx remonta a cada navegação — é o gancho para a transição
// de entrada de página, sem piscada branca entre rotas.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
