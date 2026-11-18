import Link from "next/link";
import { painelLiberado } from "@/lib/admin";
import { assistenteLigado } from "@/lib/atendente";
import { listarConversas, type ConversaNaLista } from "@/lib/conversas";

export const dynamic = "force-dynamic";

// A lista de conversas do chat do site.
//
// ---------- O que esta tela responde ----------
//
// Uma pergunta só: tem alguém esperando? Por isso a ordem é por última
// mexida e o estado vem antes do texto — quem está esperando resposta é o
// que importa, e o resto é histórico.

const CARTAO = "rounded-2xl border border-contorno bg-cartao";

const ESTADOS: Record<
  ConversaNaLista["estado"],
  { rotulo: string; classe: string }
> = {
  equipe: {
    rotulo: "Esperando você",
    classe: "border-salmon/50 text-destaque",
  },
  assistente: {
    rotulo: "Com o assistente",
    classe: "border-contorno text-tinta/50",
  },
  fechada: { rotulo: "Encerrada", classe: "border-contorno text-tinta/35" },
};

function quandoLegivel(iso: string) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default async function AdminConversas() {
  if (!(await painelLiberado())) return null;

  const conversas = await listarConversas();
  const esperando = conversas.filter((c) => c.estado === "equipe").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-tinta">Conversas</h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-tinta/55">
        O chat do site. O assistente responde dúvida sobre serviço e passa
        para cá o que não sabe — preço, prazo e qualquer coisa que precise de
        gente.
      </p>

      {!assistenteLigado() && (
        // Dito na tela, e não só no código: sem a chave o chat funciona, só
        // que toda mensagem cai direto aqui. Quem abre o painel precisa saber
        // por que ninguém está sendo atendido na hora.
        <p className={`${CARTAO} mt-5 p-5 text-sm leading-relaxed text-tinta/70`}>
          <span className="font-medium text-tinta">
            O assistente está desligado.
          </span>{" "}
          Falta a variável <code className="text-destaque">ANTHROPIC_API_KEY</code>{" "}
          na Vercel. Enquanto ela não existir, o chat continua no ar e toda
          mensagem vem direto para esta tela — ninguém fica sem resposta, mas
          também não há resposta automática de madrugada.
        </p>
      )}

      {esperando > 0 && (
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-salmon/50 px-4 py-2 text-sm text-destaque">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-salmon opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-salmon" />
          </span>
          {esperando === 1
            ? "1 conversa esperando resposta"
            : `${esperando} conversas esperando resposta`}
        </p>
      )}

      {conversas.length === 0 ? (
        <p className={`${CARTAO} mt-5 p-5 text-sm leading-relaxed text-tinta/60`}>
          Nenhuma conversa ainda. Elas aparecem aqui assim que alguém abrir o
          chat no site e mandar a primeira mensagem.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3">
          {conversas.map((conversa) => {
            const estado = ESTADOS[conversa.estado];

            return (
              <li key={conversa.id}>
                <Link
                  href={`/lncadmin/conversas/${conversa.id}`}
                  className={`${CARTAO} block p-4 transition-colors duration-300 hover:border-salmon/40`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium text-tinta">
                      {conversa.nome || "Visitante sem nome"}
                      {conversa.contato && (
                        <span className="ml-2 font-normal text-tinta/45">
                          {conversa.contato}
                        </span>
                      )}
                    </p>
                    <span className="shrink-0 text-xs text-tinta/40">
                      {quandoLegivel(conversa.mexidoEm)}
                    </span>
                  </div>

                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-tinta/60">
                    {conversa.ultimoAutor === "cliente" ? "" : "— "}
                    {conversa.ultima || "Sem mensagem."}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[0.7rem] ${estado.classe}`}
                    >
                      {estado.rotulo}
                    </span>
                    <span className="text-[0.7rem] text-tinta/35">
                      {conversa.mensagens === 1
                        ? "1 mensagem"
                        : `${conversa.mensagens} mensagens`}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
