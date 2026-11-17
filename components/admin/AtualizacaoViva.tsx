"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Mantém o painel atualizado sozinho.
//
// ---------- Por que não é WebSocket ----------
//
// O site roda em hospedagem sem servidor: não há processo de pé esperando
// conexão. Manter um canal aberto por aba ali significa manter uma função
// viva por aba, cobrada por tempo, e reconectar a cada implantação. Para um
// painel que duas ou três pessoas abrem, é caro e frágil para um ganho de
// poucos segundos.
//
// Aqui o painel se reconsulta sozinho. `router.refresh()` refaz só o que o
// servidor renderiza e aproveita o resto da página: a tela não pisca, o que
// estiver digitado num campo continua digitado, e a rolagem não se mexe.
//
// ---------- O que custa, e como isso é contido ----------
//
// Cada atualização é uma renderização no servidor e as consultas da tela. Um
// painel esquecido aberto o dia inteiro, a cada quinze segundos, daria quase
// seis mil consultas — e o banco cobra por tempo de processamento.
//
// Por isso:
//
//   - com a aba escondida, para. Painel aberto atrás de outra janela não
//     precisa de número novo, e esse é o caso da maior parte do dia;
//   - ao voltar para a aba, atualiza na hora. É justamente quando a pessoa
//     olha, e é o momento em que o dado velho apareceria;
//   - quinze segundos, e não um. "No site agora" é uma janela de cinco
//     minutos: atualizar de segundo em segundo não mostraria nada que
//     quinze não mostrem, e multiplicaria a conta por quinze.

/** De quanto em quanto tempo, com a aba à vista. */
const INTERVALO_MS = 15_000;

export default function AtualizacaoViva() {
  const router = useRouter();

  useEffect(() => {
    let relogio: ReturnType<typeof setInterval> | null = null;

    function parar() {
      if (relogio) {
        clearInterval(relogio);
        relogio = null;
      }
    }

    function começar() {
      parar();
      relogio = setInterval(() => router.refresh(), INTERVALO_MS);
    }

    function aoMudarVisibilidade() {
      if (document.hidden) {
        parar();
        return;
      }
      // Volta à aba: o dado da tela é de quando ela saiu, então vale uma
      // atualização imediata antes de retomar o intervalo.
      router.refresh();
      começar();
    }

    if (!document.hidden) começar();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    return () => {
      parar();
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, [router]);

  return null;
}
