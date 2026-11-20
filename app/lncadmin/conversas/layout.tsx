import { painelLiberado } from "@/lib/admin";
import { assistenteLigado } from "@/lib/atendente";
import { encerrarPorSilencio, listarConversas } from "@/lib/conversas";
import { equipeNoExpediente, quandoAEquipeVolta } from "@/lib/expediente";
import ListaDeConversas from "@/components/admin/ListaDeConversas";
import SeletorDeAtendimento from "@/components/admin/SeletorDeAtendimento";
import { ESTADOS, lerEstadoDaEquipe } from "@/lib/atendimento";
import { alternarAssistente, definirEstadoDaEquipe, escolherAtendente } from "./acoes";
import { LIMITES, usoDoAssistente } from "@/lib/protecao-chat";
import SeletorDeAtendente from "@/components/admin/SeletorDeAtendente";
import AvisosNoAparelho from "@/components/admin/AvisosNoAparelho";
import ColunaDaLista from "@/components/admin/ColunaDaLista";
import { lerEquipe } from "@/lib/conteudo";
import { atendenteAtual } from "@/lib/quem-atende";

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

  // A faxina antes da lista, para a lista já sair limpa (ver
  // encerrarPorSilencio: abrir a tela é o que encerra as conversas mortas).
  await encerrarPorSilencio();

  const [conversas, estadoDaEquipe, equipe, atendente] = await Promise.all([
    listarConversas(),
    lerEstadoDaEquipe(),
    lerEquipe(),
    atendenteAtual(),
  ]);
  const uso = await usoDoAssistente();
  const noExpediente = equipeNoExpediente();

  return (
    // Altura da tela menos o respiro do painel, e o resto se vira.
    //
    // A alternativa era descontar um numero fixo para o cabecalho — e o
    // cabecalho muda de altura: o aviso do assistente desligado aparece e
    // some, a tarja de "esperando voce" tambem. Com numero fixo, cada
    // combinacao sobrava ou faltava alguns pixels, e a pagina voltava a
    // rolar. Assim o cabecalho ocupa o que precisa e as colunas ficam com o
    // que sobrou, seja quanto for.
    <div className="flex flex-col lg:h-[calc(100vh-5rem)]">
      {/* Cabecalho em uma linha so.

          Cada pixel aqui sai da conversa la embaixo, e a conversa e o que a
          pessoa veio ler. O contador de quem esta esperando saiu daqui
          porque ja existe, maior e mais perto da acao, no filtro da propria
          lista — duas contagens da mesma coisa so ocupam espaco. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl font-semibold text-tinta">Conversas</h1>

        {/* O expediente, dito na própria tela.

            Quem atende precisa saber se está dentro do horário anunciado ao
            visitante — é isso que decide se uma conversa parada há vinte
            minutos é um problema ou é a madrugada. */}
        {/* O estado do atendimento, escolhido a mao.

            O horario fixo acerta o caso comum e erra os extremos: a reuniao
            de tres horas numa terca de manha e o sabado de lancamento nao
            cabem numa tabela. "Automatico" e o padrao e segue o horario; os
            outros tres cobrem o dia que nao foi como o combinado.

            O assistente le isto antes de encaminhar qualquer conversa. */}
        <SeletorDeAtendimento
          acao={definirEstadoDaEquipe}
          atual={estadoDaEquipe}
          opcoes={ESTADOS}
          agora={
            noExpediente ? "atendendo" : `volta ${quandoAEquipeVolta()}`
          }
        />
      </div>

      {/* Quem atende, e os avisos no aparelho: dois ajustes deste navegador,
          lado a lado, numa linha só abaixo do cabeçalho. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <SeletorDeAtendente
          acao={escolherAtendente}
          atual={atendente}
          nomes={equipe.map((p) => p.nome)}
        />
        <AvisosNoAparelho />

        {/* O botão de pânico, e quanto o assistente já respondeu hoje.

            O número é o que mostra um ataque antes da conta chegar: 30
            num dia comum, 300 numa tarde estranha. */}
        <form action={alternarAssistente} className="flex items-center gap-2">
          <input type="hidden" name="pausar" value={uso.pausado ? "0" : "1"} />
          <button
            type="submit"
            title={
              uso.pausado
                ? "O assistente não responde; o chat indica o WhatsApp. Clique para religar."
                : "Para o assistente na hora (use se alguém estiver enchendo o chat)."
            }
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors duration-300 ${
              uso.pausado
                ? "border-red-700/40 bg-red-700/10 text-red-700 hover:bg-red-700/15"
                : "border-contorno text-tinta/70 hover:border-salmon hover:text-tinta"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${uso.pausado ? "bg-red-700" : "bg-emerald-600"}`}
            />
            {uso.pausado ? "Assistente pausado · religar" : "Assistente ligado · pausar"}
          </button>
          <span className="text-[0.7rem] text-tinta/45">
            {uso.dia} de 500 respostas hoje · {uso.hora} nesta hora
            {uso.hora >= LIMITES.respostasPorHora ? " (disjuntor aberto)" : ""}
          </span>
        </form>
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


      {/* Altura fixa, e rolagem por dentro de cada coluna.

          Com a página crescendo livre, abrir uma conversa longa empurrava a
          lista para fora da tela e obrigava a rolar de volta até o topo para
          escolher a próxima. Preso na altura da janela, cada lado rola no
          seu canto e os dois continuam visíveis. */}
      {/* `grid-rows-[minmax(0,1fr)]` não é enfeite: sem ele, a altura aqui
          não segura nada.

          Altura no contêiner de um grid não limita a linha — a linha é
          `auto` por padrão, cresce com o conteúdo e vaza para fora. Era o
          que acontecia: a conversa longa esticava a linha para quase quatro
          mil pixels, as duas colunas acompanhavam, e a página inteira
          passava a rolar com a caixa de resposta lá embaixo, fora da tela.

          `minmax(0, 1fr)` diz que a linha tem no máximo o espaço disponível,
          e o `0` é o mínimo que permite o conteúdo encolher — sem ele, o
          mínimo seria o tamanho do conteúdo e estaríamos no mesmo lugar. */}
      <div className="mt-5 grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[320px_1fr] lg:grid-rows-[minmax(0,1fr)]">
        <ColunaDaLista>
          <ListaDeConversas lista={conversas} />
        </ColunaDaLista>

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
