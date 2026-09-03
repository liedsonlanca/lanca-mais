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
      <div className="flex items-start justify-center gap-3 sm:gap-6">
        {partes.map(([valor, rotulo], i) => (
          <div key={rotulo} className="flex items-start gap-3 sm:gap-6">
            <div className="text-center">
              <span className="numeral-fantasma block text-4xl leading-none text-[#E8E4D9] sm:text-5xl lg:text-6xl">
                {String(valor ?? 0).padStart(2, "0")}
              </span>
              <span className="mt-2 block text-[10px] uppercase tracking-[0.24em] text-[#E8E4D9]/45 sm:text-xs">
                {rotulo}
              </span>
            </div>

            {/* Separador entre os blocos, menos depois do último. */}
            {i < partes.length - 1 && (
              <span
                aria-hidden
                className="text-3xl leading-none text-[#D97B45]/40 sm:text-4xl lg:text-5xl"
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
