"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

// "Apagar todas as conversas", atrás de uma gaveta, do código do
// autenticador e de uma confirmação. Ver apagarTodasAsConversas em
// app/lncadmin/conversas/acoes.ts.

function Botao({ pronto }: { pronto: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!pronto || pending}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-red-700 px-5 text-sm font-medium text-white transition-opacity duration-300 hover:opacity-90 disabled:opacity-35"
    >
      {pending ? "Apagando…" : "Apagar todas as conversas"}
    </button>
  );
}

export default function ApagarTodasAsConversas({
  acao,
  total,
  temAutenticador,
}: {
  acao: (dados: FormData) => Promise<void>;
  total: number;
  temAutenticador: boolean;
}) {
  const [codigo, setCodigo] = useState("");

  return (
    <details className="group rounded-2xl border border-red-700/25 bg-cartao p-4">
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-sm text-tinta/55 transition-colors duration-300 hover:text-tinta">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 transition-transform duration-300 group-open:rotate-90"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
        Apagar todas as conversas
      </summary>

      <div className="mt-3 grid gap-3">
        <p className="text-xs leading-relaxed text-tinta/60">
          Apaga as <strong className="font-medium text-tinta">{total}</strong>{" "}
          {total === 1 ? "conversa" : "conversas"} do chat, com todas as
          mensagens, nomes, WhatsApp, e-mails, avaliações e arquivos enviados.{" "}
          <strong className="font-medium text-red-700">Não há como desfazer.</strong>{" "}
          Os pedidos do formulário e os visitantes barrados continuam.
        </p>

        {temAutenticador ? (
          <form
            action={acao}
            onSubmit={(evento) => {
              const certeza = window.confirm(
                `Apagar TODAS as ${total} conversas do chat, com mensagens, contatos e arquivos?\n\nNão há como desfazer.`
              );
              if (!certeza) evento.preventDefault();
              else setTimeout(() => setCodigo(""), 0);
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <label className="grid gap-1.5">
              <span className="text-[0.7rem] uppercase tracking-wide text-tinta/45">
                Código do autenticador
              </span>
              <input
                name="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                aria-label="Código de seis dígitos do aplicativo autenticador"
                className="min-h-11 w-36 rounded-xl border border-contorno bg-fundo-alt px-3.5 text-center text-base tracking-[0.3em] text-tinta outline-none transition-colors duration-300 placeholder:text-tinta/25 focus:border-red-700"
              />
            </label>
            <Botao pronto={codigo.length === 6 && total > 0} />
          </form>
        ) : (
          <p className="rounded-xl bg-fundo-alt px-3 py-2 text-xs leading-relaxed text-tinta/60">
            Para usar isto, ative a verificação em duas etapas em{" "}
            <a href="/lncadmin/seguranca" className="text-destaque underline">
              Segurança
            </a>
            . O código do autenticador é o que garante que só você apaga tudo.
          </p>
        )}
      </div>
    </details>
  );
}
