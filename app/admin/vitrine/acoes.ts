"use server";

import { revalidatePath } from "next/cache";
import { apagarArquivo } from "@/lib/upload";
import {
  preparar,
  texto,
  arquivoEnviado,
  proximaOrdem,
  moverItem,
} from "@/lib/painel";

// O trilho "Nosso trabalho" fica na home.
function atualizarSite() {
  revalidatePath("/");
  revalidatePath("/admin/vitrine");
}

export async function criarPeca(dados: FormData) {
  const banco = await preparar();

  // A capa é obrigatória mesmo em vídeo: é ela que aparece no trilho, e sem
  // ela o ladrilho ficaria vazio até o vídeo carregar.
  const capa = await arquivoEnviado(dados, "capa", "vitrine", "imagem");
  if (!capa) throw new Error("Escolha a imagem de capa.");

  const video = await arquivoEnviado(dados, "video", "vitrine", "video");

  await banco.query(
    "INSERT INTO vitrine (src, alt, tipo, video, legenda, ordem) VALUES ($1,$2,$3,$4,$5,$6)",
    [
      capa,
      texto(dados, "alt") || "Trabalho da LANÇA+",
      video ? "video" : "imagem",
      video,
      texto(dados, "legenda") || null,
      await proximaOrdem("vitrine"),
    ]
  );

  atualizarSite();
}

export async function salvarPeca(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const capa = await arquivoEnviado(dados, "capa", "vitrine", "imagem");
  const video = await arquivoEnviado(dados, "video", "vitrine", "video");

  const antes = (await banco.query(
    "SELECT src, video FROM vitrine WHERE id = $1",
    [id]
  )) as Array<{ src: string; video: string | null }>;

  await banco.query(
    `UPDATE vitrine
        SET src = COALESCE($1, src),
            video = COALESCE($2, video),
            alt = $3,
            legenda = $4,
            tipo = CASE WHEN COALESCE($2, video) IS NULL THEN 'imagem' ELSE 'video' END
      WHERE id = $5`,
    [capa, video, texto(dados, "alt"), texto(dados, "legenda") || null, id]
  );

  // Só depois de gravar: se o arquivo novo entrou, o antigo não serve a mais
  // ninguém e vira peso morto na cota.
  if (capa) await apagarArquivo(antes[0]?.src);
  if (video) await apagarArquivo(antes[0]?.video);

  atualizarSite();
}

/** Tira o vídeo e devolve a peça à condição de imagem. */
export async function removerVideo(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const antes = (await banco.query("SELECT video FROM vitrine WHERE id = $1", [
    id,
  ])) as Array<{ video: string | null }>;

  await banco.query(
    "UPDATE vitrine SET video = NULL, tipo = 'imagem' WHERE id = $1",
    [id]
  );
  await apagarArquivo(antes[0]?.video);

  atualizarSite();
}

export async function apagarPeca(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const antes = (await banco.query(
    "SELECT src, video FROM vitrine WHERE id = $1",
    [id]
  )) as Array<{ src: string; video: string | null }>;

  await banco.query("DELETE FROM vitrine WHERE id = $1", [id]);
  await apagarArquivo(antes[0]?.src);
  await apagarArquivo(antes[0]?.video);

  atualizarSite();
}

export async function moverPeca(dados: FormData) {
  await preparar();
  await moverItem("vitrine", Number(dados.get("id")), Number(dados.get("direcao")));
  atualizarSite();
}
