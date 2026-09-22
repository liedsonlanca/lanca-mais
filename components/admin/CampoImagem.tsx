"use client";

import { useState } from "react";
import CampoArquivo from "@/components/admin/CampoArquivo";
import type { Moldura } from "@/lib/imagens";

// Campo de imagem com prévia, no painel.
//
// A diferença para o CampoArquivo puro é a moldura: ela não é um quadradinho
// genérico, é a cópia da caixa onde a imagem vai morar no site — mesma
// proporção, mesmo recorte, mesmo véu por cima, mesmo fundo atrás.
//
// Isso existe porque o erro caro não é enviar o arquivo errado: é enviar o
// arquivo certo e descobrir, já publicado, que naquela caixa ele perde a
// cabeça de alguém, ou que o logo tinha fundo branco, ou que a foto some sob
// o véu. Tudo isso se vê aqui antes de salvar.
//
// A prévia troca no instante em que a pessoa escolhe o arquivo, sem esperar o
// envio terminar: o CampoArquivo devolve um endereço local pelo aoPrever.

/** Altura que toda moldura tenta ter. A largura sai da proporção. */
const ALTURA_ALVO = 300;

export default function CampoImagem({
  name,
  atual,
  moldura,
  label,
  ajuda,
  pasta = "imagens",
  aceita = "imagem",
}: {
  name: string;
  /** O que está no ar agora. É o que a moldura mostra enquanto nada foi escolhido. */
  atual: string;
  moldura: Moldura;
  label: string;
  ajuda?: string;
  pasta?: "imagens" | "depoimentos-video";
  aceita?: "imagem" | "video";
}) {
  const [escolhida, setEscolhida] = useState<string | null>(null);

  // Teto de largura tirado da própria proporção.
  //
  // Sem isto a moldura ocupa a largura toda quando as colunas se empilham,
  // e uma prévia de 4 por 5 numa coluna de 700px vira uma imagem de 875 de
  // altura: a pessoa rola três telas para ver cinco posições. O que precisa
  // ficar constante é a altura, não a largura, senão a de 21 por 9 sairia
  // minúscula e a em pé, gigante.
  const [largura, altura] = moldura.proporcao.split("/").map(Number);
  const teto =
    largura > 0 && altura > 0
      ? Math.min(560, Math.round(ALTURA_ALVO * (largura / altura)))
      : 360;
  const mostrando = escolhida ?? atual;

  const fundo =
    moldura.fundo === "escuro"
      ? "bg-[#0D0D0B]"
      : moldura.fundo === "claro"
        ? "bg-[#EFEDE8]"
        : "bg-fundo-alt";

  return (
    <div>
      <div className="relative" style={{ maxWidth: teto }}>
        <div
          className={`relative w-full overflow-hidden border border-contorno ${fundo}`}
          style={{
            aspectRatio: moldura.proporcao,
            borderRadius: moldura.raio ?? "1rem",
            maxWidth: teto,
          }}
        >
          {mostrando ? (
            // <img> e não next/image de propósito: o endereço da prévia é um
            // blob: do próprio navegador, que o otimizador de imagem não sabe
            // buscar. E esta tela é do painel, vista por duas pessoas — não
            // vale um caminho especial para economizar bytes aqui.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mostrando}
              alt=""
              className="absolute inset-0 h-full w-full"
              style={{
                objectFit: moldura.encaixe ?? "cover",
                objectPosition: moldura.recorte ?? "center",
                opacity: moldura.opacidade ?? 1,
              }}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-xs text-tinta/40">
              Sem imagem
            </span>
          )}

          {/* O mesmo véu que o site põe por cima. Sem ele, a prévia mentiria:
              uma foto de muito contraste parece ótima aqui e ilegível lá. */}
          {moldura.veu && (
            <span aria-hidden className={`absolute inset-0 ${moldura.veu}`} />
          )}
        </div>

        {/* Só quando há escolha pendente. O painel inteiro é de formulários
            que só valem ao clicar em Salvar, e sem este aviso a prévia nova
            pareceria já estar no ar. */}
        {escolhida && (
          <span className="absolute left-3 top-3 rounded-full bg-destaque px-3 py-1 text-xs font-medium text-branco shadow-[var(--sombra-cartao)]">
            Ainda não salvo
          </span>
        )}
      </div>

      <div className="mt-4">
        <CampoArquivo
          name={name}
          pasta={pasta}
          aceita={aceita}
          label={label}
          ajuda={ajuda}
          aoPrever={setEscolhida}
        />
      </div>
    </div>
  );
}
