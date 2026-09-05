"use client";

import { useId, useState } from "react";
import CampoArquivo from "./CampoArquivo";
import CampoPaginasCarrossel from "./CampoPaginasCarrossel";

// Escolha entre os quatro tipos de peça, uma coisa ou outra.
//
// Estático é uma imagem só. Vídeo toca sozinho no trilho, e por isso não pede
// capa: quem mostra o primeiro quadro é o próprio vídeo. Carrossel é um post
// de várias imagens, e no trilho aparece só a primeira.
//
// Trinca é uma imagem panorâmica, das que ocupam três quadros do feed lado a
// lado. Guarda exatamente o mesmo que a estática — uma imagem —, e por isso
// divide o campo de envio com ela. O que muda é só a apresentação: o trilho
// mostra o recorte central, e ao abrir se vê a peça inteira, larga.
//
// O campo escondido leva o tipo escolhido, para o servidor não precisar
// adivinhar pelo que veio preenchido.
type Tipo = "imagem" | "video" | "carrossel" | "trinca";

const TIPOS: Array<{ valor: Tipo; rotulo: string }> = [
  // O valor guardado para o estático continua sendo "imagem": renomear
  // obrigaria a migrar as peças já cadastradas, e um banco meio migrado é pior
  // do que um nome menos bonito. Na tela ele aparece como a agência fala.
  { valor: "imagem", rotulo: "Estático" },
  { valor: "video", rotulo: "Vídeo" },
  { valor: "carrossel", rotulo: "Carrossel" },
  { valor: "trinca", rotulo: "Trinca" },
];

export default function SeletorTipoPeca() {
  const [tipo, setTipo] = useState<Tipo>("imagem");
  const grupo = useId();

  const opcao =
    "flex flex-1 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors duration-300";

  return (
    <div>
      <span className="block text-xs font-medium uppercase tracking-wider text-preto/50">
        Tipo da peça
      </span>

      {/* Empilha no celular: três opções lado a lado a 375px espremem o texto
          até quebrar dentro do cartão. */}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-3">
        {TIPOS.map(({ valor, rotulo }) => (
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
            {rotulo}
          </label>
        ))}
      </div>

      <input type="hidden" name="tipo" value={tipo} />

      <div className="mt-4">
        {/* A chave troca o componente ao mudar de tipo: sem ela, o arquivo já
            enviado de um tipo continuaria no campo escondido do outro. */}
        {tipo === "imagem" && (
          <CampoArquivo
            key="imagem"
            name="capa"
            pasta="vitrine"
            label="Imagem"
            obrigatorio
            ajuda="JPG, PNG ou WEBP, até 8 MB, em pé (4:5)."
          />
        )}

        {/* Mesmo campo da estática, com outra orientação de formato: aqui a
            imagem é deitada, e mandá-la em pé desperdiçaria a peça. */}
        {tipo === "trinca" && (
          <CampoArquivo
            key="trinca"
            name="capa"
            pasta="vitrine"
            label="Imagem da trinca"
            obrigatorio
            ajuda="JPG, PNG ou WEBP, até 8 MB, deitada: os três quadros do feed lado a lado, por volta de 2,4:1. No trilho aparece o recorte do meio, e ao abrir, a peça inteira."
          />
        )}

        {tipo === "video" && (
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

        {tipo === "carrossel" && (
          <CampoPaginasCarrossel key="carrossel" name="paginas" pasta="vitrine" />
        )}
      </div>
    </div>
  );
}
