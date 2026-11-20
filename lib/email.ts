import { sql, garantirEsquema } from "@/lib/db";
import { siteConfig } from "@/lib/site-config";

// E-mail ao visitante quando a equipe responde e ele já saiu do chat.
//
// ---------- Por que existe ----------
//
// A resposta da equipe chega pelo chat, e o chat só existe com a página
// aberta. Quem deixou o e-mail e foi embora nunca veria a resposta — e um
// lead que pergunta o preço e não recebe resposta é um lead perdido.
//
// ---------- Desligado até ter conta ----------
//
// O envio usa o Resend (resend.com), por uma chamada HTTP simples, sem
// pacote. Sem RESEND_API_KEY e EMAIL_REMETENTE na Vercel, nada é enviado e
// nada quebra: é o mesmo chat de antes.
//
// ---------- Quando manda ----------
//
// Só se o visitante não está com o chat aberto e à vista (não "leu" nos
// últimos dois minutos), e no máximo um e-mail a cada 30 minutos por
// conversa: três respostas seguidas da equipe viram um e-mail, não três.

const CHAVE = process.env.RESEND_API_KEY ?? "";
const REMETENTE = process.env.EMAIL_REMETENTE ?? "";

export const emailLigado = () => Boolean(CHAVE && REMETENTE);

function escapar(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function avisarVisitantePorEmail(conversa: number, resposta: string, quem: string) {
  if (!emailLigado() || !sql) return;

  try {
    await garantirEsquema();

    // Reserva o envio no mesmo comando que confere as condições: duas
    // respostas quase juntas não mandam dois e-mails.
    const linhas = (await sql.query(
      `UPDATE conversas
          SET avisado_por_email_em = now()
        WHERE id = $1
          AND email <> ''
          AND estado = 'equipe'
          AND (cliente_viu_em IS NULL OR cliente_viu_em < now() - interval '2 minutes')
          AND (avisado_por_email_em IS NULL OR avisado_por_email_em < now() - interval '30 minutes')
        RETURNING email, nome, chave`,
      [conversa]
    )) as Array<{ email: string; nome: string; chave: string }>;

    const alvo = linhas[0];
    if (!alvo) return;

    const primeiro = alvo.nome.split(/\s+/)[0] || "Olá";
    const link = `${siteConfig.url.replace(/\/$/, "")}/?conversa=${alvo.chave}`;
    const assinatura = quem ? `${quem}, da ${siteConfig.name}` : `Equipe ${siteConfig.name}`;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1a1917">
        <p style="font-size:16px">${escapar(primeiro)}, respondemos sua mensagem no chat do site:</p>
        <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #dd8a55;background:#f6f1e7;font-size:15px;line-height:1.5;white-space:pre-line">${escapar(resposta)}</blockquote>
        <p style="font-size:14px;color:#555">— ${escapar(assinatura)}</p>
        <p style="margin:24px 0">
          <a href="${link}" style="background:#dd8a55;color:#0a0a08;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold;font-size:14px">Continuar a conversa</a>
        </p>
        <p style="font-size:12px;color:#888">Você recebeu este e-mail porque deixou seu contato no chat de ${escapar(siteConfig.name)}. Se preferir, responda pelo WhatsApp.</p>
      </div>`;

    const envio = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHAVE}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REMETENTE,
        to: [alvo.email],
        subject: `${siteConfig.name} respondeu sua mensagem`,
        html,
        text: `${primeiro}, respondemos sua mensagem no chat:\n\n${resposta}\n\n— ${assinatura}\n\nContinuar a conversa: ${link}`,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!envio.ok) {
      console.error("[email] Resend respondeu", envio.status);
      // Libera para a próxima resposta tentar de novo.
      await sql.query(
        "UPDATE conversas SET avisado_por_email_em = NULL WHERE id = $1",
        [conversa]
      );
    }
  } catch (erro) {
    console.error("[email] falhou", erro);
  }
}
