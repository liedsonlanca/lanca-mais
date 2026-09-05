"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Pessoa } from "@/lib/equipe";

// Trilho da equipe, na página Sobre.
//
// A grade fixa que existia aqui antes tinha um teto: com quatro colunas dentro
// da coluna da página, cada retrato ficava com 250px, e cadastrar a quinta
// pessoa só pioraria isso. Um trilho horizontal desata os dois nós de uma vez:
// o card cresce, e a lista deixa de ter tamanho máximo.
//
// O trilho fica dentro da mesma coluna do título, e não sangrando até as
// bordas da tela. Foram duas tentativas até chegar aqui, e as duas erraram
// pelo mesmo motivo: sangrando, o trilho não tem como concordar com o título.
// Encostado à esquerda da tela, o card começava 380px antes do título e sobrava
// meia tela vazia do outro lado; centralizado na tela, a folga ficava igual dos
// dois lados mas o card passava a começar antes do título. Dentro da coluna, as
// duas bordas batem com o título e com todas as seções acima, que é o que faz a
// seção parecer parte da página.
//
// As setas só aparecem quando há mais gente do que cabe. Com a equipe inteira à
// vista, um par de botões que não levam a lugar nenhum seria ruído, e
// desabilitados seriam pior ainda.
//
// Diferente do trilho da vitrine, este não anda sozinho: lá o movimento é o
// convite para olhar o trabalho; aqui a pessoa lê nomes e cargos, e um texto
// que escapa enquanto se lê é hostil.
const GAP = 24;

export default function EquipeTrilho({ equipe }: { equipe: Pessoa[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [transborda, setTransborda] = useState(false);
  const [noInicio, setNoInicio] = useState(true);
  const [noFim, setNoFim] = useState(false);

  const medir = useCallback(() => {
    const el = trilho.current;
    if (!el) return;

    // Uma folga de 2px absorve o arredondamento do navegador: sem ela, um
    // trilho exatamente do tamanho do conteúdo às vezes se dizia transbordado
    // por meio pixel, e as setas piscavam ao redimensionar.
    const sobra = el.scrollWidth - el.clientWidth;
    setTransborda(sobra > 2);
    setNoInicio(el.scrollLeft <= 2);
    setNoFim(el.scrollLeft >= sobra - 2);
  }, []);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;

    medir();

    // ResizeObserver em vez de ouvir o resize da janela: o trilho também muda
    // de largura quando a barra de rolagem da página aparece ou some, e isso
    // não dispara resize.
    const observador = new ResizeObserver(medir);
    observador.observe(el);

    el.addEventListener("scroll", medir, { passive: true });
    return () => {
      observador.disconnect();
      el.removeEventListener("scroll", medir);
    };
  }, [medir, equipe.length]);

  function passar(direcao: -1 | 1) {
    const el = trilho.current;
    if (!el) return;

    // Um card por clique, medido no próprio card em vez de fixado no código:
    // a largura muda com a faixa da tela, e um passo constante deixaria o
    // trilho meio card fora de lugar no celular.
    const card = el.firstElementChild as HTMLElement | null;
    const passo = (card?.offsetWidth ?? 280) + GAP;

    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: passo * direcao, behavior: suave ? "smooth" : "auto" });
  }

  const seta =
    "flex h-11 w-11 items-center justify-center rounded-full border border-linha text-preto/55 transition-colors duration-300 hover:border-salmon hover:text-salmon-texto disabled:opacity-25 disabled:hover:border-linha disabled:hover:text-preto/55";

  return (
    <>
      {transborda && (
        <div className="mx-auto mt-8 flex max-w-6xl justify-end gap-3 px-6 lg:px-10">
          <button
            type="button"
            onClick={() => passar(-1)}
            disabled={noInicio}
            aria-label="Ver quem vem antes"
            className={seta}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="h-4 w-4"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => passar(1)}
            disabled={noFim}
            aria-label="Ver quem vem depois"
            className={seta}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="h-4 w-4"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      <div className="relative mx-auto mt-8 max-w-6xl">
        {/* Véus laterais, cada um só quando há conteúdo escondido daquele
            lado. Fixos, escureceriam um card inteiramente visível. */}
        {transborda && !noInicio && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-areia to-transparent lg:w-16" />
        )}
        {transborda && !noFim && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-areia to-transparent lg:w-16" />
        )}

        {/* tabIndex torna o trilho alcançável pelo teclado: os cards não são
            clicáveis, então sem isto quem não usa mouse não teria como chegar
            às pessoas escondidas. Com ele, as setas do teclado rolam. */}
        <div
          ref={trilho}
          tabIndex={0}
          role="group"
          aria-label="Equipe da LANÇA+"
          // O respiro é o mesmo px do resto da página, e é ele que alinha o
          // primeiro card com o título.
          //
          // Sem encaixe de rolagem, de propósito. O encaixe obrigatório exige
          // que o trilho pare sempre sobre um ponto de encaixe, e aqui o que
          // sobra para rolar (200px com quatro pessoas) é menor que um card
          // (324px com o vão): o único ponto além do começo ficava fora do
          // alcance, então o navegador devolvia o trilho ao zero e a seta não
          // saía do lugar. Encaixar o último pela direita também não resolveu.
          //
          // Como a peça mostra um card cortado de propósito, encaixar nunca foi
          // o objetivo: o passo certo já vem do clique na seta, que anda um
          // card exato.
          className="sem-barra flex gap-6 overflow-x-auto px-6 pb-2 lg:px-10"
        >
          {equipe.map((pessoa) => (
            <div
              key={pessoa.nome}
              // 300 dentro da coluna deixa três retratos inteiros e cem pixels
              // do quarto à mostra. O pedaço que sobra é o que diz, sem texto
              // nenhum, que a fileira continua.
              className="w-[248px] shrink-0 sm:w-[288px] lg:w-[300px]"
            >
              {/* A foto ocupa o card inteiro e o nome vem sobre ela, num véu
                  que sobe no hover. A função fica numa etiqueta salmão, o
                  mesmo selo de acento usado nas etiquetas do blog. */}
              <div className="group relative aspect-[3/4] overflow-hidden rounded-3xl border border-linha bg-areia shadow-[var(--sombra-cartao)] transition-all duration-500 hover:-translate-y-1.5 hover:border-salmon/45 hover:shadow-[0_30px_60px_-36px_rgba(10,10,8,0.55)]">
                <Image
                  src={pessoa.foto}
                  alt={pessoa.nome}
                  fill
                  sizes="(max-width: 640px) 248px, (max-width: 1024px) 288px, 300px"
                  className="object-cover object-top grayscale transition-all duration-[1.2s] group-hover:scale-[1.06] group-hover:grayscale-0"
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-abismo via-abismo/80 to-transparent p-5 pt-20">
                  {/* Rótulo sem cápsula: os cargos reais são longos e, em card
                      estreito, a pílula quebrava em duas linhas com alturas
                      desiguais na fileira. */}
                  <span className="block text-[11px] font-semibold uppercase leading-tight tracking-[0.14em] text-salmon">
                    {pessoa.funcao}
                  </span>
                  <h3 className="mt-2.5 text-lg font-semibold leading-tight text-branco">
                    {pessoa.nome}
                  </h3>
                  {/* Régua de lançamento, como nas abas e no método. */}
                  <span
                    aria-hidden
                    className="mt-3 block h-[3px] w-8 bg-salmon transition-all duration-700 ease-out group-hover:w-16"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
