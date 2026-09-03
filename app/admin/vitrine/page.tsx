import CampoArquivo from "@/components/admin/CampoArquivo";
import SeletorTipoPeca from "@/components/admin/SeletorTipoPeca";
import Image from "next/image";
import { sql, garantirEsquema } from "@/lib/db";
import { blobConfigurado } from "@/lib/upload";
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
import {
  criarPeca,
  salvarPeca,
  apagarPeca,
  moverPeca,
  posicionarPeca,
} from "./acoes";

export const dynamic = "force-dynamic";

type Linha = {
  id: number;
  src: string;
  alt: string;
  tipo: string;
  video: string | null;
  legenda: string | null;
};

async function carregar(): Promise<Linha[]> {
  if (!sql) return [];
  await garantirEsquema();
  return (await sql.query(
    "SELECT id, src, alt, tipo, video, legenda FROM vitrine ORDER BY ordem, id"
  )) as Linha[];
}

export default async function AdminVitrine() {
  const pecas = await carregar();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-preto">
        Nosso trabalho
      </h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-preto/65">
        O trilho que desliza sozinho na home. A ordem aqui é a ordem lá, e
        clicar numa peça no site abre a versão ampliada.
      </p>

      <div className={`${cartao} mt-4 !p-5 text-sm leading-relaxed text-preto/70`}>
        <strong className="font-medium text-preto">Formato:</strong> as peças
        aparecem em pé, na proporção 4:5 do feed. Uma imagem quadrada ou
        deitada vai ser cortada em cima e embaixo. O vídeo toca sozinho e sem
        som no trilho, e ganha o som ao ser aberto — por isso vale começar por
        uma imagem forte no primeiro segundo.
      </div>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-branco p-5 text-sm text-preto/75">
          Banco de dados não configurado. Nada aqui será salvo.
        </p>
      )}

      {!blobConfigurado && (
        <p className="mt-4 rounded-2xl border border-salmon/40 bg-branco p-5 text-sm leading-relaxed text-preto/75">
          Armazenamento de arquivos não configurado. Falta o
          <span className="text-salmon-texto"> BLOB_READ_WRITE_TOKEN</span> no
          projeto da Vercel, então o envio de imagem e vídeo vai falhar.
        </p>
      )}

      {/* ---------- Nova peça ---------- */}
      <form action={criarPeca} className={`${cartao} mt-8`}>
        <h2 className="font-medium text-preto">Adicionar peça</h2>

        <div className="mt-5 grid gap-4">
          <SeletorTipoPeca />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nova-legenda" className={rotulo}>
                Legenda
              </label>
              <input
                id="nova-legenda"
                name="legenda"
                placeholder="Ex: Campanha de verão, Clínica X"
                className={`${campo} mt-2`}
              />
              <p className={ajuda}>Aparece ao abrir a peça ampliada.</p>
            </div>
            <div>
              <label htmlFor="novo-alt" className={rotulo}>
                Descrição da imagem
              </label>
              <input
                id="novo-alt"
                name="alt"
                placeholder="O que aparece na imagem"
                className={`${campo} mt-2`}
              />
              <p className={ajuda}>
                Para quem usa leitor de tela e para o Google.
              </p>
            </div>
          </div>
        </div>

        <button type="submit" className={`${botaoPrimario} mt-5`}>
          Adicionar
        </button>
      </form>

      {/* ---------- Lista ---------- */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {pecas.length === 0 && (
          <p className="rounded-2xl border border-linha bg-branco p-6 text-sm text-preto/60 sm:col-span-2">
            Nenhuma peça cadastrada.
          </p>
        )}

        {pecas.map((p, i) => (
          <div key={p.id} className={cartao}>
            <div className="flex items-start gap-4">
              {/* Peça de vídeo não tem imagem: a prévia é o próprio vídeo,
                  parado no primeiro quadro. */}
              <div className="relative h-28 w-[90px] shrink-0 overflow-hidden rounded-xl border border-linha bg-areia">
                {p.video ? (
                  <video
                    src={p.video}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes="90px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="numeral-fantasma text-sm text-preto/35">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {/* O tipo aparece aqui para a alternação vídeo/imagem ser
                      visível de relance enquanto se monta a sequência. */}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.video
                        ? "bg-salmon/15 text-salmon-texto"
                        : "border border-linha text-preto/45"
                    }`}
                  >
                    {p.video ? "vídeo" : "imagem"}
                  </span>
                </span>

                <p className="mt-1 truncate text-sm text-preto/70">
                  {p.legenda || p.alt}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={moverPeca}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="direcao" value={-1} />
                    <button
                      type="submit"
                      disabled={i === 0}
                      aria-label="Mover uma posição para trás"
                      className={setaOrdem}
                    >
                      ←
                    </button>
                  </form>
                  <form action={moverPeca}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="direcao" value={1} />
                    <button
                      type="submit"
                      disabled={i === pecas.length - 1}
                      aria-label="Mover uma posição para frente"
                      className={setaOrdem}
                    >
                      →
                    </button>
                  </form>

                  {/* Ir direto para uma posição: com muitas peças, montar a
                      sequência só com as setas seria um clique por casa. */}
                  <form action={posicionarPeca} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <label htmlFor={`posicao-${p.id}`} className="sr-only">
                      Nova posição desta peça
                    </label>
                    <input
                      id={`posicao-${p.id}`}
                      name="posicao"
                      type="number"
                      min={1}
                      max={pecas.length}
                      defaultValue={i + 1}
                      className="w-16 rounded-full border border-linha bg-branco px-3 py-1 text-center text-sm text-preto outline-none focus:border-salmon"
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-linha px-3 py-1 text-sm text-preto/60 transition-colors hover:border-salmon hover:text-salmon-texto"
                    >
                      Ir
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <form action={salvarPeca} className="mt-5 grid gap-4">
              <input type="hidden" name="id" value={p.id} />

              <div>
                <label htmlFor={`legenda-${p.id}`} className={rotulo}>
                  Legenda
                </label>
                <input
                  id={`legenda-${p.id}`}
                  name="legenda"
                  defaultValue={p.legenda ?? ""}
                  className={`${campo} mt-2`}
                />
              </div>

              <div>
                <label htmlFor={`alt-${p.id}`} className={rotulo}>
                  Descrição da imagem
                </label>
                <input
                  id={`alt-${p.id}`}
                  name="alt"
                  defaultValue={p.alt}
                  className={`${campo} mt-2`}
                />
              </div>

              {/* Só o campo do tipo que a peça já é: trocar imagem por vídeo
                  seria outra peça, e é mais claro apagar e criar de novo. */}
              {p.video ? (
                <CampoArquivo
                  name="video"
                  pasta="vitrine"
                  aceita="video"
                  label="Trocar o vídeo"
                />
              ) : (
                <CampoArquivo
                  name="capa"
                  pasta="vitrine"
                  label="Trocar a imagem"
                />
              )}

              <button type="submit" className={`${botaoSecundario} justify-self-start`}>
                Salvar
              </button>
            </form>

            <form action={apagarPeca} className="mt-4 border-t border-linha pt-4">
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className={botaoDiscreto}>
                Apagar esta peça
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
