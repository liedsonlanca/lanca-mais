import { sql } from "@/lib/db";
import { painelLiberado } from "@/lib/admin";
import { lerConfigSite, siteAberto, type ModoSite } from "@/lib/modo-site";
import {
  campo,
  rotulo,
  ajuda,
  botaoPrimario,
  botaoDiscreto,
  cartao,
} from "@/components/admin/estilos";
import { salvarModo, salvarLancamento, limparLancamento } from "./acoes";

export const dynamic = "force-dynamic";

const MODOS: Array<{ valor: ModoSite; titulo: string; descricao: string }> = [
  {
    valor: "publico",
    titulo: "Site no ar",
    descricao: "Qualquer pessoa vê o site completo.",
  },
  {
    valor: "em-breve",
    titulo: "Em breve",
    descricao:
      "Visitantes veem a página de lançamento. Você entra com a senha do site.",
  },
  {
    valor: "manutencao",
    titulo: "Em manutenção",
    descricao:
      "Aviso curto de que o site volta logo, com os canais de contato.",
  },
];

/** Separa a data ISO guardada nos dois campos do formulário. */
function partesDoLancamento(iso: string | null) {
  if (!iso) return { data: "", hora: "" };
  const casamento = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return casamento
    ? { data: casamento[1], hora: casamento[2] }
    : { data: "", hora: "" };
}

export default async function AdminSite() {
  // Portão próprio, além do layout: no App Router o layout não impede a
  // página de rodar, só escolhe se a mostra. Sem isto, uma visita sem sessão
  // fazia esta tela consultar o banco e ia embora dentro do HTML da resposta.
  if (!(await painelLiberado())) return null;

  const config = await lerConfigSite();
  const aberto = siteAberto(config);
  const { data, hora } = partesDoLancamento(config.lancamento);

  const jaLancou =
    config.modo === "em-breve" &&
    Boolean(config.lancamento) &&
    Date.parse(config.lancamento as string) <= Date.now();

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-3xl font-semibold text-preto">
        Estado do site
      </h1>
      <p className="mt-2 leading-relaxed text-preto/65">
        Decide o que um visitante vê ao abrir o endereço. Você, com a senha do
        site, atravessa qualquer um dos estados para conferir o site fechado.
      </p>

      {!sql && (
        <p className="mt-6 rounded-2xl border border-salmon/40 bg-branco p-5 text-sm text-preto/75">
          Banco de dados não configurado. Nada aqui será salvo.
        </p>
      )}

      {/* Situação atual, em uma frase. */}
      <div
        className={`mt-6 rounded-2xl border p-5 ${
          aberto ? "border-salmon/50 bg-salmon/10" : "border-linha bg-branco"
        }`}
      >
        <p className="font-medium text-preto">
          {aberto ? "O site está aberto ao público." : "O site está fechado."}
        </p>
        {jaLancou && (
          <p className="mt-2 text-sm leading-relaxed text-preto/70">
            A contagem chegou ao fim e o site abriu sozinho. Para voltar a
            fechá-lo, mude o estado abaixo ou marque uma data nova.
          </p>
        )}
      </div>

      {/* ---------- Estado ---------- */}
      <form action={salvarModo} className={`${cartao} mt-8`}>
        <h2 className="font-medium text-preto">O que os visitantes veem</h2>

        <div className="mt-5 grid gap-3">
          {MODOS.map((m) => (
            <label
              key={m.valor}
              className={`flex cursor-pointer gap-4 rounded-2xl border p-4 transition-colors duration-300 ${
                config.modo === m.valor
                  ? "border-salmon bg-salmon/10"
                  : "border-linha bg-branco hover:border-salmon/40"
              }`}
            >
              <input
                type="radio"
                name="modo"
                value={m.valor}
                defaultChecked={config.modo === m.valor}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-salmon)]"
              />
              <span>
                <span className="block font-medium text-preto">{m.titulo}</span>
                <span className="mt-1 block text-sm leading-relaxed text-preto/62">
                  {m.descricao}
                </span>
              </span>
            </label>
          ))}
        </div>

        <button type="submit" className={`${botaoPrimario} mt-5`}>
          Salvar estado
        </button>

        <p className={ajuda}>
          A mudança vale em até 30 segundos. O site guarda essa resposta por
          pouco tempo para não consultar o banco a cada visita.
        </p>
      </form>

      {/* ---------- Contagem ---------- */}
      <form action={salvarLancamento} className={`${cartao} mt-6`}>
        <h2 className="font-medium text-preto">Contagem para o lançamento</h2>
        <p className="mt-2 text-sm leading-relaxed text-preto/65">
          Marque o dia e a hora. A contagem aparece na página Em breve e,
          quando chega a zero, <strong className="font-medium text-preto">o
          site abre sozinho</strong> — mesmo de madrugada, sem ninguém precisar
          entrar aqui.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_160px]">
          <div>
            <label htmlFor="data" className={rotulo}>
              Dia
            </label>
            <input
              id="data"
              name="data"
              type="date"
              defaultValue={data}
              className={`${campo} mt-2`}
            />
          </div>
          <div>
            <label htmlFor="hora" className={rotulo}>
              Hora
            </label>
            <input
              id="hora"
              name="hora"
              type="time"
              defaultValue={hora || "09:00"}
              className={`${campo} mt-2`}
            />
          </div>
        </div>

        <p className={ajuda}>
          Horário de Brasília. Fixamos o fuso de propósito: sem isso, alterar a
          data de um celular configurado em outro fuso moveria o lançamento sem
          ninguém perceber.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="submit" className={botaoPrimario}>
            Salvar contagem
          </button>

          {config.lancamento && (
            <span className="text-sm text-preto/60">
              Marcado para{" "}
              <strong className="font-medium text-preto">
                {new Date(config.lancamento).toLocaleString("pt-BR", {
                  dateStyle: "long",
                  timeStyle: "short",
                  timeZone: "America/Sao_Paulo",
                })}
              </strong>
            </span>
          )}
        </div>
      </form>

      {config.lancamento && (
        <form action={limparLancamento} className="mt-4">
          <button type="submit" className={botaoDiscreto}>
            Remover a contagem e deixar a página sem data
          </button>
        </form>
      )}
    </div>
  );
}
