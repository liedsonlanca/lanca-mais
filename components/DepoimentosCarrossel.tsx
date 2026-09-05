"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Depoimento } from "@/lib/conteudo";

// Depoimentos navegáveis.
//
// Device diferente do trilho de "Nosso trabalho" de propósito: lá o movimento
// é contínuo e automático, aqui é por página, com setas. Dois deslizes iguais
// na mesma home pareceriam falta de repertório — e, sobretudo, texto que anda
// sozinho foge da vista de quem está lendo.
//
// A rolagem é nativa, com scroll-snap: funciona com dedo, roda, teclado e
// setas, sem estado de posição para sincronizar. As setas só empurram o
// contêiner; quem manda na posição é o navegador.
export default function DepoimentosCarrossel({
  itens,
}: {
  itens: Depoimento[];
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const [pagina, setPagina] = useState(0);
  const [paginas, setPaginas] = useState(1);

  // Quantos cards cabem por vista, e onde começa cada página.
  //
  // A conta é feita pelas posições reais dos cards, e não dividindo a largura
  // rolável pela largura visível. O vão entre eles (gap) entra na rolagem mas
  // não na largura do card: dividir daria um resto que se acumula, e a partir
  // da nona página o ponto aceso apontaria a página errada.
  const porVista = useRef(1);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;

    function medir() {
      if (!el) return;
      const cards = [...el.children] as HTMLElement[];
      if (cards.length === 0 || el.clientWidth === 0) return;

      // Passo = largura do card mais o vão até o próximo.
      const passo =
        cards.length > 1
          ? cards[1].offsetLeft - cards[0].offsetLeft
          : cards[0].offsetWidth;
      if (passo <= 0) return;

      const cabem = Math.max(1, Math.round(el.clientWidth / passo));
      porVista.current = cabem;

      setPaginas(Math.ceil(cards.length / cabem));
      setPagina(Math.min(
        Math.round(el.scrollLeft / (passo * cabem)),
        Math.ceil(cards.length / cabem) - 1
      ));
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

    // Rola até o começo do primeiro card daquela página: a posição vem do
    // próprio elemento, então o vão nunca é esquecido.
    const cards = [...el.children] as HTMLElement[];
    const alvo = cards[indice * porVista.current];
    if (!alvo) return;

    el.scrollTo({ left: alvo.offsetLeft - cards[0].offsetLeft, behavior: "smooth" });
  }

  const temNavegacao = paginas > 1;

  return (
    <div className="mt-16">
      <div
        ref={trilho}
        // sem-barra esconde a barra de rolagem sem tirar a rolagem.
        // data-lenis-prevent: sem isto o Lenis engoliria o gesto horizontal.
        data-lenis-prevent
        className="sem-barra flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth"
      >
        {itens.map((depoimento, i) => (
          <div
            key={i}
            // Um card por vista no celular, dois no tablet, três no desktop.
            // A conta desconta o vão entre eles para o terceiro não vazar.
            className="w-full shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
          >
            <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-linha bg-areia p-8 shadow-[var(--sombra-cartao)] transition-all duration-500 hover:-translate-y-1.5 hover:border-salmon/50 hover:bg-branco">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 w-0 bg-salmon transition-all duration-700 group-hover:w-full"
              />

              <span
                aria-hidden
                className="font-heading block text-7xl leading-[0.6] text-salmon"
              >
                &ldquo;
              </span>

              <p className="mt-7 flex-1 text-[17px] leading-relaxed text-preto/85">
                {depoimento.citacao}
              </p>

              <div className="mt-8 flex items-center gap-4 border-t border-linha pt-6">
                {depoimento.foto ? (
                  <Image
                    src={depoimento.foto}
                    alt={`Foto de ${depoimento.nome}`}
                    width={44}
                    height={44}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-salmon/15 text-sm font-semibold text-salmon-texto"
                  >
                    {depoimento.nome
                      .replace(/[^A-Za-zÀ-ÿ ]/g, "")
                      .trim()
                      .charAt(0)
                      .toUpperCase() || "•"}
                  </span>
                )}

                <span>
                  <span className="block font-semibold text-preto">
                    {depoimento.nome}
                  </span>
                  <span className="block text-sm text-preto/60">
                    {depoimento.cargo}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Some quando tudo já cabe na tela: seta que não leva a lugar nenhum
          confunde mais do que ajuda. */}
      {temNavegacao && (
        <div className="mt-10 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => irPara(Math.max(0, pagina - 1))}
            disabled={pagina === 0}
            aria-label="Depoimentos anteriores"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-preto/20 text-preto/60 transition-all duration-500 hover:border-salmon hover:bg-salmon hover:text-preto disabled:opacity-30 disabled:hover:border-preto/20 disabled:hover:bg-transparent disabled:hover:text-preto/60"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </button>

          {/* O respiro entre os pontos vive no padding de cada botão, e não
              num gap: assim a área de toque de um encosta na do vizinho, sem
              faixa morta no meio, e o ponto continua do mesmo tamanho.

              A altura já era de 44px, mas a largura ficava em 14, e num alvo
              de dedo as duas contam: acertar uma tira de 14px de largura no
              celular é sorte. Agora são 44 nos dois sentidos, e o desenho não
              muda porque quem cresce é a área invisível em volta do ponto. */}
          <div className="flex items-center">
            {Array.from({ length: paginas }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => irPara(i)}
                aria-label={`Ir para a página ${i + 1} de depoimentos`}
                aria-current={i === pagina}
                className="flex h-11 min-w-11 items-center justify-center"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-500 ${
                    i === pagina ? "w-6 bg-salmon" : "w-1.5 bg-preto/20"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => irPara(Math.min(paginas - 1, pagina + 1))}
            disabled={pagina >= paginas - 1}
            aria-label="Próximos depoimentos"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-preto/20 text-preto/60 transition-all duration-500 hover:border-salmon hover:bg-salmon hover:text-preto disabled:opacity-30 disabled:hover:border-preto/20 disabled:hover:bg-transparent disabled:hover:text-preto/60"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
