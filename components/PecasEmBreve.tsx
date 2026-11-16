"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { type PecaVitrine } from "@/lib/showcase";

// As peças do trabalho na tela de espera, passando de cinco em cinco segundos.
//
// ---------- Por que rodar, em vez de mostrar três ----------
//
// Três peças fixas mostram três trabalhos. A vitrine tem o portfólio inteiro
// cadastrado, e numa tela onde a pessoa está parada esperando, deixar o resto
// guardado é desperdiçar o único argumento que esta tela tem.
//
// ---------- Por que cinco segundos resolvem o corte sozinhos ----------
//
// Antes cada card repetia os seis primeiros segundos do mesmo arquivo, com um
// relógio próprio vigiando o currentTime. Agora a peça inteira troca a cada
// cinco segundos, e a troca já é o corte: o vídeo que entra começa do zero e
// sai antes de chegar aos cinco. Um relógio só, no lugar de dois.
//
// ---------- Por que a troca é em dissolução ----------
//
// Trocar o endereço de um <video> faz o navegador descartar o que tinha e
// carregar de novo, e entre uma coisa e outra não há quadro nenhum para
// pintar — o card pisca preto. É o mesmo defeito que a abertura do site teve,
// e lá a saída foi não trocar de elemento. Aqui trocar é o ponto, então a
// saída é outra: o card esmaece enquanto o novo carrega e volta quando há
// imagem, pelo `loadeddata`. O escuro continua existindo, mas como passagem,
// e não como falha.
//
// ---------- Quem pediu menos movimento ----------
//
// Não roda e não toca: fica nas três primeiras peças, paradas. Sem relógio,
// sem autoplay, e o vídeo baixa só o cabeçalho.

type Props = {
  /** Todas as peças da vitrine, na ordem do banco. */
  pecas: PecaVitrine[];
  /** Quantos cards a fileira tem. */
  slots: number;
};

/** Quanto tempo cada peça fica em cena. */
const TEMPO_MS = 5000;

/** Quanto dura a dissolução entre uma peça e a seguinte. */
const DISSOLUCAO_MS = 400;

export default function PecasEmBreve({ pecas, slots }: Props) {
  const reduzir = useReducedMotion();
  const total = pecas.length;
  const quantos = Math.min(slots, total);

  // O passo é o tamanho da fileira: assim cada volta traz um conjunto novo,
  // em vez de empurrar a peça de um card para o card vizinho.
  const [base, setBase] = useState(0);

  useEffect(() => {
    if (reduzir || total <= quantos) return;
    const t = setInterval(() => setBase((b) => b + quantos), TEMPO_MS);
    return () => clearInterval(t);
  }, [reduzir, total, quantos]);

  if (quantos === 0) return null;

  return (
    <div className="mt-11 grid w-full max-w-3xl grid-cols-3 items-center gap-2.5 sm:mt-14 sm:gap-5">
      {Array.from({ length: quantos }).map((_, k) => {
        const peca = pecas[(base + k) % total];
        const central = k === Math.floor(quantos / 2);

        return (
          <div
            key={k}
            className={`relative aspect-[4/5] overflow-hidden rounded-2xl border bg-preto transition-all duration-700 sm:rounded-[20px] ${
              central
                ? "z-10 scale-[1.08] border-bege/25 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)]"
                : "border-bege/12 brightness-[0.72]"
            }`}
          >
            {/* A chave é a peça, e não o slot.

                É ela que faz o quadro remontar quando a peça troca — e um
                quadro recém-montado já nasce esmaecido, esperando a imagem.
                Sem isso seria preciso apagar o estado dentro de um efeito,
                que é correr atrás de um valor que podia ter nascido certo. */}
            <Quadro
              key={peca.video || peca.src}
              peca={peca}
              parado={Boolean(reduzir)}
            />
          </div>
        );
      })}
    </div>
  );
}

function Quadro({ peca, parado }: { peca: PecaVitrine; parado: boolean }) {
  // Nasce apagado e acende quando há imagem para mostrar. Quem garante que
  // ele nasce de novo a cada peça é a chave, lá em cima.
  const [visivel, setVisivel] = useState(false);

  const pintura = `absolute inset-0 h-full w-full object-cover transition-opacity ${
    visivel ? "opacity-100" : "opacity-0"
  }`;
  const estilo = { transitionDuration: `${DISSOLUCAO_MS}ms` };

  if (peca.tipo === "video" && peca.video) {
    return (
      <video
        src={peca.video}
        poster={peca.src || undefined}
        autoPlay={!parado}
        muted
        // Peça mais curta que cinco segundos acabaria antes da troca e
        // congelaria no último quadro; em laço, ela recomeça.
        loop
        playsInline
        preload={parado ? "metadata" : "auto"}
        onLoadedData={() => setVisivel(true)}
        aria-hidden
        tabIndex={-1}
        className={pintura}
        style={estilo}
      />
    );
  }

  if (!peca.src) return null;

  return (
    <Image
      src={peca.src}
      alt=""
      fill
      sizes="(max-width: 640px) 33vw, 240px"
      onLoad={() => setVisivel(true)}
      className={pintura}
      style={estilo}
    />
  );
}
