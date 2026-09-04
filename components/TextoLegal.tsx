import type { ReactNode } from "react";

// Moldura de leitura das páginas legais.
//
// Elas não competem com o resto do site: sem animação de entrada, sem acento
// de cor a cada parágrafo, medida de linha curta. Quem abre uma política está
// procurando uma informação específica, e o que ajuda ali é hierarquia clara e
// linha curta, não personalidade.
export function PaginaLegal({
  atualizadoEm,
  children,
}: {
  /** Data da última revisão, no formato que a pessoa lê. */
  atualizadoEm: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-papel">
      <div className="mx-auto max-w-2xl px-6 py-20 lg:py-28">
        <p className="eyebrow text-preto/45">
          Atualizada em {atualizadoEm}
        </p>
        <div className="mt-10 space-y-10">{children}</div>
      </div>
    </section>
  );
}

export function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold text-preto">
        {titulo}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-preto/72">
        {children}
      </div>
    </div>
  );
}

export function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="space-y-3">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            aria-hidden
            className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-salmon"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
