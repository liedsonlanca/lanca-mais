// Envio de um arquivo do navegador para o armazenamento.
//
// Roda no navegador, e é usado pelos dois campos do painel: o de arquivo único
// e o das páginas do carrossel. Ficou aqui quando o segundo apareceu — duas
// cópias do mesmo handshake acabariam divergindo, e o pedaço que mais custou a
// acertar (a URL assinada, o content-type, o progresso) é justamente o que não
// pode divergir.
//
// São dois passos: o servidor assina uma URL de uso único, conferindo sessão,
// tipo e tamanho, e o navegador manda o arquivo direto para lá. O arquivo nunca
// passa pela função da Vercel, que tem teto de 4,5 MB por requisição.

export type AceitaArquivo = "imagem" | "video";

export async function enviarArquivo(
  arquivo: File,
  pasta: string,
  aceita: AceitaArquivo,
  aoProgresso?: (porcentagem: number) => void
): Promise<string> {
  // 1. Autorização. O servidor decide o nome do arquivo, confere o tipo e o
  //    tamanho, e devolve uma URL que vale cinco minutos.
  const resposta = await fetch("/api/lncadmin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: arquivo.name,
      tipo: arquivo.type,
      tamanho: arquivo.size,
      pasta,
      aceita,
    }),
  });

  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados?.erro ?? "Envio recusado.");

  // 2. O arquivo. XMLHttpRequest, e não fetch, porque só ele informa o
  //    progresso do envio — e sem a barra um vídeo de 30 MB parece a página
  //    travada.
  await new Promise<void>((resolver, rejeitar) => {
    const pedido = new XMLHttpRequest();
    pedido.open("PUT", dados.envio);
    pedido.setRequestHeader("Content-Type", arquivo.type);

    pedido.upload.onprogress = (evento) => {
      if (evento.lengthComputable && aoProgresso) {
        aoProgresso((evento.loaded / evento.total) * 100);
      }
    };

    pedido.onload = () =>
      pedido.status >= 200 && pedido.status < 300
        ? resolver()
        : rejeitar(new Error("O armazenamento recusou o arquivo."));

    pedido.onerror = () => rejeitar(new Error("Falha de conexão no envio."));
    pedido.send(arquivo);
  });

  return dados.url as string;
}
