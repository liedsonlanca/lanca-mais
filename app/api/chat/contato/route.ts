import { NextResponse } from "next/server";
import { impressaoDoVisitante } from "@/lib/acessos";
import { registrarEvento } from "@/lib/eventos";
import {
  acharOuAbrir,
  conversaEmTexto,
  gravarMensagem,
  passarParaEquipe,
} from "@/lib/conversas";
import { origemDaRequisicao, podeTentar, registrarFalha } from "@/lib/tentativas";

// A ficha de contato do chat: nome e sobrenome, WhatsApp e e-mail.
//
// ---------- Por que um formulário, e não o assistente perguntando ----------
//
// Pedir em conversa parece mais natural e entrega pior. A pessoa responde
// "João" sem sobrenome, manda o telefone sem DDD, escreve o e-mail errado, e
// alguém da equipe garimpa isso no meio do texto depois — ou liga para um
// número que não existe.
//
// Com campos, o navegador já cobra o que falta, o teclado do celular vira
// numérico no telefone, e o que chega ao CRM é um dado e não um palpite.
//
// ---------- Por que o lead vai para o DGFLOW ----------
//
// É onde a agência trabalha. A conversa fica no banco do site porque dúvida
// de madrugada não é lead; a partir daqui é, e ficha de cliente mora no CRM.
// A conversa inteira vai junto, para quem atender não começar pedindo que a
// pessoa repita o que já escreveu.

/** Teto por endereço, por quinze minutos. Ficha é coisa que se manda uma vez. */
const TETO_POR_ENDERECO = 10;

function texto(valor: unknown, limite: number) {
  return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
}

export async function POST(requisicao: Request) {
  const origem = origemDaRequisicao(requisicao);

  if (!(await podeTentar("chat-contato", origem, TETO_POR_ENDERECO)).permitido) {
    return NextResponse.json({ ok: false, motivo: "limite" }, { status: 429 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, motivo: "corpo" }, { status: 400 });
  }

  const chaveEnviada = texto(corpo.chave, 64).replace(/[^a-f0-9]/g, "");
  if (chaveEnviada.length !== 32) {
    return NextResponse.json({ ok: false, motivo: "chave" }, { status: 400 });
  }

  const nome = texto(corpo.nome, 120);
  const whatsapp = texto(corpo.whatsapp, 25).replace(/\D/g, "");
  const email = texto(corpo.email, 160);

  // Os três são exigidos, e exigidos aqui também.
  //
  // O formulário já cobra, e a cobrança dele é conveniência para quem
  // digita: esta rota é um endereço público, e quem chamar sem passar pela
  // página não passa por validação nenhuma.
  //
  // Nome e sobrenome: duas palavras de verdade. "João" sozinho não serve
  // para quem vai atender, e é o que a pessoa digita quando ninguém pede o
  // resto.
  const nomeCompleto = nome.split(/\s+/).filter((p) => p.length > 1).length >= 2;

  // E-mail checado de leve — arroba, ponto depois, sem espaço. Expressão
  // rigorosa recusa endereço válido, e recusar o e-mail certo de um cliente
  // é pior do que aceitar um errado.
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  // Dez dígitos é fixo com DDD; onze, celular. Menos que isso não liga.
  const whatsappValido = whatsapp.length >= 10 && whatsapp.length <= 13;

  if (!nomeCompleto || !emailValido || !whatsappValido) {
    return NextResponse.json(
      {
        ok: false,
        motivo: "campos",
        falhas: {
          nome: !nomeCompleto,
          email: !emailValido,
          whatsapp: !whatsappValido,
        },
      },
      { status: 400 }
    );
  }

  const visitante = await impressaoDoVisitante(
    origem,
    requisicao.headers.get("user-agent") ?? ""
  );

  const conversa = await acharOuAbrir(chaveEnviada, visitante);
  if (!conversa) {
    return NextResponse.json({ ok: false, motivo: "config" }, { status: 503 });
  }

  await registrarFalha("chat-contato", origem);

  // Primeiro o banco, depois o CRM.
  //
  // Esta ordem importa: o CRM é de outra pessoa e pode estar fora do ar, e
  // nesse caso o dado não pode se perder. Gravado aqui, ele aparece no
  // painel mesmo que o webhook falhe — e a equipe atende por aqui.
  await passarParaEquipe(conversa.id, { nome, contato: whatsapp, email });

  await gravarMensagem(
    conversa.id,
    "assistente",
    `Obrigado, ${nome.split(/\s+/)[0]}. A equipe da LANÇA+ foi avisada e ` +
      `responde por aqui ou no seu WhatsApp. Se quiser adiantar, pode ` +
      `escrever sua dúvida abaixo.`
  );

  await registrarEvento({
    tipo: "orcamento_enviado",
    visitante,
    caminho: "/chat",
    // Só o nome no aviso: telefone e e-mail já estão na ficha, e repeti-los
    // numa lista que fica aberta na tela do painel só espalha o dado.
    detalhe: nome,
  });

  const endereco = process.env.DGFLOW_WEBHOOK_URL;
  let noCrm = false;

  if (endereco) {
    try {
      const resposta = await fetch(endereco, {
        method: "POST",
        // O charset é explícito: sem ele, o primeiro lead chegou ao CRM com
        // "Tráfego Pago" virado em "Tr?fego Pago" — do outro lado alguém
        // adivinhou a codificação, e adivinhou errado.
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          nome,
          whatsapp,
          email,
          servico: "Chat do site",
          mensagem: await conversaEmTexto(conversa.id),
        }),
        signal: AbortSignal.timeout(8000),
      });
      noCrm = resposta.ok;
      if (!resposta.ok) {
        console.error("[chat-contato] webhook respondeu", resposta.status);
      }
    } catch (erro) {
      console.error("[chat-contato] webhook falhou", erro);
    }
  } else {
    console.error("[chat-contato] DGFLOW_WEBHOOK_URL não configurada");
  }

  // `ok: true` mesmo sem o CRM: para quem está no chat, o pedido chegou — e
  // chegou mesmo, está no painel. `noCrm` é para o registro, não para a tela.
  return NextResponse.json({ ok: true, noCrm });
}
