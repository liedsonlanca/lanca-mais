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
    // Por extenso, como na referência. Cabem: são quatro colunas de uma
    // caixa de 672px, e "segundos" ocupa menos da metade de cada uma.
    [restante?.minutos ?? null, "minutos"],
    [restante?.segundos ?? null, "segundos"],
  ];

  return (
    <div
      // Enquanto o primeiro cálculo não chega, o bloco existe com a mesma
      // altura, só transparente: sem isso a página daria um salto no instante
      // em que os números aparecem.
      className={`transition-opacity duration-700 ${pronto ? "opacity-100" : "opacity-0"}`}
      aria-live="off"
    >
      {/* Quatro números soltos, sem caixa e sem dois-pontos.
          O peso vem do tamanho, e não de moldura: quanto menos desenho em
          volta, maior o número pode ser na mesma largura — e o número é a
          única coisa desta tela que muda sozinha. */}
      <div className="mx-auto grid max-w-2xl grid-cols-4">
        {partes.map(([valor, rotulo]) => (
          <div key={rotulo} className="text-center">
            <span className="numeral-fantasma block text-[clamp(2.5rem,12vw,4.5rem)] font-light leading-none text-bege">
              {String(valor ?? 0).padStart(2, "0")}
            </span>
            <span className="mt-2 block text-xs text-bege/50 sm:text-sm">
              {rotulo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
