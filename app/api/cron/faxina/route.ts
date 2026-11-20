import { NextResponse } from "next/server";
import { sql, garantirEsquema } from "@/lib/db";
import {
  apagarArquivosVencidos,
  apagarConversasAntigas,
  encerrarPorSilencio,
} from "@/lib/conversas";

// A faxina diária, chamada pela Vercel (ver vercel.json).
//
// ---------- O que faz ----------
//
// Encerra o que morreu de silêncio e não foi visto por ninguém — o
// encerramento normal pega carona no movimento do site, e uma conversa
// esquecida num fim de semana sem visitas ficaria aberta até segunda — e
// apaga as conversas encerradas há mais de um ano, como a Política de
// Privacidade promete. E apaga os arquivos do chat (imagens, PDFs) com mais
// de 5 dias.
//
// ---------- Quem pode chamar ----------
//
// Com CRON_SECRET definida na Vercel, só quem traz o segredo: é o que a
// própria Vercel manda no cabeçalho. Sem ela, qualquer um pode chamar — e o
// pior que consegue é adiantar uma faxina que já ia acontecer.

export const dynamic = "force-dynamic";

export async function GET(requisicao: Request) {
  const segredo = process.env.CRON_SECRET;
  if (
    segredo &&
    requisicao.headers.get("authorization") !== `Bearer ${segredo}`
  ) {
    return new NextResponse(null, { status: 401 });
  }

  // No máximo uma faxina a cada 10 minutos, venha de onde vier.
  //
  // Sem CRON_SECRET a rota é pública, e quem a chamasse em laço faria o
  // banco varrer mensagens e apagar arquivos sem parar. A reserva é um
  // comando só (gravar se a última for velha), então duas chamadas juntas
  // não passam as duas.
  if (sql) {
    await garantirEsquema();
    const reservou = (await sql.query(
      `INSERT INTO meta (chave, valor, em) VALUES ('faxina:ultima', '', now())
       ON CONFLICT (chave) DO UPDATE SET em = now()
         WHERE meta.em < now() - interval '10 minutes'
       RETURNING chave`,
      []
    )) as Array<{ chave: string }>;
    if (reservou.length === 0) {
      return NextResponse.json({ ok: true, pulada: true });
    }

    // Os contadores do freio de tentativas vencem em 15 minutos, mas a
    // linha ficava no banco para sempre — uma por endereço que já tentou
    // algo. Um dia de folga e fora.
    await sql.query(
      `DELETE FROM meta
        WHERE (chave LIKE 'tentativas:%' OR chave LIKE 'chat-%:%'
               OR chave LIKE 'assistente:hora:%' OR chave LIKE 'assistente:surto-avisado:%')
          AND em < now() - interval '2 days'`,
      []
    );
  }

  const encerradas = await encerrarPorSilencio(true);
  const apagadas = await apagarConversasAntigas();
  const arquivos = await apagarArquivosVencidos();

  return NextResponse.json({ ok: true, encerradas, apagadas, arquivos });
}
