import { sql, garantirEsquema } from "@/lib/db";
import { exigirAdmin } from "@/lib/admin";
import { HOST_PUBLICO } from "@/lib/upload";


// Peças comuns às Server Actions do painel.
//
// Este arquivo não tem "use server" de propósito: ele não exporta ações, só
// ajudantes que as ações usam. Marcar tudo como ação exporia funções internas
// como endpoints POST sem necessidade.

/** Tabelas que o painel pode tocar. A lista existe porque nome de tabela não
 *  pode ser parâmetro em SQL, então ele é interpolado — e só valor desta lista
 *  chega lá. */
export type Tabela =
  | "vitrine"
  | "depoimentos"
  | "cases"
  | "logos"
  | "numeros"
  | "posts";

export async function preparar() {
  await exigirAdmin();
  await garantirEsquema();
  if (!sql) throw new Error("Banco de dados não configurado.");
  return sql;
}

export function texto(dados: FormData, campo: string) {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

export function inteiro(dados: FormData, campo: string) {
  const valor = Number(texto(dados, campo));
  return Number.isFinite(valor) ? Math.trunc(valor) : 0;
}

export function marcado(dados: FormData, campo: string) {
  return dados.get(campo) !== null;
}

/**
 * Endereço do arquivo que o navegador já enviou ao Blob.
 *
 * O envio acontece antes, em CampoArquivo: aqui chega só a URL. Devolve null
 * quando nada foi escolhido, que é o caso de salvar sem trocar o arquivo.
 *
 * A URL é conferida porque o campo vem do navegador como qualquer outro: sem
 * isto, alguém poderia gravar o endereço de uma imagem de fora e fazer o site
 * servir conteúdo de terceiro.
 */
export function urlEnviada(dados: FormData, campo: string) {
  const valor = texto(dados, campo);
  if (!valor) return null;

  // O endereço do Blob continua aceito porque o banco ainda guarda os das
  // peças enviadas antes da mudança para o R2. Elas seguem válidas até serem
  // substituídas; recusar aqui impediria de salvar uma legenda numa peça
  // antiga sem reenviar o arquivo.
  let host = "";
  try {
    const endereco = new URL(valor);
    if (endereco.protocol !== "https:") throw new Error("http");
    host = endereco.hostname;
  } catch {
    throw new Error("Endereço de arquivo inválido.");
  }

  const conhecido =
    (HOST_PUBLICO && host === HOST_PUBLICO) ||
    host.endsWith(".blob.vercel-storage.com");

  if (!conhecido) {
    throw new Error("Endereço de arquivo inválido.");
  }

  return valor;
}

/** Próxima posição no fim da lista. */
export async function proximaOrdem(tabela: Tabela) {
  const banco = sql!;
  const linhas = (await banco.query(
    `SELECT COALESCE(MAX(ordem), -1) + 1 AS proxima FROM ${tabela}`
  )) as Array<{ proxima: number }>;
  return linhas[0]?.proxima ?? 0;
}

/**
 * Troca a posição de um item com o vizinho.
 *
 * Reescreve a ordem inteira em vez de trocar dois valores: é mais fácil de
 * acertar, e todas as listas do painel são curtas.
 */
export async function moverItem(tabela: Tabela, id: number, direcao: number) {
  if (!Number.isFinite(id) || (direcao !== 1 && direcao !== -1)) return;

  const banco = sql!;
  const lista = (await banco.query(
    `SELECT id FROM ${tabela} ORDER BY ordem, id`
  )) as Array<{ id: number }>;

  const atual = lista.findIndex((l) => l.id === id);
  const destino = atual + direcao;
  if (atual === -1 || destino < 0 || destino >= lista.length) return;

  const nova = [...lista];
  [nova[atual], nova[destino]] = [nova[destino], nova[atual]];

  for (const [posicao, item] of nova.entries()) {
    await banco.query(`UPDATE ${tabela} SET ordem = $1 WHERE id = $2`, [
      posicao,
      item.id,
    ]);
  }
}

/**
 * Leva um item para uma posição qualquer da lista.
 *
 * As setas movem uma casa por clique, o que é lento para montar uma sequência
 * pensada (vídeo, imagem, vídeo…) numa lista longa. Aqui a pessoa diz o número
 * e o item vai direto, empurrando os outros.
 */
export async function reposicionarItem(
  tabela: Tabela,
  id: number,
  posicaoHumana: number
) {
  if (!Number.isFinite(id) || !Number.isFinite(posicaoHumana)) return;

  const banco = sql!;
  const lista = (await banco.query(
    `SELECT id FROM ${tabela} ORDER BY ordem, id`
  )) as Array<{ id: number }>;

  const atual = lista.findIndex((l) => l.id === id);
  if (atual === -1) return;

  // A pessoa conta a partir de 1; a lista, de 0. E um número fora da faixa
  // vira a ponta mais próxima, em vez de não fazer nada.
  const destino = Math.min(Math.max(Math.trunc(posicaoHumana) - 1, 0), lista.length - 1);
  if (destino === atual) return;

  const nova = [...lista];
  const [movido] = nova.splice(atual, 1);
  nova.splice(destino, 0, movido);

  for (const [posicao, item] of nova.entries()) {
    await banco.query(`UPDATE ${tabela} SET ordem = $1 WHERE id = $2`, [
      posicao,
      item.id,
    ]);
  }
}

/** Texto vira "slug-assim", usado como endereço de case e de post. */
export function paraSlug(valor: string) {
  return valor
    .normalize("NFD")
    // Tira os acentos que o NFD separou das letras (ç, ã, é viram c, a, e).
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
