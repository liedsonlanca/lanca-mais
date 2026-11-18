"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { preparar, avisar, texto, inteiro } from "@/lib/painel";
import { fecharConversa, gravarMensagem } from "@/lib/conversas";

// As ações da tela de conversas.
//
// `preparar()` vem antes de tudo em cada uma, e não é zelo repetido: uma
// ação de servidor é um endereço que aceita POST de qualquer lugar, e o
// portão do layout do painel só decide o que a tela mostra — não impede a
// ação de rodar. Quem guarda é esta linha.

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

  await gravarMensagem(id, "equipe", resposta);

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
