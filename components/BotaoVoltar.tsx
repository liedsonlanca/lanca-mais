"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

// O "Voltar" das páginas internas.
//
// Existe para quem está no celular: o botão do navegador fica escondido atrás
// de um gesto ou de uma barra que some ao rolar, e quem entrou numa página de
// serviço a partir da home costuma querer voltar exatamente para onde parou de
// ler. O router.back() faz isso: o Next devolve a posição de rolagem anterior,
// então a pessoa volta para o meio da home, e não para o topo dela.
//
// Não é flutuante, a pedido do cliente: fica no alto da página e sobe junto
// com o conteúdo. Mora no vão que o topo das páginas internas já deixa vazio
// por causa do menu fixo, então não empurra nada para baixo.

/** Onde o botão não aparece. */
const SEM_VOLTAR = ["/", "/em-breve", "/manutencao"];

function Seta() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 transition-transform duration-500 group-hover:-translate-x-1"
    >
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export default function BotaoVoltar() {
  const pathname = usePathname();
  const router = useRouter();

  // Se existe histórico para onde voltar.
  //
  // useSyncExternalStore em vez de estado com efeito: no servidor não há
  // history, e este padrão devolve falso lá e o valor real depois de
  // hidratar, sem o HTML do servidor divergir do primeiro desenho e sem
  // gravar estado dentro de efeito.
  const temHistorico = useSyncExternalStore(
    () => () => {},
    () => window.history.length > 1,
    () => false
  );

  if (SEM_VOLTAR.includes(pathname) || pathname.startsWith("/lncadmin")) {
    return null;
  }

  const classe =
    "group inline-flex min-h-11 items-center gap-2.5 text-sm font-medium text-bege/70 transition-colors duration-500 hover:text-bege";

  return (
    // Fica por cima do vão vazio do topo, sem ocupar espaço no fluxo: as
    // páginas internas já reservam esse respiro para o menu fixo, e empurrar
    // o título para baixo só para caber um link seria caro demais.
    //
    // O contêiner não recebe clique; só o botão recebe. Sem isso, uma faixa
    // invisível de ponta a ponta ficaria roubando o toque do que está atrás.
    <div className="pointer-events-none absolute inset-x-0 top-[92px] z-30 lg:top-[104px]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {temHistorico ? (
          <button
            type="button"
            onClick={() => router.back()}
            className={`pointer-events-auto ${classe}`}
          >
            <Seta />
            Voltar
          </button>
        ) : (
          // Sem histórico, voltar não tem para onde ir: quem chegou direto
          // nesta página por um link compartilhado veria o botão levar para
          // fora do site. Aqui ele leva para a home.
          <Link href="/" className={`pointer-events-auto ${classe}`}>
            <Seta />
            Ir para o início
          </Link>
        )}
      </div>
    </div>
  );
}
