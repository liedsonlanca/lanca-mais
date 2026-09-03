import { sql, garantirEsquema } from "@/lib/db";
import {
  criarDepoimento,
  salvarDepoimento,
  apagarDepoimento,
  moverDepoimento,
} from "./acoes";

// Sempre fresco: o painel precisa mostrar o que está no banco agora, não uma
// versão em cache de minutos atrás.
export const dynamic = "force-dynamic";

type Linha = { id: number; citacao: string; nome: string; cargo: string };

async function carregar(): Promise<Linha[]> {
  if (!sql) return [];
  await garantirEsquema();
  return (await sql.query(
    "SELECT id, citacao, nome, cargo FROM depoimentos ORDER BY ordem, id"
  )) as Linha[];
}

const campo =
  "w-full rounded-xl border border-linha bg-branco px-4 py-2.5 text-sm text-preto outline-none transition-colors duration-300 focus:border-salmon";
const rotulo = "block text-xs font-medium uppercase tracking-wider text-preto/50";
const botao =
  "rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300";

export default async function AdminDepoimentos() {
  const depoimentos = await carregar();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-preto">
        Depoimentos
      </h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-preto/65">
        Aparecem na home, na seção &ldquo;Quem já trabalha com a gente&rdquo;.
        A ordem aqui é a ordem lá. Toda alteração vale no site em segundos.
      </p>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-branco p-5 text-sm text-preto/75">
          Banco de dados não configurado. Nada aqui será salvo.
        </p>
      )}

      {/* ---------- Novo ---------- */}
      <form
        action={criarDepoimento}
        className="mt-8 rounded-3xl border border-linha bg-branco p-6 shadow-[var(--sombra-cartao)]"
      >
        <h2 className="font-medium text-preto">Adicionar depoimento</h2>

        <div className="mt-5 grid gap-4">
          <div>
            <label htmlFor="novo-citacao" className={rotulo}>
              Depoimento
            </label>
            <textarea
              id="novo-citacao"
              name="citacao"
              rows={3}
              required
              className={`${campo} mt-2 resize-y`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="novo-nome" className={rotulo}>
                Nome do cliente
              </label>
              <input id="novo-nome" name="nome" required className={`${campo} mt-2`} />
            </div>
            <div>
              <label htmlFor="novo-cargo" className={rotulo}>
                Nicho ou cargo
              </label>
              <input
                id="novo-cargo"
                name="cargo"
                placeholder="Ex: Clínica de estética"
                className={`${campo} mt-2`}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className={`${botao} mt-5 bg-salmon text-preto hover:bg-salmon-escuro`}
        >
          Adicionar
        </button>
      </form>

      {/* ---------- Lista ---------- */}
      <div className="mt-8 space-y-4">
        {depoimentos.length === 0 && (
          <p className="rounded-2xl border border-linha bg-branco p-6 text-sm text-preto/60">
            Nenhum depoimento cadastrado. A seção não aparece no site enquanto
            estiver vazia.
          </p>
        )}

        {depoimentos.map((d, i) => (
          <div
            key={d.id}
            className="rounded-3xl border border-linha bg-branco p-6 shadow-[var(--sombra-cartao)]"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="numeral-fantasma text-sm text-preto/35">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="flex items-center gap-2">
                {/* Formulários separados: cada botão manda a sua própria ação,
                    sem depender de JavaScript no navegador. */}
                <form action={moverDepoimento}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="direcao" value={-1} />
                  <button
                    type="submit"
                    disabled={i === 0}
                    aria-label="Mover para cima"
                    className="rounded-full border border-linha px-3 py-1 text-sm text-preto/60 transition-colors hover:border-salmon disabled:opacity-30"
                  >
                    ↑
                  </button>
                </form>

                <form action={moverDepoimento}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="direcao" value={1} />
                  <button
                    type="submit"
                    disabled={i === depoimentos.length - 1}
                    aria-label="Mover para baixo"
                    className="rounded-full border border-linha px-3 py-1 text-sm text-preto/60 transition-colors hover:border-salmon disabled:opacity-30"
                  >
                    ↓
                  </button>
                </form>
              </div>
            </div>

            <form action={salvarDepoimento} className="mt-4 grid gap-4">
              <input type="hidden" name="id" value={d.id} />

              <div>
                <label htmlFor={`citacao-${d.id}`} className={rotulo}>
                  Depoimento
                </label>
                <textarea
                  id={`citacao-${d.id}`}
                  name="citacao"
                  rows={3}
                  defaultValue={d.citacao}
                  className={`${campo} mt-2 resize-y`}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`nome-${d.id}`} className={rotulo}>
                    Nome
                  </label>
                  <input
                    id={`nome-${d.id}`}
                    name="nome"
                    defaultValue={d.nome}
                    className={`${campo} mt-2`}
                  />
                </div>
                <div>
                  <label htmlFor={`cargo-${d.id}`} className={rotulo}>
                    Nicho ou cargo
                  </label>
                  <input
                    id={`cargo-${d.id}`}
                    name="cargo"
                    defaultValue={d.cargo}
                    className={`${campo} mt-2`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`${botao} justify-self-start border border-preto/20 text-preto hover:border-preto`}
              >
                Salvar
              </button>
            </form>

            <form action={apagarDepoimento} className="mt-4 border-t border-linha pt-4">
              <input type="hidden" name="id" value={d.id} />
              <button
                type="submit"
                className="text-sm text-preto/45 transition-colors duration-300 hover:text-salmon-texto"
              >
                Apagar este depoimento
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
