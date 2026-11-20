"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// O painel em tempo quase real, numa conversa aberta.
//
// A tela inteira se recarregava a cada 15 segundos (AtualizacaoViva), o que
// é bom para a lista e lento para uma conversa em andamento: a resposta do
// visitante demorava até 15 s para aparecer, e o "digitando…" nem existia.
//
// Aqui a pergunta é pequena e frequente — a cada 3 s, só "qual a última
// mensagem, ele está digitando, ele viu?" — e a tela só recarrega de verdade
// quando a última mensagem muda. Aba escondida não pergunta nada.

const INTERVALO_MS = 3000;

type Sinais = { ultima: number; estado: string; digitando: boolean; visto: boolean };

export default function SinaisDaConversa({
  conversa,
  ultimaConhecida,
  nome,
  equipeFalouPorUltimo,
}: {
  conversa: number;
  /** O id da última mensagem que a página já mostra. */
  ultimaConhecida: number;
  nome: string;
  /** Só faz sentido dizer "visto" quando a última fala foi da equipe. */
  equipeFalouPorUltimo: boolean;
}) {
  const router = useRouter();
  const [sinais, setSinais] = useState<Sinais | null>(null);
  const conhecida = useRef(ultimaConhecida);

  // A página recarregada traz um número novo: a pergunta passa a comparar
  // com ele.
  useEffect(() => {
    conhecida.current = ultimaConhecida;
  }, [ultimaConhecida]);

  useEffect(() => {
    let vivo = true;

    async function perguntar() {
      if (document.hidden) return;
      try {
        const resposta = await fetch(`/api/lncadmin/conversas/${conversa}`, {
          cache: "no-store",
        });
        if (!resposta.ok || !vivo) return;
        const dados = (await resposta.json()) as Sinais;
        setSinais(dados);
        if (dados.ultima > conhecida.current) router.refresh();
      } catch {
        // Rede instável: a próxima rodada tenta de novo.
      }
    }

    void perguntar();
    const relogio = setInterval(perguntar, INTERVALO_MS);
    return () => {
      vivo = false;
      clearInterval(relogio);
    };
  }, [conversa, router]);

  const primeiro = nome.split(/\s+/)[0] || "O visitante";
  const digitando = sinais?.digitando && sinais.estado === "equipe";
  const visto = equipeFalouPorUltimo && sinais?.visto;

  if (!digitando && !visto) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-5 pb-2 text-[0.7rem] text-tinta/45">
      <span aria-live="polite">
        {digitando && (
          <span className="inline-flex items-center gap-1.5">
            <span className="flex gap-0.5">
              <span className="h-1 w-1 animate-bounce rounded-full bg-tinta/40 [animation-delay:0ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-tinta/40 [animation-delay:150ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-tinta/40 [animation-delay:300ms]" />
            </span>
            {primeiro} está digitando…
          </span>
        )}
      </span>
      {visto && <span className="text-destaque/80">✓✓ Visto</span>}
    </div>
  );
}
