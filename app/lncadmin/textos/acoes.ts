"use server";

import { revalidatePath } from "next/cache";
import { preparar, texto, avisar } from "@/lib/painel";
import { POR_CHAVE } from "@/lib/textos";

// Server Actions dos textos do site.
//
// preparar() abre as duas: Server Actions são endpoints POST de verdade,
// alcançáveis sem passar pela interface, então o layout ter checado a sessão
// não protege isto aqui.

/**
 * Onde cada texto aparece, para revalidar só o que precisa.
 *
 * As páginas são geradas antecipadamente. Sem revalidar, a frase reescrita só
 * apareceria no próximo deploy — e foi assim que a agência já ficou achando
 * que o painel não gravava.
 *
 * O resumo do serviço aparece em três lugares: no card da home, na grade de
 * /servicos e na própria página dele. Por isso os três são revalidados juntos.
 */
function atualizarSite(chave: string) {
  revalidatePath("/lncadmin/textos", "layout");

  if (chave.startsWith("home.")) {
    revalidatePath("/");
    return;
  }

  if (chave.startsWith("servico.")) {
    const slug = chave.split(".")[1];
    revalidatePath("/");
    revalidatePath("/servicos");
    revalidatePath(`/servicos/${slug}`);
  }
}

/**
 * Grava um campo.
 *
 * Uma ação por campo, e não um formulário com a tela inteira: um grupo tem
 * dezenas de textos, e um salvar único faria a pessoa perder tudo se ela
 * fechasse a aba no meio — além de reescrever no banco cinquenta linhas para
 * mudar uma frase.
 */
export async function salvarTexto(dados: FormData) {
  const banco = await preparar();

  const chave = texto(dados, "chave");
  const campo = POR_CHAVE.get(chave);
  // Chave que não está no catálogo não tem lugar no site. Recusar aqui é o
  // que impede a tabela de acumular linhas que nenhuma página vai ler.
  if (!campo) return avisar("Este campo não existe mais no site.", "erro");

  // O valor não passa por trim inteiro: num campo de lista, a quebra de linha
  // é o que separa os itens. Só as pontas são aparadas.
  const valor = (dados.get("valor") as string | null)?.replace(/^\s+|\s+$/g, "") ?? "";

  if (!valor) {
    return avisar(
      "O texto não pode ficar em branco. Para voltar ao original, use o botão abaixo do campo.",
      "atencao"
    );
  }

  // Igual ao original não vira linha no banco: assim uma correção futura no
  // código ainda alcança este campo.
  if (valor === campo.padrao) {
    await banco.query("DELETE FROM textos WHERE chave = $1", [chave]);
    await avisar("Texto igual ao original. Nada foi gravado.", "atencao");
    atualizarSite(chave);
    return;
  }

  await banco.query(
    `INSERT INTO textos (chave, valor, atualizado_em)
          VALUES ($1, $2, now())
     ON CONFLICT (chave) DO UPDATE
            SET valor = $2, atualizado_em = now()`,
    [chave, valor]
  );

  await avisar(`${campo.rotulo}: texto salvo.`);
  atualizarSite(chave);
}

/**
 * Devolve o campo ao texto original.
 *
 * É um DELETE, e não um UPDATE de volta: o original vive em código, e ausência
 * de linha já significa "use o original". Gravar o texto antigo de volta
 * congelaria a versão de hoje.
 */
export async function restaurarTexto(dados: FormData) {
  const banco = await preparar();

  const chave = texto(dados, "chave");
  if (!POR_CHAVE.has(chave)) return;

  await banco.query("DELETE FROM textos WHERE chave = $1", [chave]);

  await avisar("Texto original devolvido ao site.");
  atualizarSite(chave);
}
