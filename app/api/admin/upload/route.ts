import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { estadoDoAdmin } from "@/lib/admin";
import { LIMITE_IMAGEM, LIMITE_VIDEO } from "@/lib/upload";

// Autoriza o navegador a enviar o arquivo direto para o Blob.
//
// Por que não mandar o arquivo pelo servidor, como era antes: uma Server
// Action é uma requisição para a função da Vercel, e o corpo dela tem teto de
// 4,5 MB. Um vídeo nunca passaria — a página caía com "This page couldn't
// load", sem erro que ajudasse.
//
// Aqui o servidor não recebe o arquivo. Ele só assina um token curto dizendo
// "este navegador pode enviar um arquivo deste tipo, até este tamanho", e o
// upload vai do computador da pessoa direto para o Blob. Sem teto de função no
// caminho.
const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const TIPOS_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const resultado = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_caminho, cargaDoCliente) => {
        // A checagem de sessão mora aqui, e não no componente: esta rota é
        // pública como qualquer endpoint, e sem isto qualquer pessoa poderia
        // pedir um token e encher o armazenamento.
        if ((await estadoDoAdmin()) !== "liberado") {
          throw new Error("Não autorizado.");
        }

        const aceitaVideo = cargaDoCliente === "video";

        // O limite vai no token: quem manda é o Blob, não o navegador. Fosse
        // só no formulário, bastaria abrir o console para burlar.
        return {
          allowedContentTypes: aceitaVideo
            ? [...TIPOS_IMAGEM, ...TIPOS_VIDEO]
            : TIPOS_IMAGEM,
          maximumSizeInBytes: aceitaVideo ? LIMITE_VIDEO : LIMITE_IMAGEM,
          addRandomSuffix: true,
        };
      },

      // O Blob avisa quando termina. Não gravamos nada aqui: quem grava é o
      // formulário, ao salvar, com a URL que o navegador recebeu.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(resultado);
  } catch (erro) {
    return NextResponse.json(
      { error: erro instanceof Error ? erro.message : "Falha no envio." },
      { status: 400 }
    );
  }
}
