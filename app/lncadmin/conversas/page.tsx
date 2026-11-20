import { painelLiberado } from "@/lib/admin";
import { numerosDoAtendimento } from "@/lib/conversas";

export const dynamic = "force-dynamic";

// O miolo, quando nenhuma conversa está aberta.
//
// A lista fica no layout ao lado, então esta página é só o vazio do meio —
// e vazio de tela que a pessoa vai usar todo dia merece dizer o que fazer,
// em vez de ficar branco.

export default async function ConversasSemEscolha() {
  if (!(await painelLiberado())) return null;

  const n = await numerosDoAtendimento();

  // Os números do mês, no lugar vazio da conversa não escolhida.
  //
  // É a tela que se vê ao entrar, e a pergunta de quem entra é "como estamos
  // indo?" antes de "quem eu atendo agora?". Sem uma tela só para isso, que
  // ninguém lembraria de abrir.
  const cartoes = [
    {
      rotulo: "Conversas",
      valor: String(n.conversas),
      nota: "nos últimos 30 dias",
    },
    {
      rotulo: "Resolvidas pelo assistente",
      valor:
        n.conversas > 0
          ? `${Math.round((n.peloAssistente / n.conversas) * 100)}%`
          : "—",
      nota: "encerradas sem a equipe precisar escrever",
    },
    {
      rotulo: "Primeira resposta da equipe",
      valor:
        n.primeiraRespostaMin === null
          ? "—"
          : n.primeiraRespostaMin < 1
            ? "< 1 min"
            : n.primeiraRespostaMin < 60
              ? `${Math.round(n.primeiraRespostaMin)} min`
              : `${(n.primeiraRespostaMin / 60).toFixed(1).replace(".", ",")} h`,
      nota: `mediana, em ${n.comEquipe} ${n.comEquipe === 1 ? "conversa" : "conversas"}`,
    },
    {
      rotulo: "Nota média",
      valor:
        n.notaMedia === null ? "—" : n.notaMedia.toFixed(1).replace(".", ","),
      nota: `${n.avaliacoes} ${n.avaliacoes === 1 ? "avaliação" : "avaliações"}`,
    },
    {
      rotulo: "Contatos recebidos",
      valor: String(n.contatos),
      nota: "WhatsApp e e-mail deixados no chat",
    },
  ];

  return (
    <div className="grid h-full min-h-56 content-start gap-4 overflow-y-auto">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {cartoes.map((c) => (
          <div
            key={c.rotulo}
            className="rounded-2xl border border-contorno bg-cartao p-4"
          >
            <p className="text-[0.7rem] uppercase tracking-wide text-tinta/40">
              {c.rotulo}
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-tinta">{c.valor}</p>
            <p className="mt-1 text-[0.7rem] leading-snug text-tinta/40">
              {c.nota}
            </p>
          </div>
        ))}
      </div>

    <div className="flex min-h-56 flex-1 items-center justify-center rounded-2xl border border-contorno bg-cartao p-8">
      <div className="max-w-xs text-center">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto h-10 w-10 text-tinta/20"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
        </svg>

        <p className="mt-4 text-sm leading-relaxed text-tinta/50">
          Escolha uma conversa à esquerda para ler e responder.
        </p>
      </div>
    </div>
    </div>
  );
}
