/**
 * Diz se um conteúdo ainda é o provisório, que vem com colchetes, como
 * "[Nome do cliente]".
 *
 * A home esconde depoimento, case e o que mais for prova social enquanto ele
 * for provisório: na parte mais vista do site, um texto entre colchetes
 * passaria por descuido, e um inventado passaria por verdadeiro. Assim que a
 * agência cadastra o real pelo painel, a seção aparece sozinha.
 *
 * Mora sozinho, sem importar nada, de propósito: a abertura da home roda no
 * navegador, e lib/conteudo importa o banco. Tirar isto de lá levaria o código
 * do banco para o pacote que o visitante baixa.
 */
export function ehProvisorio(...textos: Array<string | null | undefined>) {
  return textos.some((t) => typeof t === "string" && /[[\]]/.test(t));
}
