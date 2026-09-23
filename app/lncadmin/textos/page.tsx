import Link from "next/link";
import { painelLiberado } from "@/lib/admin";
import { sql } from "@/lib/db";
import { GRUPOS, camposDoGrupo } from "@/lib/textos";

export const dynamic = "force-dynamic";

// O índice dos textos do site.
//
// São mais de quinhentos campos entre a home e os oito serviços. Numa tela só
// seria uma rolagem sem fim, e cada caixa de texto carrega o próprio conteúdo:
// a página levaria segundos para aparecer e a pessoa não acharia nada.
//
// Aqui ficam os grupos, com a contagem do que há dentro e quantos já foram
// reescritos. A edição acontece uma tela adiante.

export default async function AdminTextos() {
  if (!(await painelLiberado())) return null;

  // Quantos campos de cada grupo já foram reescritos. É o que diz, de relance,
  // onde a agência já mexeu e onde o texto ainda é o que a equipe escreveu.
  const reescritos = new Map<string, number>();
  if (sql) {
    try {
      const linhas = (await sql.query("SELECT chave FROM textos")) as Array<{
        chave: string;
      }>;
      for (const { chave } of linhas) {
        for (const grupo of GRUPOS) {
          if (camposDoGrupo(grupo.id).some((c) => c.chave === chave)) {
            reescritos.set(grupo.id, (reescritos.get(grupo.id) ?? 0) + 1);
            break;
          }
        }
      }
    } catch {
      // A tela abre sem isso; no pior caso a contagem não aparece.
    }
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-tinta">
        Textos do site
      </h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-tinta/65">
        Toda frase da página inicial e das páginas de serviço: títulos,
        chamadas, entregáveis, diferenciais, etapas do processo e as dúvidas do
        FAQ. Alterou aqui, valeu no site em segundos.
      </p>

      <div className="mt-4 rounded-2xl border border-contorno bg-cartao p-5 text-sm leading-relaxed text-tinta/70">
        <strong className="font-medium text-tinta">
          Nada aqui é obrigatório.
        </strong>{" "}
        O texto que já está no ar continua valendo enquanto você não reescrever.
        Cada campo tem um botão para voltar ao original, e campos de lista usam
        uma frase por linha: apagar a linha tira o item, escrever uma nova
        acrescenta.
      </div>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-cartao p-5 text-sm leading-relaxed text-tinta/75">
          Banco de dados não configurado. Os textos originais continuam no ar,
          mas nada que você reescrever aqui será salvo.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {GRUPOS.map((grupo) => {
          const total = camposDoGrupo(grupo.id).length;
          const mexidos = reescritos.get(grupo.id) ?? 0;

          return (
            <Link
              key={grupo.id}
              href={`/lncadmin/textos/${grupo.id}`}
              className="rounded-3xl border border-contorno bg-cartao p-6 shadow-[var(--sombra-cartao)] transition-all duration-300 hover:-translate-y-0.5 hover:border-salmon/50"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-semibold text-tinta">
                  {grupo.rotulo}
                </h2>
                <span className="numeral-fantasma text-sm text-tinta/35">
                  {total}
                </span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-tinta/62">
                {grupo.descricao}
              </p>

              {mexidos > 0 && (
                <p className="mt-4 inline-block rounded-full bg-salmon/15 px-3 py-1 text-xs font-medium text-destaque">
                  {mexidos === 1
                    ? "1 texto reescrito"
                    : `${mexidos} textos reescritos`}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
