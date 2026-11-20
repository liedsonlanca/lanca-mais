"use client";

import { usePathname } from "next/navigation";

// A coluna da lista de conversas, que no celular sai de cena quando uma
// conversa está aberta.
//
// No computador as duas colunas cabem lado a lado. No celular elas
// empilham, e a conversa aberta ficava embaixo da lista inteira — com vinte
// conversas, era rolar a tela toda para achar o que se tinha acabado de
// tocar. Aqui, com uma conversa aberta, a lista some abaixo do lg e a
// conversa ganha um "← Conversas" para voltar (ver a página da conversa).

export default function ColunaDaLista({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const conversaAberta = /^\/lncadmin\/conversas\/\d+/.test(caminho);

  return (
    <aside
      className={`max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-contorno bg-cartao lg:flex lg:h-full lg:max-h-none ${
        conversaAberta ? "hidden" : "flex"
      }`}
    >
      {children}
    </aside>
  );
}
