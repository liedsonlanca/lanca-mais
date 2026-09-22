"use client";

import { useRef, useState } from "react";

// As dúvidas dos três serviços em evidência, em abas.
//
// Na home elas existem para derrubar objeção antes do contato: quem chegou
// até aqui já quer, e o que falta é a pergunta que ele não fez em voz alta.
// Cada serviço tem as suas, e misturar as quinze numa lista só obrigaria a
// pessoa a garimpar as que são dela.
//
// Uma resposta aberta por vez, de propósito: com várias abertas a lista cresce
// e a pessoa perde o lugar. A que abre inverte as cores e vira o bloco mais
// escuro (ou mais claro) da tela, então nunca há dúvida sobre qual está
// aberta.
//
// A abertura é feita com grid-rows de 0fr para 1fr, e não com altura medida em
// JavaScript: o navegador anima sozinho, a resposta pode ter o tamanho que
// tiver, e nada precisa ser remedido quando a janela muda de largura.

export type AbaFaq = {
  slug: string;
  nome: string;
  perguntas: { pergunta: string; resposta: string }[];
};

export default function FaqServicos({ abas }: { abas: AbaFaq[] }) {
  const [aba, setAba] = useState(0);
  // Tudo fechado ao chegar: a lista de perguntas se lê de relance, e uma
  // resposta já aberta rouba a vista das outras quatro antes de a pessoa
  // escolher a dela.
  const [aberta, setAberta] = useState<number | null>(null);
  const botoesAba = useRef<Array<HTMLButtonElement | null>>([]);

  if (abas.length === 0) return null;

  const atual = abas[aba];

  function trocarAba(indice: number) {
    setAba(indice);
    // Fecha o que estava aberto: a resposta da aba antiga não tem nada a ver
    // com a nova, e deixá-la aberta na mesma posição parecia que o conteúdo
    // não tinha trocado.
    setAberta(null);
  }

  // Setas andam entre as abas, como manda o padrão de abas: sem isto, quem
  // navega por teclado precisa sair e voltar com Tab para trocar.
  function aoTeclar(evento: React.KeyboardEvent) {
    const passo =
      evento.key === "ArrowRight" ? 1 : evento.key === "ArrowLeft" ? -1 : 0;
    if (passo === 0) return;

    evento.preventDefault();
    const proxima = (aba + passo + abas.length) % abas.length;
    trocarAba(proxima);
    botoesAba.current[proxima]?.focus();
  }

  return (
    <div className="mt-10">
      {/* A barra de abas.

          No celular os três nomes não cabem lado a lado, e antes a barra
          rolava: a terceira aba ficava fora da tela e a segunda aparecia
          cortada no meio da palavra, sem nada avisando que aquilo arrastava.
          Aba que não se vê não é escolhida.

          Agora elas quebram linha e aparecem inteiras. O contêiner perde o
          arredondamento de pílula no celular, porque pílula com duas fileiras
          dentro vira uma cápsula estranha; da tablet para cima, onde as três
          cabem numa linha só, a pílula volta. */}
      <div
        role="tablist"
        aria-label="Dúvidas por serviço"
        onKeyDown={aoTeclar}
        className="flex flex-wrap gap-1.5 rounded-[20px] border border-contorno bg-cartao p-1.5 sm:w-fit sm:flex-nowrap sm:rounded-full"
      >
        {abas.map((item, i) => (
          <button
            key={item.slug}
            ref={(el) => {
              botoesAba.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`aba-${item.slug}`}
            aria-selected={i === aba}
            aria-controls={`painel-${item.slug}`}
            tabIndex={i === aba ? 0 : -1}
            onClick={() => trocarAba(i)}
            // grow no celular, para as abas de uma mesma fileira dividirem a
            // largura em vez de deixarem um buraco na ponta direita.
            className={`flex min-h-11 grow shrink-0 items-center justify-center rounded-full px-5 text-center text-sm font-medium transition-colors duration-500 sm:grow-0 ${
              i === aba
                ? "bg-salmon text-preto"
                : "text-tinta/60 hover:text-tinta"
            }`}
          >
            {item.nome}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`painel-${atual.slug}`}
        aria-labelledby={`aba-${atual.slug}`}
        className="mt-5 flex flex-col gap-2.5"
      >
        {atual.perguntas.map((item, i) => {
          const estaAberta = aberta === i;

          return (
            <div
              key={item.pergunta}
              className={`overflow-hidden rounded-[18px] border transition-colors duration-500 ${
                estaAberta
                  ? "border-transparent bg-tinta text-fundo"
                  : "border-contorno bg-cartao hover:border-salmon/40"
              }`}
            >
              <button
                type="button"
                aria-expanded={estaAberta}
                aria-controls={`resposta-${atual.slug}-${i}`}
                onClick={() => setAberta(estaAberta ? null : i)}
                className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left"
              >
                <span
                  className={`font-medium leading-snug ${
                    estaAberta ? "text-fundo" : "text-tinta"
                  }`}
                >
                  {item.pergunta}
                </span>

                {/* O mais vira menos: a barra de pé encolhe até sumir. */}
                <span
                  aria-hidden
                  className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${
                    estaAberta ? "bg-fundo/12" : "bg-destaque/12"
                  }`}
                >
                  <span
                    className={`absolute h-[1.5px] w-3.5 rounded-full transition-colors duration-500 ${
                      estaAberta ? "bg-fundo" : "bg-destaque"
                    }`}
                  />
                  <span
                    className={`absolute h-[1.5px] w-3.5 rounded-full transition-all duration-500 ${
                      estaAberta ? "scale-x-0 bg-fundo" : "rotate-90 bg-destaque"
                    }`}
                  />
                </span>
              </button>

              <div
                id={`resposta-${atual.slug}-${i}`}
                className={`grid transition-all duration-500 ease-out ${
                  estaAberta
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 pr-14 leading-relaxed text-fundo/70">
                    {item.resposta}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
