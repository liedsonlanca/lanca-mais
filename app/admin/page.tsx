import Link from "next/link";
import { sql, garantirEsquema } from "@/lib/db";

export const dynamic = "force-dynamic";

const SECOES = [
  {
    href: "/admin/vitrine",
    tabela: "vitrine",
    rotulo: "Nosso trabalho",
    descricao: "As fotos e vídeos do trilho que roda na home.",
    pronto: false,
  },
  {
    href: "/admin/depoimentos",
    tabela: "depoimentos",
    rotulo: "Depoimentos",
    descricao: "O que os clientes dizem, na home.",
    pronto: true,
  },
  {
    href: "/admin/cases",
    tabela: "cases",
    rotulo: "Cases",
    descricao: "Os trabalhos com foto, resumo e resultado.",
    pronto: false,
  },
  {
    href: "/admin/logos",
    tabela: "logos",
    rotulo: "Logos de clientes",
    descricao: "A faixa de marcas atendidas.",
    pronto: false,
  },
  {
    href: "/admin/numeros",
    tabela: "numeros",
    rotulo: "Números",
    descricao: "Os contadores de prova social.",
    pronto: false,
  },
  {
    href: "/admin/blog",
    tabela: "posts",
    rotulo: "Blog",
    descricao: "Os textos publicados.",
    pronto: false,
  },
];

async function contar() {
  const vazio: Record<string, number> = {};
  if (!sql) return vazio;

  try {
    await garantirEsquema();
    for (const secao of SECOES) {
      const linhas = (await sql.query(
        `SELECT count(*)::int AS total FROM ${secao.tabela}`
      )) as Array<{ total: number }>;
      vazio[secao.tabela] = linhas[0]?.total ?? 0;
    }
  } catch {
    // O painel abre mesmo sem contagem; a seção diz o que houve.
  }

  return vazio;
}

export default async function AdminInicio() {
  const totais = await contar();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-preto">
        O que você pode editar
      </h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-preto/65">
        Cada bloco abaixo é uma parte do site. O que você salvar aqui aparece
        no site em segundos, sem precisar publicar nada.
      </p>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-branco p-5 text-sm leading-relaxed text-preto/75">
          O banco de dados não está conectado, então nada será salvo. Confira em{" "}
          <span className="text-salmon-texto">/api/status-conteudo</span> o que
          está faltando.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECOES.map((secao) => {
          const total = totais[secao.tabela];

          const cartao = (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-semibold text-preto">
                  {secao.rotulo}
                </h2>
                {typeof total === "number" && (
                  <span className="numeral-fantasma text-sm text-preto/35">
                    {total}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-preto/62">
                {secao.descricao}
              </p>
              {!secao.pronto && (
                <p className="mt-3 text-xs uppercase tracking-wider text-salmon-texto">
                  Em construção
                </p>
              )}
            </>
          );

          return secao.pronto ? (
            <Link
              key={secao.href}
              href={secao.href}
              className="rounded-3xl border border-linha bg-branco p-6 shadow-[var(--sombra-cartao)] transition-all duration-300 hover:-translate-y-0.5 hover:border-salmon/50"
            >
              {cartao}
            </Link>
          ) : (
            <div
              key={secao.href}
              className="rounded-3xl border border-linha bg-branco/60 p-6 opacity-70"
            >
              {cartao}
            </div>
          );
        })}
      </div>
    </div>
  );
}
