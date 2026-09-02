"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { navLinks, siteConfig } from "@/lib/site-config";

export default function Header() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);
  const { scrollY } = useScroll();

  // Toda página abre com um hero escuro, então no topo o header é transparente
  // com texto claro. Depois da dobra ele entra no claro do corpo do site.
  useMotionValueEvent(scrollY, "change", (valor) => {
    setRolou(valor > 24);
  });

  const claro = rolou || aberto;

  // Fecha o menu ao trocar de página.
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  // Trava a rolagem enquanto o menu cheio está aberto.
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          claro
            ? "border-b border-linha bg-papel/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" aria-label="LANÇA+, página inicial" className="relative block h-7 w-[110px] shrink-0">
            {/* Duas versões do logo em cross-fade: a clara vale sobre o hero
                escuro, a escura vale sobre o corpo claro. */}
            <Image
              src="/images/logo-1.png"
              alt="LANÇA+"
              fill
              priority
              sizes="110px"
              className={`object-contain object-left transition-opacity duration-500 ${
                claro ? "opacity-0" : "opacity-100"
              }`}
            />
            <Image
              src="/images/logo-2.png"
              alt=""
              aria-hidden
              fill
              sizes="110px"
              className={`object-contain object-left transition-opacity duration-500 ${
                claro ? "opacity-100" : "opacity-0"
              }`}
            />
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {navLinks.map((link) => {
              const ativo =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative text-sm transition-colors duration-500 ${
                    claro
                      ? "text-preto/65 hover:text-preto"
                      : "text-bege/85 hover:text-bege"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-px bg-salmon transition-all duration-500 ${
                      ativo ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/contato"
              className="hidden rounded-full bg-salmon px-5 py-2.5 text-sm font-medium text-preto shadow-[0_0_24px_-8px_var(--color-salmon)] transition-all duration-300 hover:shadow-[0_0_36px_-6px_var(--color-salmon)] sm:inline-block"
            >
              Pedir orçamento
            </Link>

            <button
              type="button"
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              aria-expanded={aberto}
              className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden"
              onClick={() => setAberto((v) => !v)}
            >
              <span
                className={`h-px w-6 transition-all duration-300 ${
                  claro ? "bg-preto" : "bg-bege"
                } ${aberto ? "translate-y-[3px] rotate-45" : ""}`}
              />
              <span
                className={`h-px w-6 transition-all duration-300 ${
                  claro ? "bg-preto" : "bg-bege"
                } ${aberto ? "-translate-y-[3px] -rotate-45" : ""}`}
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Menu em tela cheia */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-papel px-6 lg:hidden"
          >
            <nav className="flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.08 + i * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setAberto(false)}
                    className="font-heading block py-2 text-4xl font-semibold text-preto transition-colors hover:text-salmon"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mt-12 border-t border-linha pt-8"
            >
              <Link
                href="/contato"
                onClick={() => setAberto(false)}
                className="inline-block rounded-full bg-salmon px-7 py-3.5 font-medium text-preto"
              >
                Pedir orçamento
              </Link>
              <p className="mt-6 text-sm text-preto/50">{siteConfig.instagram}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
