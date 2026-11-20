import Link from "next/link";
import { painelLiberado } from "@/lib/admin";
import { horaDaAgencia } from "@/lib/horario";
import { equipeViu, lerConversa } from "@/lib/conversas";
import { equipeNoExpediente, quandoAEquipeVolta } from "@/lib/expediente";
import CampoDeResposta from "@/components/admin/CampoDeResposta";
import {
  responderNoChat,
  encerrarConversa,
  devolverAoAssistente,
  apagarConversa,
  barrarVisitante,
  liberarVisitante,
  anotarNaConversa,
  sinalizarDigitando,
} from "../acoes";
import SinaisDaConversa from "@/components/admin/SinaisDaConversa";
import AnexoDaMensagem from "@/components/AnexoDaMensagem";
import { conversaBarrada } from "@/lib/atendimento";
import AcaoIrreversivel from "@/components/admin/AcaoIrreversivel";

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
  nota: { rotulo: "Nota interna", classe: "text-amber-500" },
} as const;

const ESTADOS = {
  equipe: { rotulo: "Esperando você", classe: "text-destaque" },
  assistente: { rotulo: "Com o assistente", classe: "text-tinta/55" },
  fechada: { rotulo: "Encerrada", classe: "text-tinta/40" },
} as const;


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
  const barrado = await conversaBarrada(conversa.id);
  const estado = ESTADOS[conversa.estado];
  const comoEncerrou =
    conversa.estado !== "fechada"
      ? estado.rotulo
      : conversa.fechadaPor === "inatividade"
        ? "Encerrada por inatividade"
        : conversa.fechadaPor === "cliente"
          ? "Encerrada pelo visitante"
          : estado.rotulo;
  const minha = conversa.estado === "equipe";

  // Abrir a conversa é ler o que o visitante mandou: é isto que acende o
  // "visto" do lado dele.
  if (minha) await equipeViu(conversa.id);

  const falas = mensagens.filter((m) => m.autor !== "nota");
  const ultimaFala = falas[falas.length - 1];
  const ultimoId = mensagens.reduce((maior, m) => Math.max(maior, m.id), 0);

  const soDigitos = conversa.contato.replace(/\D/g, "");
  const temTelefone = soDigitos.length >= 10;

  return (
    <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1fr_17rem]">
      {/* ---------------- O fio ---------------- */}
      <div className="flex min-h-0 min-w-0 flex-col">
        {/* O cartao da conversa ocupa o que sobra, e a lista dentro dele e
            quem rola. A caixa de resposta fica embaixo, fixa: sem isto ela
            descia junto com o historico e saia da tela justamente quando se
            queria escrever. */}
        <div className={`${CARTAO} flex min-h-36 flex-1 flex-col`}>
          <div className="flex items-center justify-between gap-3 border-b border-contorno px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fundo-alt text-xs font-medium text-tinta/60">
                {(conversa.nome || "?")
                  .split(/s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? "")
                  .join("") || "?"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-tinta">
                  {conversa.nome || "Visitante sem nome"}
                </p>
                <p className="truncate text-[0.7rem] text-tinta/45">
                  {conversa.contato || "sem telefone"}
                </p>
              </div>
            </div>
            <span className={`shrink-0 text-xs ${estado.classe}`}>
              {comoEncerrou}
            </span>
          </div>

          <ul className="grid min-h-28 flex-1 content-start gap-4 overflow-y-auto px-5 py-4">
            {mensagens.length === 0 && (
              <li className="text-sm text-tinta/45">Sem mensagens.</li>
            )}

            {mensagens.map((mensagem) => {
              const autor = AUTORES[mensagem.autor];
              const daCasa = mensagem.autor !== "cliente";

              // A nota interna no meio do fio, centrada e em outra cor: não
              // é fala de nenhum dos lados.
              if (mensagem.autor === "nota") {
                return (
                  <li key={mensagem.id} className="flex justify-center">
                    <div className="max-w-[85%] rounded-xl border border-amber-500/30 bg-amber-400/10 px-3.5 py-2">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-[0.7rem] font-medium ${autor.classe}`}>
                          {autor.rotulo}
                        </span>
                        <span className="text-[0.65rem] text-tinta/30">
                          {horaDaAgencia(mensagem.quando)} · só a equipe vê
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-tinta/75">
                        {mensagem.texto}
                      </p>
                    </div>
                  </li>
                );
              }

              /* Visitante a esquerda, agencia a direita.

                 E a convencao de todo aplicativo de conversa, e ela faz o
                 trabalho que o rotulo sozinho nao faz: num fio de trinta
                 mensagens, o lado diz de quem e a fala antes de a pessoa ler
                 qualquer palavra. */
              return (
                <li
                  key={mensagem.id}
                  className={daCasa ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                      daCasa
                        ? "rounded-br-md bg-salmon/12"
                        : "rounded-bl-md bg-fundo-alt"
                    }`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className={`text-[0.7rem] font-medium ${autor.classe}`}>
                        {mensagem.autor === "equipe" && mensagem.autorNome
                          ? `${mensagem.autorNome.split(/\s+/)[0]} · Equipe`
                          : autor.rotulo}
                      </span>
                      <span className="text-[0.65rem] text-tinta/30">
                        {horaDaAgencia(mensagem.quando)}
                      </span>
                    </div>
                    {mensagem.anexoUrl ? (
                      <div className="mt-1.5">
                        <AnexoDaMensagem
                          url={mensagem.anexoUrl}
                          tipo={mensagem.anexoTipo ?? ""}
                          nome={mensagem.texto}
                        />
                      </div>
                    ) : (
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-tinta/80">
                        {mensagem.texto}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* A barra fica dentro do mesmo cartão da conversa, colada no
              rodapé — como em qualquer aplicativo de mensagem. Fora dele,
              como estava, era um segundo cartão disputando altura com o
              primeiro, e perdia: a conversa sumia. */}
          <SinaisDaConversa
            conversa={conversa.id}
            ultimaConhecida={ultimoId}
            nome={conversa.nome}
            equipeFalouPorUltimo={ultimaFala?.autor === "equipe"}
          />

          {/* Com a conversa fora da equipe, o campo só anota. */}
          <CampoDeResposta
            acao={responderNoChat}
            anotar={anotarNaConversa}
            sinalizar={sinalizarDigitando}
            conversa={conversa.id}
            podeResponder={minha}
          />
        </div>

        {!minha && (
          <p
            className={`${CARTAO} mt-4 shrink-0 p-5 text-sm leading-relaxed text-tinta/55`}
          >
            {conversa.estado === "fechada"
              ? "Conversa encerrada. Para voltar a responder, é preciso que a pessoa escreva de novo — e aí ela abre uma conversa nova, que aparece na lista."
              : "Esta conversa está com o assistente. Ele responde por aqui; ela volta para a sua fila se a pessoa pedir para falar com a equipe."}
          </p>
        )}
      </div>

      {/* ---------------- Os dados ---------------- */}
      <aside className="grid content-start gap-4 xl:max-h-full xl:overflow-y-auto">
        {/* O retrato no topo, como no aplicativo: e o que diz, antes de
            qualquer texto, de quem e a coluna que se esta lendo. */}
        <div className={`${CARTAO} grid justify-items-center gap-1 p-5`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-fundo-alt text-base font-medium text-tinta/55">
            {(conversa.nome || "?")
              .split(/s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() ?? "")
              .join("") || "?"}
          </span>
          <p className="mt-2 text-center text-sm font-semibold text-tinta">
            {conversa.nome || "Visitante sem nome"}
          </p>
          <p className={`text-xs ${estado.classe}`}>{comoEncerrou}</p>
          {barrado && (
            <p className="mt-1 rounded-full bg-fundo-alt px-2 py-0.5 text-[0.65rem] text-tinta/50">
              Visitante barrado
            </p>
          )}
        </div>

        <div className={`${CARTAO} grid gap-4 p-5`}>
          <p className="flex items-center gap-2 text-[0.7rem] uppercase tracking-wide text-tinta/35">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Detalhes
          </p>
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
          <Dado rotulo="Responsável" valor={conversa.responsavel ?? ""} />
          <Dado rotulo="Começou" valor={horaDaAgencia(conversa.criadoEm)} />

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

        {/* Atras de uma gaveta, e nao soltos ao lado dos outros: estes dois
            nao se desfazem. Apagar e DELETE, e barrar fecha a porta para a
            pessoa. Dois cliques deliberados, e o segundo diz o que faz. */}
        <details className="group">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-xs text-tinta/40 transition-colors duration-300 hover:text-tinta">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 transition-transform duration-300 group-open:rotate-90"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
            Mais ações
          </summary>

          <div className="mt-3 grid gap-2">
            {barrado ? (
              <AcaoIrreversivel
                acao={liberarVisitante}
                id={conversa.id}
                titulo="Desfazer bloqueio"
                descricao="O visitante volta a conseguir escrever no chat. A conversa continua encerrada."
                pergunta=""
              />
            ) : (
              <AcaoIrreversivel
                acao={barrarVisitante}
                id={conversa.id}
                titulo="Barrar este visitante"
                descricao="Encerra a conversa e impede novas mensagens por este navegador."
                pergunta={`Barrar ${conversa.nome || "este visitante"}? A conversa é encerrada e ele não consegue mais escrever por este navegador. Dá para desfazer depois.`}
              />
            )}

            <AcaoIrreversivel
              acao={apagarConversa}
              id={conversa.id}
              titulo="Apagar conversa e dados"
              descricao="Some com as mensagens, o nome, o WhatsApp e o e-mail. Não há como desfazer."
              pergunta={`Apagar a conversa de ${conversa.nome || "este visitante"} com todas as mensagens e dados de contato? Não há como desfazer.`}
              perigo
            />
          </div>
        </details>
      </aside>
    </div>
  );
}
