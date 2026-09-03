import Image from "next/image";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import CtaFinal from "@/components/CtaFinal";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/motion/Reveal";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheça a LANÇA+, agência de marketing completa que atende clientes de todos os nichos com estratégia, conteúdo e identidade de marca.",
};

const team = [
  {
    name: "Liédson Rodrigues",
    role: "CEO & Social Media",
    image: "/images/team/liedson-rodrigues.jpg",
  },
  {
    name: "Vitória Dantas",
    role: "Designer e Arquiteta",
    image: "/images/team/vitoria-dantas.jpg",
  },
  {
    name: "Diógenes Mesquita",
    role: "Designer",
    image: "/images/team/diogenes-mesquita.jpg",
  },
  {
    name: "Silas Oliveira",
    role: "Filmmaker e Fotógrafo",
    image: "/images/team/silas-oliveira.jpg",
  },
];

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

export default function SobrePage() {
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
                src="/images/team/LFF_0519_resized.jpg"
                alt="Time da LANÇA+"
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

      {/* Time */}
      <section className="relative overflow-hidden bg-papel">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
          <SectionHeading
            eyebrow="Nosso time"
            alinhamento="esquerda"
            titulo={[
              { texto: "Quem constrói" },
              { texto: "a sua marca.", acento: "marca." },
            ]}
            lead="Estratégia, social media, design, arquitetura, vídeo e fotografia debaixo do mesmo teto."
          />

          <Stagger className="mt-14 grid gap-6 grid-cols-2 lg:grid-cols-5">
            {team.map((member) => (
              <StaggerItem key={member.name}>
                {/* A foto ocupa o card inteiro e o nome vem sobre ela, num véu
                    que sobe no hover. A função fica numa etiqueta salmão, o
                    mesmo selo de acento usado nas etiquetas do blog. */}
                <div className="group relative aspect-[3/4] overflow-hidden rounded-3xl border border-linha bg-areia shadow-[var(--sombra-cartao)] transition-all duration-500 hover:-translate-y-1.5 hover:border-salmon/45 hover:shadow-[0_30px_60px_-36px_rgba(10,10,8,0.55)]">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 20vw"
                    className="object-cover object-top grayscale transition-all duration-[1.2s] group-hover:scale-[1.06] group-hover:grayscale-0"
                  />

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-abismo via-abismo/80 to-transparent p-5 pt-20">
                    {/* Rótulo sem cápsula: os cargos reais são longos e, em card estreito,
                        a pílula quebrava em duas linhas com alturas desiguais na fileira. */}
                    <span className="block text-[11px] font-semibold uppercase leading-tight tracking-[0.14em] text-salmon">
                      {member.role}
                    </span>
                    <h3 className="mt-2.5 text-base font-semibold leading-tight text-branco lg:text-lg">
                      {member.name}
                    </h3>
                    {/* Régua de lançamento, como nas abas e no método. */}
                    <span
                      aria-hidden
                      className="mt-3 block h-[3px] w-8 bg-salmon transition-all duration-700 ease-out group-hover:w-16"
                    />
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

        </div>
      </section>

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
