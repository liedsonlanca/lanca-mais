// Como as horas são escritas no painel.
//
// ---------- O bug que isto conserta ----------
//
// A tela da conversa é desenhada no servidor, e `toLocaleString` sem fuso
// usa o fuso de quem desenha. O servidor da Vercel roda em UTC, então uma
// mensagem das 14h aparecia como 17h para quem estava em João Pessoa — três
// horas adiantada, sem nada na tela indicando isso.
//
// A lista ao lado é desenhada no navegador, e ali a hora saía certa. Duas
// telas do mesmo painel discordando sobre a mesma mensagem é pior do que as
// duas erradas: quem vê não sabe em qual acreditar.
//
// Com o fuso escrito, as duas dizem a mesma coisa, e dizem a hora de quem
// trabalha — que é o que importa num painel de atendimento.

const FUSO = "America/Recife";

/** Dia e hora, como "18/11, 14:03". */
export function horaDaAgencia(iso: string) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";

  return data.toLocaleString("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Só o dia, como "18/11/26". */
export function diaDaAgencia(iso: string) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";

  return data.toLocaleDateString("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/**
 * Quanto tempo faz, em palavras.
 *
 * Usa o instante, não o relógio de parede, então não depende de fuso — a
 * diferença entre dois instantes é a mesma em qualquer lugar do mundo.
 */
export function quantoFaz(iso: string) {
  const quando = new Date(iso).getTime();
  if (!Number.isFinite(quando)) return "";

  const minutos = Math.round((Date.now() - quando) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `${minutos} min`;

  const horas = Math.round(minutos / 60);
  if (horas < 24) return `${horas} h`;

  return diaDaAgencia(iso);
}
