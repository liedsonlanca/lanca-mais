import { NextResponse } from "next/server";

// O pedido de orçamento, a caminho do CRM.
//
// ---------- Por que passa pelo servidor ----------
//
// O webhook do DGFLOW leva o token na própria URL, e esse token cria lead na
// conta da agência. Chamado direto do navegador, ele iria no pacote de
// JavaScript que todo visitante baixa — ou seja, publicado. Aqui ele fica em
// DGFLOW_WEBHOOK_URL, lido só no servidor, e o navegador conversa com esta
// rota, que é do próprio site.
//
// Isso também dá onde pôr o resto: validação de verdade, limite de envios e o
// campo-isca abaixo. Nada disso existiria num fetch solto do cliente.
//
// ---------- Por que ela não guarda nada ----------
//
// O lead vive no CRM, que é onde a agência trabalha. Guardar uma cópia no
// banco do site criaria uma segunda lista, que ninguém abre e que envelhece
// divergindo da primeira.
//
// ---------- O que acontece quando o DGFLOW está fora ----------
//
// Esta rota responde com `ok: false`, e o formulário cai no WhatsApp com os
// dados escritos na mensagem. Um pedido perdido porque o servidor de outra
// pessoa caiu é o pior desfecho possível, e é barato de evitar.

/** Nomes de campo exigidos pelo webhook. Mudar aqui quebra a captura. */
type Pedido = {
  nome: string;
  whatsapp: string;
  email: string;
  servico: string;
  mensagem: string;
};

/**
 * Quantos pedidos um mesmo endereço pode mandar, e em quanto tempo.
 *
 * É memória do processo, e não banco: numa função sem estado isto se perde
 * entre instâncias, então não é defesa contra ataque dedicado. Serve para o
 * caso comum — o clique repetido e o robô preguiçoso — e custa nada.
 */
const JANELA_MS = 60_000;
const LIMITE = 5;
const visitas = new Map<string, number[]>();

function excedeu(chave: string) {
  const agora = Date.now();
  const recentes = (visitas.get(chave) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  visitas.set(chave, recentes);

  // A tabela não pode crescer para sempre num processo de vida longa.
  if (visitas.size > 500) {
    for (const [k, v] of visitas) {
      if (v.every((t) => agora - t >= JANELA_MS)) visitas.delete(k);
    }
  }

  return recentes.length > LIMITE;
}

function texto(valor: unknown, limite: number) {
  return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
}

export async function POST(requisicao: Request) {
  const endereco = process.env.DGFLOW_WEBHOOK_URL;

  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, motivo: "corpo" }, { status: 400 });
  }

  // O campo-isca. Fica escondido no formulário, então pessoa nenhuma o
  // preenche: quem preenche é robô que despeja texto em tudo que encontra.
  // Responde 200 de propósito — dizer "recusado" ensina o robô a tentar de
  // novo sem ele.
  if (texto(corpo.sobrenome, 80)) {
    return NextResponse.json({ ok: true });
  }

  const pedido: Pedido = {
    nome: texto(corpo.nome, 120),
    whatsapp: texto(corpo.whatsapp, 20).replace(/\D/g, ""),
    email: texto(corpo.email, 160),
    servico: texto(corpo.servico, 120),
    mensagem: texto(corpo.mensagem, 2000),
  };

  // Todos os campos são exigidos, a pedido do cliente.
  //
  // O servidor repete a checagem que o formulário já faz, e não confia nela:
  // esta rota é um endereço público, e qualquer um pode chamá-la sem passar
  // pela página. Validação no navegador é conveniência para quem preenche;
  // validação aqui é a que vale.
  //
  // O e-mail é checado de leve — arroba, ponto depois, sem espaço. Expressão
  // rigorosa recusa endereço válido, e recusar o e-mail certo de um cliente
  // é pior do que aceitar um errado, que só volta como mensagem que não
  // chega.
  const faltando =
    !pedido.nome ||
    pedido.whatsapp.length < 10 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(pedido.email) ||
    !pedido.servico ||
    !pedido.mensagem;

  if (faltando) {
    return NextResponse.json({ ok: false, motivo: "campos" }, { status: 400 });
  }

  const ip =
    requisicao.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "desconhecido";
  if (excedeu(ip)) {
    return NextResponse.json({ ok: false, motivo: "limite" }, { status: 429 });
  }

  if (!endereco) {
    // Sem a variável configurada, o site não finge que mandou.
    console.error("[orcamento] DGFLOW_WEBHOOK_URL não configurada");
    return NextResponse.json({ ok: false, motivo: "config" }, { status: 503 });
  }

  try {
    // O tempo limite existe porque sem ele a pessoa fica olhando um botão
    // "Enviando…" até o navegador desistir, e nessa espera ela vai embora.
    const resposta = await fetch(endereco, {
      method: "POST",
      // O charset é explícito de propósito. Sem ele, o primeiro lead de teste
      // chegou ao CRM com "Tráfego Pago" virado em "Tr?fego Pago": do outro
      // lado alguém adivinhou a codificação, e adivinhou errado. Nome de
      // pessoa com acento é a regra no Brasil, não a exceção.
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(pedido),
      signal: AbortSignal.timeout(8000),
    });

    if (!resposta.ok) {
      console.error("[orcamento] webhook respondeu", resposta.status);
      return NextResponse.json(
        { ok: false, motivo: "webhook" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (erro) {
    console.error("[orcamento] webhook falhou", erro);
    return NextResponse.json({ ok: false, motivo: "rede" }, { status: 502 });
  }
}
