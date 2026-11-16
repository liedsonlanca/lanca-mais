import Reveal from "@/components/motion/Reveal";
import WordReveal, { type Linha } from "@/components/motion/WordReveal";

type Props = {
  /** Linhas do título; marque `acento` na linha que recebe a cor da marca. */
  titulo: Linha[];
  lead?: string;
};

// Topo padrão das páginas internas. O pt generoso compensa o header fixo.
export default function PageHero({ titulo, lead }: Props) {
  return (
    <section className="superficie-escura noise relative overflow-hidden bg-abismo">
      <div className="glow-salmon pointer-events-none absolute left-1/2 top-0 h-[460px] w-[680px] -translate-x-1/2 opacity-35 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-40 text-center lg:pb-24 lg:pt-48">
        <h1 className="font-heading text-4xl font-semibold leading-[1.04] text-bege md:text-6xl lg:text-7xl">
          <WordReveal linhas={titulo} delay={0.2} />
        </h1>

        {lead && (
          <Reveal delay={0.35}>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-bege/78">
              {lead}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
