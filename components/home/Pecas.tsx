import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import WordReveal, { type Linha } from "@/components/motion/WordReveal";

// As peças de tipografia e de botão da home, num lugar só.
//
// Existem porque a home passou a ser editorial: o que separa um assunto do
// outro é fio e espaço, não caixa com borda. Repetir esses pedaços à mão em
// cada bloco faria cada um nascer com um tamanho ligeiramente diferente, e é
// justamente a diferença mínima entre blocos parecidos que dá a um site o ar
// de coisa montada sem cuidado.
//
// Nada aqui usa "use client": todas são componentes de servidor que embrulham
// os de movimento, que já são de cliente.

/** Rótulo da seção: texto na cor da marca, com um fio curto antes. */
export function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <span className="flex items-center gap-4">
        <span aria-hidden className="h-px w-10 bg-salmon" />
        <span className="eyebrow text-destaque">{children}</span>
      </span>
    </Reveal>
  );
}

/**
 * Título de bloco, em corpo de display.
 *
 * Num site sem caixa, é o tamanho do título que diz que começou assunto novo.
 * Mas título de duas linhas em corpo enorme, repetido em seis blocos, vira
 * rolagem: cada um custava quase duzentos pixels de altura só para anunciar o
 * que vinha embaixo. Aqui ele é grande o bastante para mandar na página, e
 * curto o bastante para caber numa linha na maioria das telas.
 */
export function Titulo({
  linhas,
  className = "",
}: {
  linhas: Linha[];
  className?: string;
}) {
  return (
    <h2
      className={`font-heading mt-5 text-[1.95rem] font-semibold leading-[1.05] tracking-[-0.035em] text-tinta sm:text-4xl lg:text-[2.9rem] ${className}`}
    >
      <WordReveal linhas={linhas} gatilho="scroll" delay={0.05} />
    </h2>
  );
}

/** Linha de apoio do título. Com peso, e não em cinza apagado. */
export function Lead({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Reveal delay={0.12}>
      <p
        className={`mt-6 max-w-2xl text-lg font-medium leading-relaxed text-tinta/75 lg:text-xl ${className}`}
      >
        {children}
      </p>
    </Reveal>
  );
}

function SetaCircular() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Botão de ação: pílula com a seta num disco à direita.
 *
 * O disco existe para o botão ter um ponto de peso, em vez de ser um retângulo
 * de cor uniforme. Ele gira ao passar o ponteiro, então o botão responde sem
 * mudar de tamanho e empurrar o que está em volta.
 */
export function Botao({
  href,
  children,
  variante = "cheio",
}: {
  href: string;
  children: React.ReactNode;
  variante?: "cheio" | "vazado" | "contraste";
}) {
  const fundo = {
    cheio: "bg-botao text-branco",
    vazado: "border border-tinta/25 text-tinta hover:border-tinta",
    contraste: "bg-preto text-bege",
  }[variante];

  const disco = {
    cheio: "bg-preto text-branco",
    vazado: "bg-tinta/10 text-tinta",
    contraste: "bg-salmon text-preto",
  }[variante];

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-4 rounded-full py-2 pl-7 pr-2 font-medium transition-transform duration-500 hover:-translate-y-0.5 ${fundo}`}
    >
      {children}
      <span
        aria-hidden
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-500 group-hover:rotate-45 ${disco}`}
      >
        <SetaCircular />
      </span>
    </Link>
  );
}

/** Link discreto, com a seta andando para a direita. */
export function LinkSeta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-11 items-center gap-2.5 font-medium text-tinta ${className}`}
    >
      {children}
      <span
        aria-hidden
        className="transition-transform duration-500 group-hover:translate-x-1"
      >
        <SetaCircular />
      </span>
    </Link>
  );
}
