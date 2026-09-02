"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// reducedMotion="user" faz o motion descartar as animações de transform
// (subida, parallax, escala) para quem pede menos movimento no sistema —
// o CSS sozinho não alcança as animações em JS.
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
