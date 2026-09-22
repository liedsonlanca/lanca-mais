import { painelLiberado } from "@/lib/admin";
import { sql } from "@/lib/db";
import { lerDepoimentosVideo } from "@/lib/conteudo";
import CampoArquivo from "@/components/admin/CampoArquivo";
import CampoImagem from "@/components/admin/CampoImagem";
import {
  campo,
  rotulo,
  botaoPrimario,
  botaoSecundario,
  botaoDiscreto,
  setaOrdem,
} from "@/components/admin/estilos";
import {
  criarDepoimentoVideo,
  salvarDepoimentoVideo,
  apagarDepoimentoVideo,
  moverDepoimentoVideo,
} from "./acoes";

export const dynamic = "force-dynamic";

/**
 * A moldura da prévia da capa: a forma do vídeo, e não a do card.
 *
 * A capa é o primeiro quadro, então ela precisa ser conferida no formato em
 * que o vídeo foi gravado. O card da home é mais largo e encaixa esse
 * retângulo em pé no meio dele, sem cortar nada.
 */
const MOLDURA_CAPA = { proporcao: "4 / 5", raio: "1.25rem" } as const;

const AJUDA_VIDEO =
  "MP4 em pé, na proporção 4 por 5 (por exemplo 1080 × 1350). O card na home é deitado, e o vídeo entra inteiro no meio dele, sem corte nenhum: o que sobra nas laterais é a capa desfocada. Filmado em 9:16 também funciona, só aparece mais estreito. Deixe o áudio limpo — é a fala que convence, e o visitante só ouve se clicar.";

const AJUDA_CAPA =
  "O quadro parado que aparece antes de alguém clicar em tocar. Sem ela o navegador mostra o primeiro quadro do vídeo, que costuma ser a pessoa de olho fechado ou o corte da claquete. Vale enviar: é esta imagem que decide se alguém aperta o play.";

export default async function AdminDepoimentosVideo() {
  // Portão próprio, além do layout: no App Router o layout não impede a
  // página de rodar, só escolhe se a mostra.
  if (!(await painelLiberado())) return null;

  const itens = await lerDepoimentosVideo();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-tinta">
        Depoimentos em vídeo
      </h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-tinta/65">
        Aparecem na página inicial, ao lado do bloco &ldquo;Bom negócio,
        presença mediana&rdquo;. É o lugar em que o visitante acabou de se
        reconhecer no problema, e a fala de um cliente vale mais ali do que
        em qualquer outro ponto da página.
      </p>

      <div className="mt-4 rounded-2xl border border-contorno bg-cartao p-5 text-sm leading-relaxed text-tinta/70">
        <strong className="font-medium text-tinta">
          Nenhum vídeo começa a tocar sozinho.
        </strong>{" "}
        Um depoimento é alguém falando, e som começando sozinho faz a pessoa
        fechar a aba. O card mostra a capa, o nome e o cargo, e só toca quando
        o visitante clica. Ao terminar, emenda no próximo da fila.{" "}
        <strong className="font-medium text-tinta">
          Enquanto não houver nenhum vídeo aqui
        </strong>
        , o espaço mostra a foto de reserva, que você troca em Imagens do site
        → Página inicial.
      </div>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-cartao p-5 text-sm text-tinta/75">
          Banco de dados não configurado. Nada aqui será salvo.
        </p>
      )}

      {/* ---------- Novo depoimento ---------- */}
      <form
        action={criarDepoimentoVideo}
        className="mt-8 rounded-3xl border border-contorno bg-cartao p-6 shadow-[var(--sombra-cartao)]"
      >
        <h2 className="font-medium text-tinta">Acrescentar depoimento</h2>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr]">
          <CampoImagem
            name="capa"
            atual=""
            moldura={MOLDURA_CAPA}
            label="Capa do vídeo"
            ajuda={AJUDA_CAPA}
            pasta="depoimentos-video"
          />

          <div className="grid content-start gap-4">
            <CampoArquivo
              name="video"
              pasta="depoimentos-video"
              aceita="video"
              label="Vídeo"
              obrigatorio
              ajuda={AJUDA_VIDEO}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="novo-nome" className={rotulo}>
                  Nome de quem fala
                </label>
                <input
                  id="novo-nome"
                  name="nome"
                  placeholder="Ex: Dra. Ana Ribeiro"
                  className={`${campo} mt-2`}
                />
              </div>
              <div>
                <label htmlFor="novo-cargo" className={rotulo}>
                  Cargo ou negócio
                </label>
                <input
                  id="novo-cargo"
                  name="cargo"
                  placeholder="Ex: Odontologia, Cajazeiras"
                  className={`${campo} mt-2`}
                />
              </div>
            </div>

            <button type="submit" className={`${botaoPrimario} justify-self-start`}>
              Acrescentar
            </button>
          </div>
        </div>
      </form>

      {/* ---------- Lista ---------- */}
      <div className="mt-8 space-y-4">
        {itens.length === 0 && (
          <p className="rounded-2xl border border-contorno bg-cartao p-6 text-sm leading-relaxed text-tinta/60">
            Nenhum depoimento em vídeo cadastrado. A página inicial está
            mostrando a foto de reserva nesse espaço.
          </p>
        )}

        {itens.map((item, i) => (
          <div
            key={item.id}
            className="rounded-3xl border border-contorno bg-cartao p-6 shadow-[var(--sombra-cartao)]"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="numeral-fantasma text-sm text-tinta/35">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Formulários separados: cada botão manda a sua própria ação,
                  sem depender de JavaScript no navegador. */}
              <div className="flex items-center gap-2">
                <form action={moverDepoimentoVideo}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="direcao" value={-1} />
                  <button
                    type="submit"
                    disabled={i === 0}
                    aria-label="Mover para trás"
                    className={setaOrdem}
                  >
                    ↑
                  </button>
                </form>
                <form action={moverDepoimentoVideo}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="direcao" value={1} />
                  <button
                    type="submit"
                    disabled={i === itens.length - 1}
                    aria-label="Mover para frente"
                    className={setaOrdem}
                  >
                    ↓
                  </button>
                </form>
              </div>
            </div>

            <form action={salvarDepoimentoVideo} className="mt-4">
              <input type="hidden" name="id" value={item.id} />

              <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr]">
                <div>
                  {/* O vídeo de verdade, na caixa de verdade: a mesma
                      forma deitada do card na home, com o arquivo encaixado
                      inteiro no meio. É aqui que se vê como ele vai aparecer
                      de fato, coisa que abrir o arquivo no computador não
                      mostra. */}
                  <video
                    src={item.video}
                    poster={item.capa ?? undefined}
                    controls
                    preload="metadata"
                    className="aspect-[7/6] w-full rounded-[1.25rem] border border-contorno bg-preto object-contain"
                  />

                  <div className="mt-4">
                    <CampoArquivo
                      name="video"
                      pasta="depoimentos-video"
                      aceita="video"
                      label="Trocar o vídeo"
                      ajuda={AJUDA_VIDEO}
                    />
                  </div>
                </div>

                <div className="grid content-start gap-4">
                  <CampoImagem
                    name="capa"
                    atual={item.capa ?? ""}
                    moldura={MOLDURA_CAPA}
                    label="Trocar a capa"
                    ajuda={AJUDA_CAPA}
                    pasta="depoimentos-video"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`nome-${item.id}`} className={rotulo}>
                        Nome de quem fala
                      </label>
                      <input
                        id={`nome-${item.id}`}
                        name="nome"
                        defaultValue={item.nome}
                        className={`${campo} mt-2`}
                      />
                    </div>
                    <div>
                      <label htmlFor={`cargo-${item.id}`} className={rotulo}>
                        Cargo ou negócio
                      </label>
                      <input
                        id={`cargo-${item.id}`}
                        name="cargo"
                        defaultValue={item.cargo}
                        className={`${campo} mt-2`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`${botaoSecundario} justify-self-start`}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>

            {/* Fora do formulário acima: um formulário não pode conter outro. */}
            <form
              action={apagarDepoimentoVideo}
              className="mt-4 border-t border-contorno pt-4"
            >
              <input type="hidden" name="id" value={item.id} />
              <button type="submit" className={botaoDiscreto}>
                Tirar este depoimento do site
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
