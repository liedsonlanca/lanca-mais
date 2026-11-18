// O horário de atendimento humano da LANÇA+.
//
// ---------- Por que isso existe ----------
//
// O assistente responde a qualquer hora, todo dia. A equipe não. Sem dizer
// isso, quem pede para falar com alguém às onze da noite fica esperando uma
// resposta que só sai às oito e meia — e, sem aviso, essa espera parece
// descaso em vez de expediente.
//
// Dito na hora, o mesmo fato vira informação: "a equipe responde amanhã a
// partir das 8h30". A pessoa decide se espera ou se chama no WhatsApp.
//
// ---------- Por que o fuso é escrito à mão ----------
//
// O servidor da Vercel roda em UTC, e o navegador do visitante roda no fuso
// dele — que pode ser outro. Nenhum dos dois serve para responder "a equipe
// está trabalhando agora?", porque quem trabalha é a equipe, em João Pessoa.
//
// America/Recife, e não America/Sao_Paulo: a Paraíba não teve horário de
// verão nem quando o Sudeste teve, e se ele voltar um dia os dois fusos
// voltam a divergir. Hoje dá no mesmo; o nome certo continua certo depois.

const FUSO = "America/Recife";

/** As janelas de atendimento humano, em minutos desde a meia-noite. */
const JANELAS = [
  { de: 8 * 60 + 30, ate: 11 * 60 + 30 }, // 8h30 às 11h30
  { de: 14 * 60, ate: 17 * 60 }, // 14h às 17h
];

/**
 * Os dias de expediente: segunda a sexta.
 *
 * Não foi dito com todas as letras, então ficou o que é padrão de agência.
 * Se a equipe atender sábado, é esta linha que muda.
 */
const DIAS_UTEIS = [1, 2, 3, 4, 5];

/** Que horas são em João Pessoa, independentemente de onde o código roda. */
function agoraNaParaiba(quando = new Date()) {
  // `en-GB` para o relógio de 24 horas sair sem "am/pm" e sem o "24:00" que
  // o `en-US` devolve à meia-noite.
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUSO,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(quando);

  const achar = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? "";

  const semana = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    dia: semana.indexOf(achar("weekday")),
    minutos: Number(achar("hour")) * 60 + Number(achar("minute")),
  };
}

/** Se há gente da LANÇA+ trabalhando neste instante. */
export function equipeNoExpediente(quando = new Date()) {
  const { dia, minutos } = agoraNaParaiba(quando);
  if (!DIAS_UTEIS.includes(dia)) return false;
  return JANELAS.some((j) => minutos >= j.de && minutos < j.ate);
}

function comoHora(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/**
 * Quando a equipe volta, em português de gente.
 *
 * Devolve "" quando ela já está atendendo — assim quem chama esta função
 * pode simplesmente não dizer nada nesse caso.
 */
export function quandoAEquipeVolta(quando = new Date()) {
  const { dia, minutos } = agoraNaParaiba(quando);
  const hoje = DIAS_UTEIS.includes(dia);

  if (hoje) {
    if (JANELAS.some((j) => minutos >= j.de && minutos < j.ate)) return "";

    const proxima = JANELAS.find((j) => minutos < j.de);
    if (proxima) return `hoje a partir das ${comoHora(proxima.de)}`;
  }

  // Passou do expediente de hoje, ou hoje não é dia útil: procura o próximo
  // dia útil, no máximo uma semana à frente.
  for (let adiante = 1; adiante <= 7; adiante += 1) {
    const seguinte = (dia + adiante) % 7;
    if (!DIAS_UTEIS.includes(seguinte)) continue;

    const quandoAbre = comoHora(JANELAS[0].de);
    if (adiante === 1) return `amanhã a partir das ${quandoAbre}`;

    const nomes = [
      "domingo",
      "segunda",
      "terça",
      "quarta",
      "quinta",
      "sexta",
      "sábado",
    ];
    return `${nomes[seguinte]} a partir das ${quandoAbre}`;
  }

  return "no próximo dia útil";
}

/** O horário, escrito. Vai na tela do chat e na base do assistente. */
export const HORARIO_ESCRITO =
  "A equipe atende de segunda a sexta, das 8h30 às 11h30 e das 14h às 17h. " +
  "O assistente do site responde a qualquer hora, todo dia.";
