import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Armazenamento dos arquivos do painel: Cloudflare R2.
//
// Por que saímos do Vercel Blob: lá a banda entregue é cobrada e contada, e o
// trilho da home toca vídeo em toda visita. A franquia de 10 GB acabou, o
// armazenamento foi pausado por trinta dias e os vídeos sumiram do site e do
// painel ao mesmo tempo. No R2 a saída de dados não é cobrada nem medida —
// guardar custa, entregar não. Para um vídeo que toca sozinho em toda visita,
// é a diferença entre um problema que volta todo mês e um que deixa de
// existir.
//
// O R2 fala o protocolo do S3, então usamos o cliente oficial da AWS apontado
// para o endereço da Cloudflare. É biblioteca só de servidor: não entra no
// pacote que o visitante baixa.

/** 8 MB para imagem. Foto de perfil e capa não precisam de mais que isso. */
export const LIMITE_IMAGEM = 8 * 1024 * 1024;

/**
 * 30 MB para vídeo.
 *
 * Eram 12, e o número respondia ao custo: no Vercel Blob cada visita que
 * assistia era cobrada. No R2 a entrega não é cobrada nem medida, então esse
 * motivo deixou de existir.
 *
 * O que limita agora é quem assiste. O trilho toca sozinho, em laço, sem
 * ninguém pedir: quem abre o site pelo celular baixa o arquivo inteiro sem
 * ter escolhido nada. O teto protege o pacote de dados do visitante, não a
 * conta da agência.
 *
 * Por que 30 e não 50: um vertical em 1080p bem exportado fica por volta de
 * 3 Mbps, então 30 MB dão cerca de um minuto e vinte de vídeo — mais do que
 * qualquer peça de portfólio costuma ter. Os 20 MB a mais comprariam duração
 * que ninguém usa, ou resolução que o ladrilho de 280 pixels não mostra.
 */
export const LIMITE_VIDEO = 30 * 1024 * 1024;

export const TIPOS_IMAGEM = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
export const TIPOS_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];

const CONTA = process.env.R2_ACCOUNT_ID ?? "";
const BUCKET = process.env.R2_BUCKET ?? "";
const CHAVE = process.env.R2_ACCESS_KEY_ID ?? "";
const SEGREDO = process.env.R2_SECRET_ACCESS_KEY ?? "";

/** Domínio público do bucket, sem protocolo. Ex: midia.lancamais.com */
export const HOST_PUBLICO = (process.env.R2_PUBLIC_HOST ?? "").replace(
  /^https?:\/\//,
  ""
);

export const armazenamentoConfigurado = Boolean(
  CONTA && BUCKET && CHAVE && SEGREDO && HOST_PUBLICO
);

export const FALTA_CONFIGURAR =
  "Armazenamento de arquivos não configurado. Faltam as variáveis R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_PUBLIC_HOST no projeto da Vercel.";

function cliente() {
  return new S3Client({
    // O R2 não tem regiões como a AWS, mas o protocolo exige o campo.
    region: "auto",
    endpoint: `https://${CONTA}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: CHAVE, secretAccessKey: SEGREDO },

    // Sem isto, nenhum envio funciona.
    //
    // A biblioteca da AWS passou a calcular uma soma de verificação por
    // padrão e a embutir na assinatura. Ao assinar uma URL ainda não existe
    // arquivo, então ela assina a soma de um corpo vazio — e a URL sai com
    // x-amz-checksum-crc32=AAAAAA==, que é o CRC32 de nada. Quando o
    // navegador manda o arquivo de verdade, o R2 compara as duas somas, elas
    // não batem e o envio é recusado.
    //
    // Pior: a recusa vem sem os cabeçalhos de permissão de origem, então o
    // navegador não consegue expor o erro e reporta como falha de conexão —
    // que aponta para tudo, menos para a causa.
    //
    // "WHEN_REQUIRED" faz a soma só onde o protocolo exige, e URL assinada
    // não exige.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

/**
 * Nome do arquivo dentro do bucket.
 *
 * Leva um sufixo aleatório porque dois clientes podem mandar "logo.png", e sem
 * isso o segundo apagaria o primeiro sem avisar ninguém. O nome original fica
 * no fim para o arquivo continuar reconhecível ao olhar a lista do bucket.
 */
export function montarChave(pasta: string, nomeOriginal: string) {
  const limpo = nomeOriginal
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-60);

  const sufixo = crypto.randomUUID().slice(0, 8);
  return `${pasta}/${sufixo}-${limpo || "arquivo"}`;
}

/** Endereço final do arquivo, o que vai para o banco e para a página. */
export function urlPublica(chave: string) {
  return `https://${HOST_PUBLICO}/${chave}`;
}

/**
 * Autoriza um envio só, com tipo e tamanho já decididos pelo servidor.
 *
 * O navegador manda o arquivo direto para o R2 com esta URL. O servidor não
 * recebe o arquivo em momento nenhum — e isso não é só economia: o corpo de
 * uma requisição para a função da Vercel tem teto de 4,5 MB, então vídeo
 * nenhum passaria por ali.
 *
 * O tipo entra na assinatura: a URL assinada para um MP4 não serve para subir
 * outra coisa, porque o R2 confere o content-type contra o que foi assinado.
 */
export async function assinarEnvio(chave: string, tipo: string) {
  const comando = new PutObjectCommand({
    Bucket: BUCKET,
    Key: chave,
    ContentType: tipo,
  });

  // Cinco minutos: tempo de sobra para um arquivo de 12 MB numa conexão ruim,
  // e curto o bastante para uma URL vazada não valer muito.
  return getSignedUrl(cliente(), comando, { expiresIn: 300 });
}

/** A chave de volta, a partir da URL pública guardada no banco. */
function chaveDaUrl(url: string) {
  try {
    const endereco = new URL(url);
    if (endereco.hostname !== HOST_PUBLICO) return null;
    return decodeURIComponent(endereco.pathname.replace(/^\//, "")) || null;
  } catch {
    return null;
  }
}

/**
 * Apaga o arquivo que deixou de ser usado.
 *
 * É "melhor esforço": falhar aqui deixa um arquivo órfão ocupando espaço, o
 * que é bem menos grave do que impedir a pessoa de apagar o conteúdo.
 *
 * ---------- Os endereços antigos do Vercel Blob ----------
 *
 * O banco ainda guarda endereços da loja antiga, e antes este trecho chamava
 * o pacote @vercel/blob para apagá-los. Ele saiu, e não por capricho de
 * dependência: aquele pacote arrastava oito avisos de segurança — sete
 * altos, entre eles um que derruba o processo e um que ignora a validação de
 * certificado TLS — e tudo isso entrava no servidor do site para atender uma
 * loja que está pausada desde a migração para o R2.
 *
 * Pausada, ela não serve mais nenhum arquivo: os endereços antigos já estão
 * quebrados no site, e apagar lá dentro não mudaria nada para ninguém. Em
 * troca de zero benefício, o site carregava a superfície de ataque inteira.
 *
 * O registro fica no console para o dia em que alguém reabrir a loja e
 * quiser faxinar o que sobrou.
 */
export async function apagarArquivo(url: string | null | undefined) {
  if (!url) return;

  if (url.includes(".blob.vercel-storage.com")) {
    console.warn(
      "[upload] arquivo antigo do Vercel Blob não foi apagado (loja pausada):",
      url
    );
    return;
  }

  if (!armazenamentoConfigurado) return;
  const chave = chaveDaUrl(url);
  if (!chave) return;

  try {
    await cliente().send(
      new DeleteObjectCommand({ Bucket: BUCKET, Key: chave })
    );
  } catch {
    // idem
  }
}

/* ---------------- Anexos do chat ---------------- */

/**
 * Os tipos aceitos no chat, e o que cada um tem de trazer nos primeiros
 * bytes.
 *
 * O tipo que o navegador declara é palpite do próprio navegador, e quem quer
 * subir outra coisa declara o que quiser. Os bytes iniciais (a "assinatura"
 * de cada formato) são o que o arquivo de fato é.
 */
const ASSINATURAS: Record<string, { ext: string; confere: (b: Uint8Array) => boolean }> = {
  "image/jpeg": { ext: "jpg", confere: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": {
    ext: "png",
    confere: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  "image/webp": {
    ext: "webp",
    confere: (b) =>
      String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
  "application/pdf": {
    ext: "pdf",
    confere: (b) => String.fromCharCode(...b.slice(0, 5)) === "%PDF-",
  },
};

/** 4 MB: abaixo do teto de 4,5 MB do corpo de uma função da Vercel. */
export const LIMITE_ANEXO = 4 * 1024 * 1024;

/**
 * Guarda um anexo do chat, passando pelo servidor.
 *
 * Diferente dos envios do painel, que vão direto do navegador para o R2: o
 * anexo do chat vem de qualquer visitante, e a URL assinada não prende o
 * tamanho. Passando por aqui, tamanho e conteúdo são conferidos antes de
 * qualquer byte chegar ao armazenamento.
 *
 * O nome no bucket é um UUID inteiro, e não o nome do arquivo: o endereço é
 * público, e só não ser adivinhável é o que protege o documento de um
 * cliente.
 */
export async function guardarAnexo(arquivo: File) {
  if (!armazenamentoConfigurado) return { erro: "Envio de arquivos indisponível." };
  if (arquivo.size > LIMITE_ANEXO) return { erro: "Arquivo grande demais. O limite é 4 MB." };

  const formato = ASSINATURAS[arquivo.type];
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  if (!formato || !formato.confere(bytes)) {
    return { erro: "Formato não aceito. Envie JPG, PNG, WEBP ou PDF." };
  }

  const chave = `chat/${crypto.randomUUID()}.${formato.ext}`;
  await cliente().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: chave,
      Body: bytes,
      ContentType: arquivo.type,
      // PDF abre no navegador, mas com o nome certo ao salvar.
      ContentDisposition:
        arquivo.type === "application/pdf"
          ? `inline; filename="${(arquivo.name || "arquivo.pdf").replace(/[^\w.\- ]+/g, "_").slice(0, 80)}"`
          : undefined,
    })
  );

  return { url: urlPublica(chave), tipo: arquivo.type };
}
