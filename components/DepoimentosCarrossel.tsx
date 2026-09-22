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

/**
 * Uma estrela da nota.
 *
 * As vazias ficam, em cinza fraco, em vez de sumirem: é o contraste entre as
 * cheias e as apagadas que deixa a nota legível de relance. Só as cheias, uma
 * pessoa teria que contá-las para saber se são quatro ou cinco.
 *
 * Decorativa: quem informa a nota é o aria-label da linha inteira.
 */
function Estrela({ cheia }: { cheia: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${cheia ? "text-salmon" : "text-tinta/15"}`}
      fill="currentColor"
    >
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" />
    </svg>
  );
}

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
        {itens.map((depoimento, i) => {
          // A nota só vira estrela se for inteira e couber de 1 a 5. Dado
          // fora disso não é arredondado para o mais próximo: é descartado,
          // e o card volta a não afirmar nota nenhuma.
          const bruta = depoimento.nota;
          const estrelas =
            typeof bruta === "number" &&
            Number.isInteger(bruta) &&
            bruta >= 1 &&
            bruta <= 5
              ? bruta
              : null;

          return (
          <div
            key={i}
            // Um card por vista no celular, dois no tablet, três no desktop.
            // A conta desconta o vão entre eles para o terceiro não vazar.
            className="w-full shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
          >
            {/* Cartão, e não a cor da seção: a home alterna os fundos conforme
                as seções que aparecem, e o card precisa se destacar das duas. */}
            <div className="group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-contorno bg-cartao p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-salmon/45 lg:p-9">
              {/* As aspas viram marca d'água, grandes e quase invisíveis, no
                  canto de cima. Antes eram um caractere solto no topo do card,
                  com um vão morto entre ele e a frase: ocupavam altura sem dar
                  nada em troca. Aqui elas preenchem o card inteiro de fundo,
                  não empurram texto nenhum e acendem um pouco ao passar o
                  ponteiro. */}
              <span
                aria-hidden
                className="font-heading pointer-events-none absolute -right-3 -top-12 select-none text-[10rem] leading-none text-salmon/[0.07] transition-colors duration-700 group-hover:text-salmon/[0.13]"
              >
                &rdquo;
              </span>

              <span
                aria-hidden
                className="glow-salmon pointer-events-none absolute -left-20 -top-20 h-52 w-52 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-45"
              />

              {/* As estrelas, quando houver nota.

                  Aparecem acima da citação porque é o primeiro sinal que o
                  olho pega num card de depoimento, antes mesmo de ler.

                  Nota é dado do painel, um por depoimento, e não enfeite fixo:
                  cliente sem avaliação registrada aparece sem estrela alguma.
                  Cinco chumbadas em todo card seriam uma nota que ninguém deu.

                  Para quem usa leitor de tela, o desenho não diz nada: o
                  aria-label logo abaixo é que informa a nota, uma vez só. */}
              {estrelas !== null && (
                <p
                  className="relative mb-5 flex items-center gap-1"
                  aria-label={`Nota ${estrelas} de 5`}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Estrela key={n} cheia={n <= estrelas} />
                  ))}
                </p>
              )}

              <p className="relative flex-1 text-lg leading-[1.62] text-tinta/85 lg:text-[1.2rem]">
                {depoimento.citacao}
              </p>

              {/* Quem falou importa tanto quanto o que foi dito, então a foto
                  cresce e o nicho ganha a cor da marca: é ele que faz alguém
                  do mesmo ramo se reconhecer. */}
              <div className="relative mt-8 flex items-center gap-4 border-t border-contorno pt-6">
                {depoimento.foto ? (
                  <Image
                    src={depoimento.foto}
                    alt={`Foto de ${depoimento.nome}`}
                    width={52}
                    height={52}
                    className="h-13 w-13 shrink-0 rounded-full object-cover ring-1 ring-contorno"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-salmon/15 font-semibold text-destaque"
                  >
                    {depoimento.nome
                      .replace(/[^A-Za-zÀ-ÿ ]/g, "")
                      .trim()
                      .charAt(0)
                      .toUpperCase() || "•"}
                  </span>
                )}

                <span className="min-w-0">
                  <span className="font-heading block text-[1.05rem] font-semibold leading-tight tracking-[-0.02em] text-tinta">
                    {depoimento.nome}
                  </span>
                  <span className="mt-1 block text-sm text-destaque">
                    {depoimento.cargo}
                  </span>
                </span>
              </div>
            </div>
          </div>
          );
        })}
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
            className="flex h-11 w-11 items-center justify-center rounded-full border border-tinta/20 text-tinta/60 transition-all duration-500 hover:border-salmon hover:bg-salmon hover:text-tinta disabled:opacity-30 disabled:hover:border-tinta/20 disabled:hover:bg-transparent disabled:hover:text-tinta/60"
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
                    i === pagina ? "w-6 bg-salmon" : "w-1.5 bg-tinta/20"
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
            className="flex h-11 w-11 items-center justify-center rounded-full border border-tinta/20 text-tinta/60 transition-all duration-500 hover:border-salmon hover:bg-salmon hover:text-tinta disabled:opacity-30 disabled:hover:border-tinta/20 disabled:hover:bg-transparent disabled:hover:text-tinta/60"
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
