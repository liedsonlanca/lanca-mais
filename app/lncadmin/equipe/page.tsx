import CampoArquivo from "@/components/admin/CampoArquivo";
import { campo, rotulo, botao } from "@/components/admin/estilos";
import { painelLiberado } from "@/lib/admin";
import Image from "next/image";
import { sql, garantirEsquema } from "@/lib/db";
import {
  criarPessoa,
  salvarPessoa,
  apagarPessoa,
  moverPessoa,
} from "./acoes";

// Sempre fresco: o painel precisa mostrar o que está no banco agora, não uma
// versão em cache de minutos atrás.
export const dynamic = "force-dynamic";

type Linha = {
  id: number;
  nome: string;
  funcao: string;
  foto: string;
};

async function carregar(): Promise<Linha[]> {
  if (!sql) return [];
  await garantirEsquema();
  return (await sql.query(
    "SELECT id, nome, funcao, foto FROM equipe ORDER BY ordem, id"
  )) as Linha[];
}


const AJUDA_FOTO =
  "JPG, PNG ou WEBP, até 8 MB, em pé (3:4). O card mostra a foto alinhada pelo topo, então deixe o rosto na parte de cima. Ela aparece em preto e branco e ganha cor quando o visitante passa o mouse, então fundos limpos funcionam melhor.";

export default async function AdminEquipe() {
  // Portão próprio, além do layout: no App Router o layout não impede a
  // página de rodar, só escolhe se a mostra. Sem isto, uma visita sem sessão
  // fazia esta tela consultar o banco e ia embora dentro do HTML da resposta.
  if (!(await painelLiberado())) return null;

  const equipe = await carregar();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-preto">Equipe</h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-preto/65">
        Aparecem na página Sobre, na seção &ldquo;Quem constrói a sua
        marca&rdquo;. Toda alteração vale no site em segundos.
      </p>

      <div className="mt-4 rounded-2xl border border-linha bg-branco p-5 text-sm leading-relaxed text-preto/70">
        <strong className="font-medium text-preto">
          Cabe quanta gente for preciso.
        </strong>{" "}
        Os retratos ficam num trilho que desliza para o lado. Quando houver
        mais gente do que cabe na tela, aparecem sozinhas duas setas para
        passar. A ordem daqui é a ordem no site, e quem está no começo é quem
        todo mundo vê primeiro.
      </div>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-branco p-5 text-sm text-preto/75">
          Banco de dados não configurado. Nada aqui será salvo.
        </p>
      )}

      {/* ---------- Nova pessoa ---------- */}
      <form
        action={criarPessoa}
        className="mt-8 rounded-3xl border border-linha bg-branco p-6 shadow-[var(--sombra-cartao)]"
      >
        <h2 className="font-medium text-preto">Acrescentar pessoa</h2>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nova-nome" className={rotulo}>
                Nome
              </label>
              <input
                id="nova-nome"
                name="nome"
                required
                placeholder="Ex: Maria Silva"
                className={`${campo} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="nova-funcao" className={rotulo}>
                Função
              </label>
              <input
                id="nova-funcao"
                name="funcao"
                placeholder="Ex: Social Media"
                className={`${campo} mt-2`}
              />
            </div>
          </div>

          <CampoArquivo
            name="foto"
            pasta="equipe"
            label="Foto"
            obrigatorio
            ajuda={AJUDA_FOTO}
          />
        </div>

        <button
          type="submit"
          className={`${botao} mt-5 bg-salmon-texto text-branco hover:bg-salmon-escuro`}
        >
          Acrescentar
        </button>
      </form>

      {/* ---------- Lista ---------- */}
      <div className="mt-8 space-y-4">
        {equipe.length === 0 && (
          <p className="rounded-2xl border border-linha bg-branco p-6 text-sm text-preto/60">
            Ninguém cadastrado. A seção não aparece na página Sobre enquanto
            estiver vazia.
          </p>
        )}

        {equipe.map((p, i) => (
          <div
            key={p.id}
            className="rounded-3xl border border-linha bg-branco p-6 shadow-[var(--sombra-cartao)]"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="numeral-fantasma text-sm text-preto/35">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="flex items-center gap-2">
                {/* Formulários separados: cada botão manda a sua própria ação,
                    sem depender de JavaScript no navegador. */}
                <form action={moverPessoa}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="direcao" value={-1} />
                  <button
                    type="submit"
                    disabled={i === 0}
                    aria-label={`Mover ${p.nome} para trás`}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-linha text-sm text-preto/60 transition-colors hover:border-salmon disabled:opacity-30"
                  >
                    ↑
                  </button>
                </form>

                <form action={moverPessoa}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="direcao" value={1} />
                  <button
                    type="submit"
                    disabled={i === equipe.length - 1}
                    aria-label={`Mover ${p.nome} para frente`}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-linha text-sm text-preto/60 transition-colors hover:border-salmon disabled:opacity-30"
                  >
                    ↓
                  </button>
                </form>
              </div>
            </div>

            <form action={salvarPessoa} className="mt-4 grid gap-4">
              <input type="hidden" name="id" value={p.id} />

              <div className="flex flex-wrap items-start gap-5">
                {/* Miniatura na mesma proporção e no mesmo cinza do site: o
                    que se confere aqui é o enquadramento, e um retrato
                    redondo ou colorido mostraria outra coisa. */}
                <Image
                  src={p.foto}
                  alt={`Foto de ${p.nome}`}
                  width={96}
                  height={128}
                  className="h-32 w-24 shrink-0 rounded-xl border border-linha object-cover object-top grayscale"
                />

                <div className="grid min-w-[240px] flex-1 gap-4">
                  <div>
                    <label htmlFor={`nome-${p.id}`} className={rotulo}>
                      Nome
                    </label>
                    <input
                      id={`nome-${p.id}`}
                      name="nome"
                      defaultValue={p.nome}
                      required
                      className={`${campo} mt-2`}
                    />
                  </div>
                  <div>
                    <label htmlFor={`funcao-${p.id}`} className={rotulo}>
                      Função
                    </label>
                    <input
                      id={`funcao-${p.id}`}
                      name="funcao"
                      defaultValue={p.funcao}
                      className={`${campo} mt-2`}
                    />
                  </div>
                </div>
              </div>

              <CampoArquivo
                name="foto"
                pasta="equipe"
                label="Trocar a foto"
                ajuda={AJUDA_FOTO}
              />

              <button
                type="submit"
                className={`${botao} justify-self-start border border-preto/20 text-preto hover:border-preto`}
              >
                Salvar
              </button>
            </form>

            {/* Fora do formulário acima: um formulário não pode conter outro. */}
            <form action={apagarPessoa} className="mt-4 border-t border-linha pt-4">
              <input type="hidden" name="id" value={p.id} />
              <button
                type="submit"
                className="text-sm text-preto/45 transition-colors duration-300 hover:text-salmon-texto"
              >
                Tirar {p.nome} da equipe
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
