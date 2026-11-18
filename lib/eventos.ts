import { sql, garantirEsquema } from "@/lib/db";

// Os sinais de interesse que o painel avisa.
//
// ---------- O que dá para saber, e o que não dá ----------
//
// O diagnóstico é a página do CRM, servida de outro domínio, dentro de um
// quadro embutido. O navegador proíbe ler qualquer coisa lá dentro — é regra
// de segurança, não configuração. Nenhum código daqui consegue saber que a
// pessoa começou a digitar, nem em que pergunta ela está.
//
// O que se sabe é quando ela abriu, que continua lá, e quando saiu. E isso
// basta para o que importa: quem fica quatro minutos está preenchendo, quem
// sai em oito segundos desistiu. O tempo é o sinal honesto, e os avisos falam
// em tempo em vez de fingir que leem o formulário.
//
// ---------- Por que não há aviso de "lead fechou" ----------
//
// O lead fecha no CRM, não aqui. Para avisar isso seria preciso perguntar ao
// CRM, e isso é integração de outro dia. O que o painel mostra é interesse em
// andamento, que é justamente o que o CRM não mostra enquanto não vira ficha.

export type TipoEvento =
  | "diagnostico_abriu"
  | "diagnostico_presente"
  | "diagnostico_saiu"
  | "orcamento_enviado";

const TIPOS: TipoEvento[] = [
  "diagnostico_abriu",
  "diagnostico_presente",
  "diagnostico_saiu",
  "orcamento_enviado",
];

export function tipoValido(valor: string): valor is TipoEvento {
  return (TIPOS as string[]).includes(valor);
}

/** Guarda um sinal. Falha em silêncio: avisar não pode derrubar o site. */
export async function registrarEvento(dados: {
  tipo: TipoEvento;
  visitante: string;
  caminho?: string;
  detalhe?: string;
}) {
  if (!sql) return;
  try {
    await garantirEsquema();
    await sql.query(
      "INSERT INTO eventos (tipo, visitante, caminho, detalhe) VALUES ($1,$2,$3,$4)",
      [
        dados.tipo,
        dados.visitante,
        dados.caminho?.slice(0, 300) ?? null,
        dados.detalhe?.slice(0, 300) ?? null,
      ]
    );
  } catch {
    // Silêncio proposital.
  }
}

export type Notificacao = {
  chave: string;
  estado: "agora" | "saiu" | "lead" | "chat";
  titulo: string;
  texto: string;
  quando: string;
};

/** Até quanto tempo sem sinal ainda se considera que a pessoa está lá. */
const SILENCIO_MS = 90_000;

function duracao(segundos: number) {
  if (segundos < 60) return `${Math.max(segundos, 1)} s`;
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}


/**
 * Os avisos do painel, uma linha por visita.
 *
 * ---------- Por que por visita, e não por pessoa ----------
 *
 * A primeira versão agrupava por visitante: quem entrasse e saísse cinco
 * vezes virava um aviso só, e o painel dizia "alguém esteve no diagnóstico"
 * uma vez enquanto a pessoa ia e voltava a tarde inteira. O interessante é
 * exatamente o contrário — alguém que volta três vezes está decidindo.
 *
 * Agora cada abertura começa uma visita, e a saída fecha. O mesmo visitante
 * aparece tantas vezes quantas voltou.
 *
 * ---------- Por que os sinais crus vêm para cá ----------
 *
 * Agrupar visita exige olhar a ordem dos sinais, e isso em SQL pede função de
 * janela e um bloco que ninguém relê com prazer. São no máximo quinhentas
 * linhas de um dia; montar a sequência aqui é mais barato de entender e não
 * se paga em tempo.
 */
export async function lerNotificacoes(): Promise<Notificacao[]> {
  if (!sql) return [];

  try {
    await garantirEsquema();

    // O carimbo sai em UTC com Z no fim, e não com o deslocamento do
    // Postgres: ele escreve "+00", de dois dígitos, e o JavaScript só aceita
    // "+00:00". O resultado era "Invalid Date" na tela.
    const quando = `to_char(criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

    const [sinais, orcamentos, conversas] = await Promise.all([
      sql.query(`
        SELECT tipo, visitante, detalhe, ${quando} AS quando
          FROM eventos
         WHERE criado_em > now() - interval '24 hours'
           AND tipo LIKE 'diagnostico%'
         ORDER BY visitante, criado_em
         LIMIT 500
      `),
      sql.query(`
        SELECT detalhe, ${quando} AS quando
          FROM eventos
         WHERE criado_em > now() - interval '24 hours'
           AND tipo = 'orcamento_enviado'
         ORDER BY criado_em DESC
         LIMIT 10
      `),

      // As conversas do chat que estão esperando a equipe.
      //
      // Vem da tabela, e não de um evento gravado: o aviso precisa dizer o
      // que *está* pendente agora, e não que alguém pediu atendimento há
      // seis horas. Respondida a conversa, o aviso sai da lista sozinho —
      // com evento, ele ficaria lá até alguém apagar.
      sql.query(`
        SELECT c.id, c.nome,
               to_char(c.mexido_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS quando
          FROM conversas c
         WHERE c.estado = 'equipe'
         ORDER BY c.mexido_em DESC
         LIMIT 10
      `),
    ]);

    const agora = Date.now();
    const avisos: Notificacao[] = [];

    type Sinal = {
      tipo: string;
      visitante: string;
      detalhe: string | null;
      quando: string;
    };

    type Visita = {
      visitante: string;
      abriu: number;
      ultimo: number;
      segundos: number | null;
    };

    const visitas: Visita[] = [];

    for (const sinal of sinais as Sinal[]) {
      const instante = new Date(sinal.quando).getTime();
      if (!Number.isFinite(instante)) continue;

      const atual = visitas[visitas.length - 1];
      const mesmaVisita =
        atual &&
        atual.visitante === sinal.visitante &&
        atual.segundos === null &&
        sinal.tipo !== "diagnostico_abriu";

      if (!mesmaVisita) {
        visitas.push({
          visitante: sinal.visitante,
          abriu: instante,
          ultimo: instante,
          segundos: null,
        });
        continue;
      }

      atual.ultimo = instante;
      if (sinal.tipo === "diagnostico_saiu") {
        atual.segundos = Number(sinal.detalhe) || Math.round((instante - atual.abriu) / 1000);
      }
    }

    for (const visita of visitas.slice(-20)) {
      // Saída declarada, ou silêncio prolongado. O aviso de saída vai no
      // fechar da aba e o navegador nem sempre consegue mandá-lo — fechar o
      // aparelho, perder a rede. Sem isto, alguém ficaria "no diagnóstico há
      // 9 horas" porque o último sinal se perdeu.
      const saiu = visita.segundos !== null || agora - visita.ultimo > SILENCIO_MS;
      const segundos =
        visita.segundos ??
        Math.round((saiu ? visita.ultimo : agora) - visita.abriu) / 1000;

      avisos.push(
        saiu
          ? {
              chave: `d-${visita.visitante}-${visita.abriu}`,
              estado: "saiu",
              titulo: "Saiu do diagnóstico",
              texto: `Ficou ${duracao(Math.round(segundos))} na página.`,
              quando: new Date(visita.ultimo).toISOString(),
            }
          : {
              chave: `d-${visita.visitante}-${visita.abriu}-agora`,
              estado: "agora",
              titulo: "Alguém no diagnóstico agora",
              texto: `Está na página há ${duracao(Math.round(segundos))}.`,
              quando: new Date(visita.abriu).toISOString(),
            }
      );
    }

    for (const linha of orcamentos as Array<{
      detalhe: string | null;
      quando: string;
    }>) {
      avisos.push({
        chave: `o-${linha.quando}`,
        estado: "lead",
        titulo: "Pedido de orçamento",
        texto: linha.detalhe
          ? `${linha.detalhe} — já está no CRM.`
          : "Já está no CRM.",
        quando: linha.quando,
      });
    }

    for (const linha of conversas as Array<{
      id: number;
      nome: string | null;
      quando: string;
    }>) {
      avisos.push({
        chave: `c-${linha.id}`,
        estado: "chat",
        titulo: "Conversa esperando no chat",
        texto: linha.nome
          ? `${linha.nome} pediu para falar com a equipe.`
          : "Alguém pediu para falar com a equipe.",
        quando: linha.quando,
      });
    }

    // Quem está no site agora vem primeiro; o resto, do mais novo ao mais
    // velho. Um aviso de alguém que saiu ontem acima de alguém que está na
    // página neste instante seria a ordem errada.
    // Urgente é o que tem alguém do outro lado esperando: quem está no
    // diagnóstico neste instante e quem pediu atendimento no chat. O resto é
    // histórico, e histórico ordena por data.
    const urgente = (estado: Notificacao["estado"]) =>
      estado === "agora" || estado === "chat" ? 0 : 1;

    return avisos
      .sort(
        (a, b) =>
          urgente(a.estado) - urgente(b.estado) ||
          new Date(b.quando).getTime() - new Date(a.quando).getTime()
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}
