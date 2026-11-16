"use client";

import { useEffect } from "react";

// Tira o menu do botão direito de cima das imagens e dos vídeos.
//
// ---------- O que isto faz, e o que não faz ----------
//
// Não impede download. Nada impede. Toda imagem e todo vídeo que a pessoa vê
// já estão na máquina dela — é assim que ela vê. Quem abrir as ferramentas do
// desenvolvedor, a aba de rede, ou pedir o endereço do arquivo direto, leva o
// arquivo. Prometer o contrário seria mentira.
//
// O que isto tira é o caminho de um clique: "Salvar imagem como…". Junto com
// o CSS que desliga o arrastar e o toque longo (ver globals), cobre o que um
// visitante faz sem querer virar hacker. É todo o alcance honesto da coisa.
//
// ---------- Por que só sobre a mídia ----------
//
// Bloquear o botão direito na página inteira é o reflexo comum, e cobra caro
// de quem não ia copiar nada: a pessoa usa o menu para abrir link em outra
// aba, copiar um telefone, traduzir a página. Quem ia salvar a imagem salva
// por outro caminho de qualquer forma, então o bloqueio geral só atrapalha
// quem estava se comportando.
//
// Aqui o menu só não abre quando o alvo é <img> ou <video>. Em cima de texto,
// de link e de botão ele continua funcionando.
//
// ---------- Por que um ouvinte só, no documento ----------
//
// A alternativa seria um onContextMenu em cada imagem do site, que são
// dezenas e crescem pelo painel — e bastaria esquecer uma. Um ouvinte na
// captura do documento pega qualquer mídia, inclusive a que ainda não existe
// quando a página carrega.

export default function MidiaProtegida() {
  useEffect(() => {
    function aoAbrirMenu(evento: MouseEvent) {
      const alvo = evento.target as HTMLElement | null;
      if (!alvo) return;

      const etiqueta = alvo.tagName;
      if (etiqueta === "IMG" || etiqueta === "VIDEO") evento.preventDefault();
    }

    document.addEventListener("contextmenu", aoAbrirMenu);
    return () => document.removeEventListener("contextmenu", aoAbrirMenu);
  }, []);

  return null;
}
