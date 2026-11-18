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
  estado: "agora" | "saiu" | "lead";
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

type Linha = {
  visitante: string;
  abriu: string;
  ultimo: string;
  saiu: string | null;
  segundos: number | null;
};

/**
 * Os avisos do painel, derivados dos sinais crus.
 *
 * A derivação é no banco, e não no servidor: trazer todos os sinais de um dia
 * para agrupar em JavaScript seria carregar milhares de linhas para mostrar
 * dez. O agrupamento por visitante faz isso em uma consulta.
 */
export async function lerNotificacoes(): Promise<Notificacao[]> {
  if (!sql) return [];

  try {
    await garantirEsquema();

    const [visitas, orcamentos] = await Promise.all([
      sql.query(`
        SELECT visitante,
               to_char(min(criado_em), 'YYYY-MM-DD"T"HH24:MI:SSOF') AS abriu,
               to_char(max(criado_em), 'YYYY-MM-DD"T"HH24:MI:SSOF') AS ultimo,
               max(CASE WHEN tipo = 'diagnostico_saiu' THEN detalhe END) AS saiu,
               extract(epoch FROM max(criado_em) - min(criado_em))::int AS segundos
          FROM eventos
         WHERE criado_em > now() - interval '24 hours'
           AND tipo LIKE 'diagnostico%'
         GROUP BY visitante
         ORDER BY max(criado_em) DESC
         LIMIT 20
      `),
      sql.query(`
        SELECT detalhe,
               to_char(criado_em, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS quando
          FROM eventos
         WHERE criado_em > now() - interval '24 hours'
           AND tipo = 'orcamento_enviado'
         ORDER BY criado_em DESC
         LIMIT 10
      `),
    ]);

    const agora = Date.now();
    const avisos: Notificacao[] = [];

    for (const linha of visitas as Linha[]) {
      const ultimo = new Date(linha.ultimo).getTime();
      const calado = agora - ultimo;
      const tempo = duracao(
        linha.saiu ? Number(linha.saiu) || 0 : Math.round((agora - new Date(linha.abriu).getTime()) / 1000)
      );

      // Saiu de verdade, ou sumiu sem avisar. Os dois contam como saída: o
      // aviso de saída é enviado no fechar da aba, e o navegador nem sempre
      // consegue mandar — fechar o aparelho, perder a rede, matar o
      // aplicativo. Tratar silêncio prolongado como saída evita a pessoa
      // ficar "no diagnóstico há 9 horas" porque o último sinal se perdeu.
      const saiu = Boolean(linha.saiu) || calado > SILENCIO_MS;

      avisos.push(
        saiu
          ? {
              chave: `d-${linha.visitante}-saiu`,
              estado: "saiu",
              titulo: "Saiu do diagnóstico",
              texto: `Ficou ${tempo} na página.`,
              quando: linha.ultimo,
            }
          : {
              chave: `d-${linha.visitante}-agora`,
              estado: "agora",
              titulo: "Alguém no diagnóstico agora",
              texto: `Está na página há ${tempo}.`,
              quando: linha.abriu,
            }
      );
    }

    for (const linha of orcamentos as Array<{ detalhe: string | null; quando: string }>) {
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

    // Quem está no site agora vem primeiro; o resto, do mais novo ao mais
    // velho. Um aviso de alguém que saiu ontem acima de alguém que está na
    // página neste instante seria a ordem errada.
    return avisos
      .sort((a, b) => {
        if (a.estado === "agora" && b.estado !== "agora") return -1;
        if (b.estado === "agora" && a.estado !== "agora") return 1;
        return new Date(b.quando).getTime() - new Date(a.quando).getTime();
      })
      .slice(0, 12);
  } catch {
    return [];
  }
}
