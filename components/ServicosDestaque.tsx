"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Service } from "@/lib/site-config";

// Os serviços em evidência, em trilho.
//
// No desktop os três cabem lado a lado e não há o que navegar; no celular vira
// um card por vez, com os pontos embaixo dizendo onde se está. Os pontos só
// nascem quando há mais de uma página: seta ou ponto que não leva a lugar
// nenhum confunde mais do que ajuda.
//
// A rolagem é nativa, com scroll-snap, então dedo, roda, teclado e leitor de
// tela continuam funcionando sem estado nosso para sincronizar.

/**
 * Quais frentes levam o selo "Mais escolhido".
 *
 * Mora aqui, e não num campo da frente, porque é afirmação sobre o conjunto:
 * dizer que duas são as mais escolhidas só faz sentido olhando as três de uma
 * vez. Num campo por serviço, nada impediria marcar as três — e selo em todo
 * mundo não distingue ninguém.
 */
const MAIS_ESCOLHIDOS = new Set(["marketing-pessoal", "marketing-empresarial"]);
export default function ServicosDestaque({
  itens,
  fotos,
}: {
  itens: Service[];
  /** A foto de cada card, por slug. Vem do painel, com o padrão como reserva. */
  fotos: Record<string, { src: string; alt: string }>;
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const porVista = useRef(1);
  const [pagina, setPagina] = useState(0);
  const [paginas, setPaginas] = useState(1);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;

    function medir() {
      if (!el) return;
      const cards = [...el.children] as HTMLElement[];
      if (cards.length === 0 || el.clientWidth === 0) return;

      // Passo = largura do card mais o vão até o próximo. Dividir a largura
      // rolável pela visível deixaria o vão de fora e a conta escorregaria.
      const passo =
        cards.length > 1
          ? cards[1].offsetLeft - cards[0].offsetLeft
          : cards[0].offsetWidth;

      // Passo zero quer dizer que os cards estão empilhados, e não em trilho:
      // é o celular. Ali não há o que navegar, então os pontos somem. O
      // setPaginas(1) importa para quem estreita a janela vindo do desktop,
      // onde já havia mais de uma página contada.
      if (passo <= 0) {
        setPaginas(1);
        return;
      }

      const cabem = Math.max(1, Math.round(el.clientWidth / passo));
      porVista.current = cabem;

      const total = Math.ceil(cards.length / cabem);
      setPaginas(total);
      setPagina(Math.min(Math.round(el.scrollLeft / (passo * cabem)), total - 1));
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
    const cards = [...el.children] as HTMLElement[];
    const alvo = cards[indice * porVista.current];
    if (!alvo) return;
    el.scrollTo({ left: alvo.offsetLeft - cards[0].offsetLeft, behavior: "smooth" });
  }

  return (
    <div className="mt-12">
      <div
        ref={trilho}
        // data-lenis-prevent: sem isto a rolagem suave da página engoliria o
        // gesto horizontal dentro do trilho.
        data-lenis-prevent
        // No celular os três ficam empilhados, e não em trilho.
        //
        // São os três serviços principais: em trilho, aparecia um e meio, e
        // conhecer os outros dois dependia de a pessoa descobrir que aquilo
        // arrastava. O que cabe numa tela de telefone não é a largura dos
        // três, é a altura, então eles descem em vez de andar de lado.
        //
        // A partir do tablet volta o trilho, onde dois ou três cabem lado a
        // lado e a comparação entre eles se faz de relance.
        className="sem-barra grid gap-4 sm:-my-3 sm:flex sm:snap-x sm:snap-mandatory sm:gap-5 sm:overflow-x-auto sm:py-3 sm:scroll-smooth"
      >
        {itens.map((s) => {
          const foto = fotos[s.slug];

          return (
          <Link
            key={s.slug}
            href={`/servicos/${s.slug}`}
            // Card inteiro de foto, com o texto pousado embaixo.
            //
            // Do tablet para cima isto já foi outra coisa: card branco, texto
            // em cima e a foto como tira de 230px no pé. Os dois desenhos
            // conviveram até ficar claro, olhando lado a lado, que o do
            // celular era o bom — a foto é o argumento, e dar a ela o card
            // inteiro diz mais do que descrevê-la em texto sobre fundo branco.
            //
            // O que ainda muda por largura é só o arranjo: um por vez no
            // celular, dois no tablet, três no desktop, onde o card também
            // fica mais alto para a foto não virar faixa.
            className="group relative flex min-h-[290px] w-full shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[26px] border border-contorno bg-cartao transition-all duration-500 hover:-translate-y-1.5 hover:border-salmon/50 focus-visible:-translate-y-1.5 focus-visible:border-salmon focus-visible:outline-none sm:w-[calc((100%-1.25rem)/2)] sm:rounded-[28px] lg:min-h-[400px] lg:w-[calc((100%-2.5rem)/3)]"
          >
            {/* Régua de lançamento no topo, a mesma dos cards do site.

                Recuada dos cantos, e não de ponta a ponta: o card tem 26px de
                raio, então uma barra de 3px colada na borda entrava na curva e
                era comida pelo recorte, aparecendo mordida nas pontas. Aqui
                ela vive no trecho reto do topo.

                E cresce por escala, não por largura: com left e right fixos a
                largura não anima sozinha, e scale-x com origem à esquerda dá o
                mesmo gesto sem conta nenhuma. */}
            <span
              aria-hidden
              className="absolute inset-x-7 top-0 h-[3px] origin-left scale-x-0 bg-salmon transition-transform duration-700 group-hover:scale-x-100 group-focus-visible:scale-x-100"
            />

            {/* Número, nome e a linha de resumo. Sem ícone em quadradinho: era
                o mesmo quadradinho em todo card de todo bloco, e é justamente
                esse tipo de peça repetida que faz um site parecer feito por
                molde. O ícone continua onde tem função, na página de serviços,
                onde são oito e o desenho ajuda a achar. */}
            {/* O texto é claro em qualquer largura, porque em qualquer largura
                ele está sobre a foto escurecida. Antes ele virava para a cor
                do tema a partir do tablet, quando passava a ficar sobre o
                card branco. */}
            <div className="relative z-10 px-7 pb-7 pt-8">
              {/* O número e o selo dividem a primeira linha.
                  O canto superior direito parece o lugar óbvio e não é: ali
                  mora a seta, e os dois se atropelariam. */}
              <div className="flex items-center gap-3">
                <span className="numeral-fantasma block text-sm text-bege/55 transition-colors duration-500 group-hover:text-salmon">
                  {String(itens.indexOf(s) + 1).padStart(2, "0")}
                </span>

                {/* Salmão puro, porque aqui ele está sempre sobre a foto
                    escurecida — onde ele passa de sobra em contraste. Sobre
                    fundo claro reprovaria, e foi por isso que esta cor virava
                    quando o card ainda era branco do tablet para cima. */}
                {MAIS_ESCOLHIDOS.has(s.slug) && (
                  <span className="rounded-full border border-salmon/35 bg-salmon/12 px-2.5 py-1 text-xs font-medium leading-none text-salmon">
                    Mais escolhido
                  </span>
                )}
              </div>

              <h3 className="font-heading mt-3 text-[1.55rem] font-semibold leading-[1.08] tracking-[-0.03em] text-bege sm:mt-4">
                {s.name}
              </h3>
              <span className="mt-2.5 block max-w-[26ch] leading-relaxed text-bege/75 sm:mt-3">
                {s.shortDescription}
              </span>
            </div>

            {/* A foto sangra até as três bordas de baixo do card. Antes aqui
                havia um desenho abstrato de interface, e desenho abstrato é o
                que qualquer máquina produz de graça: a sessão de estúdio da
                equipe, não. Ela é da LANÇA+ e de mais ninguém, e é o que faz o
                card parecer de uma agência de verdade. */}
            {foto && (
              // No celular a foto preenche o card inteiro, por baixo do texto.
              // A partir do tablet ela volta a ser uma faixa no pé.
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={foto.src}
                  alt={foto.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 30vw"
                  className="object-cover object-top transition-transform duration-[1.2s] group-hover:scale-105"
                />

                {/* Véu de baixo para cima, forte no pé e transparente no topo:
                    é ele que segura o texto legível sobre a foto sem apagar o
                    rosto. Só no celular, que é onde o texto fica por cima. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-preto via-preto/70 to-preto/10"
                />

                {/* O véu de registro, só do tablet para cima.

                    Existe por um problema que só aparece ali: no celular vê-se
                    um card por vez, no desktop os três de uma vez. As fotos
                    vêm de origens diferentes — parede laranja, estúdio branco,
                    luz de set — e lado a lado, cada uma no seu tom, o olho vai
                    para a mais colorida e o card vira moldura de uma imagem
                    solta.

                    Era 45% e cobria a foto inteira, do tempo em que ela era só
                    uma tira no pé do card. Com a foto ocupando tudo, aquela
                    dose apagava justamente o topo, que é onde está o assunto
                    da imagem. Em 18% ela só tira a aresta entre as três, e a
                    foto continua sendo foto.

                    Levanta ao passar o ponteiro, porque aí a pessoa escolheu
                    olhar aquele card: o descanso é sóbrio, a atenção é
                    colorida.

                    Saiu junto daqui a faixa curta que ficava no pé por baixo
                    da seta: a seta subiu para o topo, e a faixa ficou sem o
                    que proteger. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 hidden bg-preto/[0.18] transition-colors duration-700 group-hover:bg-preto/0 group-focus-visible:bg-preto/0 sm:block"
                />
              </div>
            )}

            {/* A seta grande, apoiada no canto da prévia. É ela que diz que o
                card inteiro leva a algum lugar, sem precisar de "saiba mais". */}
            {/* No topo, e não no pé: embaixo ela cairia em cima do texto, que
                ocupa o pé do card. */}
            <span
              aria-hidden
              className="absolute right-6 top-6 z-10 flex h-14 w-14 items-center justify-center rounded-full border border-contorno bg-fundo text-tinta shadow-[var(--sombra-cartao)] transition-all duration-500 group-hover:border-salmon group-hover:bg-salmon group-hover:text-preto group-focus-visible:border-salmon group-focus-visible:bg-salmon group-focus-visible:text-preto"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              >
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </span>
          </Link>
          );
        })}
      </div>

      {paginas > 1 && (
        <div className="mt-8 flex items-center justify-center">
          {Array.from({ length: paginas }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => irPara(i)}
              aria-label={`Ver serviço ${i + 1} de ${paginas}`}
              aria-current={i === pagina}
              // O respiro vive no botão, e não num vão entre eles: assim a
              // área de toque de um encosta na do vizinho, sem faixa morta, e
              // o ponto continua do mesmo tamanho.
              className="flex h-11 min-w-11 items-center justify-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-500 ${
                  i === pagina ? "w-7 bg-salmon" : "w-1.5 bg-tinta/20"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
