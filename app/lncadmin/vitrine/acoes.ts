"use server";

import { revalidatePath } from "next/cache";
import { apagarArquivo } from "@/lib/upload";
import {
  preparar,
  texto,
  urlEnviada,
  proximaOrdem,
  moverItem,
  reposicionarItem,
} from "@/lib/painel";

// O trilho "Nosso trabalho" fica na home.
function atualizarSite() {
  revalidatePath("/");
  revalidatePath("/lncadmin/vitrine");
}

export async function criarPeca(dados: FormData) {
  const banco = await preparar();

  // Uma coisa ou outra: o vídeo toca sozinho no trilho e mostra o próprio
  // primeiro quadro, então não precisa de capa.
  const ehVideo = texto(dados, "tipo") === "video";
  const capa = urlEnviada(dados, "capa");
  const video = urlEnviada(dados, "video");

  if (ehVideo && !video) throw new Error("Escolha o arquivo de vídeo.");
  if (!ehVideo && !capa) throw new Error("Escolha a imagem.");

  await banco.query(
    "INSERT INTO vitrine (src, alt, tipo, video, legenda, ordem) VALUES ($1,$2,$3,$4,$5,$6)",
    [
      ehVideo ? "" : capa,
      texto(dados, "alt") || "Trabalho da LANÇA+",
      ehVideo ? "video" : "imagem",
      ehVideo ? video : null,
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

  const capa = urlEnviada(dados, "capa");
  const video = urlEnviada(dados, "video");

  const antes = (await banco.query(
    "SELECT src, video FROM vitrine WHERE id = $1",
    [id]
  )) as Array<{ src: string; video: string | null }>;

  // Trocar o arquivo não muda o tipo da peça: quem é vídeo continua vídeo, e
  // o formulário só oferece o campo do tipo que ela já tem.
  await banco.query(
    `UPDATE vitrine
        SET src = COALESCE($1, src),
            video = COALESCE($2, video),
            alt = $3,
            legenda = $4
      WHERE id = $5`,
    [capa, video, texto(dados, "alt"), texto(dados, "legenda") || null, id]
  );

  // Só depois de gravar: se o arquivo novo entrou, o antigo não serve a mais
  // ninguém e vira peso morto na cota.
  if (capa) await apagarArquivo(antes[0]?.src);
  if (video) await apagarArquivo(antes[0]?.video);

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

/** Leva a peça para a posição digitada, empurrando as outras. */
export async function posicionarPeca(dados: FormData) {
  await preparar();
  await reposicionarItem(
    "vitrine",
    Number(dados.get("id")),
    Number(dados.get("posicao"))
  );
  atualizarSite();
}
