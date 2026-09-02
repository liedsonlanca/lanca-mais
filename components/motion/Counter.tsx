"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

type Props = {
  /** Parte numérica a ser contada, ex: 40. */
  valor: number;
  /** Texto antes/depois do número, ex: "+" e "%". */
  prefixo?: string;
  sufixo?: string;
  className?: string;
};

// Conta de 0 até o valor quando o bloco entra em cena.
export default function Counter({ valor, prefixo = "", sufixo = "", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const emCena = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (!emCena) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAtual(valor);
      return;
    }

    const duracao = 1400;
    const inicio = performance.now();
    let frame = 0;

    function passo(agora: number) {
      const progresso = Math.min((agora - inicio) / duracao, 1);
      // easeOutExpo — rápido no começo, assenta no final.
      const suave = progresso === 1 ? 1 : 1 - Math.pow(2, -10 * progresso);
      setAtual(Math.round(suave * valor));
      if (progresso < 1) frame = requestAnimationFrame(passo);
    }

    frame = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frame);
  }, [emCena, valor]);

  return (
    <span ref={ref} className={className}>
      {prefixo}
      {atual}
      {sufixo}
    </span>
  );
}
