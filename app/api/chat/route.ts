import { NextResponse } from "next/server";
import { impressaoDoVisitante } from "@/lib/acessos";
import { assistenteLigado, responder } from "@/lib/atendente";
import {
  acharOuAbrir,
  gravarMensagem,
  historico,
  mensagensDepois,
  novaChave,
  passarParaEquipe,
  quantasMensagens,
  recomecarConversa,
  TETO_DE_MENSAGENS,
  type Mensagem,
} from "@/lib/conversas";
import { origemDaRequisicao, podeTentar, registrarFalha } from "@/lib/tentativas";
import { equipeNoExpediente, quandoAEquipeVolta } from "@/lib/expediente";

// O chat do site: uma rota para mandar mensagem, outra para buscar resposta.
//
// ---------- Por que o assistente é chamado aqui, e não no navegador ----------
//
// A chave da Anthropic cobra na conta da agência. Chamada do navegador, ela
// iria no pacote de JavaScript que todo visitante baixa — ou seja,
// publicada, e qualquer pessoa poderia gastar a conta da LANÇA+ com o chat
// dela própria. Aqui a chave fica no servidor e o navegador conversa com
// esta rota, que é do próprio site.
//
// ---------- Por que não é tempo real ----------
//
// A resposta do assistente volta na mesma requisição, então ela é imediata.
// A resposta da equipe não: ela é digitada no painel, e a página pergunta de
// tempo em tempo se apareceu algo novo (o GET abaixo). Conexão aberta por
// visitante daria instantâneo e custaria uma ligação de pé para cada aba
// aberta — numa Vercel, uma função viva por conversa.
//
// Para o que é, perguntar de quatro em quatro segundos resolve: a espera
// entre a equipe apertar enviar e a mensagem aparecer é menor do que a
// espera entre ler e começar a digitar.

/** Teto de mensagens por endereço, por quinze minutos. */
const TETO_POR_ENDERECO = 40;

const MAIOR_MENSAGEM = 1000;

function texto(valor: unknown, limite: number) {
  return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
}

/**
 * O que o chat diz quando o assistente não pode responder.
 *
 * Sem chave configurada, fora do ar, recusado ou acima do teto da conversa:
 * em todos os casos o visitante recebe isto e a conversa vai para a equipe.
 * O que ele não pode receber é silêncio — quem manda mensagem e não recebe
 * nada supõe que o site está quebrado, e vai embora sem avisar.
 */
function recadoDeEntrega() {
  const base =
    "Essa eu prefiro não responder no chute — quem responde isso é a " +
    "equipe. Deixa seus dados aí embaixo que a gente te procura";

  // Fora do expediente, o recado diz quando. É o mesmo fato — "a equipe
  // responde depois" — dito de um jeito que a pessoa consegue usar: ela
  // decide se espera até amanhã ou se chama no WhatsApp agora.
  //
  // Sem isso, quem escreve às onze da noite fica esperando até as oito e
  // meia sem saber, e essa espera parece descaso em vez de expediente.
  if (equipeNoExpediente()) {
    return `${base}. Se preferir, chama direto no (83) 99106-0691.`;
  }

  return (
    `${base} — a equipe atende ${quandoAEquipeVolta()}. ` +
    "Se for urgente, o WhatsApp é (83) 99106-0691."
  );
}

export async function POST(requisicao: Request) {
  const origem = origemDaRequisicao(requisicao);

  if (!(await podeTentar("chat", origem, TETO_POR_ENDERECO)).permitido) {
    return NextResponse.json({ ok: false, motivo: "limite" }, { status: 429 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ ok: false, motivo: "corpo" }, { status: 400 });
  }

  const pergunta = texto(corpo.texto, MAIOR_MENSAGEM);
  if (!pergunta) {
    return NextResponse.json({ ok: false, motivo: "vazio" }, { status: 400 });
  }

  // A chave vem do navegador quando a conversa já existe, e é sorteada aqui
  // na primeira mensagem. Sorteada no servidor de propósito: chave escolhida
  // pelo cliente é chave que ele pode escolher igual à de outra pessoa.
  const chaveEnviada = texto(corpo.chave, 64).replace(/[^a-f0-9]/g, "");
  const chave = chaveEnviada.length === 32 ? chaveEnviada : novaChave();

  const visitante = await impressaoDoVisitante(
    origem,
    requisicao.headers.get("user-agent") ?? ""
  );

  const achada = await acharOuAbrir(chave, visitante);

  // Encerrada: quem escreve de novo começa outra conversa, levando os dados
  // que já deu. O assunto anterior fica fechado no painel, e a pessoa não
  // preenche a ficha duas vezes.
  const recomecou =
    achada?.estado === "fechada"
      ? await recomecarConversa(achada, visitante)
      : null;

  const conversa = recomecou ?? achada;
  if (!conversa) {
    // Sem banco não há conversa, e fingir que houve seria perder a mensagem
    // de alguém em silêncio.
    return NextResponse.json({ ok: false, motivo: "config" }, { status: 503 });
  }

  await registrarFalha("chat", origem);

  const minha = await gravarMensagem(conversa.id, "cliente", pergunta);

  // Se a ficha já foi preenchida, o chat não pede de novo. Quem já deu nome,
  // WhatsApp e e-mail e é obrigado a repetir sente que o site não anotou.
  const temFicha = Boolean(conversa.nome && conversa.contato && conversa.email);

  // Já está com a equipe: o assistente sai de cena.
  //
  // Voltar a responder depois de a pessoa pedir atendimento humano é o
  // comportamento mais irritante que um chat desses tem — ela já disse que
  // quer gente.
  if (conversa.estado === "equipe") {
    return NextResponse.json({
      ok: true,
      chave: conversa.chave,
      estado: "equipe",
      temFicha,
      expediente: {
        aberto: equipeNoExpediente(),
        volta: quandoAEquipeVolta(),
      },
      minha,
      respostas: [],
    });
  }

  const quantas = await quantasMensagens(conversa.id);

  let resposta: Mensagem | null = null;
  let estado: "assistente" | "equipe" = "assistente";

  const podeResponder = assistenteLigado() && quantas <= TETO_DE_MENSAGENS;
  const dito = podeResponder ? await responder(await historico(conversa.id)) : null;

  if (dito && !dito.chamarEquipe) {
    const id = await gravarMensagem(conversa.id, "assistente", dito.texto);
    resposta = {
      id,
      autor: "assistente",
      texto: dito.texto,
      quando: new Date().toISOString(),
    };
  } else {
    // Três caminhos chegam aqui: o assistente pediu para passar, ele falhou,
    // ou ele nem existe. O visitante vê a mesma coisa nos três, porque para
    // ele a diferença não existe — o que importa é que alguém vai responder.
    const fala = dito?.texto || recadoDeEntrega();
    const id = await gravarMensagem(conversa.id, "assistente", fala);
    await passarParaEquipe(conversa.id);
    estado = "equipe";
    resposta = {
      id,
      autor: "assistente",
      texto: fala,
      quando: new Date().toISOString(),
    };
  }

  return NextResponse.json({
    ok: true,
    chave: conversa.chave,
    estado,
    temFicha,
    expediente: {
      aberto: equipeNoExpediente(),
      volta: quandoAEquipeVolta(),
    },
    // O navegador precisa saber que o histórico na tela é de outra conversa,
    // para limpar em vez de emendar as mensagens antigas nas novas.
    novaConversa: Boolean(recomecou),
    minha,
    respostas: resposta ? [resposta] : [],
  });
}

/**
 * O que apareceu depois da mensagem que o navegador já tem.
 *
 * É por aqui que a resposta da equipe chega a quem está com o chat aberto.
 */
export async function GET(requisicao: Request) {
  const { searchParams } = new URL(requisicao.url);

  const chave = (searchParams.get("chave") ?? "").replace(/[^a-f0-9]/g, "");
  if (chave.length !== 32) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const depois = Number(searchParams.get("depois") ?? 0);
  const { estado, temFicha, avaliada, novas } = await mensagensDepois(
    chave,
    Number.isFinite(depois) && depois > 0 ? depois : 0
  );

  // Sem cache, e dito aqui em vez de confiado ao padrão: a rota é um GET, e
  // um GET de resposta repetida é exatamente o que um intermediário gosta de
  // guardar. Guardada, a pessoa ficaria olhando a mesma resposta de sempre.
  // O expediente vai no corpo, e não é calculado no navegador.
  //
  // O relógio do aparelho da pessoa pode estar errado, e o fuso certo não
  // salva um relógio adiantado. Quem sabe que horas são para a LANÇA+ é o
  // servidor — e é ele quem responde.
  return NextResponse.json(
    {
      ok: true,
      estado,
      temFicha,
      avaliada,
      novas,
      expediente: {
        aberto: equipeNoExpediente(),
        volta: quandoAEquipeVolta(),
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
