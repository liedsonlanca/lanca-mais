import Link from "next/link";
import { notFound } from "next/navigation";
import { painelLiberado } from "@/lib/admin";
import { sql } from "@/lib/db";
import { lerImagens } from "@/lib/conteudo";
import { GRUPOS, posicoesDoGrupo, imagem } from "@/lib/imagens";
import CampoImagem from "@/components/admin/CampoImagem";
import { campo, rotulo, botaoSecundario, botaoDiscreto } from "@/components/admin/estilos";
import { salvarImagem, restaurarImagem } from "../acoes";

export const dynamic = "force-dynamic";

/** Só os grupos do catálogo têm página. Nome inventado na URL cai no 404. */
export function generateStaticParams() {
  return GRUPOS.map((grupo) => ({ grupo: grupo.id }));
}

export default async function AdminGrupoDeImagens({
  params,
}: {
  params: Promise<{ grupo: string }>;
}) {
  if (!(await painelLiberado())) return null;

  const { grupo: id } = await params;
  const grupo = GRUPOS.find((g) => g.id === id);
  if (!grupo) notFound();

  const posicoes = posicoesDoGrupo(id);
  const imagens = await lerImagens();

  // Quais posições já foram trocadas. Serve só para decidir se o botão de
  // restaurar aparece: oferecer "voltar ao padrão" numa posição que nunca
  // saiu do padrão não faz nada e confunde.
  const personalizadas = new Set<string>();
  if (sql) {
    try {
      const linhas = (await sql.query(
        "SELECT chave FROM imagens WHERE chave = ANY($1)",
        [posicoes.map((p) => p.chave)]
      )) as Array<{ chave: string }>;
      for (const linha of linhas) personalizadas.add(linha.chave);
    } catch {
      // A tela abre sem isso; no pior caso o botão de restaurar não aparece.
    }
  }

  return (
    <div>
      <Link href="/lncadmin/imagens" className={botaoDiscreto}>
        ← Todas as imagens
      </Link>

      <h1 className="font-heading mt-4 text-3xl font-semibold text-tinta">
        {grupo.rotulo}
      </h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-tinta/65">
        {grupo.descricao}
      </p>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-cartao p-5 text-sm text-tinta/75">
          Banco de dados não configurado. Nada aqui será salvo.
        </p>
      )}

      <div className="mt-8 space-y-5">
        {posicoes.map((posicao) => {
          const atual = imagem(imagens, posicao.chave);
          const trocada = personalizadas.has(posicao.chave);

          return (
            <div
              key={posicao.chave}
              className="rounded-3xl border border-contorno bg-cartao p-6 shadow-[var(--sombra-cartao)]"
            >
              <form action={salvarImagem}>
                <input type="hidden" name="chave" value={posicao.chave} />

                {/* A moldura fica numa coluna de largura fixa, e não metade da
                    tela: as proporções vão de 21 por 9 a 4 por 5, e numa
                    coluna elástica a chamada final viraria uma tira fininha
                    enquanto o arco ficaria gigante. */}
                <div className="grid gap-6 lg:grid-cols-[minmax(0,300px)_1fr]">
                  <CampoImagem
                    name="arquivo"
                    atual={atual.src}
                    moldura={posicao.moldura}
                    label="Trocar a imagem"
                    ajuda={posicao.ajuda}
                  />

                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="text-lg font-semibold text-tinta">
                        {posicao.rotulo}
                      </h2>
                      {trocada && (
                        <span className="rounded-full bg-salmon/15 px-2.5 py-0.5 text-xs font-medium text-destaque">
                          trocada
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-tinta/62">
                      {posicao.onde}
                    </p>

                    {/* Posição decorativa não pede descrição: ela entra como
                        textura sob um véu, e leitor de tela a pula. Pedir um
                        texto aqui seria pedir algo que ninguém vai ouvir. */}
                    {posicao.decorativa ? (
                      <p className="mt-6 rounded-xl border border-contorno bg-fundo-alt px-4 py-3 text-xs leading-relaxed text-tinta/60">
                        Esta imagem é decorativa: entra como textura, bem
                        escurecida, atrás de um texto. Quem usa leitor de tela
                        não a ouve, então ela não precisa de descrição.
                      </p>
                    ) : (
                      <div className="mt-6">
                        <label
                          htmlFor={`alt-${posicao.chave}`}
                          className={rotulo}
                        >
                          Descrição da imagem
                        </label>
                        <input
                          id={`alt-${posicao.chave}`}
                          name="alt"
                          defaultValue={atual.alt}
                          placeholder="Ex: equipe da LANÇA+ reunida em estúdio"
                          className={`${campo} mt-2`}
                        />
                        <p className="mt-2 text-xs leading-relaxed text-tinta/50">
                          É o que uma pessoa cega ouve no lugar da imagem, e o
                          que o Google lê. Descreva o que se vê, em uma frase
                          curta, sem começar com “imagem de”.
                        </p>
                      </div>
                    )}

                    <button type="submit" className={`${botaoSecundario} mt-6`}>
                      Salvar
                    </button>
                  </div>
                </div>
              </form>

              {/* Fora do formulário acima: um formulário não pode conter
                  outro. */}
              {trocada && (
                <form
                  action={restaurarImagem}
                  className="mt-5 border-t border-contorno pt-4"
                >
                  <input type="hidden" name="chave" value={posicao.chave} />
                  <button type="submit" className={botaoDiscreto}>
                    Voltar para a imagem original
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
