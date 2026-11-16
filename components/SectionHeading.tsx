import Reveal from "@/components/motion/Reveal";
import WordReveal, { type Linha } from "@/components/motion/WordReveal";

type Props = {
  /** Linhas do título; marque `acento` na linha que recebe a cor da marca. */
  titulo: Linha[];
  lead?: string;
  alinhamento?: "esquerda" | "centro";
};

// O corpo do site é claro; as únicas superfícies escuras (hero, faixa do slogan
// e rodapé) têm marcação própria e não usam este componente. Por isso ele não
// tem mais variante de tema.
export default function SectionHeading({
  titulo,
  lead,
  alinhamento = "centro",
}: Props) {
  const centro = alinhamento === "centro";

  return (
    <div className={centro ? "text-center" : "text-left"}>
      <h2 className="font-heading text-4xl font-semibold leading-[1.06] text-tinta md:text-5xl lg:text-6xl">
        <WordReveal linhas={titulo} gatilho="scroll" delay={0.05} />
      </h2>

      {lead && (
        <Reveal delay={0.15}>
          <p
            className={`mt-6 text-lg leading-relaxed text-tinta/72 ${
              centro ? "mx-auto max-w-2xl" : "max-w-2xl"
            }`}
          >
            {lead}
          </p>
        </Reveal>
      )}
    </div>
  );
}
