"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Contato } from "@/lib/contatos";
import { diaDaAgencia } from "@/lib/horario";

// A lista de quem chegou pelo site.
//
// ---------- Por que a busca é no navegador ----------
//
// São duzentas linhas no máximo, e elas já estão todas aqui. Mandar cada
// letra digitada ao servidor seria uma ida ao banco por tecla para filtrar o
// que a página já tem na mão — e com atraso de rede no meio, o campo
// pareceria travado.

const CHIP = "rounded-full px-2 py-0.5 text-[0.65rem]";


export default function TabelaDeContatos({ lista }: { lista: Contato[] }) {
  const [busca, setBusca] = useState("");
  const [porta, setPorta] = useState<"todas" | Contato["porta"]>("todas");

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return lista.filter((c) => {
      if (porta !== "todas" && c.porta !== porta) return false;
      if (!termo) return true;

      // Procura no que a pessoa lembraria de digitar: nome, telefone,
      // e-mail e o próprio assunto. Buscar só por nome obriga a lembrar
      // exatamente como ela se escreveu.
      return [c.nome, c.whatsapp, c.email, c.assunto]
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });
  }, [busca, lista, porta]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone, e-mail ou assunto"
          aria-label="Buscar contato"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-contorno bg-cartao px-4 text-sm text-tinta outline-none transition-colors duration-300 placeholder:text-tinta/35 focus:border-salmon"
        />

        <div className="flex gap-2">
          {(["todas", "chat", "orcamento"] as const).map((alvo) => (
            <button
              key={alvo}
              type="button"
              onClick={() => setPorta(alvo)}
              className={`min-h-11 rounded-full px-4 text-xs transition-colors duration-300 ${
                porta === alvo
                  ? "bg-destaque text-branco"
                  : "border border-contorno text-tinta/55 hover:text-tinta"
              }`}
            >
              {alvo === "todas"
                ? "Todos"
                : alvo === "chat"
                  ? "Chat"
                  : "Orçamento"}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-tinta/40">
        {visiveis.length === lista.length
          ? `${lista.length} ${lista.length === 1 ? "contato" : "contatos"}`
          : `${visiveis.length} de ${lista.length}`}
      </p>

      {visiveis.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-contorno bg-cartao p-5 text-sm leading-relaxed text-tinta/55">
          {lista.length === 0
            ? "Ninguém ainda. Esta lista enche sozinha quando alguém deixa os dados no chat ou manda o formulário de orçamento."
            : "Nada com esse termo."}
        </p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {visiveis.map((contato) => (
            <li
              key={contato.chave}
              className="rounded-2xl border border-contorno bg-cartao p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-tinta">{contato.nome}</p>

                <div className="flex items-center gap-2">
                  <span
                    className={`${CHIP} ${
                      contato.porta === "chat"
                        ? "bg-fundo-alt text-tinta/55"
                        : "bg-salmon/15 text-destaque"
                    }`}
                  >
                    {contato.porta === "chat" ? "Chat" : "Orçamento"}
                  </span>

                  {/* Só aparece quando deu errado: um selo verde em tudo que
                      funcionou vira ruído, e o que precisa de ação some no
                      meio. */}
                  {!contato.noCrm && (
                    <span className={`${CHIP} bg-salmon/20 text-destaque`}>
                      fora do CRM
                    </span>
                  )}

                  <span className="text-[0.7rem] text-tinta/35">
                    {diaDaAgencia(contato.quando)}
                  </span>
                </div>
              </div>

              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {contato.whatsapp && (
                  <a
                    href={`https://wa.me/55${contato.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tinta/70 transition-colors duration-300 hover:text-tinta"
                  >
                    {contato.whatsapp}
                  </a>
                )}
                {contato.email && (
                  <a
                    href={`mailto:${contato.email}`}
                    className="text-tinta/70 transition-colors duration-300 hover:text-tinta"
                  >
                    {contato.email}
                  </a>
                )}
              </div>

              {contato.assunto && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-tinta/50">
                  {contato.assunto}
                </p>
              )}

              <div className="mt-2 flex items-center gap-3">
                {contato.conversa !== null && (
                  <Link
                    href={`/lncadmin/conversas/${contato.conversa}`}
                    className="text-xs text-destaque transition-opacity duration-300 hover:opacity-75"
                  >
                    Ver a conversa
                  </Link>
                )}

                {contato.nota !== null && (
                  <span className="text-xs text-tinta/40">
                    <span className="text-salmon">
                      {"★".repeat(contato.nota)}
                    </span>
                    <span className="text-tinta/20">
                      {"★".repeat(5 - contato.nota)}
                    </span>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
