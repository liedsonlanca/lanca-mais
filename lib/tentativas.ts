import { sql, garantirEsquema } from "@/lib/db";

// Freio para tentativa em massa de senha.
//
// O atraso de 600ms que existia antes atrasa um humano, não um script: quem
// tenta mil senhas em paralelo não sente. Aqui as tentativas ficam contadas
// por endereço de origem, na tabela meta, para sobreviverem à troca de
// instância do servidor — memória local não serviria, já que cada requisição
// pode cair numa instância diferente.
const LIMITE = 8;
const JANELA_MS = 15 * 60 * 1000;

type Registro = { n: number; ate: number };

function chave(escopo: string, origem: string) {
  return `tentativas:${escopo}:${origem}`;
}

/** Endereço de quem chamou, pelos cabeçalhos que a Vercel preenche. */
export function origemDaRequisicao(request: Request) {
  const encaminhado = request.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "desconhecida";
}

async function ler(k: string): Promise<Registro | null> {
  const linhas = (await sql!.query("SELECT valor FROM meta WHERE chave = $1", [
    k,
  ])) as Array<{ valor: string }>;

  if (!linhas[0]?.valor) return null;
  try {
    return JSON.parse(linhas[0].valor) as Registro;
  } catch {
    return null;
  }
}

/**
 * Diz se ainda pode tentar.
 *
 * Falha aberto de propósito: se o banco estiver fora, ninguém deve ficar
 * trancado para fora do próprio painel. O freio é uma camada a mais, não a
 * única — a senha continua sendo a barreira.
 */
export async function podeTentar(escopo: string, origem: string) {
  if (!sql) return { permitido: true, restantes: LIMITE, ate: 0 };

  try {
    await garantirEsquema();
    const registro = await ler(chave(escopo, origem));

    if (!registro || Date.now() > registro.ate) {
      return { permitido: true, restantes: LIMITE, ate: 0 };
    }

    return {
      permitido: registro.n < LIMITE,
      restantes: Math.max(0, LIMITE - registro.n),
      // Quando a janela vence. Vai junto para a tela dizer quanto falta, em
      // vez de repetir "quinze minutos" quando faltam dois.
      ate: registro.ate,
    };
  } catch {
    return { permitido: true, restantes: LIMITE, ate: 0 };
  }
}

export async function registrarFalha(escopo: string, origem: string) {
  if (!sql) return;

  try {
    await garantirEsquema();
    const k = chave(escopo, origem);
    const registro = await ler(k);

    const novo: Registro =
      registro && Date.now() <= registro.ate
        ? { n: registro.n + 1, ate: registro.ate }
        : { n: 1, ate: Date.now() + JANELA_MS };

    await sql.query(
      "INSERT INTO meta (chave, valor) VALUES ($1, $2) ON CONFLICT (chave) DO UPDATE SET valor = $2, em = now()",
      [k, JSON.stringify(novo)]
    );
  } catch {
    // Não deixar o registro do erro virar o erro.
  }
}

/** Acertou: o contador daquele endereço zera. */
export async function limparTentativas(escopo: string, origem: string) {
  if (!sql) return;
  try {
    await sql.query("DELETE FROM meta WHERE chave = $1", [chave(escopo, origem)]);
  } catch {
    // idem
  }
}

export const LIMITE_TENTATIVAS = LIMITE;
