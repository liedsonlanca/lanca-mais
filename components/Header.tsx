"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { navLinks, siteConfig } from "@/lib/site-config";
import { pararRolagem, retomarRolagem } from "@/lib/scroll";

type Marca = { src: string; alt: string };

// A marca chega por propriedade, e não lida aqui dentro: este é um
// componente de navegador, e leitura de banco só acontece no servidor. Quem
// lê é o layout, uma vez por página, e passa para o topo e para o rodapé.
export default function Header({
  marcaClara,
  marcaEscura,
}: {
  marcaClara: Marca;
  marcaEscura: Marca;
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);
  const [sobreClaro, setSobreClaro] = useState(false);
  const { scrollY } = useScroll();

  // A cor do header segue o que está embaixo dele.
  //
  // Antes a regra era "no topo, texto claro; depois de rolar, escuro", que só
  // valia porque toda página abria com um hero escuro. Desde 18/09/2026 a home
  // abre com um painel claro e as outras continuam abrindo escuras, então
  // nenhuma regra de posição acerta as duas. Olhar o que está de fato sob o
  // header acerta qualquer página, inclusive uma que ainda não exista.
  //
  // Sobre um trecho claro, o header ganha a própria classe tema-claro, e as
  // cores dele se redefinem sozinhas, do mesmo jeito que as do painel.
  const medirFundo = useCallback(() => {
    const debaixo = document
      .elementsFromPoint(window.innerWidth / 2, 38)
      .find((el) => !el.closest("header"));
    setSobreClaro(Boolean(debaixo?.closest(".tema-claro")));
  }, []);

  useMotionValueEvent(scrollY, "change", (valor) => {
    setRolou(valor > 24);
    medirFundo();
  });

  // Ao chegar numa página, antes de qualquer rolagem. No quadro seguinte, e
  // não na hora: a página nova ainda está sendo desenhada quando o efeito roda.
  useEffect(() => {
    const quadro = requestAnimationFrame(medirFundo);
    return () => cancelAnimationFrame(quadro);
  }, [pathname, medirFundo]);

  // Com o menu cheio aberto, o que está embaixo é o menu, que é escuro.
  const claroEmCima = sobreClaro && !aberto;

  // Fecha o menu ao trocar de página.
  //
  // Ajuste durante a renderização, e não num efeito. Num efeito, o React
  // desenha a tela nova com o menu ainda aberto e só depois fecha, o que dá um
  // piscar do menu por cima da página que acabou de chegar. Comparando a rota
  // aqui, a tela nunca chega a ser pintada com o menu aberto.
  const [rotaDoMenu, setRotaDoMenu] = useState(pathname);
  if (rotaDoMenu !== pathname) {
    setRotaDoMenu(pathname);
    setAberto(false);
  }

  // Trava a rolagem enquanto o menu cheio está aberto.
  //
  // Travar o overflow do body não basta: quem controla a rolagem é o Lenis, e
  // ele continuaria movendo a página atrás do menu. Por isso o Lenis é parado
  // de verdade, e o overflow fica como reforço para o caso de movimento
  // reduzido, em que o Lenis nem chega a existir.
  useEffect(() => {
    if (aberto) {
      pararRolagem();
      document.body.style.overflow = "hidden";
    } else {
      retomarRolagem();
      document.body.style.overflow = "";
    }

    return () => {
      retomarRolagem();
      document.body.style.overflow = "";
    };
  }, [aberto]);

  // Esc fecha o menu, como qualquer sobreposição em tela cheia.
  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          claroEmCima ? "tema-claro" : ""
        } ${
          rolou || aberto
            ? "border-b border-contorno bg-fundo/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          {/* A área de toque tem 44px de altura; a imagem continua com 28.
              As duas medidas moram em caixas diferentes de propósito: os logos
              usam `fill`, então esticar a caixa do link esticaria o logo
              junto. A caixa interna preserva o tamanho desenhado. */}
          <Link
            href="/"
            aria-label="LANÇA+, página inicial"
            className="flex h-11 shrink-0 items-center"
          >
            <span className="relative block h-7 w-[110px]">
              {/* Duas versões do logo em cross-fade: a clara vale sobre fundo
                  escuro, a escura sobre fundo claro. */}
              <Image
                src={marcaClara.src}
                alt={marcaClara.alt}
                fill
                priority
                sizes="110px"
                className={`object-contain object-left transition-opacity duration-500 ${
                  claroEmCima ? "opacity-0" : "opacity-100"
                }`}
              />
              <Image
                src={marcaEscura.src}
                alt=""
                aria-hidden
                fill
                sizes="110px"
                className={`object-contain object-left transition-opacity duration-500 ${
                  claroEmCima ? "opacity-100" : "opacity-0"
                }`}
              />
            </span>
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
                  // A tinta já muda sozinha com o tema-claro: uma cor só serve
                  // sobre o claro e sobre o escuro.
                  className="group relative text-sm text-tinta/70 transition-colors duration-500 hover:text-tinta"
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
              // Tinta sobre fundo, como o botão preto da referência. Como o
              // header troca de tema sozinho, o mesmo botão sai preto sobre o
              // painel claro da home e claro sobre as seções escuras, sempre
              // com o contraste máximo do tema.
              className="group hidden min-h-11 items-center gap-2 rounded-full bg-tinta px-5 text-sm font-medium text-fundo transition-transform duration-300 hover:-translate-y-0.5 sm:inline-flex"
            >
              Pedir orçamento
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>

            <button
              type="button"
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              aria-expanded={aberto}
              className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] lg:hidden"
              onClick={() => setAberto((v) => !v)}
            >
              <span
                className={`h-px w-6 transition-all duration-300 ${
                  "bg-tinta"
                } ${aberto ? "translate-y-[3px] rotate-45" : ""}`}
              />
              <span
                className={`h-px w-6 transition-all duration-300 ${
                  "bg-tinta"
                } ${aberto ? "-translate-y-[3px] -rotate-45" : ""}`}
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Menu em tela cheia.
          Antes era uma lista de texto grande solta no branco, sem nada que
          desse estrutura. Agora cada destino é uma linha numerada com fio e
          seta, o mesmo vocabulário das abas de serviço e do FAQ, e a página
          atual aparece marcada em salmão.

          data-lenis-prevent: em tela baixa a lista rola dentro do painel, e
          sem isto o Lenis engoliria o gesto, como acontecia na Em breve. */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            data-lenis-prevent
            className="menu-aberto noise fixed inset-0 z-40 overflow-y-auto bg-fundo lg:hidden"
          >
            {/* Brilho de marca ao fundo: tira o chapado do branco puro. */}
            <div
              aria-hidden
              className="glow-salmon pointer-events-none absolute -right-24 top-16 h-[360px] w-[360px] opacity-40 blur-3xl"
            />

            {/* pt-24 desce o conteúdo para abaixo da barra fixa: centralizar
                fazia a primeira linha esbarrar no logo em telas baixas. */}
            <div className="relative flex min-h-full flex-col px-6 pb-10 pt-24">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="eyebrow text-tinta/45"
              >
                Navegação
              </motion.p>

              <nav className="mt-6">
                {navLinks.map((link, i) => {
                  const ativo =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);

                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.14 + i * 0.05,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Link
                        href={link.href}
                        aria-current={ativo ? "page" : undefined}
                        onClick={() => setAberto(false)}
                        className={`group flex items-center gap-4 border-t py-4 transition-colors duration-500 ${
                          ativo ? "border-salmon" : "border-contorno"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`numeral-fantasma w-7 shrink-0 text-xs transition-colors duration-500 ${
                            ativo ? "text-destaque" : "text-tinta/30"
                          }`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        <span
                          className={`font-heading flex-1 text-3xl font-semibold leading-none transition-colors duration-500 ${
                            ativo ? "text-destaque" : "text-tinta"
                          }`}
                        >
                          {link.label}
                        </span>

                        <span
                          aria-hidden
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ${
                            ativo
                              ? "border-salmon bg-salmon text-preto"
                              : "border-contorno text-tinta/55"
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Fecha a lista: sem isto o último item fica sem base. */}
                <span aria-hidden className="block border-t border-contorno" />
              </nav>

              {/* mt-auto empurra o rodapé do menu para baixo em tela alta, sem
                  deixá-lo sobrepor a lista em tela baixa. */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.46, ease: [0.22, 1, 0.36, 1] }}
                className="mt-auto pt-12"
              >
                <Link
                  href="/contato"
                  onClick={() => setAberto(false)}
                  className="block rounded-full bg-botao px-7 py-4 text-center font-medium text-branco shadow-[0_0_40px_-8px_var(--color-salmon)]"
                >
                  Pedir orçamento
                </Link>

                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-tinta/55">
                  <a
                    href={`https://wa.me/${siteConfig.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors duration-500 hover:text-destaque"
                  >
                    WhatsApp
                  </a>
                  <span aria-hidden className="text-tinta/25">
                    /
                  </span>
                  <a
                    href={`https://instagram.com/${siteConfig.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors duration-500 hover:text-destaque"
                  >
                    {siteConfig.instagram}
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
