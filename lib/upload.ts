import { put, del } from "@vercel/blob";

// Envio de arquivos para o Vercel Blob.
//
// A biblioteca lê o BLOB_READ_WRITE_TOKEN sozinha, mas conferimos aqui para
// poder dar uma mensagem que diz o que fazer, em vez do erro cru dela.
export const blobConfigurado = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** 8 MB para imagem. Foto de perfil e capa não precisam de mais que isso. */
export const LIMITE_IMAGEM = 8 * 1024 * 1024;

/** 60 MB para vídeo — o custo do Blob é por banda entregue, não por arquivo
 *  guardado, então um vídeo pesado no trilho é caro a cada visita. */
export const LIMITE_VIDEO = 60 * 1024 * 1024;

const IMAGENS = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const VIDEOS = ["video/mp4", "video/webm", "video/quicktime"];

export type Enviado = { url: string } | { erro: string };

export async function enviarArquivo(
  arquivo: File,
  pasta: string,
  aceita: "imagem" | "video" = "imagem"
): Promise<Enviado> {
  if (!blobConfigurado) {
    return {
      erro: "Armazenamento de arquivos não configurado. Falta o BLOB_READ_WRITE_TOKEN no projeto da Vercel.",
    };
  }

  const permitidos = aceita === "video" ? [...IMAGENS, ...VIDEOS] : IMAGENS;
  if (!permitidos.includes(arquivo.type)) {
    return {
      erro:
        aceita === "video"
          ? "Formato não aceito. Use JPG, PNG, WEBP, MP4 ou MOV."
          : "Formato não aceito. Use JPG, PNG ou WEBP.",
    };
  }

  const limite = VIDEOS.includes(arquivo.type) ? LIMITE_VIDEO : LIMITE_IMAGEM;
  if (arquivo.size > limite) {
    const mb = Math.round(limite / 1024 / 1024);
    return { erro: `Arquivo grande demais. O limite é ${mb} MB.` };
  }

  try {
    // addRandomSuffix evita que dois arquivos de mesmo nome se sobrescrevam:
    // "foto.jpg" de dois clientes diferentes não pode virar um só.
    const { url } = await put(`${pasta}/${arquivo.name}`, arquivo, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url };
  } catch (erro) {
    return {
      erro: erro instanceof Error ? erro.message : "Falha ao enviar o arquivo.",
    };
  }
}

// Apagar é "melhor esforço": se falhar, o arquivo fica órfão no Blob, o que é
// bem menos grave do que impedir a pessoa de apagar o conteúdo no painel.
export async function apagarArquivo(url: string | null | undefined) {
  if (!url || !blobConfigurado) return;
  if (!url.includes("blob.vercel-storage.com")) return;

  try {
    await del(url);
  } catch {
    // Silêncio proposital: ver comentário acima.
  }
}
