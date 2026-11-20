"use client";

import { useState, useTransition } from "react";
import type { EstadoDaEquipe } from "@/lib/atendimento";

// O seletor de disponibilidade, no cabeçalho das conversas.
//
// ---------- Por que salva ao escolher ----------
//
// Com um botão "Salvar" ao lado, a pessoa troca o select, esquece o botão e
// sai achando que mudou — e o assistente continua encaminhando para uma
// equipe que está em reunião. Trocar já é a decisão; pedir confirmação de
// uma coisa que se desfaz com outra troca é só um clique a mais.
//
// A explicação do estado escolhido fica embaixo, curta: "Ausente" e "Fora de
// atendimento" soam parecidos e fazem o assistente dizer coisas diferentes.

type Opcao = { valor: EstadoDaEquipe; rotulo: string; ajuda: string };

export default function SeletorDeAtendimento({
  acao,
  atual,
  opcoes,
  agora,
}: {
  acao: (dados: FormData) => Promise<void>;
  atual: EstadoDaEquipe;
  opcoes: Opcao[];
  /** Como o automático está agora: "atendendo" ou "volta segunda às 8h30". */
  agora: string;
}) {
  const [escolhido, setEscolhido] = useState<EstadoDaEquipe>(atual);
  const [salvando, comecar] = useTransition();

  const ajuda = opcoes.find((o) => o.valor === escolhido)?.ajuda ?? "";
  const cor =
    escolhido === "disponivel" || (escolhido === "automatico" && agora === "atendendo")
      ? "bg-destaque"
      : escolhido === "ausente"
        ? "bg-salmon"
        : "bg-tinta/25";

  return (
    <div className="grid gap-0.5 sm:justify-items-end">
      <label className="flex items-center gap-2 text-xs text-tinta/45">
        <span aria-hidden className={`h-2 w-2 rounded-full ${cor}`} />
        Atendimento
        <select
          name="estado"
          value={escolhido}
          disabled={salvando}
          onChange={(evento) => {
            const valor = evento.target.value as EstadoDaEquipe;
            const anterior = escolhido;
            setEscolhido(valor);

            const dados = new FormData();
            dados.set("estado", valor);
            comecar(async () => {
              try {
                await acao(dados);
              } catch {
                // Não gravou: o select volta, para não mostrar um estado que
                // o assistente não está usando.
                setEscolhido(anterior);
              }
            });
          }}
          className="min-h-9 rounded-xl border border-contorno bg-cartao px-3 text-xs text-tinta outline-none transition-colors duration-300 focus:border-salmon disabled:opacity-60"
        >
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
              {o.valor === "automatico" ? ` — ${agora}` : ""}
            </option>
          ))}
        </select>
      </label>

      <p className="text-[0.7rem] text-tinta/35" aria-live="polite">
        {salvando ? "Salvando…" : ajuda}
      </p>
    </div>
  );
}
