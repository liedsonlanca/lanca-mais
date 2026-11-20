"use client";

import { useRef, useState } from "react";
import { RESPOSTAS_PRONTAS } from "@/lib/respostas-prontas";

// A barra de mensagem, no formato de aplicativo de conversa.
//
// ---------- Por que uma barra, e não um cartão com rótulo ----------
//
// Antes era um cartão: título "Responder", duas linhas de explicação, caixa
// de quatro linhas, atalhos abertos embaixo e um botão. Ocupava mais da
// metade da coluna, e a conversa — que é o que a pessoa precisa ler para
// responder — ficava espremida no que sobrava. Abrindo os atalhos, sumia.
//
// Uma linha devolve esse espaço todo para a conversa. E é o formato que
// quem atende já tem na mão: WhatsApp, Instagram, o próprio CRM.
//
// ---------- Por que os atalhos viraram balão ----------
//
// Inline, eles empurravam tudo para baixo quando abertos. Num balão por
// cima, aparecem onde o olho já está, somem ao escolher e não movem um pixel
// da tela atrás.

const CHIP =
  "rounded-full border border-contorno px-3 py-1.5 text-xs text-tinta/70 transition-colors duration-300 hover:border-salmon/50 hover:text-tinta";

function Icone({
  children,
  titulo,
  onClick,
  ativo,
}: {
  children: React.ReactNode;
  titulo: string;
  onClick?: () => void;
  ativo?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      aria-pressed={ativo}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
        ativo
          ? "bg-salmon/15 text-destaque"
          : "text-tinta/45 hover:bg-fundo-alt hover:text-tinta"
      }`}
    >
      {children}
    </button>
  );
}

/** De quanto em quanto tempo, no máximo, o "digitando…" é renovado. */
const SINAL_MS = 3000;

export default function CampoDeResposta({
  acao,
  anotar,
  sinalizar,
  conversa,
  podeResponder = true,
}: {
  /** A acao de servidor que grava a resposta. */
  acao: (dados: FormData) => Promise<void>;
  /** A que grava a nota interna. */
  anotar: (dados: FormData) => Promise<void>;
  /** A que acende o "digitando…" do lado do visitante. */
  sinalizar: (id: number) => Promise<void>;
  conversa: number;
  /**
   * Falso com a conversa fora da equipe: aí o campo só anota. Responder a
   * quem está com o assistente, ou a uma conversa encerrada, seria falar por
   * cima de quem está atendendo — ou com ninguém.
   */
  podeResponder?: boolean;
}) {
  const [atalhos, setAtalhos] = useState(false);
  const [texto, setTexto] = useState("");
  const [modo, setModo] = useState<"resposta" | "nota">(
    podeResponder ? "resposta" : "nota"
  );
  const nota = modo === "nota" || !podeResponder;
  const ultimoSinal = useRef(0);

  function avisarQueDigita() {
    if (nota) return;
    const agora = Date.now();
    if (agora - ultimoSinal.current < SINAL_MS) return;
    ultimoSinal.current = agora;
    void sinalizar(conversa).catch(() => {});
  }

  function colar(trecho: string) {
    setTexto((atual) => {
      const limpo = atual.trim();
      return limpo ? `${limpo}\n\n${trecho}` : trecho;
    });

    setAtalhos(false);

    // Devolve o foco e põe o cursor no fim: quem colou um atalho quase
    // sempre quer acrescentar uma frase antes de enviar.
    requestAnimationFrame(() => {
      const area = document.getElementById("resposta");
      if (area instanceof HTMLTextAreaElement) {
        area.focus();
        area.setSelectionRange(area.value.length, area.value.length);
      }
    });
  }

  return (
    // O formulario mora aqui dentro, e nao na pagina, porque o campo e
    // controlado: quem guarda o texto precisa ser quem o limpa depois de
    // enviar. Deixado na pagina, a mensagem enviada continuaria escrita no
    // campo e a pessoa mandaria a mesma coisa duas vezes.
    <div className={`border-t border-contorno ${nota ? "bg-amber-400/5" : ""}`}>
    {/* Responder ou anotar.

        A nota interna mora no mesmo campo, e não num formulário à parte: é
        no meio da conversa que se lembra de anotar. A cor muda junto com o
        modo, para ninguém mandar ao cliente o que era recado para a equipe. */}
    <div className="flex gap-1 px-3 pt-2">
      {podeResponder && (
        <button
          type="button"
          onClick={() => setModo("resposta")}
          className={`rounded-full px-3 py-1 text-[0.7rem] transition-colors duration-300 ${
            !nota ? "bg-destaque text-branco" : "text-tinta/50 hover:text-tinta"
          }`}
        >
          Responder
        </button>
      )}
      <button
        type="button"
        onClick={() => setModo("nota")}
        className={`rounded-full px-3 py-1 text-[0.7rem] transition-colors duration-300 ${
          nota ? "bg-amber-500 text-preto" : "text-tinta/50 hover:text-tinta"
        }`}
      >
        Nota interna
      </button>
      {nota && (
        <span className="self-center pl-1 text-[0.65rem] text-tinta/40">
          Só a equipe vê.
        </span>
      )}
    </div>
    <form
      action={nota ? anotar : acao}
      onSubmit={() => setTexto("")}
      className="relative flex items-end gap-1 px-3 py-2.5"
    >
      <input type="hidden" name="id" value={conversa} />
      {atalhos && (
        <>
          {/* A capa fecha ao clicar fora, sem ouvinte no documento. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setAtalhos(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute bottom-full left-2 z-50 mb-2 max-h-72 w-[min(30rem,calc(100vw-6rem))] overflow-y-auto rounded-2xl border border-contorno bg-cartao p-4 shadow-[0_30px_70px_-30px_rgba(10,10,8,0.35)]">
            <p className="text-xs font-semibold text-tinta">Respostas rápidas</p>
            <p className="mt-0.5 text-[0.7rem] leading-relaxed text-tinta/45">
              Clicar cola no campo. Você ajusta antes de enviar.
            </p>

            <div className="mt-3 grid gap-3">
              {RESPOSTAS_PRONTAS.map((grupo) => (
                <div key={grupo.grupo}>
                  <p className="text-[0.65rem] uppercase tracking-wide text-tinta/35">
                    {grupo.grupo}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {grupo.itens.map((item) => (
                      <button
                        key={item.rotulo}
                        type="button"
                        onClick={() => colar(item.texto)}
                        title={item.texto}
                        className={CHIP}
                      >
                        {item.rotulo}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Icone
        titulo="Respostas rápidas"
        ativo={atalhos}
        onClick={() => setAtalhos((v) => !v)}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
        </svg>
      </Icone>

      <textarea
        id="resposta"
        name="texto"
        rows={1}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          avisarQueDigita();
        }}
        maxLength={2000}
        placeholder={nota ? "Anotação para a equipe…" : "Digite uma mensagem…"}
        onKeyDown={(evento) => {
          if (evento.key !== "Enter" || evento.shiftKey) return;

          // Enter no meio de uma sugestão do corretor do celular está
          // confirmando a palavra, e não enviando a mensagem.
          if (evento.nativeEvent.isComposing) return;

          evento.preventDefault();
          evento.currentTarget.form?.requestSubmit();
        }}
        // Cresce com o texto até um teto, e então rola. Caixa de altura fixa
        // obriga a rolar para reler o que se acabou de escrever; caixa sem
        // teto engole a conversa quando alguém cola um parágrafo longo.
        onInput={(evento) => {
          const area = evento.currentTarget;
          area.style.height = "auto";
          area.style.height = `${Math.min(area.scrollHeight, 140)}px`;
        }}
        className="max-h-[140px] min-h-11 flex-1 resize-none rounded-2xl border border-contorno bg-fundo-alt px-4 py-2.5 text-sm leading-relaxed text-tinta outline-none transition-colors duration-300 placeholder:text-tinta/35 focus:border-salmon"
      />

      <button
        type="submit"
        title={nota ? "Salvar nota — ou tecle Enter" : "Enviar — ou tecle Enter"}
        aria-label={nota ? "Salvar nota interna" : "Enviar mensagem"}
        disabled={!texto.trim()}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-opacity duration-300 disabled:opacity-30 ${
          nota ? "bg-amber-500 text-preto" : "bg-destaque text-branco"
        }`}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
        </svg>
      </button>
    </form>
    </div>
  );
}
