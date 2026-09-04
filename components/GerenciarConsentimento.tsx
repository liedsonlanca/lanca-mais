"use client";

import { temRastreadores } from "@/components/Rastreadores";

// Reabre o aviso de cookies a partir do rodapé.
//
// A lei pede que retirar o consentimento seja tão fácil quanto dá-lo, e sem
// isto a escolha valeria para sempre a partir do primeiro clique. É também o
// único caminho para quem recusou e mudou de ideia.
//
// Componente separado porque o rodapé é servidor: só este pedacinho precisa
// rodar no navegador.
export default function GerenciarConsentimento() {
  if (!temRastreadores) return null;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("lanca:consentimento"))}
      className="flex min-h-11 items-center underline underline-offset-4 transition-colors duration-300 hover:text-salmon"
    >
      Gerenciar cookies
    </button>
  );
}
