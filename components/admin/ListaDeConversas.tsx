"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ConversaNaLista } from "@/lib/conversas";

// A coluna de conversas, à esquerda da tela.
//
// ---------- Por que é componente de cliente ----------
//
// Por duas coisas que só existem no navegador: marcar qual conversa está
// aberta, e o filtro. A lista em si vem pronta do servidor — isto aqui não
// busca nada.
//
// ---------- Por que a lista fica no layout, e não na página ----------
//
// Assim ela não é redesenhada a cada conversa aberta: o App Router mantém o
// layout montado e troca só o miolo. Na prática, a coluna não pisca e não
// perde a posição da rolagem quando se pula de uma conversa para outra —
// que é exatamente o que se faz nesta tela o dia inteiro.

type Filtro = "esperando" | "todas";

const ESTADOS: Record<
  ConversaNaLista["estado"],
  { rotulo: string; classe: string }
> = {
  equipe: { rotulo: "Esperando", classe: "bg-salmon/15 text-destaque" },
  assistente: { rotulo: "Assistente", classe: "bg-fundo-alt text-tinta/50" },
  fechada: { rotulo: "Encerrada", classe: "bg-fundo-alt text-tinta/35" },
};

function quandoLegivel(iso: string) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `${horas} h`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function Inicial({ nome }: { nome: string }) {
  const letras = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fundo-alt text-xs font-medium text-tinta/60">
      {letras || "?"}
    </span>
  );
}

export default function ListaDeConversas({
  lista,
}: {
  lista: ConversaNaLista[];
}) {
  const caminho = usePathname();
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const esperando = lista.filter((c) => c.estado === "equipe").length;
  const visiveis =
    filtro === "esperando" ? lista.filter((c) => c.estado === "equipe") : lista;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-contorno px-4 py-3">
        {(["todas", "esperando"] as Filtro[]).map((alvo) => (
          <button
            key={alvo}
            type="button"
            onClick={() => setFiltro(alvo)}
            className={`rounded-full px-3 py-1.5 text-xs transition-colors duration-300 ${
              filtro === alvo
                ? "bg-destaque text-branco"
                : "text-tinta/55 hover:text-tinta"
            }`}
          >
            {alvo === "todas" ? "Todas" : "Esperando"}
            {alvo === "esperando" && esperando > 0 && (
              <span
                className={`ml-1.5 ${filtro === alvo ? "text-branco/75" : "text-destaque"}`}
              >
                {esperando}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* A coluna rola por dentro.

          Sem isto a página inteira cresce com a lista, e a conversa aberta
          ao lado sobe junto para fora da tela — com cinquenta conversas,
          atender vira rolar. */}
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {visiveis.length === 0 && (
          <li className="px-4 py-6 text-sm leading-relaxed text-tinta/45">
            {filtro === "esperando"
              ? "Ninguém esperando. Boa."
              : "Nenhuma conversa ainda. Elas aparecem assim que alguém abrir o chat no site."}
          </li>
        )}

        {visiveis.map((conversa) => {
          const aberta = caminho === `/lncadmin/conversas/${conversa.id}`;
          const estado = ESTADOS[conversa.estado];

          return (
            <li key={conversa.id}>
              <Link
                href={`/lncadmin/conversas/${conversa.id}`}
                className={`flex gap-3 border-b border-contorno px-4 py-3 transition-colors duration-200 ${
                  aberta ? "bg-fundo-alt" : "hover:bg-fundo-alt/60"
                }`}
              >
                <Inicial nome={conversa.nome || "?"} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium text-tinta">
                      {conversa.nome || "Visitante sem nome"}
                    </p>
                    <span className="shrink-0 text-[0.7rem] text-tinta/35">
                      {quandoLegivel(conversa.mexidoEm)}
                    </span>
                  </div>

                  <p className="mt-0.5 truncate text-xs text-tinta/50">
                    {conversa.ultimoAutor === "cliente" ? "" : "— "}
                    {conversa.ultima || "Sem mensagem."}
                  </p>

                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] ${estado.classe}`}
                    >
                      {estado.rotulo}
                    </span>

                    {conversa.nota !== null && (
                      <span className="text-[0.65rem] text-tinta/40">
                        {"★".repeat(conversa.nota)}
                        <span className="text-tinta/20">
                          {"★".repeat(5 - conversa.nota)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
