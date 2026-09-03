import { cookies } from "next/headers";

// Sessão do painel.
//
// Mesma mecânica do portão de pré-lançamento em proxy.ts, e pelo mesmo motivo:
// o prazo mora dentro do valor do cookie e é conferido no servidor, porque o
// navegador não é confiável para descartar cookie de sessão (o Chrome restaura
// sessão ao reabrir).
//
// A senha do painel é separada da senha do site de propósito. A do site pode
// ser passada para um cliente ver o trabalho; a do painel dá poder de apagar
// conteúdo, e não deve circular junto.
export const COOKIE_ADMIN = "lanca_admin";

/** Uma jornada de trabalho. Depois disso, entrar de novo. */
export const JANELA_ADMIN_MS = 8 * 60 * 60 * 1000;

export function montarValorAdmin(senha: string) {
  return `${senha}.${Date.now()}`;
}

export function lerValorAdmin(valor: string | undefined) {
  if (!valor) return null;

  // Último ponto: a senha pode conter pontos.
  const corte = valor.lastIndexOf(".");
  if (corte === -1) return null;

  const emitidoEm = Number(valor.slice(corte + 1));
  if (!Number.isFinite(emitidoEm)) return null;

  return { senha: valor.slice(0, corte), emitidoEm };
}

/** Estados possíveis do painel, para a tela saber o que dizer. */
export type EstadoAdmin = "liberado" | "sem-senha" | "deslogado";

export async function estadoDoAdmin(): Promise<EstadoAdmin> {
  const senha = process.env.ADMIN_SENHA;

  // Falha fechado: sem ADMIN_SENHA definida, o painel não abre para ninguém.
  if (!senha) return "sem-senha";

  const guardado = lerValorAdmin((await cookies()).get(COOKIE_ADMIN)?.value);

  const valido =
    guardado !== null &&
    guardado.senha === senha &&
    Date.now() - guardado.emitidoEm < JANELA_ADMIN_MS;

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
