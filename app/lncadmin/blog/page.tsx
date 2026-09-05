import { sql, garantirEsquema } from "@/lib/db";
import { painelLiberado } from "@/lib/admin";
import {
  campo,
  rotulo,
  ajuda,
  botaoPrimario,
  botaoSecundario,
  botaoDiscreto,
  cartao,
} from "@/components/admin/estilos";
import { criarPost, salvarPost, apagarPost } from "./acoes";

export const dynamic = "force-dynamic";

type Linha = {
  id: number;
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  data: string;
  tempo_leitura: string;
  conteudo: string[];
  publicado: boolean;
};

async function carregar(): Promise<Linha[]> {
  if (!sql) return [];
  await garantirEsquema();
  return (await sql.query(
    "SELECT id, slug, titulo, resumo, categoria, to_char(data, 'YYYY-MM-DD') AS data, tempo_leitura, conteudo, publicado FROM posts ORDER BY data DESC, id DESC"
  )) as Linha[];
}

export default async function AdminBlog() {
  // Portão próprio, além do layout: no App Router o layout não impede a
  // página de rodar, só escolhe se a mostra. Sem isto, uma visita sem sessão
  // fazia esta tela consultar o banco e ia embora dentro do HTML da resposta.
  if (!(await painelLiberado())) return null;

  const posts = await carregar();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-preto">Blog</h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-preto/65">
        Os três posts mais recentes aparecem na home e no rodapé. A lista
        completa fica na página do blog, com uma página própria para cada texto.
      </p>

      <div className={`${cartao} mt-4 !p-5 text-sm leading-relaxed text-preto/70`}>
        <strong className="font-medium text-preto">Como escrever:</strong>{" "}
        separe os parágrafos com uma linha em branco, como num e-mail. O tempo
        de leitura é calculado sozinho. Desmarque{" "}
        <em>publicado</em> para guardar um rascunho sem que ele apareça no site.
      </div>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-branco p-5 text-sm text-preto/75">
          Banco de dados não configurado. Nada aqui será salvo.
        </p>
      )}

      {/* ---------- Novo post ---------- */}
      <form action={criarPost} className={`${cartao} mt-8`}>
        <h2 className="font-medium text-preto">Escrever post</h2>

        <div className="mt-5 grid gap-4">
          <div>
            <label htmlFor="novo-titulo" className={rotulo}>
              Título
            </label>
            <input
              id="novo-titulo"
              name="titulo"
              required
              className={`${campo} mt-2`}
            />
            <p className={ajuda}>O endereço do post nasce do título.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nova-categoria" className={rotulo}>
                Categoria
              </label>
              <input
                id="nova-categoria"
                name="categoria"
                placeholder="Ex: Estratégia"
                className={`${campo} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="nova-data" className={rotulo}>
                Data
              </label>
              <input
                id="nova-data"
                name="data"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={`${campo} mt-2`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="novo-resumo" className={rotulo}>
              Resumo
            </label>
            <textarea
              id="novo-resumo"
              name="resumo"
              rows={2}
              className={`${campo} mt-2 resize-y`}
            />
            <p className={ajuda}>
              Aparece no card da home e da lista. Duas linhas bastam.
            </p>
          </div>

          <div>
            <label htmlFor="novo-conteudo" className={rotulo}>
              Texto
            </label>
            <textarea
              id="novo-conteudo"
              name="conteudo"
              rows={10}
              className={`${campo} mt-2 resize-y`}
            />
          </div>

          <label className="flex min-h-11 items-center gap-3 text-sm text-preto/70">
            <input
              type="checkbox"
              name="publicado"
              defaultChecked
              className="h-4 w-4 accent-[var(--color-salmon)]"
            />
            Publicado no site
          </label>
        </div>

        <button type="submit" className={`${botaoPrimario} mt-5`}>
          Criar post
        </button>
      </form>

      {/* ---------- Lista ---------- */}
      <div className="mt-8 space-y-4">
        {posts.length === 0 && (
          <p className="rounded-2xl border border-linha bg-branco p-6 text-sm text-preto/60">
            Nenhum post cadastrado.
          </p>
        )}

        {posts.map((p) => (
          <details key={p.id} className={`${cartao} group`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="block truncate font-medium text-preto">
                  {p.titulo}
                </span>
                <span className="mt-1 block text-sm text-preto/55">
                  {p.data} · {p.tempo_leitura}
                  {!p.publicado && (
                    <span className="ml-2 rounded-full bg-salmon/15 px-2 py-0.5 text-xs text-salmon-texto">
                      rascunho
                    </span>
                  )}
                </span>
              </span>
              <span
                aria-hidden
                className="shrink-0 text-xl text-salmon-texto transition-transform duration-300 group-open:rotate-45"
              >
                +
              </span>
            </summary>

            <form action={salvarPost} className="mt-6 grid gap-4">
              <input type="hidden" name="id" value={p.id} />

              <div>
                <label htmlFor={`titulo-${p.id}`} className={rotulo}>
                  Título
                </label>
                <input
                  id={`titulo-${p.id}`}
                  name="titulo"
                  defaultValue={p.titulo}
                  className={`${campo} mt-2`}
                />
                <p className={ajuda}>
                  Endereço atual: /blog/{p.slug} — ele não muda ao renomear o
                  título, para não quebrar links já compartilhados.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`categoria-${p.id}`} className={rotulo}>
                    Categoria
                  </label>
                  <input
                    id={`categoria-${p.id}`}
                    name="categoria"
                    defaultValue={p.categoria}
                    className={`${campo} mt-2`}
                  />
                </div>
                <div>
                  <label htmlFor={`data-${p.id}`} className={rotulo}>
                    Data
                  </label>
                  <input
                    id={`data-${p.id}`}
                    name="data"
                    type="date"
                    defaultValue={p.data}
                    className={`${campo} mt-2`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`resumo-${p.id}`} className={rotulo}>
                  Resumo
                </label>
                <textarea
                  id={`resumo-${p.id}`}
                  name="resumo"
                  rows={2}
                  defaultValue={p.resumo}
                  className={`${campo} mt-2 resize-y`}
                />
              </div>

              <div>
                <label htmlFor={`conteudo-${p.id}`} className={rotulo}>
                  Texto
                </label>
                <textarea
                  id={`conteudo-${p.id}`}
                  name="conteudo"
                  rows={12}
                  defaultValue={(p.conteudo ?? []).join("\n\n")}
                  className={`${campo} mt-2 resize-y`}
                />
              </div>

              <label className="flex min-h-11 items-center gap-3 text-sm text-preto/70">
                <input
                  type="checkbox"
                  name="publicado"
                  defaultChecked={p.publicado}
                  className="h-4 w-4 accent-[var(--color-salmon)]"
                />
                Publicado no site
              </label>

              <button type="submit" className={`${botaoSecundario} justify-self-start`}>
                Salvar
              </button>
            </form>

            <form action={apagarPost} className="mt-4 border-t border-linha pt-4">
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className={botaoDiscreto}>
                Apagar este post
              </button>
            </form>
          </details>
        ))}
      </div>
    </div>
  );
}
