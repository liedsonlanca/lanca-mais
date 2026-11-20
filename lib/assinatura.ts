import { sql, garantirEsquema } from "@/lib/db";

// Assinatura dos links de "Continuar a conversa" do e-mail.
//
// ---------- O ataque que isto impede ----------
//
// O link carrega a chave da conversa. Se o site aceitasse qualquer chave
// vinda pela barra de endereço, um golpista poderia abrir uma conversa, pegar
// a chave dela e mandar a alguém um link "lancamais.com/?conversa=CHAVE".
// Quem clicasse passaria a conversar dentro da conversa do golpista — e o
// golpista, perguntando pela mesma chave, leria tudo o que a vítima
// escrevesse, inclusive nome, WhatsApp e e-mail.
//
// Com a assinatura, só vale o link que o próprio site gerou, e por 14 dias.
// O segredo nasce no primeiro uso e mora no banco, como as chaves do push.

const CHAVE_DO_SEGREDO = "segredo:links";
const VALIDADE_MS = 14 * 24 * 60 * 60 * 1000;
const codificador = new TextEncoder();

let segredo: CryptoKey | null = null;

async function chaveHmac() {
  if (segredo) return segredo;
  if (!sql) return null;
  await garantirEsquema();

  let linhas = (await sql.query("SELECT valor FROM meta WHERE chave = $1", [
    CHAVE_DO_SEGREDO,
  ])) as Array<{ valor: string }>;

  if (!linhas[0]?.valor) {
    const novo = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await sql.query(
      "INSERT INTO meta (chave, valor) VALUES ($1, $2) ON CONFLICT (chave) DO NOTHING",
      [CHAVE_DO_SEGREDO, novo]
    );
    linhas = (await sql.query("SELECT valor FROM meta WHERE chave = $1", [
      CHAVE_DO_SEGREDO,
    ])) as Array<{ valor: string }>;
  }

  segredo = await crypto.subtle.importKey(
    "raw",
    codificador.encode(linhas[0].valor),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return segredo;
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Os parâmetros do link assinado: `conversa`, `t` e `v`. */
export async function assinarLinkDaConversa(chave: string) {
  const k = await chaveHmac();
  if (!k) return null;
  const t = Date.now().toString(36);
  const v = hex(await crypto.subtle.sign("HMAC", k, codificador.encode(`${chave}.${t}`)));
  return { conversa: chave, t, v };
}

export async function linkValido(chave: string, t: string, v: string) {
  if (!/^[a-f0-9]{32}$/.test(chave) || !/^[a-z0-9]{1,12}$/.test(t) || !/^[a-f0-9]{64}$/.test(v)) {
    return false;
  }
  const quando = parseInt(t, 36);
  if (!Number.isFinite(quando) || Date.now() - quando > VALIDADE_MS || quando > Date.now() + 60_000) {
    return false;
  }
  const k = await chaveHmac();
  if (!k) return false;
  const bytes = new Uint8Array(v.match(/../g)!.map((h) => parseInt(h, 16)));
  // verify compara em tempo constante.
  return crypto.subtle.verify("HMAC", k, bytes, codificador.encode(`${chave}.${t}`));
}
