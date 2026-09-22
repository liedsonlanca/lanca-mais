"use server";

import { revalidatePath } from "next/cache";
import {
  preparar,
  texto,
  urlEnviada,
  proximaOrdem,
  moverItem,
  avisar,
} from "@/lib/painel";
import { apagarArquivo } from "@/lib/upload";

// Server Actions dos depoimentos em vídeo.
//
// preparar() abre todas: Server Actions são endpoints POST de verdade,
// alcançáveis sem passar pela interface, então o layout ter checado a sessão
// não protege isto aqui.

function atualizarSite() {
  revalidatePath("/");
  revalidatePath("/lncadmin/depoimentos-video");
}

export async function criarDepoimentoVideo(dados: FormData) {
  const banco = await preparar();

  const video = urlEnviada(dados, "video");
  // Sem vídeo não há depoimento: sobraria um card preto com um nome embaixo.
  // A capa é opcional — sem ela o navegador mostra o primeiro quadro.
  if (!video) return avisar("Escolha o arquivo do vídeo.", "atencao");

  await banco.query(
    "INSERT INTO depoimentos_video (video, capa, nome, cargo, ordem) VALUES ($1,$2,$3,$4,$5)",
    [
      video,
      urlEnviada(dados, "capa"),
      texto(dados, "nome"),
      texto(dados, "cargo"),
      await proximaOrdem("depoimentos_video"),
    ]
  );

  await avisar("Depoimento em vídeo publicado na página inicial.");
  atualizarSite();
}

export async function salvarDepoimentoVideo(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const novoVideo = urlEnviada(dados, "video");
  const novaCapa = urlEnviada(dados, "capa");

  // Os arquivos trocados saem do R2, senão ficam ocupando espaço para sempre
  // sem estar em lugar nenhum do site.
  if (novoVideo || novaCapa) {
    const antes = (await banco.query(
      "SELECT video, capa FROM depoimentos_video WHERE id = $1",
      [id]
    )) as Array<{ video: string | null; capa: string | null }>;

    if (novoVideo) await apagarArquivo(antes[0]?.video);
    if (novaCapa) await apagarArquivo(antes[0]?.capa);
  }

  await banco.query(
    `UPDATE depoimentos_video
        SET video = COALESCE($1, video),
            capa  = COALESCE($2, capa),
            nome  = $3,
            cargo = $4
      WHERE id = $5`,
    [novoVideo, novaCapa, texto(dados, "nome"), texto(dados, "cargo"), id]
  );

  await avisar("Depoimento salvo.");
  atualizarSite();
}

export async function apagarDepoimentoVideo(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const antes = (await banco.query(
    "SELECT video, capa FROM depoimentos_video WHERE id = $1",
    [id]
  )) as Array<{ video: string | null; capa: string | null }>;

  await banco.query("DELETE FROM depoimentos_video WHERE id = $1", [id]);
  await apagarArquivo(antes[0]?.video);
  await apagarArquivo(antes[0]?.capa);

  await avisar("Depoimento em vídeo retirado do site.");
  atualizarSite();
}

/** Troca a posição com o vizinho, para trás (-1) ou para frente (1). */
export async function moverDepoimentoVideo(dados: FormData) {
  await preparar();
  await moverItem(
    "depoimentos_video",
    Number(dados.get("id")),
    Number(dados.get("direcao"))
  );
  await avisar("Ordem dos depoimentos alterada.");
  atualizarSite();
}
