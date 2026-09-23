import Link from "next/link";
import type { Metadata } from "next";
import { lerServicos } from "@/lib/conteudo-textos";
import { lerNumeros, lerVitrine } from "@/lib/conteudo";
import ArcoDeFotos, { type FotoDoArco } from "@/components/ArcoDeFotos";
import CtaFinal from "@/components/CtaFinal";
import ServiceIcon from "@/components/ServiceIcon";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Marketing pessoal, marketing empresarial, audiovisual, consultoria, tráfego pago, identidade visual, desenvolvimento web e arquitetura: tudo em uma única agência.",
};

export default async function ServicosPage() {
  // Tudo aqui vem do painel; sem banco, cai no conteúdo dos arquivos.
  const [numeros, vitrine, services] = await Promise.all([
    lerNumeros(),
    lerVitrine(),
    // Os nomes e resumos vêm com o texto do painel aplicado.
    lerServicos(),
  ]);

  // As peças que abrem o arco são as do trilho de trabalho: vídeos,
  // carrosséis, estáticos, o que estiver cadastrado. Antes eram retratos da
  // equipe fixos no código, e numa página de serviços o que precisa aparecer
  // é o trabalho, não quem faz. Cadastrou uma peça nova no painel, ela entra
  // aqui sozinha.
  //
  // Do vídeo entra a capa, e não o vídeo: cinco vídeos tocando ao mesmo tempo
  // num leque de miniaturas seria peso de download sem nada a ganhar.
  const fotosDoArco: FotoDoArco[] = vitrine
    .filter((peca) => Boolean(peca.src))
    .slice(0, 5)
    .map((peca) => ({ src: peca.src, alt: peca.alt }));

  return (
    <>
      <ArcoDeFotos
        eyebrow="Serviços"
        titulo={[
          { texto: "Oito frentes que constroem" },
          { texto: "uma marca por inteiro.", acento: "inteiro." },
        ]}
        lead="Contrate uma ou várias. O que não muda é o padrão e o alinhamento entre elas."
        botao={{ href: "/contato", texto: "Falar com a equipe" }}
        fotos={fotosDoArco}
        numeros={numeros}
      />

      {/* Grade de serviços. Em lista longa as oito frentes viravam rolagem;
          em grade elas se comparam de relance, que é o que a página precisa. */}
      {/* Areia, e não branco: a seção seguinte é a chamada final, que é
          branca. Duas brancas coladas não têm borda, e sem borda só o vão diz
          que uma acabou e a outra começou. */}
      <section className="relative overflow-hidden bg-fundo-alt">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
          <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <StaggerItem key={service.slug} className="h-full">
                <Link
                  href={`/servicos/${service.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-contorno bg-cartao p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-salmon/45 hover:shadow-[0_28px_60px_-38px_rgba(10,10,8,0.5)] focus-visible:-translate-y-1.5 focus-visible:border-salmon focus-visible:outline-none"
                >
                  {/* Régua de lançamento, a mesma da home e do método. */}
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 h-0 w-[3px] bg-salmon transition-all duration-700 ease-out group-hover:h-full group-focus-visible:h-full"
                  />

                  {/* O número e o ícone nas pontas da mesma linha. Entre eles
                      havia um fio que não ligava nada, e o número vinha dentro
                      de um círculo com borda: dois enfeites onde bastava a
                      ordem e o desenho da frente. */}
                  <div className="flex items-start justify-between gap-4">
                    <span className="numeral-fantasma text-sm text-tinta/45 transition-colors duration-500 group-hover:text-destaque">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span
                      aria-hidden
                      className="shrink-0 text-tinta/35 transition-colors duration-500 group-hover:text-destaque"
                    >
                      <ServiceIcon slug={service.slug} className="h-7 w-7" />
                    </span>
                  </div>

                  <h2 className="font-heading mt-7 text-[1.5rem] font-semibold leading-[1.1] tracking-[-0.03em] text-tinta">
                    {service.name}
                  </h2>
                  <p className="mt-3 leading-relaxed text-tinta/65">
                    {service.shortDescription}
                  </p>

                  <div className="mt-8 flex flex-1 items-end justify-between gap-4 border-t border-contorno pt-6">
                    <span className="text-sm leading-relaxed text-tinta/60">
                      {service.bullets.slice(0, 2).join(" · ")}
                    </span>

                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-contorno text-tinta/60 transition-all duration-500 group-hover:border-salmon group-hover:bg-salmon group-hover:text-preto"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      >
                        <path d="M7 17 17 7M9 7h8v8" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <CtaFinal
        titulo="Não sabe por onde"
        destaque="começar?"
        lead="Conte pra gente o momento atual da sua marca e a equipe da LANÇA+ recomenda o melhor ponto de partida."
      />
    </>
  );
}
