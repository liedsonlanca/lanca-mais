"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

// Campo de arquivo do painel.
//
// O envio acontece assim que a pessoa escolhe o arquivo, direto do navegador
// para o Cloudflare R2, e o formulário guarda só a URL resultante num campo
// escondido. O arquivo nunca passa pela função da Vercel, que tem teto de
// 4,5 MB por requisição — era o que derrubava a página ao salvar vídeo.
//
// São dois passos: o servidor assina uma URL de uso único (conferindo sessão,
// tipo e tamanho), e o navegador manda o arquivo para lá.
//
// Efeito colateral bom: ao clicar em Salvar o arquivo já subiu, então o
// formulário responde na hora em vez de segurar a página durante o upload.
//
// O campo se limpa sozinho quando o formulário termina de salvar. Sem isso
// a mensagem "enviado" ficava na tela depois de aplicada, e o campo
// escondido seguia carregando a URL — um segundo clique em Salvar
// reaplicaria o mesmo arquivo.
type Props = {
  /** Nome do campo escondido que vai levar a URL ao formulário. */
  name: string;
  label: string;
  aceita?: "imagem" | "video";
  pasta: string;
  ajuda?: string;
  obrigatorio?: boolean;
};

const ACEITE = {
  imagem: "image/jpeg,image/png,image/webp",
  video: "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime",
};

export default function CampoArquivo({
  name,
  label,
  aceita = "imagem",
  pasta,
  ajuda,
  obrigatorio = false,
}: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  // useId dá um identificador único por instância: várias peças na mesma
  // página usam o mesmo name, e ids repetidos quebrariam o vínculo do label.
  const idCampo = useId();
  const [url, setUrl] = useState("");
  const [nome, setNome] = useState("");
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function limpar() {
    setUrl("");
    setNome("");
    setProgresso(null);
    setErro(null);
    if (entrada.current) entrada.current.value = "";
  }

  // useFormStatus enxerga o formulário que envolve este campo. Quando ele
  // sai de "enviando" para parado, a gravação terminou e o que estava aqui
  // já foi aplicado — então some.
  //
  // Precisa da referência ao estado anterior: o efeito também roda na
  // montagem, quando nada foi enviado, e limpar ali apagaria um arquivo que
  // a pessoa acabou de escolher.
  const { pending } = useFormStatus();
  const salvando = useRef(false);

  useEffect(() => {
    if (pending) {
      salvando.current = true;
      return;
    }
    if (salvando.current) {
      salvando.current = false;
      limpar();
    }
  }, [pending]);

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setErro(null);
    setUrl("");
    setNome(arquivo.name);
    setProgresso(0);

    try {
      // 1. Pedir autorização. O servidor decide o nome, confere o tipo e o
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

      // 2. Mandar o arquivo. XMLHttpRequest, e não fetch, porque só ele
      //    informa o progresso do envio — e sem a barra um vídeo de 12 MB
      //    parece a página travada.
      await new Promise<void>((resolver, rejeitar) => {
        const pedido = new XMLHttpRequest();
        pedido.open("PUT", dados.envio);
        pedido.setRequestHeader("Content-Type", arquivo.type);

        pedido.upload.onprogress = (evento) => {
          if (evento.lengthComputable) {
            setProgresso((evento.loaded / evento.total) * 100);
          }
        };

        pedido.onload = () =>
          pedido.status >= 200 && pedido.status < 300
            ? resolver()
            : rejeitar(new Error("O armazenamento recusou o arquivo."));

        pedido.onerror = () => rejeitar(new Error("Falha de conexão no envio."));
        pedido.send(arquivo);
      });

      setUrl(dados.url);
      setProgresso(100);
    } catch (falha) {
      limpar();
      setErro(
        falha instanceof Error ? falha.message : "Não foi possível enviar."
      );
    }
  }

  const enviando = progresso !== null && progresso < 100;

  return (
    <div>
      <label
        htmlFor={idCampo}
        className="block text-xs font-medium uppercase tracking-wider text-preto/50"
      >
        {label}
      </label>

      {/* O input do arquivo não tem name: só a URL vai para o formulário. */}
      <input
        ref={entrada}
        id={idCampo}
        type="file"
        accept={ACEITE[aceita]}
        onChange={aoEscolher}
        className="mt-2 block w-full text-sm text-preto/70 file:mr-4 file:rounded-full file:border-0 file:bg-salmon/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-salmon-texto"
      />

      <input type="hidden" name={name} value={url} />

      {/* required no campo escondido faria o navegador reclamar de um campo
          invisível, sem dizer onde. A validação fica no visível. */}
      {obrigatorio && !url && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value=""
          onChange={() => {}}
          className="h-0 w-0 border-0 p-0 opacity-0"
        />
      )}

      {enviando && (
        <div className="mt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-linha">
            <div
              className="h-full bg-salmon transition-all duration-200"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-preto/55">
            Enviando {nome} — {Math.round(progresso ?? 0)}%
          </p>
        </div>
      )}

      {url && (
        <p className="mt-2 text-xs font-medium text-salmon-texto">
          {nome} enviado. Clique em Salvar para aplicar.
        </p>
      )}

      {erro && (
        <p role="alert" className="mt-2 text-xs text-salmon-texto">
          {erro}
        </p>
      )}

      {ajuda && !enviando && !erro && (
        <p className="mt-2 text-xs leading-relaxed text-preto/50">{ajuda}</p>
      )}
    </div>
  );
}
