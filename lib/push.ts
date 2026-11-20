import webpush from "web-push";
import { sql, garantirEsquema } from "@/lib/db";

// Avisos no celular e no computador da equipe (notificação push).
//
// ---------- Por que push, e não e-mail ou WhatsApp ----------
//
// O painel só avisava quem estava com ele aberto. Push chega com o navegador
// fechado, na tela de bloqueio do celular, sem conta em serviço nenhum: o
// próprio navegador (Chrome, Safari, Edge) entrega. No iPhone, o painel
// precisa estar adicionado à tela de início — é a regra da Apple para push
// de site.
//
// ---------- As chaves ----------
//
// O padrão (VAPID) pede um par de chaves que identifica o site junto aos
// serviços de push. Em vez de mais duas variáveis para configurar na Vercel,
// o par nasce sozinho no primeiro uso e mora no banco, como o segredo do
// segundo fator do painel. Trocar o par invalida os aparelhos cadastrados —
// por isso ele nunca é regerado depois de existir.

const CHAVE_VAPID = "push:vapid";

type Par = { publicKey: string; privateKey: string };

let emMemoria: Par | null = null;

async function parDeChaves(): Promise<Par | null> {
  if (emMemoria) return emMemoria;
  if (!sql) return null;
  await garantirEsquema();

  const linhas = (await sql.query("SELECT valor FROM meta WHERE chave = $1", [
    CHAVE_VAPID,
  ])) as Array<{ valor: string }>;

  if (linhas[0]?.valor) {
    emMemoria = JSON.parse(linhas[0].valor) as Par;
    return emMemoria;
  }

  // ON CONFLICT DO NOTHING e releitura: duas instâncias nascendo juntas
  // gerariam dois pares, e só um pode valer.
  const novo = webpush.generateVAPIDKeys();
  await sql.query(
    "INSERT INTO meta (chave, valor) VALUES ($1, $2) ON CONFLICT (chave) DO NOTHING",
    [CHAVE_VAPID, JSON.stringify(novo)]
  );
  emMemoria = null;
  return parDeChaves();
}

/** A chave pública, que o navegador do painel usa para se inscrever. */
export async function chavePublica() {
  return (await parDeChaves())?.publicKey ?? "";
}

export async function guardarAparelho(inscricao: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  if (!sql) return;
  await garantirEsquema();
  await sql.query(
    `INSERT INTO aparelhos_push (endereco, p256dh, auth) VALUES ($1, $2, $3)
     ON CONFLICT (endereco) DO UPDATE SET p256dh = $2, auth = $3`,
    [inscricao.endpoint, inscricao.keys.p256dh, inscricao.keys.auth]
  );
}

export async function esquecerAparelho(endereco: string) {
  if (!sql) return;
  await garantirEsquema();
  await sql.query("DELETE FROM aparelhos_push WHERE endereco = $1", [endereco]);
}

/**
 * Avisa todos os aparelhos da equipe.
 *
 * `tag` agrupa: avisos com a mesma tag substituem o anterior em vez de
 * empilhar, então dez mensagens seguidas da mesma pessoa viram um aviso só,
 * atualizado, e não dez.
 *
 * Nunca lança: aviso é acessório, e falhar aqui não pode derrubar a
 * resposta ao visitante.
 */
export async function avisarEquipe(aviso: {
  titulo: string;
  texto: string;
  url: string;
  tag?: string;
}) {
  try {
    const par = await parDeChaves();
    if (!par || !sql) return;

    const aparelhos = (await sql.query(
      "SELECT endereco, p256dh, auth FROM aparelhos_push",
      []
    )) as Array<{ endereco: string; p256dh: string; auth: string }>;
    if (aparelhos.length === 0) return;

    webpush.setVapidDetails(
      "mailto:contato@lancamais.com",
      par.publicKey,
      par.privateKey
    );

    const corpo = JSON.stringify({
      titulo: aviso.titulo,
      texto: aviso.texto.slice(0, 180),
      url: aviso.url,
      tag: aviso.tag ?? "",
    });

    await Promise.all(
      aparelhos.map(async (a) => {
        try {
          await webpush.sendNotification(
            { endpoint: a.endereco, keys: { p256dh: a.p256dh, auth: a.auth } },
            corpo,
            // Um aviso de chat velho não serve: se o aparelho estiver
            // desligado por mais de uma hora, melhor não entregar.
            { TTL: 3600, urgency: "high" }
          );
        } catch (erro) {
          const status = (erro as { statusCode?: number }).statusCode;
          // 404/410: o navegador desinscreveu (app removido, permissão
          // revogada). Não adianta insistir.
          if (status === 404 || status === 410) {
            await esquecerAparelho(a.endereco);
          } else {
            console.error("[push] falhou", status ?? erro);
          }
        }
      })
    );
  } catch (erro) {
    console.error("[push] falhou", erro);
  }
}
