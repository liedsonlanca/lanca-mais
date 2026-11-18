"use client";

import { useEffect, useState } from "react";
import type { Notificacao } from "@/lib/eventos";

// O sino do painel.
//
// ---------- Por que ele não busca nada ----------
//
// A lista chega pronta do servidor, e se renova junto com o resto do painel
// (ver AtualizacaoViva). Um componente que busca por conta própria teria o
// próprio relógio, o próprio intervalo e o próprio jeito de errar — e duas
// contagens correndo lado a lado é como se descobre, um mês depois, que o
// número do sino não bate com o da tela.
//
// ---------- O ponto vermelho ----------
//
// Só acende para quem está no site agora. Aviso de alguém que saiu ontem não
// é urgente, e um sino que pisca para tudo deixa de ser avisado em uma
// semana: a pessoa aprende a ignorar.

const CORES: Record<Notificacao["estado"], string> = {
  agora: "text-destaque",
  saiu: "text-tinta/35",
  lead: "text-destaque",
  chat: "text-destaque",
};

function quandoLegivel(iso: string) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function Icone({ estado }: { estado: Notificacao["estado"] }) {
  if (estado === "chat") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
      </svg>
    );
  }

  if (estado === "lead") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  if (estado === "agora") {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-salmon opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-salmon" />
      </span>
    );
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M16 17l5-5-5-5M21 12H9M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

export default function Notificacoes({ lista }: { lista: Notificacao[] }) {
  const [aberto, setAberto] = useState(false);
  // O contador conta o que tem gente do outro lado esperando: quem está no
  // diagnóstico neste instante e quem pediu atendimento no chat. Avisos de
  // quem já saiu não entram — número que não pede ação nenhuma ensina a
  // ignorar o número.
  const agora = lista.filter(
    (n) => n.estado === "agora" || n.estado === "chat"
  ).length;

  // O aviso na aba do navegador.
  //
  // O painel costuma ficar aberto atrás de outra janela, e é justamente aí
  // que a informação importa: alguém está no diagnóstico agora, e a
  // conversa vale mais nesse minuto do que daqui a uma hora. O título da
  // aba é o único lugar que a pessoa vê sem trocar de janela.
  //
  // Guarda o título original em vez de escrevê-lo à mão: assim ele
  // continua certo se a página mudar de nome, e volta inteiro quando o
  // último visitante sai.
  useEffect(() => {
    const original = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = agora > 0 ? `(${agora}) ${original}` : original;

    return () => {
      document.title = original;
    };
  }, [agora]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-label={
          agora > 0
            ? `Notificações: ${agora} esperando atendimento`
            : "Notificações"
        }
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-tinta/55 transition-colors duration-300 hover:bg-fundo-alt hover:text-tinta"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>

        {agora > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-salmon opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-salmon" />
          </span>
        )}
      </button>

      {aberto && (
        <>
          {/* A capa fecha ao clicar fora, sem ouvinte no documento: um
              ouvinte global precisaria saber distinguir o clique de fora do
              clique no próprio botão, e isso é mais código para o mesmo
              efeito. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setAberto(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          {/* Abre para a direita, e nao para a esquerda.

              O sino mora na barra lateral, perto da borda da janela: ancorado
              a direita, um painel de 320px saia da tela e ficava cortado. A
              largura tambem deixou de ser fixa — em telefone estreito, 320px
              passam da tela sozinhos. */}
          <div className="absolute left-0 z-50 mt-1 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-contorno bg-cartao shadow-[0_30px_70px_-30px_rgba(10,10,8,0.35)]">
            <div className="border-b border-contorno px-4 py-3">
              <p className="text-sm font-semibold text-tinta">Notificações</p>
              <p className="mt-0.5 text-xs text-tinta/45">
                Últimas 24 horas, atualizando sozinho.
              </p>
            </div>

            <ul className="max-h-[360px] overflow-y-auto">
              {lista.length === 0 && (
                <li className="px-4 py-6 text-sm text-tinta/50">
                  Nada ainda. Os avisos aparecem quando alguém abrir o
                  diagnóstico ou pedir um orçamento.
                </li>
              )}

              {lista.map((n) => (
                <li
                  key={n.chave}
                  className="flex gap-3 border-b border-contorno px-4 py-3 last:border-b-0"
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center ${CORES[n.estado]}`}
                  >
                    <Icone estado={n.estado} />
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-tinta">{n.titulo}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-tinta/60">
                      {n.texto}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-tinta/35">
                      {quandoLegivel(n.quando)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Dito aqui, e não escondido num comentário de código: quem abre
                o painel precisa saber que o site não lê o formulário. */}
            <p className="border-t border-contorno px-4 py-3 text-[0.7rem] leading-relaxed text-tinta/40">
              O site vê quando alguém abre o diagnóstico e quanto tempo fica,
              mas não o que a pessoa digita — o formulário é do CRM, noutro
              domínio.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
