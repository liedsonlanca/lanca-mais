import Image from "next/image";
import { lerLogos } from "@/lib/conteudo";
import Reveal from "@/components/motion/Reveal";

// Faixa de marcas atendidas, deslizando sozinha.
//
// Sem logos cadastrados não renderiza nada: melhor a seção não existir do que
// existir vazia.
export default async function ClientLogos() {
  const clientes = await lerLogos();

  if (clientes.length === 0) return null;

  // A animação desloca a trilha em -50%, então ela precisa conter a lista
  // exatamente duas vezes para o laço não ter emenda.
  //
  // Com poucos logos, uma volta seria mais estreita que a tela e o movimento
  // viraria um salto com buraco. Por isso a lista é repetida até somar um
  // número mínimo de peças antes de ser duplicada.
  const minimo = 8;
  const repeticoes = Math.max(1, Math.ceil(minimo / clientes.length));
  const volta = Array.from({ length: repeticoes }, () => clientes).flat();
  const trilha = [...volta, ...volta];

  return (
    <section className="relative overflow-hidden border-y border-linha bg-papel">
      <div className="py-10 lg:py-14">
        <Reveal>
          <p className="eyebrow text-center text-preto/58">
            Marcas que confiam na LANÇA+
          </p>
        </Reveal>

        <div className="relative mt-12 overflow-hidden">
          {/* Máscaras laterais: os logos surgem e somem em vez de cortar seco,
              como na faixa de nichos logo abaixo do hero. */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-papel to-transparent lg:w-32" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-papel to-transparent lg:w-32" />

          {/* animate-marquee corre sozinho e para quando o ponteiro encosta. */}
          <div className="animate-marquee flex w-max items-center gap-12 lg:gap-16">
            {trilha.map((cliente, i) => (
              // A caixa é igual para todos e define o ritmo da faixa. O que
              // varia é a escala de cada logo dentro dela, ajustada no painel:
              // arquivos chegam com margens internas diferentes, e sem esse
              // ajuste um aparece enorme ao lado de outro minúsculo.
              <div
                key={`${cliente.nome}-${i}`}
                className="relative h-12 w-40 shrink-0 lg:h-14 lg:w-44"
              >
                <Image
                  src={cliente.logo}
                  alt={i < clientes.length ? cliente.nome : ""}
                  // As repetições são decorativas: leitor de tela percorre a
                  // lista uma vez só.
                  aria-hidden={i >= clientes.length}
                  fill
                  sizes="176px"
                  style={{ transform: `scale(${(cliente.escala ?? 100) / 100})` }}
                  // Cinza escurecido sobre o fundo claro, colorido no hover.
                  //
                  // brightness abaixo de 1 escurece proporcionalmente: um logo
                  // de traço fino e claro ganha peso e passa a ser legível,
                  // enquanto um logo preto não muda (zero vezes qualquer coisa
                  // continua zero). É o que aproxima marcas de pesos muito
                  // diferentes sem mexer em arquivo nenhum.
                  //
                  // A versão anterior usava opacidade 55% sobre cinza, e os
                  // logos claros praticamente sumiam.
                  className="object-contain opacity-80 grayscale brightness-[0.55] transition-[opacity,filter] duration-500 hover:opacity-100 hover:grayscale-0 hover:brightness-100"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
