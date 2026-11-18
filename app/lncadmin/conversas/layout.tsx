import { painelLiberado } from "@/lib/admin";
import { assistenteLigado } from "@/lib/atendente";
import { listarConversas } from "@/lib/conversas";
import { equipeNoExpediente, quandoAEquipeVolta } from "@/lib/expediente";
import ListaDeConversas from "@/components/admin/ListaDeConversas";

export const dynamic = "force-dynamic";

// A tela de conversas, em duas colunas.
//
// ---------- Por que a lista vive no layout ----------
//
// Porque ela não muda quando se abre outra conversa. No App Router, o layout
// fica montado e só o miolo troca: a coluna não pisca, não recarrega e não
// perde a rolagem a cada clique — e nesta tela se clica o dia inteiro.
//
// Também é o que torna o desenho de duas colunas possível sem repetir a
// lista em cada página.

export default async function LayoutDasConversas({
  children,
}: {
  children: React.ReactNode;
}) {
  // Portão próprio, além do layout do painel: no App Router o layout de cima
  // não impede este de rodar, só escolhe se o mostra.
  if (!(await painelLiberado())) return null;

  const conversas = await listarConversas();
  const esperando = conversas.filter((c) => c.estado === "equipe").length;
  const noExpediente = equipeNoExpediente();

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-tinta">Conversas</h1>
          <p className="mt-1 text-sm text-tinta/55">
            O chat do site. O assistente responde dúvida sobre serviço e passa
            para cá o que precisa de gente.
          </p>
        </div>

        {/* O expediente, dito na própria tela.

            Quem atende precisa saber se está dentro do horário anunciado ao
            visitante — é isso que decide se uma conversa parada há vinte
            minutos é um problema ou é a madrugada. */}
        <p className="text-xs text-tinta/45">
          {noExpediente ? (
            <span className="text-destaque">● No horário de atendimento</span>
          ) : (
            <>Fora do horário — a equipe volta {quandoAEquipeVolta()}</>
          )}
        </p>
      </div>

      {!assistenteLigado() && (
        <p className="mt-4 rounded-2xl border border-contorno bg-cartao p-4 text-sm leading-relaxed text-tinta/70">
          <span className="font-medium text-tinta">
            O assistente está desligado.
          </span>{" "}
          Falta a variável{" "}
          <code className="text-destaque">ANTHROPIC_API_KEY</code> na Vercel.
          Enquanto ela não existir, toda mensagem do chat vem direto para cá —
          ninguém fica sem resposta, mas também não há resposta automática
          fora do expediente.
        </p>
      )}

      {esperando > 0 && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-salmon/50 px-4 py-2 text-sm text-destaque">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-salmon opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-salmon" />
          </span>
          {esperando === 1
            ? "1 conversa esperando resposta"
            : `${esperando} conversas esperando resposta`}
        </p>
      )}

      {/* Altura fixa, e rolagem por dentro de cada coluna.

          Com a página crescendo livre, abrir uma conversa longa empurrava a
          lista para fora da tela e obrigava a rolar de volta até o topo para
          escolher a próxima. Preso na altura da janela, cada lado rola no
          seu canto e os dois continuam visíveis. */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[320px_1fr] lg:h-[calc(100vh-15rem)]">
        <aside className="overflow-hidden rounded-2xl border border-contorno bg-cartao lg:h-full">
          <ListaDeConversas lista={conversas} />
        </aside>

        {/* A coluna do meio não rola; quem rola é a lista de mensagens
            dentro dela.

            Rolando as duas, a caixa de resposta descia junto com a conversa
            e saía da tela — era preciso rolar de volta para escrever. Com a
            coluna presa, o campo fica sempre no mesmo lugar e só o histórico
            se move. */}
        <section className="flex min-w-0 flex-col lg:h-full">{children}</section>
      </div>
    </div>
  );
}
