// Fotos de iPhone: HEIC vira JPEG antes de subir.
//
// ---------- Por que converter, e não simplesmente aceitar ----------
//
// HEIC é o formato padrão da câmera do iPhone desde 2017, então é o que sai do
// celular de quem grava o conteúdo. Só que nenhum navegador além do Safari
// sabe desenhar HEIC: Chrome, Firefox e Edge mostram um retângulo quebrado.
//
// Guardar o arquivo cru no R2 seria aceitar o envio e publicar uma imagem que
// a maioria dos visitantes não veria — e pior, o painel mostraria tudo certo
// para quem estivesse num Mac. Um erro desses só aparece quando um cliente
// reclama.
//
// O otimizador de imagem do Next também não resolveria: ele usa o sharp, e a
// versão pronta do sharp não traz o decodificador de HEIC.
//
// Então a conversão acontece aqui, no navegador de quem publica, antes de o
// arquivo sair da máquina. O R2 nunca guarda um HEIC, o site nunca serve um, e
// a lista de tipos aceitos do servidor continua sendo só o que a web desenha.
//
// ---------- Por que a biblioteca é carregada só quando precisa ----------
//
// O decodificador tem quase 3 MB: é o libheif inteiro compilado para o
// navegador. Carregá-lo em toda visita ao painel para converter uma foto de
// vez em quando seria caro.
//
// Por isso o reconhecimento é feito aqui, lendo doze bytes do arquivo, e a
// biblioteca só é buscada depois que esses bytes dizem que é HEIC mesmo.

/**
 * As marcas de HEIC e HEIF dentro do cabeçalho do arquivo.
 *
 * Não dá para confiar no tipo que o navegador informa: no Windows um .heic
 * costuma chegar com tipo vazio, e um arquivo renomeado mentiria na extensão.
 * O cabeçalho é o próprio arquivo dizendo o que é.
 */
const MARCAS = [
  "heic",
  "heix",
  "heim",
  "heis",
  "hevc",
  "hevx",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
];

/** O maior lado da imagem convertida. */
const LADO_MAXIMO = 2400;

/**
 * Qualidade do JPEG resultante.
 *
 * 0,82 é onde a diferença deixa de ser visível numa foto e o arquivo ainda
 * cabe folgado no limite de 8 MB. Acima disso o tamanho cresce depressa sem
 * nada aparecer na tela.
 */
const QUALIDADE = 0.82;

/**
 * O arquivo é HEIC ou HEIF?
 *
 * Lê o cabeçalho ISO-BMFF: os bytes 4 a 8 trazem "ftyp" e os quatro seguintes,
 * a marca do formato. É a mesma estrutura do MP4, então a marca é o que
 * distingue uma foto de iPhone de um vídeo.
 *
 * Doze bytes, sem biblioteca nenhuma: é isto que evita baixar os 3 MB do
 * decodificador para conferir um JPEG comum.
 */
export async function ehHeic(arquivo: File) {
  try {
    const cabecalho = new Uint8Array(await arquivo.slice(0, 12).arrayBuffer());
    if (cabecalho.length < 12) return false;

    const texto = (inicio: number, fim: number) =>
      String.fromCharCode(...cabecalho.slice(inicio, fim));

    return texto(4, 8) === "ftyp" && MARCAS.includes(texto(8, 12));
  } catch {
    // Arquivo que não abre não é HEIC nosso problema: segue o fluxo normal e
    // quem recusa é o servidor, com a mensagem de formato.
    return false;
  }
}

/**
 * Converte um HEIC em JPEG, já no tamanho que o site usa.
 *
 * Devolve um File novo, com a extensão trocada, pronto para seguir o mesmo
 * caminho de qualquer outra imagem — inclusive a prévia do painel, que também
 * não saberia desenhar o original.
 *
 * A imagem é reduzida no caminho porque foto de iPhone sai com 4032 pixels de
 * largura, e nenhum lugar do site mostra mais que uns 1500. Sem reduzir, o
 * JPEG passaria do limite de 8 MB e a pessoa levaria a recusa depois de
 * esperar a conversão inteira — que é o pior momento possível para saber.
 */
export async function converterHeic(arquivo: File): Promise<File> {
  // A busca da biblioteca acontece aqui dentro: quem nunca enviar um HEIC
  // nunca baixa esses 3 MB.
  // A variante "csp" da biblioteca, e nao a padrao: a padrao avalia texto
  // como JavaScript, e a politica de seguranca do site nao permite isso em
  // producao. Com a padrao a conversao funcionaria no servidor de
  // desenvolvimento e falharia no ar — o pior tipo de erro.
  const { heicTo } = await import("heic-to/csp");

  const bitmap = await heicTo({ blob: arquivo, type: "bitmap" });

  const escala = Math.min(
    1,
    LADO_MAXIMO / Math.max(bitmap.width, bitmap.height)
  );
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const tela = document.createElement("canvas");
  tela.width = largura;
  tela.height = altura;

  const pincel = tela.getContext("2d");
  if (!pincel) throw new Error("Não foi possível converter a imagem.");

  pincel.drawImage(bitmap, 0, 0, largura, altura);
  // Libera a memória do decodificador: uma foto de 12 megapixels ocupa uns
  // 48 MB descomprimida, e o painel converte várias seguidas.
  bitmap.close();

  const blob = await new Promise<Blob | null>((pronto) =>
    tela.toBlob(pronto, "image/jpeg", QUALIDADE)
  );
  if (!blob) throw new Error("Não foi possível converter a imagem.");

  const nome = arquivo.name.replace(/\.(heic|heif)$/i, "") || "foto";
  return new File([blob], `${nome}.jpg`, { type: "image/jpeg" });
}

/**
 * Deixa o arquivo pronto para subir: converte se for HEIC, devolve igual se
 * não for.
 *
 * É este o ponto por onde todo campo de arquivo do painel passa, para que a
 * regra viva num lugar só.
 */
export async function prepararImagem(
  arquivo: File,
  aoConverter?: (convertendo: boolean) => void
): Promise<File> {
  if (!(await ehHeic(arquivo))) return arquivo;

  aoConverter?.(true);
  try {
    return await converterHeic(arquivo);
  } catch {
    throw new Error(
      "Não foi possível converter esta foto do iPhone. Exporte como JPG e tente de novo."
    );
  } finally {
    aoConverter?.(false);
  }
}
