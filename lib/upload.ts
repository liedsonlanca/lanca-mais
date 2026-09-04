import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { del } from "@vercel/blob";

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
 * Ainda aceita endereços do Vercel Blob porque o banco guarda os das peças
 * antigas: enquanto elas não forem substituídas, apagar uma precisa apagar o
 * arquivo no lugar certo.
 */
export async function apagarArquivo(url: string | null | undefined) {
  if (!url) return;

  if (url.includes(".blob.vercel-storage.com")) {
    try {
      await del(url);
    } catch {
      // Silêncio proposital: ver comentário acima.
    }
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
