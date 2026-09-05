"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { enviarArquivo } from "@/lib/envio-arquivo";

// Campo de arquivo do painel.
//
// O envio acontece assim que a pessoa escolhe o arquivo, direto do navegador
// para o Cloudflare R2, e o formulário guarda só a URL resultante num campo
// escondido. O arquivo nunca passa pela função da Vercel, que tem teto de
// 4,5 MB por requisição — era o que derrubava a página ao salvar vídeo.
//
// O handshake com o armazenamento vive em lib/envio-arquivo, compartilhado
// com o campo das páginas do carrossel.
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
  /**
   * Avisa, sem impedir, quando a imagem escolhida for mais estreita que isto.
   *
   * Existe por causa da trinca. Uma peça panorâmica é mostrada no trilho pelo
   * recorte do meio, ampliada até a altura encaixar: só um terço da largura do
   * arquivo aparece, e é esse terço que precisa ter pixel. Um arquivo de 1080
   * de largura, que numa peça estática é de sobra, vira um terço de 360 e
   * chega borrado.
   *
   * Não bloqueia porque não é erro: a peça funciona, só fica menos nítida, e
   * essa é uma escolha de quem publica. O que faltava era saber disso antes de
   * o site ir ao ar, e não depois.
   */
  larguraMinima?: number;
};

/** Largura do arquivo escolhido. Zero quando não der para medir. */
async function medirLargura(arquivo: File) {
  const endereco = URL.createObjectURL(arquivo);
  try {
    const img = document.createElement("img");
    await new Promise((pronto, falhou) => {
      img.onload = pronto;
      img.onerror = falhou;
      img.src = endereco;
    });
    return img.naturalWidth;
  } catch {
    return 0;
  } finally {
    URL.revokeObjectURL(endereco);
  }
}

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
  larguraMinima,
}: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  // useId dá um identificador único por instância: várias peças na mesma
  // página usam o mesmo name, e ids repetidos quebrariam o vínculo do label.
  const idCampo = useId();
  const [url, setUrl] = useState("");
  const [nome, setNome] = useState("");
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function limpar() {
    setUrl("");
    setNome("");
    setProgresso(null);
    setErro(null);
    setAviso(null);
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
    setAviso(null);
    setUrl("");
    setNome(arquivo.name);

    // Mede antes de subir, e não depois: descobrir no fim faria a pessoa
    // esperar o envio inteiro para só então saber que valia reexportar.
    if (larguraMinima && aceita === "imagem") {
      const largura = await medirLargura(arquivo);
      if (largura > 0 && largura < larguraMinima) {
        setAviso(
          `Esta imagem tem ${largura} pixels de largura. No trilho aparece só o terço do meio, então ela vai ficar menos nítida que as outras peças. O ideal são ${larguraMinima} ou mais. Dá para enviar assim mesmo.`
        );
      }
    }

    setProgresso(0);

    try {
      const endereco = await enviarArquivo(arquivo, pasta, aceita, setProgresso);
      setUrl(endereco);
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

      {/* Aviso, não erro: o envio segue, e a peça funciona. Por isso fica em
          caixa própria em vez de vermelho, e por isso o texto termina dizendo
          que dá para enviar assim mesmo. */}
      {aviso && (
        <p
          role="status"
          className="mt-2 rounded-xl border border-linha bg-areia px-3 py-2 text-xs leading-relaxed text-preto/70"
        >
          {aviso}
        </p>
      )}

      {ajuda && !enviando && !erro && !aviso && (
        <p className="mt-2 text-xs leading-relaxed text-preto/50">{ajuda}</p>
      )}
    </div>
  );
}
