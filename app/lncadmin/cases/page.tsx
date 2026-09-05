import CampoArquivo from "@/components/admin/CampoArquivo";
import { painelLiberado } from "@/lib/admin";
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
  setaOrdem,
} from "@/components/admin/estilos";
import { criarCase, salvarCase, apagarCase, moverCase } from "./acoes";

export const dynamic = "force-dynamic";

type Linha = {
  id: number;
  slug: string;
  cliente: string;
  nicho: string;
  imagem: string;
  resumo: string;
  servicos: string[];
  resultado: string;
};

async function carregar(): Promise<Linha[]> {
  if (!sql) return [];
  await garantirEsquema();
  return (await sql.query(
    "SELECT id, slug, cliente, nicho, imagem, resumo, servicos, resultado FROM cases ORDER BY ordem, id"
  )) as Linha[];
}

export default async function AdminCases() {
  // Portão próprio, além do layout: no App Router o layout não impede a
  // página de rodar, só escolhe se a mostra. Sem isto, uma visita sem sessão
  // fazia esta tela consultar o banco e ia embora dentro do HTML da resposta.
  if (!(await painelLiberado())) return null;

  const cases = await carregar();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-preto">Cases</h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-preto/65">
        Aparecem na home, em &ldquo;Marcas que mudaram de patamar&rdquo;, e na
        página de portfólio inteira.
      </p>

      <div className={`${cartao} mt-4 !p-5 text-sm leading-relaxed text-preto/70`}>
        <strong className="font-medium text-preto">Formato da imagem:</strong>{" "}
        deitada, na proporção 16:11. Ela aparece em preto e branco e ganha cor
        ao passar o mouse, então prefira fotos com bom contraste.
      </div>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-branco p-5 text-sm text-preto/75">
          Banco de dados não configurado. Nada aqui será salvo.
        </p>
      )}

      <form action={criarCase} className={`${cartao} mt-8`}>
        <h2 className="font-medium text-preto">Adicionar case</h2>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="novo-cliente" className={rotulo}>
                Cliente
              </label>
              <input
                id="novo-cliente"
                name="cliente"
                required
                className={`${campo} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="novo-nicho" className={rotulo}>
                Nicho
              </label>
              <input
                id="novo-nicho"
                name="nicho"
                placeholder="Ex: Estética"
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
              rows={3}
              className={`${campo} mt-2 resize-y`}
            />
            <p className={ajuda}>O que foi feito, em duas ou três linhas.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="novo-resultado" className={rotulo}>
                Resultado
              </label>
              <input
                id="novo-resultado"
                name="resultado"
                placeholder="Ex: +180% em alcance em 4 meses"
                className={`${campo} mt-2`}
              />
              <p className={ajuda}>Aparece destacado no rodapé do card.</p>
            </div>
            <div>
              <label htmlFor="novo-servicos" className={rotulo}>
                Serviços usados
              </label>
              <input
                id="novo-servicos"
                name="servicos"
                placeholder="Gestão de Marketing, Audiovisual"
                className={`${campo} mt-2`}
              />
              <p className={ajuda}>Separe por vírgula.</p>
            </div>
          </div>

          <CampoArquivo
            name="imagem"
            pasta="cases"
            label="Imagem"
            obrigatorio
            ajuda="Deitada, 16:11. JPG, PNG ou WEBP, até 8 MB."
          />
        </div>

        <button type="submit" className={`${botaoPrimario} mt-5`}>
          Adicionar
        </button>
      </form>

      <div className="mt-8 space-y-4">
        {cases.length === 0 && (
          <p className="rounded-2xl border border-linha bg-branco p-6 text-sm text-preto/60">
            Nenhum case cadastrado.
          </p>
        )}

        {cases.map((c, i) => (
          <div key={c.id} className={cartao}>
            <div className="flex items-start gap-4">
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-linha">
                <Image
                  src={c.imagem}
                  alt={c.cliente}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-preto">{c.cliente}</p>
                <p className="mt-1 truncate text-sm text-preto/55">
                  /portfolio — {c.slug}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <form action={moverCase}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="direcao" value={-1} />
                    <button
                      type="submit"
                      disabled={i === 0}
                      aria-label="Mover para cima"
                      className={setaOrdem}
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moverCase}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="direcao" value={1} />
                    <button
                      type="submit"
                      disabled={i === cases.length - 1}
                      aria-label="Mover para baixo"
                      className={setaOrdem}
                    >
                      ↓
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <form action={salvarCase} className="mt-5 grid gap-4">
              <input type="hidden" name="id" value={c.id} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`cliente-${c.id}`} className={rotulo}>
                    Cliente
                  </label>
                  <input
                    id={`cliente-${c.id}`}
                    name="cliente"
                    defaultValue={c.cliente}
                    className={`${campo} mt-2`}
                  />
                </div>
                <div>
                  <label htmlFor={`nicho-${c.id}`} className={rotulo}>
                    Nicho
                  </label>
                  <input
                    id={`nicho-${c.id}`}
                    name="nicho"
                    defaultValue={c.nicho}
                    className={`${campo} mt-2`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`resumo-${c.id}`} className={rotulo}>
                  Resumo
                </label>
                <textarea
                  id={`resumo-${c.id}`}
                  name="resumo"
                  rows={3}
                  defaultValue={c.resumo}
                  className={`${campo} mt-2 resize-y`}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`resultado-${c.id}`} className={rotulo}>
                    Resultado
                  </label>
                  <input
                    id={`resultado-${c.id}`}
                    name="resultado"
                    defaultValue={c.resultado}
                    className={`${campo} mt-2`}
                  />
                </div>
                <div>
                  <label htmlFor={`servicos-${c.id}`} className={rotulo}>
                    Serviços usados
                  </label>
                  <input
                    id={`servicos-${c.id}`}
                    name="servicos"
                    defaultValue={(c.servicos ?? []).join(", ")}
                    className={`${campo} mt-2`}
                  />
                </div>
              </div>

              <CampoArquivo
                name="imagem"
                pasta="cases"
                label="Trocar a imagem"
              />

              <button type="submit" className={`${botaoSecundario} justify-self-start`}>
                Salvar
              </button>
            </form>

            <form action={apagarCase} className="mt-4 border-t border-linha pt-4">
              <input type="hidden" name="id" value={c.id} />
              <button type="submit" className={botaoDiscreto}>
                Apagar este case
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
