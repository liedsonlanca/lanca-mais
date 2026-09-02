import WordReveal from "@/components/motion/WordReveal";
import { siteConfig } from "@/lib/site-config";

// Faixa de assinatura da marca: o slogan ganha uma seção só dele, revelado
// palavra a palavra, com a última linha no acento. É o único bloco do site
// sem nenhuma chamada para ação — serve de respiro entre dois capítulos.
export default function SloganBand() {
  const [primeira, segunda, terceira] = siteConfig.slogan;

  return (
    <section className="superficie-escura noise relative overflow-hidden bg-abismo">
      <div className="glow-salmon pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[720px] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-6 py-28 text-center lg:py-36">
        <p className="font-heading text-[clamp(1.75rem,5.5vw,3.5rem)] font-semibold leading-[1.15] text-bege">
          <WordReveal
            linhas={[
              { texto: primeira },
              { texto: segunda },
              { texto: terceira, acento: true },
            ]}
            gatilho="scroll"
            delay={0.05}
          />
        </p>
      </div>
    </section>
  );
}
