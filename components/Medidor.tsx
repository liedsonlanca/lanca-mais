"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Avisa a rota de visitas que uma página foi aberta.
//
// ---------- Por que um componente, e não um script na página ----------
//
// O site navega sem recarregar: trocar de página não dispara nada que um
// script solto no HTML perceba. Ouvindo o pathname, cada troca conta — que é
// o que faz "páginas mais vistas" significar alguma coisa.
//
// ---------- Por que sendBeacon ----------
//
// A pessoa pode sair da página no mesmo instante em que ela abre, e um fetch
// comum é cancelado quando isso acontece: perderíamos justamente a visita
// curta, que é a que mais interessa num site em obras. O sendBeacon é
// entregue pelo navegador mesmo depois de a aba fechar.
//
// Quando ele não existe, cai no fetch com keepalive, que faz a mesma coisa
// com outro nome. Se nem isso, não mede — e não quebra.
//
// ---------- O que ele não faz ----------
//
// Não guarda nada no aparelho: nem cookie, nem armazenamento local. Quem
// separa uma visita da outra é um hash calculado no servidor, que troca de
// dia (ver lib/acessos.ts). Por isso ele não espera resposta do aviso de
// cookies: não há o que consentir.
//
// Também não conta duas vezes a mesma tela. Em desenvolvimento o React monta
// cada componente duas vezes de propósito, e sem a trava o número do painel
// sairia dobrado.

export default function Medidor() {
  const pathname = usePathname();
  const ultimo = useRef<string | null>(null);

  useEffect(() => {
    if (ultimo.current === pathname) return;
    ultimo.current = pathname;

    const corpo = JSON.stringify({
      caminho: pathname,
      referencia: document.referrer,
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/visita",
          new Blob([corpo], { type: "application/json" })
        );
        return;
      }

      void fetch("/api/visita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: corpo,
        keepalive: true,
      });
    } catch {
      // Medir é acessório: nunca pode virar erro na tela de quem está lendo.
    }
  }, [pathname]);

  return null;
}
