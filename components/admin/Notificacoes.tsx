"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Notificacao } from "@/lib/eventos";
import { quantoFaz } from "@/lib/horario";
import { tocar } from "@/lib/som";

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
  respondida: "text-tinta/35",
};


function Icone({ estado }: { estado: Notificacao["estado"] }) {
  if (estado === "chat" || estado === "respondida") {
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
  const botao = useRef<HTMLButtonElement | null>(null);

  // Esc fecha a lista, como fecha qualquer janelinha.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  // Onde a lista abre, medido no clique.
  //
  // Ela era `absolute` dentro da barra lateral — e a barra tem rolagem
  // própria, que corta tudo o que passa da largura dela. A lista de 320px
  // saía de uma barra de 256px e ficava cortada, parecendo estar atrás do
  // painel. `fixed` escapa do corte; a posição vem do próprio sino.
  const [posicao, setPosicao] = useState<{ top: number; left: number } | null>(
    null
  );

  // O pop-up de mensagem nova.
  //
  // O sino só muda quando alguém olha para ele. Mensagem de cliente é a
  // única notícia que não pode esperar alguém olhar: ela salta no canto da
  // tela, com som, e leva direto à conversa num clique.
  //
  // "Nova" é a que não estava na lista anterior. Na primeira leitura tudo é
  // anterior — abrir o painel não dispara um pop-up para cada mensagem do
  // dia.
  const vistas = useRef<Set<string> | null>(null);
  const [recente, setRecente] = useState<Notificacao | null>(null);

  useEffect(() => {
    const chats = lista.filter((n) => n.estado === "chat");
    if (vistas.current === null) {
      vistas.current = new Set(chats.map((n) => n.chave));
      return;
    }
    const novas = chats.filter((n) => !vistas.current!.has(n.chave));
    for (const n of chats) vistas.current.add(n.chave);
    if (novas.length === 0) return;

    setRecente(novas[0]);
    tocar("mensagem");
    const relogio = setTimeout(() => setRecente(null), 10_000);
    return () => clearTimeout(relogio);
  }, [lista]);

  function alternar() {
    if (aberto) {
      setAberto(false);
      return;
    }
    const caixa = botao.current?.getBoundingClientRect();
    if (caixa) {
      const largura = Math.min(320, window.innerWidth - 32);
      setPosicao({
        top: caixa.bottom + 4,
        left: Math.max(16, Math.min(caixa.left, window.innerWidth - largura - 16)),
      });
    }
    setAberto(true);
  }
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
      {recente && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[70] w-[min(340px,calc(100vw-3rem))] rounded-2xl border border-contorno bg-cartao p-4 shadow-[0_30px_70px_-30px_rgba(10,10,8,0.45)]"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-destaque">
              <Icone estado="chat" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-tinta">{recente.titulo}</p>
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-tinta/60">
                {recente.texto}
              </p>
              {recente.href && (
                <Link
                  href={recente.href}
                  onClick={() => setRecente(null)}
                  className="mt-2 inline-flex min-h-9 items-center rounded-full bg-salmon px-3 text-xs font-medium text-preto"
                >
                  Abrir conversa
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => setRecente(null)}
              aria-label="Fechar aviso"
              className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-tinta/40 hover:text-tinta"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <button
        ref={botao}
        type="button"
        onClick={alternar}
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
            className="fixed inset-0 z-[60] cursor-default"
          />

          {/* Abre para a direita, e nao para a esquerda.

              O sino mora na barra lateral, perto da borda da janela: ancorado
              a direita, um painel de 320px saia da tela e ficava cortado. A
              largura tambem deixou de ser fixa — em telefone estreito, 320px
              passam da tela sozinhos. */}
          <div
            style={posicao ?? undefined}
            className="fixed z-[61] w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-contorno bg-cartao shadow-[0_30px_70px_-30px_rgba(10,10,8,0.35)]">
            <div className="border-b border-contorno px-4 py-3">
              <p className="text-sm font-semibold text-tinta">Notificações</p>
              <p className="mt-0.5 text-xs text-tinta/45">
                Últimas 24 horas, atualizando sozinho.
              </p>
            </div>

            <ul className="max-h-[min(360px,calc(100vh-14rem))] overflow-y-auto">
              {lista.length === 0 && (
                <li className="px-4 py-6 text-sm text-tinta/50">
                  Nada ainda. Os avisos aparecem quando alguém abrir o
                  diagnóstico, pedir um orçamento ou escrever no chat.
                </li>
              )}

              {lista.map((n) => (
                <li
                  key={n.chave}
                  className="relative flex gap-3 border-b border-contorno px-4 py-3 transition-colors duration-300 last:border-b-0 hover:bg-fundo-alt"
                >
                  {n.href && (
                    <Link
                      href={n.href}
                      onClick={() => setAberto(false)}
                      aria-label={`${n.titulo}: abrir a conversa`}
                      className="absolute inset-0"
                    />
                  )}
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
                      {quantoFaz(n.quando)}
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
