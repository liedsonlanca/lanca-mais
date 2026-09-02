import Reveal from "@/components/motion/Reveal";
import WordReveal, { type Linha } from "@/components/motion/WordReveal";

type Props = {
  /** Rótulo curto em caixa alta, ex: "NOSSO MÉTODO". */
  eyebrow: string;
  /** Linhas do título; marque `acento` na linha que recebe a cor da marca. */
  titulo: Linha[];
  lead?: string;
  alinhamento?: "esquerda" | "centro";
};

// O corpo do site é claro; as únicas superfícies escuras (hero, faixa do slogan
// e rodapé) têm marcação própria e não usam este componente. Por isso ele não
// tem mais variante de tema.
export default function SectionHeading({
  eyebrow,
  titulo,
  lead,
  alinhamento = "centro",
}: Props) {
  const centro = alinhamento === "centro";

  return (
    <div className={centro ? "text-center" : "text-left"}>
      <Reveal>
        <span className="eyebrow inline-flex items-center gap-3 rounded-full border border-preto/12 px-4 py-1.5 text-preto/68">
          <span className="h-1 w-1 rounded-full bg-salmon" />
          {eyebrow}
        </span>
      </Reveal>

      <h2 className="font-heading mt-6 text-4xl font-semibold leading-[1.06] text-preto md:text-5xl lg:text-6xl">
        <WordReveal linhas={titulo} gatilho="scroll" delay={0.05} />
      </h2>

      {lead && (
        <Reveal delay={0.15}>
          <p
            className={`mt-6 text-lg leading-relaxed text-preto/72 ${
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
