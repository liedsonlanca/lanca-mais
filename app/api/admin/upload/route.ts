import { NextResponse } from "next/server";
import { estadoDoAdmin } from "@/lib/admin";
import {
  LIMITE_IMAGEM,
  LIMITE_VIDEO,
  TIPOS_IMAGEM,
  TIPOS_VIDEO,
  armazenamentoConfigurado,
  FALTA_CONFIGURAR,
  montarChave,
  urlPublica,
  assinarEnvio,
} from "@/lib/upload";

// Autoriza um envio para o Cloudflare R2.
//
// Por que o arquivo não passa pelo servidor: uma Server Action é uma
// requisição para a função da Vercel, e o corpo dela tem teto de 4,5 MB. Um
// vídeo nunca passaria — a página caía com "This page couldn't load", sem erro
// que ajudasse.
//
// Aqui o servidor só assina uma URL de uso único dizendo "pode subir um
// arquivo deste tipo, com este nome, nos próximos cinco minutos". O arquivo
// vai do computador da pessoa direto para o R2.
//
// Três coisas que esta rota precisa fazer, e faz:
//
//   1. conferir a sessão do painel. A rota é pública como qualquer endpoint, e
//      sem isso qualquer pessoa pediria uma URL e encheria o bucket;
//   2. decidir o nome do arquivo aqui, e não aceitar o que o navegador manda.
//      Nome vindo de fora poderia conter "../" e escrever fora da pasta;
//   3. amarrar o tipo na assinatura. O R2 confere o content-type contra o que
//      foi assinado, então uma URL para MP4 não serve para subir outra coisa.
//
// O tamanho é o único que o navegador poderia burlar, então ele também é
// conferido ao salvar, quando a peça é gravada.
export async function POST(request: Request) {
  if ((await estadoDoAdmin()) !== "liberado") {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  if (!armazenamentoConfigurado) {
    return NextResponse.json({ erro: FALTA_CONFIGURAR }, { status: 503 });
  }

  let nome = "";
  let tipo = "";
  let tamanho = 0;
  let pasta = "";
  let aceitaVideo = false;

  try {
    const corpo = await request.json();
    nome = typeof corpo?.nome === "string" ? corpo.nome : "";
    tipo = typeof corpo?.tipo === "string" ? corpo.tipo : "";
    tamanho = Number(corpo?.tamanho) || 0;
    pasta = typeof corpo?.pasta === "string" ? corpo.pasta : "";
    aceitaVideo = corpo?.aceita === "video";
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  // A pasta vem do formulário, então é escolhida de uma lista, nunca aceita
  // como texto livre: "../" no meio escreveria fora do lugar previsto.
  const PASTAS = ["vitrine", "depoimentos", "cases", "logos", "blog"];
  if (!PASTAS.includes(pasta)) {
    return NextResponse.json({ erro: "Destino inválido." }, { status: 400 });
  }

  const permitidos = aceitaVideo
    ? [...TIPOS_IMAGEM, ...TIPOS_VIDEO]
    : TIPOS_IMAGEM;

  if (!permitidos.includes(tipo)) {
    return NextResponse.json(
      {
        erro: aceitaVideo
          ? "Formato não aceito. Use JPG, PNG, WEBP, MP4 ou MOV."
          : "Formato não aceito. Use JPG, PNG ou WEBP.",
      },
      { status: 400 }
    );
  }

  const limite = TIPOS_VIDEO.includes(tipo) ? LIMITE_VIDEO : LIMITE_IMAGEM;
  if (tamanho > limite) {
    const mb = Math.round(limite / 1024 / 1024);
    return NextResponse.json(
      { erro: `Arquivo grande demais. O limite é ${mb} MB.` },
      { status: 400 }
    );
  }

  const chave = montarChave(pasta, nome);

  return NextResponse.json({
    envio: await assinarEnvio(chave, tipo),
    url: urlPublica(chave),
  });
}
