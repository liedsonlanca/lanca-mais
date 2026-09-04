"use server";

import { revalidatePath } from "next/cache";
import { sql, garantirEsquema } from "@/lib/db";
import { exigirAdmin } from "@/lib/admin";
import { apagarArquivo } from "@/lib/upload";
import { urlEnviada } from "@/lib/painel";

// Server Actions do bloco de depoimentos.
//
// exigirAdmin() abre cada uma. Não é exagero: Server Actions são endpoints
// POST de verdade, alcançáveis sem passar pela interface, então o layout ter
// checado a sessão não protege isto aqui.
async function preparar() {
  await exigirAdmin();
  await garantirEsquema();
  if (!sql) throw new Error("Banco de dados não configurado.");
  return sql;
}

// A home mostra os depoimentos e é gerada antecipadamente. Sem revalidar, a
// edição só apareceria no próximo deploy.
function atualizarSite() {
  revalidatePath("/");
  revalidatePath("/lncadmin/depoimentos");
}

function texto(dados: FormData, campo: string) {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

// A foto já foi enviada ao Blob pelo navegador; aqui chega só a URL.
function fotoEnviada(dados: FormData) {
  return urlEnviada(dados, "foto");
}

export async function criarDepoimento(dados: FormData) {
  const banco = await preparar();

  const citacao = texto(dados, "citacao");
  const nome = texto(dados, "nome");
  if (!citacao || !nome) return;

  // Entra no fim da lista.
  const ultimo = (await banco.query(
    "SELECT COALESCE(MAX(ordem), -1) + 1 AS proxima FROM depoimentos"
  )) as Array<{ proxima: number }>;

  await banco.query(
    "INSERT INTO depoimentos (citacao, nome, cargo, foto, ordem) VALUES ($1,$2,$3,$4,$5)",
    [
      citacao,
      nome,
      texto(dados, "cargo"),
      fotoEnviada(dados),
      ultimo[0]?.proxima ?? 0,
    ]
  );

  atualizarSite();
}

export async function salvarDepoimento(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const nova = fotoEnviada(dados);

  if (nova) {
    // Foto trocada: a antiga sai do Blob, senão ela fica ocupando espaço para
    // sempre, sem estar em lugar nenhum do site.
    const antes = (await banco.query(
      "SELECT foto FROM depoimentos WHERE id = $1",
      [id]
    )) as Array<{ foto: string | null }>;
    await apagarArquivo(antes[0]?.foto);
  }

  await banco.query(
    `UPDATE depoimentos
        SET citacao = $1, nome = $2, cargo = $3,
            foto = COALESCE($4, foto)
      WHERE id = $5`,
    [texto(dados, "citacao"), texto(dados, "nome"), texto(dados, "cargo"), nova, id]
  );

  atualizarSite();
}

/** Tira a foto do depoimento, voltando para a inicial do nome. */
export async function removerFoto(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const antes = (await banco.query("SELECT foto FROM depoimentos WHERE id = $1", [
    id,
  ])) as Array<{ foto: string | null }>;

  await banco.query("UPDATE depoimentos SET foto = NULL WHERE id = $1", [id]);
  await apagarArquivo(antes[0]?.foto);

  atualizarSite();
}

export async function apagarDepoimento(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const antes = (await banco.query("SELECT foto FROM depoimentos WHERE id = $1", [
    id,
  ])) as Array<{ foto: string | null }>;

  await banco.query("DELETE FROM depoimentos WHERE id = $1", [id]);
  await apagarArquivo(antes[0]?.foto);

  atualizarSite();
}

/** Troca a posição com o vizinho, para cima (-1) ou para baixo (1). */
export async function moverDepoimento(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  const direcao = Number(dados.get("direcao"));
  if (!Number.isFinite(id) || (direcao !== 1 && direcao !== -1)) return;

  const lista = (await banco.query(
    "SELECT id FROM depoimentos ORDER BY ordem, id"
  )) as Array<{ id: number }>;

  const atual = lista.findIndex((l) => l.id === id);
  const destino = atual + direcao;
  if (atual === -1 || destino < 0 || destino >= lista.length) return;

  // Reescreve a ordem inteira: mais simples de acertar do que trocar dois
  // valores, e a lista aqui é sempre curta.
  const nova = [...lista];
  [nova[atual], nova[destino]] = [nova[destino], nova[atual]];

  for (const [posicao, item] of nova.entries()) {
    await banco.query("UPDATE depoimentos SET ordem = $1 WHERE id = $2", [
      posicao,
      item.id,
    ]);
  }

  atualizarSite();
}
