import Link from "next/link";
import { painelLiberado } from "@/lib/admin";
import { sql } from "@/lib/db";
import { lerImagens } from "@/lib/conteudo";
import { GRUPOS, posicoesDoGrupo, imagem } from "@/lib/imagens";

export const dynamic = "force-dynamic";

// O índice das imagens fixas do site.
//
// São cinquenta posições no total, entre os blocos da home, a página Sobre, a
// marca, a tela de espera e as cinco fotos do arco de cada um dos oito
// serviços. Numa página só, isso seria uma rolagem infinita de molduras — e
// cada moldura carrega uma imagem, então a tela levaria meio minuto para
// aparecer.
//
// Então aqui ficam só os grupos, com uma fita de miniaturas que diz o que tem
// dentro, e a edição acontece uma tela adiante.

export default async function AdminImagens() {
  // Portão próprio, além do layout: no App Router o layout não impede a
  // página de rodar, só escolhe se a mostra.
  if (!(await painelLiberado())) return null;

  const imagens = await lerImagens();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-tinta">
        Imagens do site
      </h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-tinta/65">
        Toda imagem que fica sempre no mesmo lugar do site: os cards de
        serviço, os blocos grandes da página inicial, a imagem da página Sobre,
        o logo e o leque de fotos que abre cada página de serviço.
      </p>

      <div className="mt-4 rounded-2xl border border-contorno bg-cartao p-5 text-sm leading-relaxed text-tinta/70">
        <strong className="font-medium text-tinta">
          Cada posição mostra como a imagem vai ficar de verdade.
        </strong>{" "}
        A moldura da prévia tem a proporção, o corte e o escurecimento do lugar
        onde ela aparece no site. Escolha o arquivo, confira na moldura e só
        então clique em Salvar. Enquanto você não salvar, nada muda no site.
      </div>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-cartao p-5 text-sm leading-relaxed text-tinta/75">
          Banco de dados não configurado. As imagens padrão continuam no ar,
          mas nada que você trocar aqui será salvo.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {GRUPOS.map((grupo) => {
          const posicoes = posicoesDoGrupo(grupo.id);

          return (
            <Link
              key={grupo.id}
              href={`/lncadmin/imagens/${grupo.id}`}
              className="group rounded-3xl border border-contorno bg-cartao p-6 shadow-[var(--sombra-cartao)] transition-all duration-300 hover:-translate-y-0.5 hover:border-salmon/50"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-semibold text-tinta">
                  {grupo.rotulo}
                </h2>
                <span className="numeral-fantasma text-sm text-tinta/35">
                  {posicoes.length}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-tinta/62">
                {grupo.descricao}
              </p>

              {/* A fita de miniaturas. Diz o que tem no grupo sem obrigar a
                  entrar nele, que é o que torna um índice útil. */}
              <div className="mt-5 flex gap-2">
                {posicoes.slice(0, 5).map((posicao) => {
                  const atual = imagem(imagens, posicao.chave);
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={posicao.chave}
                      src={atual.src}
                      alt=""
                      className="h-14 w-11 rounded-lg border border-contorno bg-fundo-alt object-cover object-top"
                    />
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
