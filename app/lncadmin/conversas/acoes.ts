"use server";

import { revalidatePath } from "next/cache";
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

  await banco.query(
    "UPDATE conversas SET estado = 'assistente', mexido_em = now() WHERE id = $1",
    [id]
  );
  await avisar("O assistente volta a responder nessa conversa.");

  revalidatePath("/lncadmin/conversas");
  revalidatePath(`/lncadmin/conversas/${id}`);
  revalidatePath("/lncadmin");
}
