"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { DepoimentoVideo } from "@/lib/conteudo";

// Os depoimentos em vídeo, ao lado dos sintomas na home.
//
// ---------- Por que não toca sozinho ----------
//
// O reflexo seria dar autoplay, como o trilho da abertura faz. Mas aquele são
// peças mudas, que existem para serem vistas de relance; um depoimento é
// alguém falando, e vídeo com voz começando sozinho na cara de quem acabou de
// abrir o site é o tipo de coisa que faz a pessoa fechar a aba.
//
// Tocar mudo seria pior ainda: um depoimento sem som é um rosto mexendo. A
// prova está na fala, não na imagem.
//
// Então: capa parada, botão de tocar, som ligado quando a pessoa pedir. O
// nome e o cargo ficam visíveis o tempo todo, porque é isso que faz o card
// valer alguma coisa mesmo para quem nunca clicar.
//
// ---------- Por que a caixa é deitada e o vídeo, em pé ----------
//
// A caixa é 7 por 6, que é o tamanho que este espaço sempre teve na página
// e o que o cliente pediu que ficasse. O vídeo de depoimento, porém, é
// gravado no celular, em pé, em 4 por 5.
//
// Um dentro do outro pelo corte normal decepava a cabeça de quem fala. Por
// isso o vídeo entra inteiro, encaixado pela altura, e o que sobra nas
// laterais é a própria capa ampliada e desfocada. É o mesmo recurso do
// Instagram e do YouTube quando o vídeo não tem a forma do player: dá ao
// vazio a cor da cena, então ele parece parte do card e não uma falha.
//
// Antes a caixa nem proporção fixa tinha: a altura vinha da coluna de
// sintomas ao lado, e ia de 2:1 deitado no tablet a 0,85 em pé no celular.
// Foto aguenta isso, vídeo não — o mesmo arquivo apareceria cortado de um
// jeito diferente em cada tela.

function Tocar() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M8 5.14v13.72a.5.5 0 0 0 .76.43l11.1-6.86a.5.5 0 0 0 0-.86L8.76 4.71A.5.5 0 0 0 8 5.14z" />
    </svg>
  );
}

export default function DepoimentosVideo({
  itens,
}: {
  itens: DepoimentoVideo[];
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [indice, setIndice] = useState(0);
  const [tocando, setTocando] = useState(false);

  const atual = itens[indice];
  if (!atual) return null;

  function irPara(proximo: number) {
    // Para o que está tocando antes de trocar: sem isto, o áudio do anterior
    // seguia por um instante por cima da capa do seguinte.
    video.current?.pause();
    setTocando(false);
    setIndice(proximo);
  }

  async function alternar() {
    const el = video.current;
    if (!el) return;

    if (el.paused) {
      try {
        await el.play();
        setTocando(true);
      } catch {
        // O navegador pode recusar (aba em segundo plano, economia de
        // bateria). O botão volta para "tocar" em vez de mentir que está.
        setTocando(false);
      }
    } else {
      el.pause();
      setTocando(false);
    }
  }

  return (
    <div>
      <div className="group relative aspect-[7/6] overflow-hidden rounded-[22px] bg-preto">
        {/* O fundo: a própria capa, ampliada e borrada. Fica atrás do vídeo
            e preenche as laterais que sobram. Só quando há capa — sem ela o
            preto do card já resolve. */}
        {atual.capa && (
          <Image
            key={`fundo-${atual.id}`}
            src={atual.capa}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="scale-125 object-cover blur-2xl brightness-50"
          />
        )}

        <video
          // key: sem ele o React reaproveita o mesmo <video> e o navegador
          // segue com o arquivo anterior carregado, ignorando o src novo.
          key={atual.id}
          ref={video}
          src={atual.video}
          poster={atual.capa ?? undefined}
          playsInline
          preload="metadata"
          onEnded={() => {
            // Encadeia para o próximo, que é como se assiste a uma fileira de
            // depoimentos. No último, para: continuar daria a volta e a
            // pessoa reveria o primeiro sem ter pedido.
            if (indice < itens.length - 1) irPara(indice + 1);
            else setTocando(false);
          }}
          onPause={() => setTocando(false)}
          onPlay={() => setTocando(true)}
          // object-contain, e não cover: o vídeo aparece inteiro, seja qual
          // for a forma em que foi gravado. Cortar para preencher é o que
          // tiraria a cabeça de quem está falando.
          className="absolute inset-0 h-full w-full object-contain"
        />

        {/* Véu só enquanto está parado: com o vídeo rodando ele escureceria a
            cara de quem está falando. */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-preto/85 via-preto/25 to-transparent transition-opacity duration-500 ${
            tocando ? "opacity-0" : "opacity-100"
          }`}
        />

        <button
          type="button"
          onClick={alternar}
          aria-label={
            tocando
              ? "Pausar o depoimento"
              : `Ver o depoimento de ${atual.nome || "cliente"}`
          }
          // O botão cobre o card inteiro: num vídeo, a área de clique
          // esperada é a imagem, e não só o círculo.
          className="absolute inset-0 flex items-center justify-center focus-visible:outline-none"
        >
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full bg-salmon pl-1 text-preto shadow-[0_18px_40px_-16px_rgba(0,0,0,0.8)] transition-all duration-500 group-hover:scale-105 ${
              tocando ? "scale-75 opacity-0" : "scale-100 opacity-100"
            }`}
          >
            <Tocar />
          </span>
        </button>

        {/* Quem falou. Fica fora do botão para não virar parte do rótulo que
            o leitor de tela anuncia, e some junto com o véu. */}
        {(atual.nome || atual.cargo) && (
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 p-6 transition-opacity duration-500 ${
              tocando ? "opacity-0" : "opacity-100"
            }`}
          >
            {atual.nome && (
              <p className="font-heading text-lg font-semibold leading-tight tracking-[-0.02em] text-bege">
                {atual.nome}
              </p>
            )}
            {atual.cargo && (
              <p className="mt-1 text-sm text-bege/65">{atual.cargo}</p>
            )}
          </div>
        )}
      </div>

      {/* Só quando há mais de um: ponto que não leva a lugar nenhum confunde
          mais do que ajuda. */}
      {itens.length > 1 && (
        <div className="mt-5 flex items-center justify-center">
          {itens.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => irPara(i)}
              aria-label={`Ver o depoimento ${i + 1} de ${itens.length}`}
              aria-current={i === indice}
              // O respiro vive no botão, e não num vão entre eles: assim a
              // área de toque de um encosta na do vizinho, sem faixa morta.
              className="flex h-11 min-w-11 items-center justify-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-500 ${
                  i === indice ? "w-7 bg-salmon" : "w-1.5 bg-tinta/25"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A foto que segura o lugar enquanto não houver nenhum vídeo.
 *
 * Fica aqui, e não na home, porque as duas versões do mesmo espaço precisam
 * ter a mesma proporção: se a reserva fosse elástica, o bloco mudaria de
 * altura no dia em que o primeiro depoimento entrasse.
 */
export function ReservaDoBloco({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[7/6] overflow-hidden rounded-[22px]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 45vw"
        className="object-cover object-[50%_25%]"
      />
    </div>
  );
}
