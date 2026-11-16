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
  avisar,
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

  // Recado em vez de erro: escolher arquivo errado é engano de quem
  // preenche, e não falha do sistema. Lançar trocaria o formulário por
  // uma tela de erro, e o que já estava preenchido se perderia.
  if (tipo === "video" && !video) {
    return avisar("Escolha o arquivo de vídeo.", "atencao");
  }
  if (tipo === "carrossel" && paginas.length < 2) {
    return avisar(
      "Um carrossel precisa de pelo menos duas páginas.",
      "atencao"
    );
  }

  // Teto, além do piso.
  //
  // Não é defesa contra invasor — só quem tem sessão do painel chega aqui.
  // É defesa contra o acidente de selecionar uma pasta inteira no seletor
  // de arquivos, que criaria um carrossel de centenas de páginas e um
  // trabalho grande para desfazer. Vinte é o teto das próprias redes de
  // onde esse conteúdo vem.
  if (tipo === "carrossel" && paginas.length > MAXIMO_PAGINAS) {
    return avisar(
      `Um carrossel aceita no máximo ${MAXIMO_PAGINAS} páginas.`,
      "atencao"
    );
  }
  if ((tipo === "imagem" || tipo === "trinca") && !capa) {
    return avisar("Escolha a imagem.", "atencao");
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

  await avisar("Peça publicada em Nosso trabalho.");
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

  await avisar("Peça salva.");
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

  await avisar("Peça retirada do trilho.");
  atualizarSite();
}

export async function moverPeca(dados: FormData) {
  await preparar();
  await moverItem("vitrine", Number(dados.get("id")), Number(dados.get("direcao")));
  await avisar("Ordem do trilho alterada.");
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
  await avisar("Peça movida de posição.");
  atualizarSite();
}

/**
 * Reorganiza o trilho: alterna os tipos e põe o recente na frente.
 *
 * ---------- O desenho ----------
 *
 * A ordem vira vídeo, estático, vídeo, carrossel, vídeo, estático, e assim por
 * diante: vídeo em toda posição ímpar, e as pares revezando entre os tipos
 * parados que existirem, na ordem estático → carrossel → trinca.
 *
 * O motivo é que o trilho desliza sozinho. Com os vídeos agrupados, quem passa
 * os olhos vê um pedaço só de movimento e o resto parado; alternando, o
 * movimento se distribui e o trilho não tem trecho morto.
 *
 * ---------- Por que o recente primeiro ----------
 *
 * Dentro de cada tipo a peça mais nova vem antes. O trilho é vitrine de
 * trabalho atual, e trabalho de dois anos atrás na frente do de ontem diz a
 * coisa errada sobre a agência — ainda que a peça antiga seja boa.
 *
 * Por `criado_em`, e não pelo id: id é ordem de cadastro, e peça recadastrada
 * depois de uma correção nasce com id novo sem ser trabalho novo. O
 * desempate por id só entra quando o carimbo é o mesmo, que é o caso das
 * peças criadas na mesma transação.
 *
 * ---------- O que acontece quando um lado acaba ----------
 *
 * Se houver dez vídeos e dois estáticos, a alternância vale enquanto houver
 * os dois, e o que sobrar entra em seguida, do mais novo para o mais velho.
 * Forçar o padrão até o fim exigiria inventar peça que não existe.
 *
 * É destrutivo para a ordem manual: quem tiver arrastado peça a peça perde o
 * arranjo. Por isso é um botão, e não algo que roda sozinho ao salvar.
 */
export async function intercalarPecas() {
  const banco = await preparar();

  const linhas = (await banco.query(
    "SELECT id, tipo FROM vitrine ORDER BY criado_em DESC NULLS LAST, id DESC"
  )) as Array<{ id: number; tipo: string | null }>;

  if (linhas.length === 0) {
    await avisar("Não há peças para organizar.");
    return;
  }

  const videos = linhas.filter((l) => l.tipo === "video");

  // A ordem do rodízio dos parados. Só entram os tipos que existem: uma lista
  // fixa deixaria buracos quando a agência não usa carrossel, por exemplo.
  const ORDEM_PARADOS = ["imagem", "carrossel", "trinca"];
  const parados = ORDEM_PARADOS.map((tipo) =>
    linhas.filter((l) => (l.tipo ?? "imagem") === tipo)
  ).filter((grupo) => grupo.length > 0);

  const final: number[] = [];
  let vez = 0;

  // Enquanto houver dos dois lados, alterna. O lado parado avança de grupo a
  // cada rodada, e pula o grupo que já esvaziou.
  while (videos.length > 0 && parados.some((g) => g.length > 0)) {
    final.push(videos.shift()!.id);

    for (let tentativas = 0; tentativas < parados.length; tentativas += 1) {
      const grupo = parados[vez % parados.length];
      vez += 1;
      if (grupo.length > 0) {
        final.push(grupo.shift()!.id);
        break;
      }
    }
  }

  // O resto, do mais novo para o mais velho. `linhas` já está nessa ordem,
  // então basta varrer e pegar quem ficou de fora.
  const jaPostos = new Set(final);
  for (const linha of linhas) {
    if (!jaPostos.has(linha.id)) final.push(linha.id);
  }

  for (let i = 0; i < final.length; i += 1) {
    await banco.query("UPDATE vitrine SET ordem = $1 WHERE id = $2", [
      i,
      final[i],
    ]);
  }

  await avisar(`Trilho reorganizado: ${final.length} peças.`);
  atualizarSite();
}
