"use server";

import { revalidatePath } from "next/cache";
import { apagarArquivo } from "@/lib/upload";
import {
  preparar,
  texto,
  urlEnviada,
  urlsEnviadas,
  proximaOrdem,
  moverItem,
  reposicionarItem,
} from "@/lib/painel";

/** Teto de páginas por carrossel, igual ao das redes de onde vem o post. */
const MAXIMO_PAGINAS = 20;

// O trilho "Nosso trabalho" fica na home.
function atualizarSite() {
  revalidatePath("/");
  revalidatePath("/lncadmin/vitrine");
}

export async function criarPeca(dados: FormData) {
  const banco = await preparar();

  // Uma coisa, outra ou a terceira. O vídeo toca sozinho no trilho e mostra
  // o próprio primeiro quadro, então não precisa de capa. O carrossel usa a
  // primeira página como capa.
  const tipo = texto(dados, "tipo");
  const capa = urlEnviada(dados, "capa");
  const video = urlEnviada(dados, "video");
  const paginas = urlsEnviadas(dados, "paginas");

  if (tipo === "video" && !video) {
    throw new Error("Escolha o arquivo de vídeo.");
  }
  if (tipo === "carrossel" && paginas.length < 2) {
    throw new Error("Um carrossel precisa de pelo menos duas páginas.");
  }

  // Teto, além do piso.
  //
  // Não é defesa contra invasor — só quem tem sessão do painel chega aqui.
  // É defesa contra o acidente de selecionar uma pasta inteira no seletor
  // de arquivos, que criaria um carrossel de centenas de páginas e um
  // trabalho grande para desfazer. Vinte é o teto das próprias redes de
  // onde esse conteúdo vem.
  if (tipo === "carrossel" && paginas.length > MAXIMO_PAGINAS) {
    throw new Error(
      `Um carrossel aceita no máximo ${MAXIMO_PAGINAS} páginas.`
    );
  }
  if ((tipo === "imagem" || tipo === "trinca") && !capa) {
    throw new Error("Escolha a imagem.");
  }

  // `src` é sempre o que o trilho mostra: a imagem, a primeira página do
  // carrossel, ou nada quando é vídeo, que se desenha sozinho.
  //
  // A trinca cai no mesmo caminho da estática, porque guarda a mesma coisa:
  // uma imagem. A diferença entre as duas vive só na apresentação — o trilho
  // recorta, e ao abrir se vê a peça inteira.
  const noTrilho =
    tipo === "video" ? "" : tipo === "carrossel" ? paginas[0] : capa;

  await banco.query(
    "INSERT INTO vitrine (src, alt, tipo, video, legenda, imagens, ordem) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [
      noTrilho,
      texto(dados, "alt") || "Trabalho da LANÇA+",
      tipo,
      tipo === "video" ? video : null,
      texto(dados, "legenda") || null,
      tipo === "carrossel" ? paginas : null,
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
  const paginas = urlsEnviadas(dados, "paginas");

  const antes = (await banco.query(
    "SELECT src, video, imagens FROM vitrine WHERE id = $1",
    [id]
  )) as Array<{ src: string; video: string | null; imagens: string[] | null }>;

  // Trocar o arquivo não muda o tipo da peça: quem é vídeo continua vídeo, e
  // o formulário só oferece o campo do tipo que ela já tem.
  //
  // No carrossel o formulário manda o estado inteiro, e não a diferença:
  // acrescentar, remover e reordenar chegam aqui como a lista final. Vazia
  // significa que a peça não é carrossel e o campo nem foi desenhado, então
  // as páginas ficam como estão.
  const ehCarrossel = paginas.length > 0;

  await banco.query(
    `UPDATE vitrine
        SET src = COALESCE($1, src),
            video = COALESCE($2, video),
            imagens = COALESCE($3, imagens),
            alt = $4,
            legenda = $5
      WHERE id = $6`,
    [
      ehCarrossel ? paginas[0] : capa,
      video,
      ehCarrossel ? paginas : null,
      texto(dados, "alt"),
      texto(dados, "legenda") || null,
      id,
    ]
  );

  // Só depois de gravar: se o arquivo novo entrou, o antigo não serve a mais
  // ninguém e vira peso morto na cota.
  if (video) await apagarArquivo(antes[0]?.video);

  if (ehCarrossel) {
    // Apaga só o que saiu da lista. Uma página reordenada continua em uso, e
    // apagá-la deixaria o carrossel com um buraco.
    const restantes = new Set(paginas);
    for (const antiga of antes[0]?.imagens ?? []) {
      if (!restantes.has(antiga)) await apagarArquivo(antiga);
    }
  } else if (capa) {
    await apagarArquivo(antes[0]?.src);
  }

  atualizarSite();
}

export async function apagarPeca(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const antes = (await banco.query(
    "SELECT src, video, imagens FROM vitrine WHERE id = $1",
    [id]
  )) as Array<{ src: string; video: string | null; imagens: string[] | null }>;

  await banco.query("DELETE FROM vitrine WHERE id = $1", [id]);

  // Todas as páginas do carrossel vão junto: peça apagada não deixa arquivo
  // órfão ocupando a cota.
  await apagarArquivo(antes[0]?.src);
  await apagarArquivo(antes[0]?.video);
  for (const pagina of antes[0]?.imagens ?? []) await apagarArquivo(pagina);

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
