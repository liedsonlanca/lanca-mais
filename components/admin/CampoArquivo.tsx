"use client";

import { useId, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

// Campo de arquivo do painel.
//
// O envio acontece assim que a pessoa escolhe o arquivo, direto do navegador
// para o Blob, e o formulário guarda só a URL resultante num campo escondido.
// O arquivo nunca passa pela função da Vercel, que tem teto de 4,5 MB por
// requisição — era o que derrubava a página ao salvar vídeo.
//
// Efeito colateral bom: ao clicar em Salvar o arquivo já subiu, então o
// formulário responde na hora em vez de segurar a página durante o upload.
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

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setErro(null);
    setUrl("");
    setNome(arquivo.name);
    setProgresso(0);

    try {
      const enviado = await upload(`${pasta}/${arquivo.name}`, arquivo, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        // Diz ao servidor que limite e que tipos valem para este campo.
        clientPayload: aceita,
        // Divide o arquivo em partes, envia em paralelo e refaz a que falhar.
        // É o que torna vídeo grande viável numa conexão instável.
        multipart: true,
        onUploadProgress: ({ percentage }) => setProgresso(percentage),
      });

      setUrl(enviado.url);
      setProgresso(100);
    } catch (falha) {
      setErro(
        falha instanceof Error ? falha.message : "Não foi possível enviar."
      );
      setProgresso(null);
      setNome("");
      if (entrada.current) entrada.current.value = "";
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
