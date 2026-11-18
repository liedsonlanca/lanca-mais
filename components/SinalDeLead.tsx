"use client";

import { useEffect, useRef } from "react";

// Avisa o painel que alguém está no diagnóstico.
//
// ---------- O que este componente consegue ver ----------
//
// Que a página abriu, que continua aberta, e quando fechou. Nada do que
// acontece dentro do formulário: ele é a página do CRM, servida de outro
// domínio, e o navegador proíbe ler ali dentro.
//
// Por isso o sinal é tempo, e não conteúdo. Quem fica quatro minutos está
// preenchendo; quem sai em oito segundos desistiu. O painel fala em tempo
// porque é o que existe de verdade.
//
// ---------- Por que a batida é de trinta segundos ----------
//
// Ela é o que distingue "está na página" de "fechou e o aviso não chegou". O
// painel considera ausente quem fica noventa segundos calado, ou seja, três
// batidas perdidas — uma falha de rede sozinha não some com a pessoa da tela.
//
// Trinta segundos num site com pouca gente é barato. Se um dia a tela encher,
// é este número que se mexe primeiro.
//
// ---------- Por que pagehide, e não beforeunload ----------
//
// `beforeunload` não dispara no celular quando a pessoa troca de aplicativo,
// que é como a maioria sai. `pagehide` dispara nos dois casos, e sobrevive à
// aba sendo congelada pelo sistema.

const BATIDA_MS = 30_000;

function avisar(tipo: string, caminho: string, detalhe?: string) {
  const corpo = JSON.stringify({ tipo, caminho, detalhe });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/evento",
        new Blob([corpo], { type: "application/json" })
      );
      return;
    }
    void fetch("/api/evento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: corpo,
      keepalive: true,
    });
  } catch {
    // Avisar é acessório: nunca pode virar erro na tela de quem está lendo.
  }
}

export default function SinalDeLead({ caminho }: { caminho: string }) {
  const jaSaiu = useRef(false);

  useEffect(() => {
    // A hora de entrada é marcada aqui, e não no corpo do componente: ler o
    // relógio durante a renderização dá resultado diferente a cada vez que o
    // React redesenha, e o tempo na página sairia errado.
    const inicio = Date.now();
    avisar("diagnostico_abriu", caminho);

    const relogio = setInterval(() => {
      // Aba escondida não é saída: a pessoa pode estar conferindo um dado
      // noutra janela para responder. Só paramos de bater.
      if (!document.hidden) avisar("diagnostico_presente", caminho);
    }, BATIDA_MS);

    function sair() {
      if (jaSaiu.current) return;
      jaSaiu.current = true;
      const segundos = Math.round((Date.now() - inicio) / 1000);
      avisar("diagnostico_saiu", caminho, String(segundos));
    }

    window.addEventListener("pagehide", sair);

    return () => {
      clearInterval(relogio);
      window.removeEventListener("pagehide", sair);
      // Sair pela navegação do próprio site também é sair.
      sair();
    };
  }, [caminho]);

  return null;
}
