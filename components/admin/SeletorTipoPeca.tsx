"use client";

import { useId, useState } from "react";
import CampoArquivo from "./CampoArquivo";

// Escolha entre imagem e vídeo, uma coisa ou outra.
//
// Antes a peça pedia capa e aceitava vídeo por cima, e o vídeo só tocava
// quando alguém clicava. Agora o vídeo toca sozinho no trilho, então a capa
// perdeu a função: quem mostra o primeiro quadro é o próprio vídeo.
//
// O campo escondido leva o tipo escolhido, para o servidor não precisar
// adivinhar pelo que veio preenchido.
export default function SeletorTipoPeca() {
  const [tipo, setTipo] = useState<"imagem" | "video">("imagem");
  const grupo = useId();

  const opcao =
    "flex flex-1 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors duration-300";

  return (
    <div>
      <span className="block text-xs font-medium uppercase tracking-wider text-preto/50">
        Tipo da peça
      </span>

      <div className="mt-2 flex gap-3">
        {(["imagem", "video"] as const).map((valor) => (
          <label
            key={valor}
            className={`${opcao} ${
              tipo === valor
                ? "border-salmon bg-salmon/10 text-preto"
                : "border-linha bg-branco text-preto/60 hover:border-salmon/40"
            }`}
          >
            <input
              type="radio"
              name={`${grupo}-tipo`}
              value={valor}
              checked={tipo === valor}
              onChange={() => setTipo(valor)}
              className="h-4 w-4 accent-[var(--color-salmon)]"
            />
            {valor === "imagem" ? "Imagem" : "Vídeo"}
          </label>
        ))}
      </div>

      <input type="hidden" name="tipo" value={tipo} />

      <div className="mt-4">
        {/* A chave troca o componente ao mudar de tipo: sem ela, o arquivo já
            enviado de um tipo continuaria no campo escondido do outro. */}
        {tipo === "imagem" ? (
          <CampoArquivo
            key="imagem"
            name="capa"
            pasta="vitrine"
            label="Imagem"
            obrigatorio
            ajuda="JPG, PNG ou WEBP, até 8 MB, em pé (4:5)."
          />
        ) : (
          <CampoArquivo
            key="video"
            name="video"
            pasta="vitrine"
            aceita="video"
            label="Vídeo"
            obrigatorio
            ajuda="MP4, até 30 MB. O trilho toca sozinho em toda visita, então o peso do arquivo é baixado no pacote de dados de quem abre o site pelo celular. Exporte em 1080p vertical: dá cerca de um minuto e vinte dentro do limite, e já é mais do que o ladrilho mostra."
          />
        )}
      </div>
    </div>
  );
}
