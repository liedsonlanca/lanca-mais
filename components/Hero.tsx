"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import WordReveal from "@/components/motion/WordReveal";
import Counter from "@/components/motion/Counter";
import { stats } from "@/lib/site-config";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Parallax: o fundo sobe mais devagar que o texto e desaparece na saída.
  const fundoY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const conteudoY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const opacidade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={ref}
      className="superficie-escura noise relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-abismo"
    >
      {/* Padrão da marca ao fundo.
          Entra como imagem única em cover, e não repetida: as bordas do arquivo
          não fecham (diferença média de 20 e 47 entre lados opostos), então
          tilear deixaria emenda visível. */}
      <motion.div style={{ y: fundoY }} className="absolute inset-0 -top-[10%] h-[120%]">
        <Image
          src="/images/fundo-inicio.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
      </motion.div>

      {/* Vinheta: garante contraste do texto sobre o padrão */}
      <div className="absolute inset-0 bg-gradient-to-t from-abismo via-abismo/85 to-abismo/55" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-abismo to-transparent" />

      {/* Glow ambiente da marca */}
      <div className="glow-salmon pointer-events-none absolute -left-40 top-1/3 h-[520px] w-[520px] opacity-60 blur-3xl" />

      <motion.div
        style={{ y: conteudoY, opacity: opacidade }}
        className="relative mx-auto w-full max-w-7xl px-6 pb-24 pt-24 sm:pb-14 sm:pt-36 lg:px-10"
      >
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-4"
        >
          <span className="h-px w-8 shrink-0 bg-salmon sm:w-10" />
          <span className="eyebrow text-salmon">Agência de marketing completa</span>
        </motion.div>

        <div className="mt-6 grid gap-7 sm:mt-8 sm:gap-12 lg:grid-cols-[1.55fr_1fr] lg:items-end">
          <div>
            {/* A frase-problema: é a primeira coisa que o visitante lê.
                O clamp impede que o título encoste nas bordas no celular. */}
            <h1 className="font-heading text-[clamp(2.25rem,8.2vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-branco sm:text-6xl sm:leading-[0.98] lg:text-[5.5rem]">
              <WordReveal
                linhas={[
                  { texto: "Sua marca tem qualidade." },
                  { texto: "Sua presença digital", acento: true },
                  { texto: "mostra isso?", acento: true },
                ]}
                delay={0.35}
              />
            </h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="max-w-md text-[15px] leading-relaxed text-bege/85 sm:text-lg">
              A LANÇA+ transforma negócios com bons produtos e serviços em marcas
              com posicionamento sólido: estratégia documentada, conteúdo
              consistente e resultado medido mês a mês.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/contato"
                className="group relative overflow-hidden rounded-full bg-salmon px-7 py-3.5 text-center font-medium text-preto shadow-[0_0_32px_-8px_var(--color-salmon)] transition-all duration-500 hover:shadow-[0_0_48px_-6px_var(--color-salmon)]"
              >
                <span className="relative z-10">Receber diagnóstico inicial</span>
                <span className="absolute inset-0 -translate-x-full bg-salmon-claro transition-transform duration-500 group-hover:translate-x-0" />
              </Link>
              <Link
                href="/servicos"
                className="rounded-full border border-bege/25 px-7 py-3.5 text-center font-medium text-bege transition-colors duration-500 hover:border-salmon hover:text-salmon"
              >
                Conhecer serviços
              </Link>
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-bege/68 sm:text-sm">
              Primeira conversa sem compromisso, você sai com uma leitura honesta
              da sua presença digital.
            </p>
          </motion.div>
        </div>

        {/* Métricas e convite para rolar.
            Escondidos no celular: não cabiam na primeira tela e empurravam o
            título contra as bordas. Os mesmos números aparecem na seção Sobre. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-16 hidden flex-col gap-8 border-t border-borda/70 pt-8 lg:flex lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-12">
            {stats.map((stat) => (
              <div key={stat.label}>
                <span className="font-heading block text-3xl font-semibold text-salmon lg:text-4xl">
                  <Counter
                    valor={stat.valor}
                    prefixo={stat.prefixo}
                    sufixo={stat.sufixo}
                  />
                </span>
                <span className="mt-1 block text-xs uppercase tracking-widest text-bege/68">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-bege/62">
            <span className="eyebrow">Role para descobrir</span>
            <motion.span
              aria-hidden
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="block h-8 w-px bg-gradient-to-b from-salmon to-transparent"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
