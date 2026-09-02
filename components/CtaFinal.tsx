import Link from "next/link";
import Reveal from "@/components/motion/Reveal";

type Props = {
  titulo: string;
  /** Segunda linha, destacada na cor da marca. */
  destaque: string;
  lead?: string;
  rotulo?: string;
};

// Fechamento padrão de toda página — mesma promessa, mesmo gesto visual.
export default function CtaFinal({
  titulo,
  destaque,
  lead,
  rotulo = "Solicitar orçamento",
}: Props) {
  return (
    <section className="relative overflow-hidden bg-papel">
      <div className="glow-salmon pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-40 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-6 py-28 text-center lg:py-36">
        <h2 className="font-heading text-3xl font-semibold leading-[1.08] text-preto md:text-5xl">
          {titulo}
          <span className="block text-salmon-texto">{destaque}</span>
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
