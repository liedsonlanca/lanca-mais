import Link from "next/link";
import { services } from "@/lib/site-config";
import ServiceIcon from "@/components/ServiceIcon";
import Stagger, { StaggerItem } from "@/components/motion/Stagger";

// Lista editorial dos serviços, usada na home.
//
// O painel é `areia` sobre o branco da seção: card branco em fundo branco não
// existe como painel, e era isso que deixava a lista sem presença.
//
// O gesto próprio da marca é a régua salmão na borda esquerda, que cresce de
// cima a baixo ao passar o mouse — um lançamento. Ela se repete no método, na
// equipe e na grade da página de serviços.
export default function ServiceRows() {
  return (
    <Stagger className="mt-16 space-y-4">
      {services.map((service, i) => (
        <StaggerItem key={service.slug}>
          <Link
            href={`/servicos/${service.slug}`}
            className="group relative flex items-center gap-6 overflow-hidden rounded-3xl border border-linha bg-branco p-6 shadow-[var(--sombra-cartao)] transition-all duration-500 hover:-translate-y-1 hover:border-salmon/45 hover:shadow-[0_28px_60px_-38px_rgba(10,10,8,0.5)] focus-visible:-translate-y-1 focus-visible:border-salmon focus-visible:outline-none sm:gap-8 sm:p-8 lg:gap-10 lg:p-10"
          >
            {/* Régua de lançamento */}
            <span
              aria-hidden
              className="absolute left-0 top-0 h-0 w-[3px] bg-salmon transition-all duration-700 ease-out group-hover:h-full group-focus-visible:h-full"
            />

            <span className="numeral-fantasma hidden shrink-0 text-5xl text-preto/20 transition-colors duration-500 group-hover:text-salmon-texto sm:block lg:text-6xl">
              {String(i + 1).padStart(2, "0")}
            </span>

            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-salmon/15 text-salmon-texto transition-colors duration-500 group-hover:bg-salmon group-hover:text-preto lg:h-16 lg:w-16"
            >
              <ServiceIcon slug={service.slug} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-xl font-semibold leading-tight text-preto transition-colors duration-500 group-hover:text-salmon-texto lg:text-2xl">
                {service.name}
              </span>
              <span className="mt-2 block leading-relaxed text-preto/70">
                {service.shortDescription}
              </span>
            </span>

            {/* Entregáveis: só onde há largura sobrando. */}
            <span className="hidden max-w-[16rem] text-sm leading-relaxed text-preto/55 xl:block">
              {service.bullets.slice(0, 2).join(" · ")}
            </span>

            <span
              aria-hidden
              className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-preto/15 text-preto/60 transition-all duration-500 group-hover:border-salmon group-hover:bg-salmon group-hover:text-preto sm:flex"
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
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
