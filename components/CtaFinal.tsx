import Link from "next/link";
import Reveal from "@/components/motion/Reveal";

type Props = {
  titulo: string;
  /** Segunda linha do título. */
  destaque: string;
  /** Palavra-chave da segunda linha que recebe a cor da marca. Sem ela, a
   *  linha inteira é colorida, que é o caso de destaques de uma palavra só. */
  realce?: string;
  lead?: string;
  rotulo?: string;
};

// Colore só a palavra-chave dentro da linha, como fazem os títulos de seção.
function comRealce(texto: string, realce?: string) {
  const corte = realce ? texto.indexOf(realce) : -1;

  // Sem realce, ou palavra que não existe na linha: colore a linha toda, que
  // é o comportamento antigo e nunca deixa o título sem destaque nenhum.
  if (!realce || corte === -1) {
    return <span className="text-salmon-texto">{texto}</span>;
  }

  return (
    <>
      {texto.slice(0, corte)}
      <span className="text-salmon-texto">{realce}</span>
      {texto.slice(corte + realce.length)}
    </>
  );
}

// Fechamento padrão de toda página — mesma promessa, mesmo gesto visual.
export default function CtaFinal({
  titulo,
  destaque,
  realce,
  lead,
  rotulo = "Solicitar orçamento",
}: Props) {
  return (
    <section className="relative overflow-hidden bg-papel">
      <div className="glow-salmon pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-40 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-6 py-28 text-center lg:py-36">
        <h2 className="font-heading text-3xl font-semibold leading-[1.08] text-preto md:text-5xl">
          {titulo}
          <span className="block">{comRealce(destaque, realce)}</span>
        </h2>

        {lead && (
          <Reveal delay={0.15}>
            <p className="mx-auto mt-6 max-w-xl text-preto/72">{lead}</p>
          </Reveal>
        )}

        <Reveal delay={0.25}>
          <Link
            href="/contato"
            className="mt-10 inline-block rounded-full bg-salmon px-9 py-4 font-medium text-preto shadow-[0_0_40px_-8px_var(--color-salmon)] transition-all duration-500 hover:shadow-[0_0_64px_-4px_var(--color-salmon)]"
          >
            {rotulo}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
