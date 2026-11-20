"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { after } from "next/server";
import { avisarVisitantePorEmail } from "@/lib/email";
import { lerEquipe } from "@/lib/conteudo";
import { COOKIE_ATENDENTE, atendenteAtual } from "@/lib/quem-atende";
import { apagarArquivo } from "@/lib/upload";
import { redirect } from "next/navigation";
import { preparar, avisar, texto, inteiro } from "@/lib/painel";
import { anexosDaConversa, equipeDigitando, fecharConversa, gravarMensagem } from "@/lib/conversas";
import { ESTADOS, barrar, guardarEstadoDaEquipe, liberar } from "@/lib/atendimento";

// As ações da tela de conversas.
//
// `preparar()` vem antes de tudo em cada uma, e não é zelo repetido: uma
// ação de servidor é um endereço que aceita POST de qualquer lugar, e o
// portão do layout do painel só decide o que a tela mostra — não impede a
// ação de rodar. Quem guarda é esta linha.

export async function escolherAtendente(dados: FormData) {
  await preparar();
  const nome = texto(dados, "nome");
  const equipe = await lerEquipe();
  const loja = await cookies();

  if (nome && equipe.some((p) => p.nome === nome)) {
    loja.set(COOKIE_ATENDENTE, nome, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    loja.delete(COOKIE_ATENDENTE);
  }
  revalidatePath("/lncadmin/conversas", "layout");
}

export async function responderNoChat(dados: FormData) {
  const banco = await preparar();

  const id = inteiro(dados, "id");
  const resposta = texto(dados, "texto").slice(0, 2000);

  if (!id || !resposta) {
    await avisar("Escreva a resposta antes de enviar.", "erro");
    return;
  }

  // A conversa precisa estar com a equipe.
  //
  // A tela já esconde o campo quando não está, e esconder é conveniência:
  // esta ação é um endereço alcançável por POST, e a aba pode estar aberta
  // desde antes de alguém encerrar a conversa noutra janela. Sem esta
  // conferência, a resposta entraria numa conversa encerrada e apareceria
  // para quem já tinha sido avisado de que o atendimento acabou.
  const atual = (await banco.query(
    "SELECT estado FROM conversas WHERE id = $1",
    [id]
  )) as Array<{ estado: string }>;

  if (atual[0]?.estado !== "equipe") {
    await avisar(
      atual[0]?.estado === "fechada"
        ? "Essa conversa foi encerrada. Ela só reabre se a pessoa escrever de novo."
        : "Essa conversa está com o assistente. Traga-a de volta antes de responder.",
      "erro"
    );
    return;
  }

  const quem = await atendenteAtual();
  await gravarMensagem(id, "equipe", resposta, { autorNome: quem });

  // Se a pessoa já saiu do chat, a resposta vai também por e-mail (quando o
  // envio estiver configurado; ver lib/email.ts).
  after(() => avisarVisitantePorEmail(id, resposta, quem.split(/\s+/)[0] ?? ""));

  // A conversa volta a "equipe" mesmo se estava fechada: respondê-la é
  // reabri-la, e deixar como fechada faria a próxima mensagem da pessoa cair
  // de novo no assistente, que responderia por cima da equipe.
  await banco.query(
    "UPDATE conversas SET estado = 'equipe', mexido_em = now() WHERE id = $1",
    [id]
  );

  revalidatePath("/lncadmin/conversas");
  revalidatePath(`/lncadmin/conversas/${id}`);
  revalidatePath("/lncadmin");
}

/**
 * Uma nota interna na conversa.
 *
 * Fica no fio, entre as mensagens, para quem pegar a conversa depois saber o
 * que já foi combinado ("mandei proposta por e-mail", "liga depois das 18h").
 * Nunca sai do painel: o visitante não recebe, o assistente não lê e o CRM
 * não copia (ver o autor "nota" em lib/conversas.ts).
 *
 * Vale em qualquer estado, inclusive encerrada: anotar o desfecho de uma
 * conversa fechada é justamente quando a nota mais serve.
 */
export async function anotarNaConversa(dados: FormData) {
  await preparar();

  const id = inteiro(dados, "id");
  const nota = texto(dados, "texto").slice(0, 2000);

  if (!id || !nota) {
    await avisar("Escreva a nota antes de salvar.", "erro");
    return;
  }

  await gravarMensagem(id, "nota", nota);
  revalidatePath(`/lncadmin/conversas/${id}`);
}

/** Quem atende está digitando: acende o "digitando…" no chat do visitante. */
export async function sinalizarDigitando(id: number) {
  await preparar();
  if (Number.isInteger(id) && id > 0) await equipeDigitando(id);
}

export async function encerrarConversa(dados: FormData) {
  await preparar();

  const id = inteiro(dados, "id");
  if (!id) return;

  await fecharConversa(id);
  await avisar("Conversa encerrada.");

  revalidatePath("/lncadmin/conversas");
  revalidatePath(`/lncadmin/conversas/${id}`);
  revalidatePath("/lncadmin");

  // Volta para a lista.
  //
  // Encerrou, acabou: ficar olhando a conversa que você mesma acabou de
  // fechar não serve para nada, e o que importa agora é quem está esperando.
  // O redirect precisa ficar fora de try/catch — ele funciona lançando.
  redirect("/lncadmin/conversas");
}

/**
 * Devolve a conversa ao assistente.
 *
 * Serve para quando o assistente passou a bola sem precisar — alguém
 * perguntou o preço, ele chamou a equipe, a equipe respondeu e a conversa
 * seguiu em assunto que ele dá conta. Sem isto, toda conversa que uma vez
 * passou pela equipe ficaria dependendo de gente até o fim.
 */
export async function devolverAoAssistente(dados: FormData) {
  const banco = await preparar();

  const id = inteiro(dados, "id");
  if (!id) return;

  // A pessoa do outro lado é avisada, e avisada como mensagem e não como
  // recado de sistema.
  //
  // Ela estava esperando gente. Se o assistente simplesmente voltar a
  // responder, a troca parece um atendente mudando de personalidade no meio
  // da conversa — e, pior, ela não sabe mais a quem está falando.
  //
  // Mensagem de verdade também resolve o resto de graça: fica no histórico,
  // chega pela mesma busca periódica e apita como as outras apitam.
  await gravarMensagem(
    id,
    "assistente",
    "Voltei a atender por aqui. Pode seguir perguntando — e se precisar " +
      "falar com alguém da equipe de novo, é só pedir."
  );

  await banco.query(
    "UPDATE conversas SET estado = 'assistente', mexido_em = now() WHERE id = $1",
    [id]
  );
  await avisar("O assistente volta a responder nessa conversa.");

  revalidatePath("/lncadmin/conversas");
  revalidatePath(`/lncadmin/conversas/${id}`);
  revalidatePath("/lncadmin");

  // Fora da sua caixa: devolvida ao assistente, ela não espera mais por você.
  redirect("/lncadmin/conversas");
}

/**
 * Define como o assistente deve tratar o atendimento humano.
 *
 * "Automático" segue o horário e é o padrão. Os outros três existem porque o
 * horário fixo erra os extremos: a reunião de três horas numa terça de manhã
 * e o sábado de lançamento não cabem numa tabela.
 */
export async function definirEstadoDaEquipe(dados: FormData) {
  await preparar();

  const valor = texto(dados, "estado");
  await guardarEstadoDaEquipe(valor);

  const escolhido = ESTADOS.find((e) => e.valor === valor);
  await avisar(
    escolhido
      ? `Atendimento: ${escolhido.rotulo.toLowerCase()}.`
      : "Estado inválido."
  );

  revalidatePath("/lncadmin/conversas");
}

/**
 * Apaga a conversa e tudo o que ela guardava.
 *
 * ---------- Por que isto existe, além da faxina ----------
 *
 * O site passou a guardar nome, WhatsApp e e-mail de quem conversa. Dado
 * pessoal guardado precisa poder ser apagado quando a pessoa pede — é o que
 * a LGPD chama de eliminação, e sem um botão isso dependeria de alguém
 * mexer no banco à mão.
 *
 * As mensagens vão junto por cascata (ver lib/db.ts), então não fica linha
 * órfã.
 */
export async function apagarConversa(dados: FormData) {
  const banco = await preparar();

  const id = inteiro(dados, "id");
  if (!id) return;

  // Os arquivos anexados vão junto: apagar a conversa e deixar a logo ou o
  // documento do cliente no armazenamento não seria apagar os dados dele.
  const anexos = await anexosDaConversa(id);
  await banco.query("DELETE FROM conversas WHERE id = $1", [id]);
  await Promise.all(anexos.map((url) => apagarArquivo(url)));
  await avisar("Conversa e dados apagados.");

  revalidatePath("/lncadmin/conversas");
  revalidatePath("/lncadmin/contatos");
  revalidatePath("/lncadmin");

  redirect("/lncadmin/conversas");
}

/**
 * Barra quem veio só incomodar, e encerra a conversa.
 *
 * O alcance disto é honesto e limitado: barra pela chave guardada no
 * navegador e pela impressão do visitante, que troca de dia por desenho.
 * Para quem é insistente, o que segura volume é o teto por endereço das
 * rotas — esse não depende de ninguém clicar em nada.
 */
export async function barrarVisitante(dados: FormData) {
  const banco = await preparar();

  const id = inteiro(dados, "id");
  if (!id) return;

  const linhas = (await banco.query(
    "SELECT chave, visitante FROM conversas WHERE id = $1",
    [id]
  )) as Array<{ chave: string; visitante: string }>;

  const alvo = linhas[0];
  if (!alvo) return;

  await barrar(alvo.chave, alvo.visitante ?? "");
  await fecharConversa(id);

  await avisar(
    "Visitante barrado. Ele não consegue mais escrever por este navegador."
  );

  // Fica na conversa, e não volta para a lista: o "desfazer" aparece aqui
  // mesmo, para o caso de o clique ter sido no visitante errado.
  revalidatePath("/lncadmin/conversas");
  revalidatePath(`/lncadmin/conversas/${id}`);
}

/** Desfaz o bloqueio. A conversa continua encerrada; a pessoa só volta a poder escrever. */
export async function liberarVisitante(dados: FormData) {
  await preparar();

  const id = inteiro(dados, "id");
  if (!id) return;

  await liberar(id);
  await avisar("Bloqueio desfeito. O visitante volta a conseguir escrever.");

  revalidatePath(`/lncadmin/conversas/${id}`);
}
