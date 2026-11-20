import { sql, garantirEsquema } from "@/lib/db";

// A proteção do chat contra quem quer gastar, cansar ou sujar.
//
// ---------- O que já existia, e onde vazava ----------
//
// Freio de 40 mensagens por endereço a cada 15 minutos, 60 mensagens por
// conversa e 500 respostas do assistente por dia, somando o site inteiro.
// Bom contra o curioso; fraco contra quem quer estragar:
//
// - Uma pessoa só, respeitando o freio de 15 minutos, gastava as 500 do dia
//   em umas três horas — e o assistente sumia para os clientes de verdade.
// - Esgotado o teto, toda mensagem passava para a equipe: o celular de quem
//   atende virava uma sirene de spam.
// - Conversa nova não tinha limite: cada uma ganhava 60 mensagens novas.
// - A ficha de contato criava lead no DGFLOW a cada envio.
//
// ---------- O que entra aqui ----------
//
// Contadores por endereço e por dia, no banco (a função roda em várias
// instâncias, e um contador em memória contaria errado para baixo):
//
// - respostas do assistente por endereço: 40 por dia;
// - conversas novas por endereço: 6 por dia;
// - passagens para a equipe por endereço: 4 por dia;
// - fichas de contato (leads) por endereço: 4 por dia.
//
// Um disjuntor de surto: mais de 150 respostas do assistente numa hora,
// somando o site inteiro, desliga o assistente até a hora virar e avisa a
// equipe uma vez. Tráfego de verdade de um site de agência não chega perto.
//
// E um filtro de lixo: mensagem repetida, sem letra nenhuma, ou feita de um
// caractere só não vai ao modelo.
//
// Em todos os casos o visitante recebe uma resposta educada com o WhatsApp,
// e a conversa não passa para a equipe. Quem estava só abusando não ganha
// nada; quem era cliente de verdade tem para onde ir.

export const LIMITES = {
  respostasPorEndereco: 40,
  conversasPorEndereco: 6,
  passagensPorEndereco: 4,
  fichasPorEndereco: 4,
  respostasPorHora: 150,
};

const hoje = () => new Date().toISOString().slice(0, 10);
const estaHora = () => new Date().toISOString().slice(0, 13);

/**
 * Soma um ao contador e devolve o novo valor, numa ida só ao banco (ler e
 * depois gravar deixaria duas requisições simultâneas passarem juntas).
 * Falha aberta: banco fora não pode derrubar o chat.
 */
async function somar(chave: string) {
  if (!sql) return 0;
  try {
    await garantirEsquema();
    const linhas = (await sql.query(
      `INSERT INTO meta (chave, valor) VALUES ($1, '1')
       ON CONFLICT (chave)
       DO UPDATE SET valor = (COALESCE(NULLIF(meta.valor, '')::int, 0) + 1)::text,
                     em = now()
       RETURNING valor`,
      [chave]
    )) as Array<{ valor: string }>;
    return Number(linhas[0]?.valor ?? 0);
  } catch {
    return 0;
  }
}

async function ler(chave: string) {
  if (!sql) return 0;
  try {
    await garantirEsquema();
    const linhas = (await sql.query("SELECT valor FROM meta WHERE chave = $1", [
      chave,
    ])) as Array<{ valor: string }>;
    return Number(linhas[0]?.valor ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** Mais uma conversa nova deste endereço hoje. Falso quando passou do limite. */
export async function podeAbrirConversa(origem: string) {
  return (await somar(`chat-novas:${origem}:${hoje()}`)) <= LIMITES.conversasPorEndereco;
}

/** Mais uma passagem para a equipe deste endereço hoje. */
export async function podePassarParaEquipe(origem: string) {
  return (await somar(`chat-passagens:${origem}:${hoje()}`)) <= LIMITES.passagensPorEndereco;
}

/** Mais uma ficha de contato (lead no CRM) deste endereço hoje. */
export async function podeMandarFicha(origem: string) {
  return (await somar(`chat-fichas:${origem}:${hoje()}`)) <= LIMITES.fichasPorEndereco;
}

/* ---------------- Pausa manual do assistente ---------------- */

const CHAVE_PAUSA = "assistente:pausado";

export async function assistentePausado() {
  return (await ler(CHAVE_PAUSA)) === 1;
}

export async function pausarAssistente(pausar: boolean) {
  if (!sql) return;
  await garantirEsquema();
  await sql.query(
    `INSERT INTO meta (chave, valor) VALUES ($1, $2)
     ON CONFLICT (chave) DO UPDATE SET valor = $2, em = now()`,
    [CHAVE_PAUSA, pausar ? "1" : "0"]
  );
}

/* ---------------- O filtro antes do modelo ---------------- */

export type Barreira =
  | "pausado"
  | "surto"
  | "limite-visitante"
  | "repetida"
  | "lixo";

/** Mensagem sem conteúdo que valha uma chamada ao modelo. */
function ehLixo(texto: string) {
  const letras = texto.match(/\p{L}/gu)?.length ?? 0;
  if (letras === 0) return true;

  // "aaaaaaaaaa", "kkkkkkkkkkkkkkkk" longos: um caractere só dominando.
  const semEspaco = texto.replace(/\s/g, "");
  if (semEspaco.length >= 12) {
    const contagem = new Map<string, number>();
    for (const c of semEspaco.toLowerCase()) contagem.set(c, (contagem.get(c) ?? 0) + 1);
    const maior = Math.max(...contagem.values());
    if (maior / semEspaco.length > 0.7) return true;
  }
  return false;
}

/**
 * Decide se esta mensagem pode ir ao modelo. Devolve o motivo quando não
 * pode, e null quando pode — e, quando pode, já conta a resposta nos
 * limites do endereço e da hora.
 *
 * `anteriores` são as últimas falas do visitante nesta conversa, para pegar
 * a mesma frase colada de novo e de novo.
 */
export async function barreiraParaOAssistente(dados: {
  origem: string;
  texto: string;
  anteriores: string[];
}): Promise<Barreira | null> {
  if (await assistentePausado()) return "pausado";

  const normal = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ");
  if (dados.anteriores.some((a) => normal(a) === normal(dados.texto))) return "repetida";
  if (ehLixo(dados.texto)) return "lixo";

  // Hora cheia: o disjuntor está aberto até a hora virar. Lido antes de
  // somar, para quem chega depois do surto não empurrar o contador para
  // sempre.
  const chaveHora = `assistente:hora:${estaHora()}`;
  if ((await ler(chaveHora)) >= LIMITES.respostasPorHora) return "surto";

  if ((await somar(`chat-ia:${dados.origem}:${hoje()}`)) > LIMITES.respostasPorEndereco) {
    return "limite-visitante";
  }

  const naHora = await somar(chaveHora);
  if (naHora > LIMITES.respostasPorHora) return "surto";
  return null;
}

/** Se o disjuntor acabou de abrir nesta hora (para avisar a equipe uma vez só). */
export async function surtoAcabouDeAbrir() {
  return (await somar(`assistente:surto-avisado:${estaHora()}`)) === 1;
}

/** O que o chat diz em cada caso. Sem passar para a equipe, sempre com o WhatsApp. */
export function recadoDaBarreira(motivo: Barreira) {
  const whatsapp = "chama no WhatsApp (83) 99106-0691";
  switch (motivo) {
    case "repetida":
      return "Já recebi essa mensagem. Se quiser, me conta com outras palavras o que você precisa.";
    case "lixo":
      return "Não entendi. Pode escrever sua dúvida com palavras?";
    case "pausado":
      return `O atendimento automático está em pausa agora. Para falar com a equipe, ${whatsapp}.`;
    case "surto":
      return `Estamos com muito movimento no chat neste momento. Para não te deixar esperando, ${whatsapp}.`;
    case "limite-visitante":
      return `Por hoje já conversamos bastante por aqui. Para seguir, ${whatsapp} — lá a equipe te atende direto.`;
  }
}

/** Respostas do assistente hoje e nesta hora, para o painel. */
export async function usoDoAssistente() {
  const [dia, hora, pausado] = await Promise.all([
    ler(`assistente:${hoje()}`),
    ler(`assistente:hora:${estaHora()}`),
    assistentePausado(),
  ]);
  return { dia, hora, pausado };
}
