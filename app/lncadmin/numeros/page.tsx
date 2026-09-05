import { sql, garantirEsquema } from "@/lib/db";
import { campo, botao } from "@/components/admin/estilos";
import { painelLiberado } from "@/lib/admin";
import { criarNumero, salvarNumero, apagarNumero, moverNumero } from "./acoes";

export const dynamic = "force-dynamic";

type Linha = {
  id: number;
  prefixo: string;
  valor: number;
  sufixo: string;
  rotulo: string;
};

async function carregar(): Promise<Linha[]> {
  if (!sql) return [];
  await garantirEsquema();
  return (await sql.query(
    "SELECT id, prefixo, valor, sufixo, rotulo FROM numeros ORDER BY ordem, id"
  )) as Linha[];
}

const rotuloClasse =
  "block text-xs font-medium uppercase tracking-wider text-preto/50";

export default async function AdminNumeros() {
  // Portão próprio, além do layout: no App Router o layout não impede a
  // página de rodar, só escolhe se a mostra. Sem isto, uma visita sem sessão
  // fazia esta tela consultar o banco e ia embora dentro do HTML da resposta.
  if (!(await painelLiberado())) return null;

  const numeros = await carregar();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-preto">Números</h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-preto/65">
        Os contadores de prova social. Aparecem no topo da home e na
        apresentação da agência, animando de zero até o valor.
      </p>

      <div className="mt-4 rounded-2xl border border-linha bg-branco p-5 text-sm leading-relaxed text-preto/70">
        <strong className="font-medium text-preto">Como preencher:</strong> o
        campo <em>valor</em> aceita só o número inteiro, porque é ele que a
        animação conta. Símbolos vão nos campos ao lado. Para mostrar{" "}
        <span className="text-salmon-texto">+300 conteúdos por mês</span>, use
        prefixo <code>+</code>, valor <code>300</code>, sufixo vazio e rótulo{" "}
        <code>conteúdos por mês</code>.
      </div>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-branco p-5 text-sm text-preto/75">
          Banco de dados não configurado. Nada aqui será salvo.
        </p>
      )}

      {/* ---------- Novo ---------- */}
      <form
        action={criarNumero}
        className="mt-8 rounded-3xl border border-linha bg-branco p-6 shadow-[var(--sombra-cartao)]"
      >
        <h2 className="font-medium text-preto">Adicionar número</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-[80px_120px_80px_1fr]">
          <div>
            <label htmlFor="novo-prefixo" className={rotuloClasse}>
              Antes
            </label>
            <input
              id="novo-prefixo"
              name="prefixo"
              placeholder="+"
              className={`${campo} mt-2`}
            />
          </div>
          <div>
            <label htmlFor="novo-valor" className={rotuloClasse}>
              Valor
            </label>
            <input
              id="novo-valor"
              name="valor"
              type="number"
              required
              placeholder="300"
              className={`${campo} mt-2`}
            />
          </div>
          <div>
            <label htmlFor="novo-sufixo" className={rotuloClasse}>
              Depois
            </label>
            <input
              id="novo-sufixo"
              name="sufixo"
              placeholder="%"
              className={`${campo} mt-2`}
            />
          </div>
          <div>
            <label htmlFor="novo-rotulo" className={rotuloClasse}>
              Rótulo
            </label>
            <input
              id="novo-rotulo"
              name="rotulo"
              required
              placeholder="conteúdos por mês"
              className={`${campo} mt-2`}
            />
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
        {numeros.length === 0 && (
          <p className="rounded-2xl border border-linha bg-branco p-6 text-sm text-preto/60">
            Nenhum número cadastrado.
          </p>
        )}

        {numeros.map((n, i) => (
          <div
            key={n.id}
            className="rounded-3xl border border-linha bg-branco p-6 shadow-[var(--sombra-cartao)]"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Prévia do que a home vai mostrar. */}
              <span className="font-heading text-xl font-semibold text-preto">
                {n.prefixo}
                {n.valor}
                {n.sufixo}{" "}
                <span className="text-sm font-normal text-preto/55">
                  {n.rotulo}
                </span>
              </span>

              <div className="flex items-center gap-2">
                <form action={moverNumero}>
                  <input type="hidden" name="id" value={n.id} />
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
                <form action={moverNumero}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="direcao" value={1} />
                  <button
                    type="submit"
                    disabled={i === numeros.length - 1}
                    aria-label="Mover para baixo"
                    className="rounded-full border border-linha px-3 py-1 text-sm text-preto/60 transition-colors hover:border-salmon disabled:opacity-30"
                  >
                    ↓
                  </button>
                </form>
              </div>
            </div>

            <form
              action={salvarNumero}
              className="mt-4 grid gap-4 sm:grid-cols-[80px_120px_80px_1fr]"
            >
              <input type="hidden" name="id" value={n.id} />

              <div>
                <label htmlFor={`prefixo-${n.id}`} className={rotuloClasse}>
                  Antes
                </label>
                <input
                  id={`prefixo-${n.id}`}
                  name="prefixo"
                  defaultValue={n.prefixo}
                  className={`${campo} mt-2`}
                />
              </div>
              <div>
                <label htmlFor={`valor-${n.id}`} className={rotuloClasse}>
                  Valor
                </label>
                <input
                  id={`valor-${n.id}`}
                  name="valor"
                  type="number"
                  defaultValue={n.valor}
                  className={`${campo} mt-2`}
                />
              </div>
              <div>
                <label htmlFor={`sufixo-${n.id}`} className={rotuloClasse}>
                  Depois
                </label>
                <input
                  id={`sufixo-${n.id}`}
                  name="sufixo"
                  defaultValue={n.sufixo}
                  className={`${campo} mt-2`}
                />
              </div>
              <div>
                <label htmlFor={`rotulo-${n.id}`} className={rotuloClasse}>
                  Rótulo
                </label>
                <input
                  id={`rotulo-${n.id}`}
                  name="rotulo"
                  defaultValue={n.rotulo}
                  className={`${campo} mt-2`}
                />
              </div>

              <button
                type="submit"
                className={`${botao} justify-self-start border border-preto/20 text-preto hover:border-preto sm:col-span-4`}
              >
                Salvar
              </button>
            </form>

            <form action={apagarNumero} className="mt-4 border-t border-linha pt-4">
              <input type="hidden" name="id" value={n.id} />
              <button
                type="submit"
                className="text-sm text-preto/45 transition-colors duration-300 hover:text-salmon-texto"
              >
                Apagar este número
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
