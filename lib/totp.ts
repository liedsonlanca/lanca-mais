// Verificação em duas etapas, no padrão TOTP (RFC 6238).
//
// É o mesmo mecanismo do Google Authenticator, do Authy e do gerenciador de
// senhas do iPhone: um segredo é combinado com o relógio para produzir seis
// dígitos que mudam a cada trinta segundos. O servidor faz a mesma conta e
// compara.
//
// Implementado aqui em vez de instalar uma biblioteca: são poucas linhas sobre
// Web Crypto, e uma dependência a menos é uma superfície a menos para vigiar.

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PASSO_SEGUNDOS = 30;

/** Segredo novo, em base32, que é o formato que os aplicativos leem. */
export function gerarSegredo(bytes = 20) {
  const aleatorio = crypto.getRandomValues(new Uint8Array(bytes));
  let saida = "";
  for (const b of aleatorio) saida += ALFABETO[b % 32];
  return saida;
}

function base32ParaBytes(texto: string) {
  const limpo = texto.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const bytes: number[] = [];
  let acumulado = 0;
  let bits = 0;

  for (const caractere of limpo) {
    const valor = ALFABETO.indexOf(caractere);
    if (valor === -1) continue;

    acumulado = (acumulado << 5) | valor;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((acumulado >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

async function codigoNoPasso(segredo: string, passo: number) {
  // O contador é um inteiro de 8 bytes, big-endian.
  const contador = new Uint8Array(8);
  let resto = passo;
  for (let i = 7; i >= 0; i -= 1) {
    contador[i] = resto & 0xff;
    resto = Math.floor(resto / 256);
  }

  const chave = await crypto.subtle.importKey(
    "raw",
    base32ParaBytes(segredo),
    // SHA-1 aqui não é escolha de segurança, é o que a norma define e o que
    // todo aplicativo autenticador espera. Trocar quebraria a compatibilidade.
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const hmac = new Uint8Array(
    await crypto.subtle.sign("HMAC", chave, contador)
  );

  // Truncagem dinâmica: os últimos 4 bits dizem de onde tirar os 4 bytes.
  const inicio = hmac[hmac.length - 1] & 0x0f;
  const numero =
    ((hmac[inicio] & 0x7f) << 24) |
    (hmac[inicio + 1] << 16) |
    (hmac[inicio + 2] << 8) |
    hmac[inicio + 3];

  return String(numero % 1_000_000).padStart(6, "0");
}

/**
 * Confere o código digitado.
 *
 * A janela de tolerância aceita o passo anterior e o seguinte: relógios de
 * celular e servidor raramente batem no segundo, e sem essa folga um código
 * digitado no fim dos trinta segundos seria recusado sem motivo aparente.
 */
export async function codigoValido(segredo: string, codigo: string, folga = 1) {
  const limpo = codigo.replace(/\D/g, "");
  if (limpo.length !== 6 || !segredo) return false;

  const passoAtual = Math.floor(Date.now() / 1000 / PASSO_SEGUNDOS);

  for (let d = -folga; d <= folga; d += 1) {
    const esperado = await codigoNoPasso(segredo, passoAtual + d);
    // Comparação simples serve aqui: os dois lados têm sempre seis dígitos e
    // o valor muda a cada trinta segundos.
    if (esperado === limpo) return true;
  }

  return false;
}

/** Endereço que o aplicativo autenticador lê ao escanear o QR. */
export function uriDeConfiguracao(segredo: string, conta: string, emissor: string) {
  const rotulo = encodeURIComponent(`${emissor}:${conta}`);
  const parametros = new URLSearchParams({
    secret: segredo,
    issuer: emissor,
    algorithm: "SHA1",
    digits: "6",
    period: String(PASSO_SEGUNDOS),
  });
  return `otpauth://totp/${rotulo}?${parametros.toString()}`;
}
