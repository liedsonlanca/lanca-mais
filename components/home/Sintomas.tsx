"use client";

import { useState } from "react";
import type { Sintoma } from "@/lib/home";

// Os três sintomas do problema, que abrem ao clicar.
//
// O título sozinho é o que a pessoa precisa para se reconhecer, e por isso ele
// vinha sem explicação nenhuma: parágrafo embaixo de cada um enchia a home de
// texto que quase ninguém lia. Mas quem se reconhece num deles quer entender,
// e aí a explicação precisa estar a um clique, e não numa página adiante.
//
// É a mesma mecânica do FAQ, de propósito: quando dois lugares do site se
// comportam igual, a pessoa aprende o gesto uma vez só.

export default function Sintomas({ itens }: { itens: Sintoma[] }) {
  const [aberto, setAberto] = useState<number | null>(null);

  return (
    <div className="mt-9 border-t border-contorno">
      {itens.map((sintoma, i) => {
        const estaAberto = aberto === i;

        return (
          <div key={sintoma.titulo} className="group relative border-b border-contorno">
            {/* O fio de baixo acende de salmão: é a linha que já separa, e
                não um enfeite a mais. Acesa também quando está aberto, para
                a régua dizer onde a pessoa está. */}
            <span
              aria-hidden
              className={`absolute -bottom-px left-0 h-px bg-salmon transition-all duration-[900ms] ease-out ${
                estaAberto ? "w-full" : "w-0 group-hover:w-full"
              }`}
            />

            <button
              type="button"
              aria-expanded={estaAberto}
              aria-controls={`sintoma-${i}`}
              onClick={() => setAberto(estaAberto ? null : i)}
              className="flex w-full items-center gap-5 py-5 text-left"
            >
              <span
                className={`numeral-fantasma text-sm transition-colors duration-500 ${
                  estaAberto
                    ? "text-destaque"
                    : "text-tinta/45 group-hover:text-destaque"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <h3 className="font-heading flex-1 text-xl font-semibold leading-[1.2] tracking-[-0.025em] text-tinta lg:text-[1.45rem]">
                {sintoma.titulo}
              </h3>

              {/* O mais vira menos: a barra de pé encolhe até sumir. */}
              <span
                aria-hidden
                className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destaque/12"
              >
                <span className="absolute h-[1.5px] w-3.5 rounded-full bg-destaque" />
                <span
                  className={`absolute h-[1.5px] w-3.5 rounded-full bg-destaque transition-transform duration-500 ${
                    estaAberto ? "scale-x-0" : "rotate-90"
                  }`}
                />
              </span>
            </button>

            {/* grid-rows de 0fr para 1fr: o navegador anima a altura sozinho,
                a explicação pode ter o tamanho que tiver, e nada precisa ser
                remedido quando a janela muda de largura. */}
            <div
              id={`sintoma-${i}`}
              className={`grid transition-all duration-500 ease-out ${
                estaAberto
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-xl pb-6 pl-10 leading-relaxed text-tinta/65">
                  {sintoma.descricao}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
