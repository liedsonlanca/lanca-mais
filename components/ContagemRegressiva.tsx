"use client";

import { useEffect, useState } from "react";

// Contagem regressiva até o lançamento.
//
// O servidor entrega a data; a contagem corre no navegador, porque uma página
// gerada antecipadamente ficaria com os números congelados no instante em que
// foi gerada.
//
// Ao chegar a zero, a página se recarrega uma vez. O porteiro, que compara a
// data a cada visita, então abre o site — sem ninguém precisar mexer no painel
// e mesmo que o lançamento caia de madrugada.
type Restante = { dias: number; horas: number; minutos: number; segundos: number };

function calcular(alvo: number): Restante | null {
  const falta = alvo - Date.now();
  if (falta <= 0) return null;

  return {
    dias: Math.floor(falta / 86_400_000),
    horas: Math.floor((falta / 3_600_000) % 24),
    minutos: Math.floor((falta / 60_000) % 60),
    segundos: Math.floor((falta / 1000) % 60),
  };
}

export default function ContagemRegressiva({ lancamento }: { lancamento: string }) {
  const alvo = Date.parse(lancamento);

  // Começa em nulo e só preenche depois de montar: o servidor e o navegador
  // não compartilham relógio, e renderizar números diferentes nos dois lados
  // faria o React reclamar de conteúdo divergente.
  const [restante, setRestante] = useState<Restante | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(alvo)) return;

    function tique() {
      const agora = calcular(alvo);
      setRestante(agora);
      setPronto(true);

      // Chegou a hora: recarrega para o porteiro decidir de novo, agora com a
      // data já vencida. Uma vez só — a página seguinte já é o site.
      if (!agora) window.location.reload();
    }

    tique();
    const relogio = setInterval(tique, 1000);
    return () => clearInterval(relogio);
  }, [alvo]);

  if (!Number.isFinite(alvo)) return null;

  const partes: Array<[number | null, string]> = [
    [restante?.dias ?? null, "dias"],
    [restante?.horas ?? null, "horas"],
    [restante?.minutos ?? null, "min"],
    [restante?.segundos ?? null, "seg"],
  ];

  return (
    <div
      // Enquanto o primeiro cálculo não chega, o bloco existe com a mesma
      // altura, só transparente: sem isso a página daria um salto no instante
      // em que os números aparecem.
      className={`transition-opacity duration-700 ${pronto ? "opacity-100" : "opacity-0"}`}
      aria-live="off"
    >
      {/* Quatro ladrilhos, e não quatro números separados por dois-pontos.
          O relógio digital era o desenho de qualquer contagem; o ladrilho é a
          mesma linguagem de card do resto do site, e dá peso à única coisa
          desta tela que muda sozinha.

          Largura máxima para o conjunto não esticar numa coluna larga: quatro
          ladrilhos de 300px cada viram painel de aeroporto. */}
      <div className="grid max-w-md grid-cols-4 gap-2 sm:gap-2.5">
        {partes.map(([valor, rotulo]) => (
          <div
            key={rotulo}
            className="rounded-2xl border border-bege/12 bg-bege/[0.04] px-1 py-3.5 text-center sm:py-4"
          >
            <span className="numeral-fantasma block text-3xl leading-none text-bege sm:text-4xl">
              {String(valor ?? 0).padStart(2, "0")}
            </span>
            <span className="mt-1.5 block text-[0.7rem] text-bege/45 sm:text-xs">
              {rotulo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
