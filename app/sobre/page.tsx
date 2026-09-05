import Image from "next/image";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import CtaFinal from "@/components/CtaFinal";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/motion/Reveal";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";
import EquipeTrilho from "@/components/EquipeTrilho";
import { lerEquipe } from "@/lib/conteudo";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheça a LANÇA+, agência de marketing completa que atende clientes de todos os nichos com estratégia, conteúdo e identidade de marca.",
};

const values = [
  {
    title: "Expertise real",
    description:
      "Toda entrega precisa refletir a qualidade que uma agência de verdade entregaria, nunca conteúdo genérico ou raso.",
  },
  {
    title: "Estratégia antes de execução",
    description:
      "Nenhuma peça de conteúdo é produzida sem responder a uma pergunta: qual o objetivo dela dentro da estratégia da marca?",
  },
  {
    title: "Resultado mensurável",
    description:
      "Acompanhamento constante de métricas para que cada decisão seja baseada em dado, não em achismo.",
  },
  {
    title: "Marca por inteiro",
    description:
      "Da identidade visual ao espaço físico, cuidamos de cada ponto de contato para que a marca seja consistente em todo lugar.",
  },
];

export default async function SobrePage() {
  const equipe = await lerEquipe();

  return (
    <>
      <PageHero
        eyebrow="Sobre a LANÇA+"
        titulo={[
          { texto: "Uma agência completa" },
          { texto: "para marcas que querem" },
          { texto: "ser levadas a sério.", acento: "sério." },
        ]}
        lead="Nascemos para resolver um problema comum: marcas com bons produtos e serviços, mas com uma presença digital que não comunica o valor real do que entregam. A LANÇA+ existe para fechar essa distância."
      />

      {/* Missão */}
      <section className="relative overflow-hidden bg-areia">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-24 lg:px-10 lg:py-32 md:grid-cols-2">
          <Reveal distance={40} className="md:h-full">
            {/* No desktop a imagem acompanha a altura do texto; no celular
                volta a ter proporção fixa, já que não há coluna vizinha. */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl md:aspect-auto md:h-full">
              <Image
                src="/images/sobre.webp"
                alt="Símbolo da LANÇA+"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <div>
            <SectionHeading
              eyebrow="Missão"
              alinhamento="esquerda"
              titulo={[
                { texto: "Transformar marca em" },
                { texto: "posicionamento, não em ruído.", acento: "posicionamento," },
              ]}
            />

            <Reveal delay={0.15}>
              <p className="mt-6 leading-relaxed text-preto/72">
                Atendemos clientes de todos os nichos: saúde, estética,
                direito, imóveis, gastronomia, moda, educação, fitness, varejo
                e muito mais. Cada um exige uma leitura própria de mercado, mas
                o rigor é o mesmo, e é ele que faz a marca sair do improviso.
              </p>
              <p className="mt-4 leading-relaxed text-preto/72">
                Por trabalharmos com sete frentes complementares: gestão de
                marketing, consultoria, audiovisual, tráfego pago, identidade
                visual, desenvolvimento web e arquitetura, conseguimos
                garantir que a marca do cliente seja a mesma em qualquer ponto
                de contato.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Princípios — respiro claro */}
      <section className="relative overflow-hidden bg-areia text-preto">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
          <SectionHeading
            eyebrow="Como trabalhamos"
            alinhamento="esquerda"
            titulo={[
              { texto: "Princípios que guiam" },
              { texto: "cada entrega.", acento: "entrega." },
            ]}
          />

          <Stagger className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-linha bg-linha sm:grid-cols-2">
            {values.map((value) => (
              <StaggerItem
                key={value.title}
                className="h-full bg-branco p-8 transition-colors duration-500 hover:bg-areia"
              >
                <h3 className="text-lg font-semibold text-preto">
                  {value.title}
                </h3>
                <p className="mt-3 leading-relaxed text-preto/72">
                  {value.description}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Time.
          Some inteira quando não há ninguém cadastrado: um título "Quem
          constrói a sua marca" sobre um vazio diz o contrário do que promete. */}
      {equipe.length > 0 && (
      <section className="relative overflow-hidden bg-papel py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <SectionHeading
            eyebrow="Nosso time"
            alinhamento="esquerda"
            titulo={[
              { texto: "Quem constrói" },
              { texto: "a sua marca.", acento: "marca." },
            ]}
            lead="Estratégia, social media, design, arquitetura, vídeo e fotografia debaixo do mesmo teto."
          />
        </div>

        {/* O trilho sai da caixa central e corre até as bordas da tela. É o
            que deixa o retrato crescer: preso à caixa, ele voltaria aos 250px
            de antes. O título fica na caixa, alinhado com o resto da página. */}
        <Reveal distance={40}>
          <EquipeTrilho equipe={equipe} />
        </Reveal>
      </section>
      )}

      <CtaFinal
        titulo="Vamos construir o"
        destaque="posicionamento da sua marca?"
        realce="posicionamento"
        lead="Você acabou de conhecer quem vai cuidar dela. O próximo passo é uma conversa, sem compromisso."
        rotulo="Falar com a LANÇA+"
      />
    </>
  );
}
