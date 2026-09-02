"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { registrarLenis } from "@/lib/scroll";

// Rolagem com inércia — é o que dá a sensação de "suave" antes de qualquer
// animação de entrada. Desligada para quem pede menos movimento.
export default function SmoothScroll() {
  useEffect(() => {
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduzido.matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
    });

    registrarLenis(lenis);

    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      registrarLenis(null);
    };
  }, []);

  return null;
}
