"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Service } from "@/lib/site-config";
import ServiceIcon from "@/components/ServiceIcon";
import PreviaServico from "@/components/PreviaServico";

// Os serviços em evidência, em trilho.
//
// No desktop os três cabem lado a lado e não há o que navegar; no celular vira
// um card por vez, com os pontos embaixo dizendo onde se está. Os pontos só
// nascem quando há mais de uma página: seta ou ponto que não leva a lugar
// nenhum confunde mais do que ajuda.
//
// A rolagem é nativa, com scroll-snap, então dedo, roda, teclado e leitor de
// tela continuam funcionando sem estado nosso para sincronizar.
export default function ServicosDestaque({ itens }: { itens: Service[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const porVista = useRef(1);
  const [pagina, setPagina] = useState(0);
  const [paginas, setPaginas] = useState(1);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;

    function medir() {
      if (!el) return;
      const cards = [...el.children] as HTMLElement[];
      if (cards.length === 0 || el.clientWidth === 0) return;

      // Passo = largura do card mais o vão até o próximo. Dividir a largura
      // rolável pela visível deixaria o vão de fora e a conta escorregaria.
      const passo =
        cards.length > 1
          ? cards[1].offsetLeft - cards[0].offsetLeft
          : cards[0].offsetWidth;
      if (passo <= 0) return;

      const cabem = Math.max(1, Math.round(el.clientWidth / passo));
      porVista.current = cabem;

      const total = Math.ceil(cards.length / cabem);
      setPaginas(total);
      setPagina(Math.min(Math.round(el.scrollLeft / (passo * cabem)), total - 1));
    }

    medir();
    el.addEventListener("scroll", medir, { passive: true });

    const observador = new ResizeObserver(medir);
    observador.observe(el);

    return () => {
      el.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, [itens.length]);

  function irPara(indice: number) {
    const el = trilho.current;
    if (!el) return;
    const cards = [...el.children] as HTMLElement[];
    const alvo = cards[indice * porVista.current];
    if (!alvo) return;
    el.scrollTo({ left: alvo.offsetLeft - cards[0].offsetLeft, behavior: "smooth" });
  }

  return (
    <div className="mt-12">
      <div
        ref={trilho}
        // data-lenis-prevent: sem isto a rolagem suave da página engoliria o
        // gesto horizontal dentro do trilho.
        data-lenis-prevent
        className="sem-barra flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth"
      >
        {itens.map((s) => (
          <Link
            key={s.slug}
            href={`/servicos/${s.slug}`}
            className="group relative flex w-[86%] shrink-0 snap-start flex-col overflow-hidden rounded-[28px] border border-contorno bg-cartao transition-all duration-500 hover:-translate-y-1.5 hover:border-salmon/50 focus-visible:-translate-y-1.5 focus-visible:border-salmon focus-visible:outline-none sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
          >
            {/* Régua de lançamento no topo, a mesma dos cards do site. */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px] w-0 bg-salmon transition-all duration-700 group-hover:w-full group-focus-visible:w-full"
            />

            <div className="flex items-start gap-4 px-7 pb-6 pt-8">
              <span
                aria-hidden
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salmon/12 text-salmon transition-colors duration-500 group-hover:bg-salmon group-hover:text-preto"
              >
                <ServiceIcon slug={s.slug} className="h-5 w-5" />
              </span>

              <span className="min-w-0">
                <h3 className="text-xl font-semibold leading-snug tracking-[-0.02em] text-tinta">
                  {s.name}
                </h3>
                <span className="mt-2 block text-sm leading-relaxed text-tinta/55">
                  {s.shortDescription}
                </span>
              </span>
            </div>

            {/* A prévia. Fica recuada das bordas, como uma tela dentro do
                card, e é o que dá a cada serviço um rosto próprio. */}
            <div className="relative flex-1 px-3 pb-3">
              <div className="relative h-full min-h-[210px] overflow-hidden rounded-[20px] border border-contorno/80 bg-fundo-alt">
                <span
                  aria-hidden
                  className="glow-salmon pointer-events-none absolute -bottom-16 left-1/2 h-48 w-48 -translate-x-1/2 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-60"
                />
                <div className="relative h-full p-1 transition-transform duration-700 group-hover:scale-[1.03]">
                  <PreviaServico slug={s.slug} />
                </div>
              </div>
            </div>

            {/* A seta grande, apoiada no canto da prévia. É ela que diz que o
                card inteiro leva a algum lugar, sem precisar de "saiba mais". */}
            <span
              aria-hidden
              className="absolute bottom-7 right-7 flex h-14 w-14 items-center justify-center rounded-full border border-contorno bg-fundo text-tinta shadow-[var(--sombra-cartao)] transition-all duration-500 group-hover:border-salmon group-hover:bg-salmon group-hover:text-preto group-focus-visible:border-salmon group-focus-visible:bg-salmon group-focus-visible:text-preto"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              >
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </span>
          </Link>
        ))}
      </div>

      {paginas > 1 && (
        <div className="mt-8 flex items-center justify-center">
          {Array.from({ length: paginas }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => irPara(i)}
              aria-label={`Ver serviço ${i + 1} de ${paginas}`}
              aria-current={i === pagina}
              // O respiro vive no botão, e não num vão entre eles: assim a
              // área de toque de um encosta na do vizinho, sem faixa morta, e
              // o ponto continua do mesmo tamanho.
              className="flex h-11 min-w-11 items-center justify-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-500 ${
                  i === pagina ? "w-7 bg-salmon" : "w-1.5 bg-tinta/20"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
