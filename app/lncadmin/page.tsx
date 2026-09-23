import Link from "next/link";
import { painelLiberado } from "@/lib/admin";
import { sql, garantirEsquema } from "@/lib/db";

export const dynamic = "force-dynamic";

const SECOES: Array<{
  href: string;
  tabela: string | null;
  rotulo: string;
  descricao: string;
  pronto: boolean;
}> = [
  {
    href: "/lncadmin/vitrine",
    tabela: "vitrine",
    rotulo: "Nosso trabalho",
    descricao: "As fotos e vídeos do trilho que roda na home.",
    pronto: true,
  },
  {
    href: "/lncadmin/depoimentos-video",
    tabela: "depoimentos_video",
    rotulo: "Depoimentos em vídeo",
    descricao: "Os vídeos de cliente, ao lado do bloco do problema na home.",
    pronto: true,
  },
  {
    href: "/lncadmin/textos",
    // Sem contagem, pelo mesmo motivo das imagens: os campos existem sempre,
    // e os que ninguém reescreveu não têm linha no banco.
    tabela: null,
    rotulo: "Textos do site",
    descricao:
      "Toda frase da home e das páginas de serviço: títulos, entregáveis, diferenciais e o FAQ.",
    pronto: true,
  },
  {
    href: "/lncadmin/imagens",
    // Sem contagem: aqui o que importa não é quantas linhas há no banco, e
    // sim que as cinquenta posições existem sempre — as que ninguém trocou
    // seguem no padrão, sem linha nenhuma gravada.
    tabela: null,
    rotulo: "Imagens do site",
    descricao:
      "Toda imagem de lugar fixo: cards de serviço, blocos da home, logo e o leque de cada serviço.",
    pronto: true,
  },
  {
    href: "/lncadmin/depoimentos",
    tabela: "depoimentos",
    rotulo: "Depoimentos",
    descricao: "O que os clientes dizem, na home.",
    pronto: true,
  },
  {
    href: "/lncadmin/equipe",
    tabela: "equipe",
    rotulo: "Equipe",
    descricao: "Quem aparece na página Sobre, com foto e função.",
    pronto: true,
  },
  {
    href: "/lncadmin/cases",
    tabela: "cases",
    rotulo: "Cases",
    descricao: "Os trabalhos com foto, resumo e resultado.",
    pronto: true,
  },
  {
    href: "/lncadmin/logos",
    tabela: "logos",
    rotulo: "Logos de clientes",
    descricao: "A faixa de marcas atendidas.",
    pronto: true,
  },
  {
    href: "/lncadmin/numeros",
    tabela: "numeros",
    rotulo: "Números",
    descricao: "Os contadores de prova social.",
    pronto: true,
  },
  {
    href: "/lncadmin/blog",
    tabela: "posts",
    rotulo: "Blog",
    descricao: "Os textos publicados.",
    pronto: true,
  },
];

async function contar() {
  const vazio: Record<string, number> = {};
  if (!sql) return vazio;

  try {
    await garantirEsquema();
    for (const secao of SECOES) {
      if (!secao.tabela) continue;
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
  // Portão próprio, além do layout: no App Router o layout não impede a
  // página de rodar, só escolhe se a mostra. Sem isto, uma visita sem sessão
  // fazia esta tela consultar o banco e ia embora dentro do HTML da resposta.
  if (!(await painelLiberado())) return null;

  const totais = await contar();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-tinta">
        O que você pode editar
      </h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-tinta/65">
        Cada bloco abaixo é uma parte do site. O que você salvar aqui aparece
        no site em segundos, sem precisar publicar nada.
      </p>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-cartao p-5 text-sm leading-relaxed text-tinta/75">
          O banco de dados não está conectado, então nada será salvo. Confira em{" "}
          <span className="text-destaque">/api/status-conteudo</span> o que
          está faltando.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECOES.map((secao) => {
          const total = secao.tabela ? totais[secao.tabela] : undefined;

          const cartao = (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-semibold text-tinta">
                  {secao.rotulo}
                </h2>
                {typeof total === "number" && (
                  <span className="numeral-fantasma text-sm text-tinta/35">
                    {total}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-tinta/62">
                {secao.descricao}
              </p>
              {!secao.pronto && (
                <p className="mt-3 text-xs uppercase tracking-wider text-destaque">
                  Em construção
                </p>
              )}
            </>
          );

          return secao.pronto ? (
            <Link
              key={secao.href}
              href={secao.href}
              className="rounded-3xl border border-contorno bg-cartao p-6 shadow-[var(--sombra-cartao)] transition-all duration-300 hover:-translate-y-0.5 hover:border-salmon/50"
            >
              {cartao}
            </Link>
          ) : (
            <div
              key={secao.href}
              className="rounded-3xl border border-contorno bg-cartao/60 p-6 opacity-70"
            >
              {cartao}
            </div>
          );
        })}
      </div>
    </div>
  );
}
