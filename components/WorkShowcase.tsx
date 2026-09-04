"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { type PecaVitrine } from "@/lib/showcase";
import Lightbox from "@/components/Lightbox";
import VitrineVideo from "@/components/VitrineVideo";

// Vitrine de trabalhos.
//
// O trilho desliza sozinho, devagar, e para quando o ponteiro ou o dedo encosta
// nele — voltando a andar assim que a pessoa sai.
//
// Três decisões que sustentam isso:
//
// 1. A lista é renderizada duas vezes. Ao passar da metade, devolvemos o scroll
//    para o começo: como as duas metades são idênticas, o laço não tem emenda.
// 2. Sem scroll-snap. O snap puxaria o trilho de volta a cada quadro do
//    deslize, e o movimento ficaria aos trancos.
// 3. Sem scroll-behavior: smooth no contêiner. Ele também vale para atribuição
//    direta de scrollLeft, e animaria cada incremento de meio pixel.
const VELOCIDADE = 26; // pixels por segundo
const LIMIAR_ARRASTO = 6;

export default function WorkShowcase({ vitrine }: { vitrine: PecaVitrine[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [aberta, setAberta] = useState<number | null>(null);
  const [arrastando, setArrastando] = useState(false);

  // Em ref para o laço de animação ler sem depender de re-render.
  const pausado = useRef(false);
  const inicio = useRef({ x: 0, scroll: 0 });
  const houveArrasto = useRef(false);
  const retomada = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ouvindoRolagem = useRef<(() => void) | null>(null);

  // Nada de temporizador nem de ouvinte solto quando a seção sai da tela.
  useEffect(
    () => () => {
      if (retomada.current) clearTimeout(retomada.current);
      if (ouvindoRolagem.current && trilho.current) {
        trilho.current.removeEventListener("scroll", ouvindoRolagem.current);
      }
    },
    []
  );

  const pecas = [...vitrine, ...vitrine];

  // Enquanto o lightbox está aberto o trilho não deve andar por baixo dele.
  useEffect(() => {
    pausado.current = aberta !== null;
  }, [aberta]);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visivel = true;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        // Fora da tela não faz sentido continuar consumindo quadros.
        visivel = entrada.isIntersecting;
      },
      { threshold: 0 }
    );
    observador.observe(el);

    let frame = 0;
    let anterior = performance.now();

    // A posição é acumulada aqui, em float, e não lida de volta do elemento:
    // scrollLeft arredonda para inteiro, então somar 0,26px por quadro e reler
    // devolveria sempre o mesmo valor e o trilho nunca sairia do lugar.
    let posicao = el.scrollLeft;

    function passo(agora: number) {
      const dt = Math.min((agora - anterior) / 1000, 0.05);
      anterior = agora;

      if (el) {
        if (pausado.current || !visivel) {
          // Parado: acompanha o que a pessoa fez com o dedo, o mouse ou as setas.
          posicao = el.scrollLeft;
        } else {
          posicao += VELOCIDADE * dt;
          const metade = el.scrollWidth / 2;
          if (metade > 0 && posicao >= metade) posicao -= metade;
          el.scrollLeft = posicao;
        }
      }

      frame = requestAnimationFrame(passo);
    }

    frame = requestAnimationFrame(passo);

    // Listeners nativos, e não handlers do React: pointerenter e pointerleave
    // não borbulham, e o React os deriva de pointerout delegado na raiz. Com
    // listener direto o comportamento é previsível e testável.
    //
    // Ficam no trilho, e não no contêiner de fora: aquele embrulha também a
    // fileira de controles, então parar o mouse sobre o aviso ou sobre uma
    // seta congelava o deslize sem que a pessoa tivesse pedido nada. Pausar
    // faz sentido sobre uma peça, que é quando alguém parou para olhar.
    const alvo = el;
    const pausar = () => {
      pausado.current = true;
    };
    const retomar = () => {
      pausado.current = false;
    };

    alvo?.addEventListener("pointerenter", pausar);
    alvo?.addEventListener("pointerleave", retomar);
    // No toque não existe "sair": o fim do gesto é que devolve o movimento.
    alvo?.addEventListener("touchstart", pausar, { passive: true });
    alvo?.addEventListener("touchend", retomar, { passive: true });
    alvo?.addEventListener("focusin", pausar);
    alvo?.addEventListener("focusout", retomar);

    return () => {
      cancelAnimationFrame(frame);
      observador.disconnect();
      alvo?.removeEventListener("pointerenter", pausar);
      alvo?.removeEventListener("pointerleave", retomar);
      alvo?.removeEventListener("touchstart", pausar);
      alvo?.removeEventListener("touchend", retomar);
      alvo?.removeEventListener("focusin", pausar);
      alvo?.removeEventListener("focusout", retomar);
    };
  }, []);

  function aoPressionar(e: React.PointerEvent) {
    // Arrasto manual só com mouse: no toque a rolagem nativa já resolve, com a
    // inércia do próprio sistema.
    if (e.pointerType !== "mouse") return;
    const el = trilho.current;
    if (!el) return;

    setArrastando(true);
    houveArrasto.current = false;
    inicio.current = { x: e.clientX, scroll: el.scrollLeft };
  }

  function aoMover(e: React.PointerEvent) {
    if (!arrastando) return;
    const el = trilho.current;
    if (!el) return;

    const percorrido = e.clientX - inicio.current.x;
    if (Math.abs(percorrido) > LIMIAR_ARRASTO) houveArrasto.current = true;
    el.scrollLeft = inicio.current.scroll - percorrido;
  }

  function deslocar(direcao: 1 | -1) {
    const el = trilho.current;
    if (!el) return;

    // A seta precisa de pausa explícita.
    //
    // O laço acima não lê a posição do elemento: mantém um acumulador e
    // escreve scrollLeft a cada quadro. Rolagem externa feita com ele ativo
    // é sobrescrita no quadro seguinte, e o clique da seta não sai do lugar.
    // Antes isso não aparecia porque parar o mouse sobre a seta já pausava
    // tudo; agora que a pausa vive só no trilho, ela é feita aqui.
    //
    // A retomada espera a rolagem assentar, e não um prazo fixo: a duração
    // da animação suave varia com a distância e com o aparelho, e um número
    // chutado curto demais faz o laço atropelar a animação no meio.
    pausado.current = true;

    if (!ouvindoRolagem.current) {
      const assentou = () => {
        if (retomada.current) clearTimeout(retomada.current);
        retomada.current = setTimeout(() => {
          el.removeEventListener("scroll", assentou);
          ouvindoRolagem.current = null;
          pausado.current = false;
        }, 250);
      };

      ouvindoRolagem.current = assentou;
      el.addEventListener("scroll", assentou);
    }

    // Arma o prazo já, para o caso de a rolagem nem chegar a acontecer —
    // no fim do trilho, por exemplo, onde não há para onde ir.
    ouvindoRolagem.current();

    el.scrollBy({ left: el.clientWidth * 0.6 * direcao, behavior: "smooth" });
  }

  return (
    <>
      <div className="relative">
        {/* Máscaras laterais: as peças surgem e somem em vez de cortar seco. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-areia to-transparent lg:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-areia to-transparent lg:w-24" />

        <div
          ref={trilho}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={() => setArrastando(false)}
          className={`sem-barra flex gap-5 overflow-x-auto px-6 py-4 lg:gap-6 lg:px-10 ${
            arrastando ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {pecas.map((peca, i) => {
            // A segunda metade é cópia: o índice real volta pelo módulo.
            const indiceReal = i % vitrine.length;
            const copia = i >= vitrine.length;

            return (
              <button
                key={i}
                type="button"
                // A cópia é decorativa: quem navega por teclado ou leitor de
                // tela percorre a lista uma vez só.
                aria-hidden={copia}
                tabIndex={copia ? -1 : 0}
                onClick={() => {
                  if (houveArrasto.current) return;
                  setAberta(indiceReal);
                }}
                aria-label={`Ampliar: ${peca.legenda ?? peca.alt}`}
                className="group relative aspect-[4/5] w-[200px] shrink-0 overflow-hidden rounded-2xl border border-linha bg-branco shadow-[var(--sombra-cartao)] transition-all duration-500 hover:border-salmon/60 hover:shadow-[0_28px_60px_-30px_rgba(10,10,8,0.6)] focus-visible:border-salmon focus-visible:outline-none sm:w-[240px] lg:w-[280px]"
              >
                {peca.tipo === "video" && peca.video ? (
                  // O vídeo toca no próprio trilho, sem esperar clique. Clicar
                  // continua abrindo a versão ampliada, agora com som.
                  <VitrineVideo
                    src={peca.video}
                    poster={peca.src || undefined}
                    alt={copia ? "" : peca.alt}
                    legenda={peca.legenda ?? peca.alt}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.05]"
                  />
                ) : (
                  <Image
                    src={peca.src}
                    alt={copia ? "" : peca.alt}
                    fill
                    // Sem isto o navegador inicia o arrasto nativo da imagem e o
                    // gesto do trilho morre no meio.
                    draggable={false}
                    sizes="(max-width: 640px) 200px, (max-width: 1024px) 240px, 280px"
                    className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.05]"
                  />
                )}

                <span
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-branco/40 bg-abismo/60 text-branco backdrop-blur-sm">
                    {peca.tipo === "video" ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
                        <path d="M8 5.5v13l11-6.5z" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M9 4H4v5M15 20h5v-5M20 9V4h-5M4 15v5h5" />
                      </svg>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 px-6 lg:px-10">
          <BotaoTrilho direcao="anterior" aoClicar={() => deslocar(-1)} />
          <span className="eyebrow text-preto/45">Arraste para ver mais</span>
          <BotaoTrilho direcao="proxima" aoClicar={() => deslocar(1)} />
        </div>
      </div>

      <Lightbox
        pecas={vitrine}
        indice={aberta}
        aoFechar={() => setAberta(null)}
        aoNavegar={setAberta}
      />
    </>
  );
}

function BotaoTrilho({
  direcao,
  aoClicar,
}: {
  direcao: "anterior" | "proxima";
  aoClicar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={direcao === "anterior" ? "Peças anteriores" : "Próximas peças"}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-preto/15 text-preto/60 transition-all duration-500 hover:border-salmon hover:bg-salmon hover:text-preto"
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
        {direcao === "anterior" ? (
          <path d="M15 5l-7 7 7 7" />
        ) : (
          <path d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}
