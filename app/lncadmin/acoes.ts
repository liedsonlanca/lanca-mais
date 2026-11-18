"use server";

import { revalidatePath } from "next/cache";
import { preparar, avisar, texto } from "@/lib/painel";

/**
 * Apaga tudo o que foi medido: acessos e sinais.
 *
 * ---------- Por que existe ----------
 *
 * O site está em testes, e o número de hoje é feito das próprias visitas da
 * agência conferindo se a medição funciona. Lançar com esse lixo dentro
 * faria a primeira semana de verdade parecer pior do que foi — e não há como
 * separar depois, porque o visitante é um hash e não tem etiqueta de "era
 * teste".
 *
 * ---------- Por que não dá para desfazer ----------
 *
 * Não há lixeira. Apagar aqui é DELETE, e o que sai não volta: um histórico
 * de acessos não tem original em lugar nenhum para ser restaurado.
 *
 * Por isso o botão vive atrás de uma gaveta fechada na tela, e não solto ao
 * lado dos números. Dois cliques deliberados, e o segundo diz exatamente o
 * que vai acontecer.
 *
 * ---------- Por que apaga os dois ----------
 *
 * Acessos e eventos contam a mesma história por ângulos diferentes. Zerar só
 * um deixaria o painel dizendo "nenhuma visita" e, ao lado, "alguém esteve no
 * diagnóstico há duas horas" — o tipo de contradição que faz a pessoa parar
 * de confiar na tela inteira.
 */
// Arquivo "use server" só exporta função: a palavra fica local, e a tela
// repete o texto ao lado do campo.
const PALAVRA_DE_CONFIRMACAO = "APAGAR";

export async function limparMedicao(dados: FormData) {
  const banco = await preparar();

  // A confirmação é conferida aqui, e não só no navegador.
  //
  // Validação no cliente é conveniência para quem digita; esta ação é um
  // endereço alcançável por POST direto, e o que impede um apagar sem
  // querer tem que estar do lado que executa.
  if (texto(dados, "confirmacao").toUpperCase() !== PALAVRA_DE_CONFIRMACAO) {
    await avisar(
      `Nada foi apagado: escreva ${PALAVRA_DE_CONFIRMACAO} para confirmar.`
    );
    return;
  }

  // TRUNCATE seria mais rápido, e é justamente por isso que não é usado:
  // numa tabela com dependência ele leva junto o que estiver amarrado, e
  // DELETE não tem essa surpresa. Com o volume de um site de agência, a
  // diferença de tempo não se mede.
  await banco.query("DELETE FROM acessos");
  await banco.query("DELETE FROM eventos");

  await avisar("Medição zerada: acessos e sinais apagados.");
  revalidatePath("/lncadmin");
}
