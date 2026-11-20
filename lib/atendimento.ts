import { sql, garantirEsquema } from "@/lib/db";
import { equipeNoExpediente, quandoAEquipeVolta } from "@/lib/expediente";

// O estado do atendimento humano, e quem está barrado.
//
// ---------- Por que existe um estado manual ----------
//
// O horário fixo acerta o caso comum e erra os dois extremos: a equipe que
// entra numa reunião de três horas às dez da manhã continua "disponível", e
// a que está trabalhando num sábado de lançamento continua "fora".
//
// O estado manual não substitui o horário — ele o cobre quando a realidade
// do dia não é a da tabela. Por isso o padrão é "automático": sem ninguém
// mexer, vale o expediente.

const CHAVE_ESTADO = "equipe:estado";

export type EstadoDaEquipe = "automatico" | "disponivel" | "ausente" | "fora";

export const ESTADOS: Array<{
  valor: EstadoDaEquipe;
  rotulo: string;
  ajuda: string;
}> = [
  {
    valor: "automatico",
    rotulo: "Automático",
    ajuda: "Segue o horário: seg a sex, 8h30–11h30 e 14h–17h.",
  },
  {
    valor: "disponivel",
    rotulo: "Disponível",
    ajuda: "Atende agora, mesmo fora do horário.",
  },
  {
    valor: "ausente",
    rotulo: "Ausente",
    ajuda: "O assistente avisa que a equipe responde assim que voltar.",
  },
  {
    valor: "fora",
    rotulo: "Fora de atendimento",
    ajuda: "O assistente informa o horário e não encaminha ninguém.",
  },
];

function valido(valor: string): valor is EstadoDaEquipe {
  return ["automatico", "disponivel", "ausente", "fora"].includes(valor);
}

export async function lerEstadoDaEquipe(): Promise<EstadoDaEquipe> {
  if (!sql) return "automatico";

  try {
    await garantirEsquema();
    const linhas = (await sql.query(
      "SELECT valor FROM meta WHERE chave = $1",
      [CHAVE_ESTADO]
    )) as Array<{ valor: string }>;

    const valor = linhas[0]?.valor ?? "";
    return valido(valor) ? valor : "automatico";
  } catch {
    // Sem leitura, o automático: errar para o lado do horário anunciado é
    // melhor do que errar para o lado de prometer atendimento que não há.
    return "automatico";
  }
}

export async function guardarEstadoDaEquipe(valor: string) {
  if (!sql || !valido(valor)) return;

  await garantirEsquema();
  await sql.query(
    `INSERT INTO meta (chave, valor) VALUES ($1, $2)
     ON CONFLICT (chave) DO UPDATE SET valor = $2, em = now()`,
    [CHAVE_ESTADO, valor]
  );
}

export type Atendimento = {
  /** Se dá para passar uma conversa para gente agora. */
  atendendo: boolean;
  /** O que o assistente deve dizer quando não dá. Vazio quando dá. */
  recado: string;
  estado: EstadoDaEquipe;
};

/**
 * Se a equipe pode receber conversa agora, e o que dizer quando não pode.
 *
 * O recado é escrito aqui, e não no modelo: horário é fato, não opinião, e
 * fato ditado por modelo de linguagem é fato que um dia sai diferente.
 */
export async function comoEstaOAtendimento(): Promise<Atendimento> {
  const estado = await lerEstadoDaEquipe();

  const horario =
    "A equipe atende de segunda a sexta, das 8h30 às 11h30 e das 14h às 17h.";

  if (estado === "disponivel") {
    return { atendendo: true, recado: "", estado };
  }

  if (estado === "ausente") {
    return {
      atendendo: false,
      estado,
      recado: `A equipe está ausente neste momento. ${horario} Posso tentar te ajudar por aqui, ou você pode chamar no WhatsApp (83) 99106-0691.`,
    };
  }

  if (estado === "fora") {
    return {
      atendendo: false,
      estado,
      recado: `Estamos fora do atendimento humano agora. ${horario} Posso responder o que estiver ao meu alcance, e o WhatsApp (83) 99106-0691 fica disponível.`,
    };
  }

  // Automático: vale o expediente.
  if (equipeNoExpediente()) {
    return { atendendo: true, recado: "", estado };
  }

  return {
    atendendo: false,
    estado,
    recado:
      `Agora estamos fora do horário de atendimento humano. ${horario} ` +
      `A equipe volta ${quandoAEquipeVolta()}. Posso tentar te ajudar por ` +
      `aqui, e o WhatsApp (83) 99106-0691 também está aberto.`,
  };
}

/* ---------------- Quem foi barrado ---------------- */

/**
 * Barra um visitante.
 *
 * ---------- O que isto consegue, e o que não ----------
 *
 * Barra pela chave da conversa e pela impressão do visitante. Isso para
 * quem veio incomodar e vai embora — que é a maioria.
 *
 * Não para quem está decidido: a impressão troca de dia por desenho (ver
 * lib/acessos.ts), e a chave vive no navegador, então limpar o site ou abrir
 * uma aba anônima dá a volta. Dizer o contrário seria vender segurança que
 * não existe.
 *
 * O que realmente segura volume é o teto por endereço, que já existe nas
 * rotas e não depende de ninguém clicar em nada.
 */
export async function barrar(chave: string, visitante: string) {
  if (!sql) return;

  await garantirEsquema();
  await sql.query(
    `INSERT INTO bloqueios (chave, visitante) VALUES ($1, $2)
     ON CONFLICT (chave) DO NOTHING`,
    [chave, visitante]
  );
}

export async function estaBarrado(chave: string, visitante: string) {
  if (!sql) return false;

  try {
    await garantirEsquema();
    const linhas = (await sql.query(
      `SELECT 1 FROM bloqueios
        WHERE chave = $1 OR (visitante <> '' AND visitante = $2)
        LIMIT 1`,
      [chave, visitante]
    )) as Array<unknown>;

    return linhas.length > 0;
  } catch {
    // Falha aberto: um erro de leitura não pode barrar quem não foi barrado.
    return false;
  }
}

/**
 * Se o visitante desta conversa está barrado — pela chave dela ou pela
 * impressão de quem a abriu. É a mesma regra de `estaBarrado`, vista do
 * painel, que só tem o número da conversa.
 */
export async function conversaBarrada(conversa: number) {
  if (!sql) return false;

  try {
    await garantirEsquema();
    const linhas = (await sql.query(
      `SELECT 1 FROM bloqueios b
         JOIN conversas c
           ON b.chave = c.chave
           OR (b.visitante <> '' AND b.visitante = c.visitante)
        WHERE c.id = $1
        LIMIT 1`,
      [conversa]
    )) as Array<unknown>;

    return linhas.length > 0;
  } catch {
    return false;
  }
}

/**
 * Desfaz o bloqueio do visitante desta conversa.
 *
 * Existe porque barrar é um clique, e clique errado acontece: sem volta, um
 * cliente barrado por engano só descobriria escrevendo e não recebendo
 * resposta nunca — o silêncio que funciona contra quem incomoda é o mesmo
 * que afasta quem não devia ter sido barrado.
 */
export async function liberar(conversa: number) {
  if (!sql) return;

  await garantirEsquema();
  await sql.query(
    `DELETE FROM bloqueios b
      USING conversas c
      WHERE c.id = $1
        AND (b.chave = c.chave
             OR (b.visitante <> '' AND b.visitante = c.visitante))`,
    [conversa]
  );
}
