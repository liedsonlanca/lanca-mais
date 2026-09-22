"use server";

import { revalidatePath } from "next/cache";
import {
  preparar,
  texto,
  urlEnviada,
  avisar,
} from "@/lib/painel";
import { apagarArquivo } from "@/lib/upload";
import { POR_CHAVE } from "@/lib/imagens";

// Server Actions das imagens de posição fixa.
//
// preparar() abre as duas: Server Actions são endpoints POST de verdade,
// alcançáveis sem passar pela interface, então o layout ter checado a sessão
// não protege isto aqui.

/**
 * Onde cada imagem aparece, para revalidar só o que precisa.
 *
 * As páginas do site são geradas antecipadamente. Sem revalidar, a troca só
 * apareceria no próximo deploy — e foi assim que a agência já ficou achando
 * que o painel não gravava.
 *
 * O logo é o caso que exige o "layout": ele vive no menu e no rodapé, que são
 * do layout raiz, e não de uma página. Revalidar só "/" deixaria a marca
 * antiga em todas as outras telas.
 */
function atualizarSite(chave: string) {
  revalidatePath("/lncadmin/imagens", "layout");

  if (chave.startsWith("marca-")) {
    revalidatePath("/", "layout");
    return;
  }

  if (chave.startsWith("arco-")) {
    // arco-<slug>-<n>: o slug é tudo que está entre os dois.
    const partes = chave.split("-");
    const slug = partes.slice(1, -1).join("-");
    revalidatePath(`/servicos/${slug}`);
    return;
  }

  if (chave.startsWith("home-")) revalidatePath("/");
  else if (chave.startsWith("sobre-")) revalidatePath("/sobre");
  else if (chave.startsWith("em-breve-")) revalidatePath("/em-breve");
}

export async function salvarImagem(dados: FormData) {
  const banco = await preparar();

  const chave = texto(dados, "chave");
  const posicao = POR_CHAVE.get(chave);
  // Chave que não está no catálogo não tem lugar no site. Recusar aqui é o
  // que impede a tabela de acumular linhas que nenhuma página vai ler.
  if (!posicao) return avisar("Esta posição não existe mais no site.", "erro");

  const nova = urlEnviada(dados, "arquivo");
  // Posição decorativa não tem texto alternativo para guardar: o site a marca
  // como enfeite, e leitor de tela a pula. Gravar uma descrição aqui seria
  // gravar algo que ninguém nunca vai ouvir.
  const alt = posicao.decorativa ? "" : texto(dados, "alt");

  // Nada escolhido e nada digitado: não há o que salvar. Sem esta saída, um
  // clique em Salvar sem mexer em nada gravaria uma linha com o src do padrão
  // — e a posição passaria a constar como "personalizada" sem ter mudado.
  if (!nova && !alt) {
    return avisar("Escolha uma imagem ou escreva a descrição.", "atencao");
  }

  const antes = (await banco.query("SELECT src FROM imagens WHERE chave = $1", [
    chave,
  ])) as Array<{ src: string }>;
  const anterior = antes[0]?.src ?? null;

  await banco.query(
    `INSERT INTO imagens (chave, src, alt, atualizado_em)
          VALUES ($1, $2, $3, now())
     ON CONFLICT (chave) DO UPDATE
            SET src = COALESCE($2, imagens.src),
                alt = $3,
                atualizado_em = now()`,
    [chave, nova ?? anterior ?? posicao.padrao.src, alt]
  );

  // A antiga sai do R2, senão fica ocupando espaço para sempre sem estar em
  // lugar nenhum do site. apagarArquivo sabe distinguir: um caminho que não é
  // do R2 nem do Blob — os arquivos que vieram no repositório — passa batido.
  if (nova && anterior && anterior !== nova) await apagarArquivo(anterior);

  await avisar(`${posicao.rotulo}: alteração salva.`);
  atualizarSite(chave);
}

/**
 * Devolve a posição ao padrão de fábrica.
 *
 * É um DELETE, e não um UPDATE de volta para o endereço original: o padrão
 * vive em código, em lib/imagens.ts, e ausência de linha já significa "use o
 * padrão". Gravar o endereço antigo de volta congelaria o valor de hoje, e
 * uma futura troca do padrão no código não chegaria a esta posição.
 */
export async function restaurarImagem(dados: FormData) {
  const banco = await preparar();

  const chave = texto(dados, "chave");
  if (!POR_CHAVE.has(chave)) return;

  const antes = (await banco.query("SELECT src FROM imagens WHERE chave = $1", [
    chave,
  ])) as Array<{ src: string }>;

  await banco.query("DELETE FROM imagens WHERE chave = $1", [chave]);
  await apagarArquivo(antes[0]?.src);

  await avisar("Imagem original devolvida ao site.");
  atualizarSite(chave);
}
