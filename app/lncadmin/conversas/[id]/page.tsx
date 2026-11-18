import Link from "next/link";
import { painelLiberado } from "@/lib/admin";
import { lerConversa } from "@/lib/conversas";
import { equipeNoExpediente, quandoAEquipeVolta } from "@/lib/expediente";
import { botaoPrimario } from "@/components/admin/estilos";
import CampoDeResposta from "@/components/admin/CampoDeResposta";
import RespostasProntas from "@/components/admin/RespostasProntas";
import {
  responderNoChat,
  encerrarConversa,
  devolverAoAssistente,
} from "../acoes";

export const dynamic = "force-dynamic";

// Uma conversa aberta: o fio no meio, os dados à direita.
//
// ---------- Por que o campo de resposta nem sempre existe ----------
//
// Ele só aparece quando a conversa está com a equipe. Encerrada, ela acabou;
// devolvida ao assistente, quem responde é ele. Nos dois casos, um campo de
// texto convidando a escrever seria convite para mandar mensagem numa
// conversa que não é mais sua — e quem recebe não entenderia de onde veio.
//
// Deixar o campo e recusar o envio depois seria pior: a pessoa escreve o
// texto inteiro para descobrir no fim.

const CARTAO = "rounded-2xl border border-contorno bg-cartao";

const AUTORES = {
  cliente: { rotulo: "Visitante", classe: "text-tinta" },
  assistente: { rotulo: "Assistente", classe: "text-tinta/55" },
  equipe: { rotulo: "Equipe LANÇA+", classe: "text-destaque" },
} as const;

const ESTADOS = {
  equipe: { rotulo: "Esperando você", classe: "text-destaque" },
  assistente: { rotulo: "Com o assistente", classe: "text-tinta/55" },
  fechada: { rotulo: "Encerrada", classe: "text-tinta/40" },
} as const;

function horaLegivel(iso: string) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Dado({
  rotulo,
  valor,
  href,
}: {
  rotulo: string;
  valor: string;
  href?: string;
}) {
  if (!valor) return null;

  return (
    <div>
      <p className="text-[0.7rem] uppercase tracking-wide text-tinta/35">
        {rotulo}
      </p>
      {href ? (
        <a
          href={href}
          className="mt-0.5 block break-words text-sm text-tinta/75 transition-colors duration-300 hover:text-tinta"
        >
          {valor}
        </a>
      ) : (
        <p className="mt-0.5 break-words text-sm text-tinta/75">{valor}</p>
      )}
    </div>
  );
}

export default async function AdminConversa({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await painelLiberado())) return null;

  const { id } = await params;
  const dados = await lerConversa(Number(id));

  if (!dados) {
    return (
      <div className={`${CARTAO} p-5 text-sm text-tinta/60`}>
        Essa conversa não existe mais.{" "}
        <Link href="/lncadmin/conversas" className="text-destaque">
          Voltar
        </Link>
      </div>
    );
  }

  const { conversa, mensagens } = dados;
  const estado = ESTADOS[conversa.estado];
  const minha = conversa.estado === "equipe";

  const soDigitos = conversa.contato.replace(/\D/g, "");
  const temTelefone = soDigitos.length >= 10;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_17rem]">
      {/* ---------------- O fio ---------------- */}
      <div className="min-w-0">
        <div className={`${CARTAO} flex flex-col`}>
          <div className="flex items-baseline justify-between gap-3 border-b border-contorno px-5 py-3.5">
            <p className="min-w-0 truncate text-sm font-semibold text-tinta">
              {conversa.nome || "Visitante sem nome"}
            </p>
            <span className={`shrink-0 text-xs ${estado.classe}`}>
              {estado.rotulo}
            </span>
          </div>

          <ul className="grid max-h-[46vh] gap-4 overflow-y-auto px-5 py-4">
            {mensagens.length === 0 && (
              <li className="text-sm text-tinta/45">Sem mensagens.</li>
            )}

            {mensagens.map((mensagem) => {
              const autor = AUTORES[mensagem.autor];

              return (
                <li key={mensagem.id}>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xs font-medium ${autor.classe}`}>
                      {autor.rotulo}
                    </span>
                    <span className="text-[0.7rem] text-tinta/30">
                      {horaLegivel(mensagem.quando)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-tinta/75">
                    {mensagem.texto}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        {minha ? (
          <form action={responderNoChat} className={`${CARTAO} mt-4 p-5`}>
            <input type="hidden" name="id" value={conversa.id} />

            <label
              htmlFor="resposta"
              className="block text-sm font-medium text-tinta"
            >
              Responder
            </label>
            <p className="mt-1 text-xs leading-relaxed text-tinta/45">
              Aparece no chat de quem está do outro lado em até cinco segundos.
              Se já tiver fechado a janela, vê quando voltar.
            </p>

            <CampoDeResposta />

            <RespostasProntas campo="resposta" />

            <button type="submit" className={`${botaoPrimario} mt-4`}>
              Enviar resposta
            </button>
          </form>
        ) : (
          <p
            className={`${CARTAO} mt-4 p-5 text-sm leading-relaxed text-tinta/55`}
          >
            {conversa.estado === "fechada"
              ? "Conversa encerrada. Para voltar a responder, é preciso que a pessoa escreva de novo — e aí ela abre uma conversa nova, que aparece na lista."
              : "Esta conversa está com o assistente. Ele responde por aqui; ela volta para a sua fila se a pessoa pedir para falar com a equipe."}
          </p>
        )}
      </div>

      {/* ---------------- Os dados ---------------- */}
      <aside className="grid content-start gap-4">
        <div className={`${CARTAO} grid gap-4 p-5`}>
          <Dado
            rotulo="Nome"
            valor={conversa.nome || "Não informado"}
          />
          <Dado
            rotulo="WhatsApp"
            valor={conversa.contato}
            href={temTelefone ? `https://wa.me/55${soDigitos}` : undefined}
          />
          <Dado
            rotulo="E-mail"
            valor={conversa.email}
            href={conversa.email ? `mailto:${conversa.email}` : undefined}
          />
          <Dado rotulo="Começou" valor={horaLegivel(conversa.criadoEm)} />

          {conversa.nota !== null && (
            <div>
              <p className="text-[0.7rem] uppercase tracking-wide text-tinta/35">
                Avaliação
              </p>
              <p className="mt-0.5 text-sm text-salmon">
                {"★".repeat(conversa.nota)}
                <span className="text-tinta/20">
                  {"★".repeat(5 - conversa.nota)}
                </span>
              </p>
              {conversa.comentario && (
                <p className="mt-1 text-xs leading-relaxed text-tinta/55">
                  “{conversa.comentario}”
                </p>
              )}
            </div>
          )}
        </div>

        {!equipeNoExpediente() && (
          <p className={`${CARTAO} p-4 text-xs leading-relaxed text-tinta/50`}>
            Fora do horário de atendimento. O site disse a essa pessoa que a
            equipe responde {quandoAEquipeVolta()}.
          </p>
        )}

        <div className="grid gap-2">
          {temTelefone && (
            <a
              href={`https://wa.me/55${soDigitos}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-salmon/50 px-5 text-sm font-medium text-destaque transition-colors duration-300 hover:bg-salmon/10"
            >
              Continuar no WhatsApp
            </a>
          )}

          {conversa.estado === "equipe" && (
            <form action={devolverAoAssistente}>
              <input type="hidden" name="id" value={conversa.id} />
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-contorno px-5 text-sm text-tinta/60 transition-colors duration-300 hover:text-tinta"
              >
                Devolver ao assistente
              </button>
            </form>
          )}

          {conversa.estado !== "fechada" && (
            <form action={encerrarConversa}>
              <input type="hidden" name="id" value={conversa.id} />
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-contorno px-5 text-sm text-tinta/60 transition-colors duration-300 hover:text-tinta"
              >
                Encerrar conversa
              </button>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}
