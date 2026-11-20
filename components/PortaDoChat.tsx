"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

// Decide se o chat aparece.
//
// ---------- A regra ----------
//
// Aparece no site, e nunca na tela de "em breve" (nem na de manutenção).
//
// "No site" quer dizer duas coisas: o site aberto ao público, ou o site visto
// por dentro, por quem entrou com a senha de pré-visualização. O segundo caso
// o layout do servidor não enxerga sem passar a ler cookies em toda página —
// o que tornaria o site inteiro dinâmico só por causa de um balão. Então
// quem decide é o navegador, pelo aviso `lanca_previa` que o porteiro
// (proxy.ts) grava para quem passou pela senha.
//
// Quem não tem senha, com o site fechado, recebe a tela de "em breve" no
// lugar da página — e para essa pessoa o aviso não existe, então o chat não
// aparece por cima.

const TELAS_SEM_CHAT = ["/em-breve", "/manutencao"];

function temPrevia() {
  return document.cookie.split("; ").some((c) => c === "lanca_previa=1");
}

// O cookie não avisa quando muda; ele é lido ao montar e a cada navegação
// (o componente se redesenha quando o caminho muda).
const assinar = () => () => {};

export default function PortaDoChat({
  abertoAoPublico,
  children,
}: {
  abertoAoPublico: boolean;
  children: React.ReactNode;
}) {
  const caminho = usePathname();

  // No servidor não há cookie para ler: o HTML sai sem o chat quando o site
  // está fechado, e o navegador o acrescenta logo depois, se houver senha.
  const previa = useSyncExternalStore(assinar, temPrevia, () => false);

  if (TELAS_SEM_CHAT.some((tela) => caminho.startsWith(tela))) return null;
  if (!abertoAoPublico && !previa) return null;

  return <>{children}</>;
}
