import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/motion/Reveal";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";

type Item = { question: string; answer: string };

// Dúvidas de cada serviço, em duas colunas.
//
// Composição diferente da FAQ da home de propósito: lá o bloco é centralizado
// e as perguntas são cards; aqui a chamada fica fixa à esquerda enquanto a
// lista corre à direita, separada só por fios. A pessoa abre várias perguntas
// seguidas sem perder de vista de qual serviço está falando.
//
// O "+" fica à direita, e não à esquerda: é o mesmo marcador da home, girando
// 45 graus ao abrir, e mantém a pergunta alinhada na margem do texto.
export default function ServiceFaq({ itens }: { itens: Item[] }) {
  if (itens.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-areia">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-10 lg:py-32">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading
            eyebrow="Dúvidas frequentes"
            alinhamento="esquerda"
            titulo={[
              { texto: "Perguntas que" },
              { texto: "todo mundo faz.", acento: "faz." },
            ]}
          />

          <Reveal delay={0.2}>
            <p className="mt-6 leading-relaxed text-preto/70">
              Se a sua não estiver aqui,{" "}
              <Link
                href="/contato"
                className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4 transition-colors duration-500 hover:decoration-salmon"
              >
                fale com a gente
              </Link>
              . A primeira conversa é sem compromisso.
            </p>
          </Reveal>
        </div>

        <Stagger className="lg:pt-2">
          {itens.map((item) => (
            <StaggerItem key={item.question}>
              {/* Fio no topo de cada linha: vira salmão quando a pergunta
                  está aberta, a mesma régua de lançamento das outras seções,
                  aqui deitada.

                  O name compartilhado transforma a lista em acordeão: abrir
                  uma pergunta fecha a anterior. É comportamento nativo do
                  navegador, sem JavaScript. Em navegador antigo, que ignora o
                  atributo, as perguntas apenas continuam abrindo juntas. */}
              <details
                name="faq-servico"
                className="faq-suave group border-t border-linha transition-colors duration-500 open:border-salmon"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-medium text-preto transition-colors duration-500 hover:text-salmon-texto [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-linha text-xl text-salmon-texto transition-all duration-500 group-hover:border-salmon/60 group-open:rotate-45 group-open:border-salmon group-open:bg-salmon group-open:text-preto"
                  >
                    +
                  </span>
                </summary>

                <p className="max-w-2xl pb-7 pr-16 leading-relaxed text-preto/72">
                  {item.answer}
                </p>
              </details>
            </StaggerItem>
          ))}

          {/* Fecha a lista: sem isto a última pergunta fica sem base. */}
          <span aria-hidden className="block border-t border-linha" />
        </Stagger>
      </div>
    </section>
  );
}
