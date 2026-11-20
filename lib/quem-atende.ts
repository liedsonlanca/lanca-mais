import { cookies } from "next/headers";
import { lerEquipe } from "@/lib/conteudo";

/** O cookie que diz quem está atendendo neste navegador. */
export const COOKIE_ATENDENTE = "lanca_atendente";

/**
 * Quem está atendendo neste navegador.
 *
 * Não é um login por pessoa — o painel continua com uma senha só —, é a
 * pessoa dizendo quem é, como quem assina um bilhete. Serve para o visitante
 * ver "Liédson · LANÇA+" em vez de uma equipe sem rosto, e para a conversa
 * ter um responsável. O nome só vale se estiver na lista da equipe.
 */
export async function atendenteAtual() {
  const nome = (await cookies()).get(COOKIE_ATENDENTE)?.value ?? "";
  if (!nome) return "";
  const equipe = await lerEquipe();
  return equipe.some((p) => p.nome === nome) ? nome : "";
}

