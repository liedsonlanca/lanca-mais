import Link from "next/link";
import { notFound } from "next/navigation";
import { painelLiberado } from "@/lib/admin";
import { sql } from "@/lib/db";
import { lerTextos } from "@/lib/conteudo";
import { GRUPOS, camposDoGrupo, texto as ler } from "@/lib/textos";
import { campo, botaoSecundario, botaoDiscreto } from "@/components/admin/estilos";
import { salvarTexto, restaurarTexto } from "../acoes";

export const dynamic = "force-dynamic";

/** Só os grupos do catálogo têm página. Nome inventado na URL cai no 404. */
export function generateStaticParams() {
  return GRUPOS.map((grupo) => ({ grupo: grupo.id }));
}

/** Quantas linhas a caixa de texto ganha, conforme o que ela guarda. */
const ALTURA = { linha: 1, paragrafo: 4, lista: 7 } as const;

const AJUDA = {
  linha: null,
  paragrafo: null,
  lista: "Uma frase por linha. Apagar a linha tira o item, escrever uma nova acrescenta, e mover a linha muda a ordem no site.",
} as const;

export default async function AdminGrupoDeTextos({
  params,
}: {
  params: Promise<{ grupo: string }>;
}) {
  if (!(await painelLiberado())) return null;

  const { grupo: id } = await params;
  const grupo = GRUPOS.find((g) => g.id === id);
  if (!grupo) notFound();

  const campos = camposDoGrupo(id);
  const textos = await lerTextos();

  // Quais já foram reescritos. Serve só para decidir se o botão de restaurar
  // aparece: oferecer "voltar ao original" num texto intocado não faz nada.
  const reescritos = new Set<string>();
  if (sql) {
    try {
      const linhas = (await sql.query(
        "SELECT chave FROM textos WHERE chave = ANY($1)",
        [campos.map((c) => c.chave)]
      )) as Array<{ chave: string }>;
      for (const linha of linhas) reescritos.add(linha.chave);
    } catch {
      // A tela abre sem isso.
    }
  }

  return (
    <div>
      <Link href="/lncadmin/textos" className={botaoDiscreto}>
        ← Todos os textos
      </Link>

      <h1 className="font-heading mt-4 text-3xl font-semibold text-tinta">
        {grupo.rotulo}
      </h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-tinta/65">
        {grupo.descricao} São {campos.length} campos.
      </p>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-cartao p-5 text-sm text-tinta/75">
          Banco de dados não configurado. Nada aqui será salvo.
        </p>
      )}

      <div className="mt-8 space-y-4">
        {campos.map((c) => {
          const atual = ler(textos, c.chave);
          const mexido = reescritos.has(c.chave);

          return (
            <div
              key={c.chave}
              className="rounded-3xl border border-contorno bg-cartao p-6 shadow-[var(--sombra-cartao)]"
            >
              {/* Um formulário por campo: a pessoa salva a frase em que mexeu,
                  e não as cinquenta da tela. */}
              <form action={salvarTexto}>
                <input type="hidden" name="chave" value={c.chave} />

                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <label
                    htmlFor={c.chave}
                    className="text-sm font-medium text-tinta"
                  >
                    {c.rotulo}
                  </label>
                  {mexido && (
                    <span className="rounded-full bg-salmon/15 px-2.5 py-0.5 text-xs font-medium text-destaque">
                      reescrito
                    </span>
                  )}
                </div>

                {c.tipo === "linha" ? (
                  <input
                    id={c.chave}
                    name="valor"
                    defaultValue={atual}
                    className={`${campo} mt-3`}
                  />
                ) : (
                  <textarea
                    id={c.chave}
                    name="valor"
                    defaultValue={atual}
                    rows={ALTURA[c.tipo]}
                    className={`${campo} mt-3 min-h-0 resize-y py-3 leading-relaxed`}
                  />
                )}

                {AJUDA[c.tipo] && (
                  <p className="mt-2 text-xs leading-relaxed text-tinta/50">
                    {AJUDA[c.tipo]}
                  </p>
                )}

                <button type="submit" className={`${botaoSecundario} mt-4`}>
                  Salvar
                </button>
              </form>

              {/* Fora do formulário acima: um formulário não pode conter
                  outro. O texto original fica à vista, porque decidir se vale
                  voltar exige ver o que se perde. */}
              {mexido && (
                <form
                  action={restaurarTexto}
                  className="mt-4 border-t border-contorno pt-4"
                >
                  <input type="hidden" name="chave" value={c.chave} />
                  <p className="text-xs leading-relaxed text-tinta/45">
                    Original: {c.padrao.slice(0, 180)}
                    {c.padrao.length > 180 ? "…" : ""}
                  </p>
                  <button type="submit" className={`${botaoDiscreto} mt-3`}>
                    Voltar para o texto original
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
