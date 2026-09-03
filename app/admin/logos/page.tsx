import Image from "next/image";
import { sql, garantirEsquema } from "@/lib/db";
import {
  campo,
  rotulo,
  ajuda,
  botaoPrimario,
  botaoSecundario,
  botaoDiscreto,
  cartao,
  arquivo,
  setaOrdem,
} from "@/components/admin/estilos";
import { criarLogo, salvarLogo, apagarLogo, moverLogo } from "./acoes";

export const dynamic = "force-dynamic";

type Linha = { id: number; nome: string; logo: string };

async function carregar(): Promise<Linha[]> {
  if (!sql) return [];
  await garantirEsquema();
  return (await sql.query(
    "SELECT id, nome, logo FROM logos ORDER BY ordem, id"
  )) as Linha[];
}

export default async function AdminLogos() {
  const logos = await carregar();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-preto">
        Logos de clientes
      </h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-preto/65">
        A faixa &ldquo;Marcas que confiam na LANÇA+&rdquo;, na home. Enquanto
        não houver nenhum logo aqui, a faixa inteira não aparece no site.
      </p>

      <div className={`${cartao} mt-4 !p-5 text-sm leading-relaxed text-preto/70`}>
        <strong className="font-medium text-preto">Formato:</strong> PNG ou
        WEBP com fundo transparente. Os logos são exibidos em tom único, e a
        cor volta ao passar o mouse — logo com fundo branco quadrado vai
        aparecer como um retângulo no meio da faixa.
      </div>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-branco p-5 text-sm text-preto/75">
          Banco de dados não configurado. Nada aqui será salvo.
        </p>
      )}

      <form action={criarLogo} className={`${cartao} mt-8`}>
        <h2 className="font-medium text-preto">Adicionar logo</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="novo-nome" className={rotulo}>
              Nome da marca
            </label>
            <input id="novo-nome" name="nome" required className={`${campo} mt-2`} />
            <p className={ajuda}>Usado na descrição da imagem.</p>
          </div>
          <div>
            <label htmlFor="novo-logo" className={rotulo}>
              Arquivo do logo
            </label>
            <input
              id="novo-logo"
              name="logo"
              type="file"
              required
              accept="image/png,image/webp"
              className={arquivo}
            />
          </div>
        </div>

        <button type="submit" className={`${botaoPrimario} mt-5`}>
          Adicionar
        </button>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {logos.length === 0 && (
          <p className="rounded-2xl border border-linha bg-branco p-6 text-sm text-preto/60 sm:col-span-2">
            Nenhum logo cadastrado, então a faixa não aparece no site.
          </p>
        )}

        {logos.map((l, i) => (
          <div key={l.id} className={cartao}>
            <div className="flex items-center gap-4">
              {/* Fundo areia porque logo transparente some no branco do card. */}
              <div className="relative h-14 w-28 shrink-0 rounded-xl border border-linha bg-areia">
                <Image
                  src={l.logo}
                  alt={l.nome}
                  fill
                  sizes="112px"
                  className="object-contain p-2"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-preto">{l.nome}</p>
                <div className="mt-2 flex items-center gap-2">
                  <form action={moverLogo}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="direcao" value={-1} />
                    <button
                      type="submit"
                      disabled={i === 0}
                      aria-label="Mover para trás"
                      className={setaOrdem}
                    >
                      ←
                    </button>
                  </form>
                  <form action={moverLogo}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="direcao" value={1} />
                    <button
                      type="submit"
                      disabled={i === logos.length - 1}
                      aria-label="Mover para frente"
                      className={setaOrdem}
                    >
                      →
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <form action={salvarLogo} className="mt-5 grid gap-4">
              <input type="hidden" name="id" value={l.id} />

              <div>
                <label htmlFor={`nome-${l.id}`} className={rotulo}>
                  Nome da marca
                </label>
                <input
                  id={`nome-${l.id}`}
                  name="nome"
                  defaultValue={l.nome}
                  className={`${campo} mt-2`}
                />
              </div>

              <div>
                <label htmlFor={`logo-${l.id}`} className={rotulo}>
                  Trocar o arquivo
                </label>
                <input
                  id={`logo-${l.id}`}
                  name="logo"
                  type="file"
                  accept="image/png,image/webp"
                  className={arquivo}
                />
              </div>

              <button type="submit" className={`${botaoSecundario} justify-self-start`}>
                Salvar
              </button>
            </form>

            <form action={apagarLogo} className="mt-4 border-t border-linha pt-4">
              <input type="hidden" name="id" value={l.id} />
              <button type="submit" className={botaoDiscreto}>
                Apagar este logo
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
