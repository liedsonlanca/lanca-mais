import Link from "next/link";
import type { Metadata } from "next";
import { services } from "@/lib/site-config";
import PageHero from "@/components/PageHero";
import CtaFinal from "@/components/CtaFinal";
import ServiceIcon from "@/components/ServiceIcon";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Gestão de marketing, consultoria, audiovisual, tráfego pago, identidade visual, desenvolvimento web e arquitetura: tudo em uma única agência.",
};

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Serviços"
        titulo={[
          { texto: "Sete frentes que constroem" },
          { texto: "uma marca por inteiro.", acento: true },
        ]}
        lead="Cada serviço pode ser contratado isoladamente ou combinado, o que não muda é o padrão de qualidade e o alinhamento estratégico entre eles."
      />

      {/* Grade de serviços. Em lista longa as sete frentes viravam rolagem;
          em grade elas se comparam de relance, que é o que a página precisa. */}
      <section className="relative overflow-hidden bg-papel">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
          <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <StaggerItem key={service.slug} className="h-full">
                <Link
                  href={`/servicos/${service.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-linha bg-areia p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-salmon/45 hover:bg-branco hover:shadow-[0_28px_60px_-38px_rgba(10,10,8,0.5)] focus-visible:-translate-y-1.5 focus-visible:border-salmon focus-visible:outline-none"
                >
                  {/* Régua de lançamento, a mesma da home e do método. */}
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 h-0 w-[3px] bg-salmon transition-all duration-700 ease-out group-hover:h-full group-focus-visible:h-full"
                  />

                  {/* Marcador numerado sobre um trilho que corre até o ícone —
                      o mesmo device dos marcadores da linha do tempo do método. */}
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-linha bg-branco transition-all duration-500 group-hover:border-salmon group-hover:bg-salmon">
                      <span className="numeral-fantasma text-base text-salmon-texto transition-colors duration-500 group-hover:text-preto">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </span>

                    <span aria-hidden className="h-px flex-1 bg-linha" />

                    <span
                      aria-hidden
                      className="shrink-0 text-preto/35 transition-colors duration-500 group-hover:text-salmon-texto"
                    >
                      <ServiceIcon slug={service.slug} className="h-7 w-7" />
                    </span>
                  </div>

                  <h2 className="mt-7 text-xl font-semibold leading-snug text-preto transition-colors duration-500 group-hover:text-salmon-texto">
                    {service.name}
                  </h2>
                  <p className="mt-3 leading-relaxed text-preto/70">
                    {service.shortDescription}
                  </p>

                  <div className="mt-8 flex flex-1 items-end justify-between gap-4 border-t border-linha pt-6">
                    <span className="text-sm leading-relaxed text-preto/55">
                      {service.bullets.slice(0, 2).join(" · ")}
                    </span>

                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-preto/15 text-preto/60 transition-all duration-500 group-hover:border-salmon group-hover:bg-salmon group-hover:text-preto"
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
