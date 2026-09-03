// Sessões assinadas.
//
// Antes o cookie guardava a própria senha: "senha.carimbo". Funcionava, mas
// quem obtivesse o cookie teria a senha em mãos — e uma senha vale para
// sempre, enquanto uma sessão vence. Cookie httpOnly não é lido por script,
// mas vaza por backup de perfil, extensão do navegador, máquina compartilhada
// ou alguém abrindo o DevTools.
//
// Agora o cookie leva "carimbo.assinatura", e a assinatura é um HMAC do
// carimbo com a senha como chave. O servidor confere refazendo o cálculo. A
// senha nunca sai do servidor, e um cookie roubado expira sozinho.
//
// Usa Web Crypto, e não node:crypto, porque o porteiro em proxy.ts roda no
// runtime de borda, onde node:crypto não existe.

const codificador = new TextEncoder();

async function chaveDe(segredo: string) {
  return crypto.subtle.importKey(
    "raw",
    codificador.encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function assinar(mensagem: string, segredo: string) {
  const assinatura = await crypto.subtle.sign(
    "HMAC",
    await chaveDe(segredo),
    codificador.encode(mensagem)
  );

  return Array.from(new Uint8Array(assinatura))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Comparação em tempo constante.
 *
 * Comparar com === para na primeira letra diferente, e o tempo de resposta
 * revela quantos caracteres estavam certos. Sobre a internet o ruído esconde
 * quase tudo isso, mas o custo de fazer certo é uma função de cinco linhas.
 */
export function comparaSegura(a: string, b: string) {
  if (a.length !== b.length) return false;

  let diferenca = 0;
  for (let i = 0; i < a.length; i += 1) {
    diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferenca === 0;
}

/** Valor do cookie de uma sessão que começa agora. */
export async function montarSessao(segredo: string) {
  const emitidoEm = String(Date.now());
  return `${emitidoEm}.${await assinar(emitidoEm, segredo)}`;
}

/** Confere assinatura e prazo. Devolve falso para qualquer coisa estranha. */
export async function sessaoValida(
  valor: string | undefined,
  segredo: string,
  janelaMs: number
) {
  if (!valor || !segredo) return false;

  const corte = valor.lastIndexOf(".");
  if (corte === -1) return false;

  const emitidoEm = valor.slice(0, corte);
  const assinaturaRecebida = valor.slice(corte + 1);

  const instante = Number(emitidoEm);
  if (!Number.isFinite(instante)) return false;

  // Prazo conferido antes da assinatura: cookie vencido não merece o cálculo.
  // Também recusa carimbo no futuro, que só apareceria em tentativa de forja.
  const idade = Date.now() - instante;
  if (idade < 0 || idade >= janelaMs) return false;

  return comparaSegura(assinaturaRecebida, await assinar(emitidoEm, segredo));
}
