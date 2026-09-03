import { cookies } from "next/headers";
import { montarSessao, sessaoValida } from "@/lib/seguranca";
import { sql, garantirEsquema } from "@/lib/db";

// Sessão do painel.
//
// O cookie leva "carimbo.assinatura", nunca a senha (ver lib/seguranca.ts).
// A senha do painel é separada da senha do site de propósito: a do site pode
// ser passada a um cliente para ver o trabalho; a do painel dá poder de apagar
// conteúdo, e não deve circular junto.
export const COOKIE_ADMIN = "lanca_admin";

/** Uma jornada de trabalho. Depois disso, entrar de novo. */
export const JANELA_ADMIN_MS = 8 * 60 * 60 * 1000;

/** Chave da segunda etapa na tabela meta. */
export const CHAVE_TOTP = "totp:segredo";

export async function montarValorAdmin(senha: string) {
  return montarSessao(senha);
}

export type EstadoAdmin = "liberado" | "sem-senha" | "deslogado";

export async function estadoDoAdmin(): Promise<EstadoAdmin> {
  const senha = process.env.ADMIN_SENHA;

  // Falha fechado: sem ADMIN_SENHA definida, o painel não abre para ninguém.
  if (!senha) return "sem-senha";

  const cookie = (await cookies()).get(COOKIE_ADMIN)?.value;
  const valido = await sessaoValida(cookie, senha, JANELA_ADMIN_MS);

  return valido ? "liberado" : "deslogado";
}

// Toda Server Action de escrita começa chamando isto.
//
// Não é redundante com a tela de login: Server Actions são alcançáveis por POST
// direto, sem passar pela interface, então a autorização precisa ser conferida
// dentro de cada uma (é o aviso explícito da documentação do Next).
export async function exigirAdmin() {
  if ((await estadoDoAdmin()) !== "liberado") {
    throw new Error("Não autorizado.");
  }
}

/* ---------------- Segunda etapa ---------------- */

/** Segredo da verificação em duas etapas, ou null quando não está ativada. */
export async function segredoTotp(): Promise<string | null> {
  if (!sql) return null;

  try {
    await garantirEsquema();
    const linhas = (await sql.query("SELECT valor FROM meta WHERE chave = $1", [
      CHAVE_TOTP,
    ])) as Array<{ valor: string }>;
    return linhas[0]?.valor || null;
  } catch {
    // Sem banco, o painel segue funcionando só com a senha. Falhar aqui
    // trancaria a pessoa para fora por um problema que não é de segurança.
    return null;
  }
}

export async function guardarSegredoTotp(segredo: string) {
  if (!sql) throw new Error("Banco de dados não configurado.");
  await garantirEsquema();
  await sql.query(
    "INSERT INTO meta (chave, valor) VALUES ($1, $2) ON CONFLICT (chave) DO UPDATE SET valor = $2, em = now()",
    [CHAVE_TOTP, segredo]
  );
}

export async function removerSegredoTotp() {
  if (!sql) return;
  await garantirEsquema();
  await sql.query("DELETE FROM meta WHERE chave = $1", [CHAVE_TOTP]);
}
