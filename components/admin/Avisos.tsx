"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { COOKIE_AVISO, type TomDoAviso } from "@/lib/aviso";

// Os avisos do painel: aparecem no canto, dizem o que aconteceu, somem sozinhos.
//
// ---------- Como o aviso chega até aqui ----------
//
// A Server Action grava um cookie antes de terminar (ver lib/aviso.ts). O
// navegador guarda esse cookie ao receber a resposta do POST, e é daqui que
// este componente o lê.
//
// A leitura acontece em dois momentos: ao montar, que cobre quem chegou nesta
// tela logo depois de uma ação; e depois de cada envio de formulário, que é o
// caso normal. O segundo é o que exige cuidado: no instante do `submit` a
// resposta ainda não voltou, então não adianta olhar o cookie uma vez só.
// Olhamos durante alguns segundos, e paramos assim que ele aparece.
//
// A alternativa seria o layout ler o cookie no servidor e passar para cá. Foi
// descartada porque depende de o layout ser redesenhado junto com a página na
// volta da ação — e quando não fosse, o aviso simplesmente não apareceria, sem
// nada na tela explicando por quê. Ler no navegador não depende disso.
//
// ---------- Por que cinco segundos ----------
//
// Foi o pedido, e bate com o que se espera: tempo de ler uma frase curta sem o
// aviso virar parte da tela. Quem quiser antes tem o X. O relógio de cada
// aviso é o seu, então três ações em sequência não fazem o primeiro levar o
// terceiro embora junto.

/** Quanto tempo cada aviso fica na tela. */
const DURACAO_MS = 5000;

/** Por quanto tempo procuramos o cookie depois de um envio. */
const ESPERA_MS = 8000;
const INTERVALO_MS = 150;

type Aviso = { id: number; mensagem: string; tom: TomDoAviso };

/** Lê o cookie e o apaga, para o mesmo recado não voltar na próxima olhada. */
function pegarAviso(): Omit<Aviso, "id"> | null {
  const bruto = document.cookie
    .split("; ")
    .find((parte) => parte.startsWith(`${COOKIE_AVISO}=`))
    ?.slice(COOKIE_AVISO.length + 1);

  if (!bruto) return null;

  // Apaga antes de interpretar: se o conteúdo estiver corrompido, um cookie
  // ruim que não some deixaria este código tentando lê-lo a cada envio.
  document.cookie = `${COOKIE_AVISO}=; path=/lncadmin; max-age=0`;

  try {
    const { mensagem, tom } = JSON.parse(decodeURIComponent(bruto));
    if (typeof mensagem !== "string" || !mensagem) return null;
    return {
      mensagem,
      tom: tom === "erro" || tom === "atencao" ? tom : "feito",
    };
  } catch {
    return null;
  }
}

function Icone({ tom }: { tom: TomDoAviso }) {
  const traco =
    tom === "feito" ? "M4 12.5l5 5 11-11" : tom === "erro" ? "M6 6l12 12M18 6L6 18" : "M12 8v5M12 16.5v.01";

  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d={traco} />
    </svg>
  );
}

const CORES: Record<TomDoAviso, { disco: string; fio: string }> = {
  feito: { disco: "bg-salmon text-preto", fio: "bg-salmon" },
  atencao: { disco: "bg-tinta/15 text-tinta", fio: "bg-tinta/35" },
  erro: { disco: "bg-[#c0392b] text-branco", fio: "bg-[#c0392b]" },
};

export default function Avisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const semMovimento = useReducedMotion();

  // Contador próprio para a chave de cada aviso. Date.now() repetiria em dois
  // avisos do mesmo milissegundo, e o React trataria os dois como um.
  const proximoId = useRef(0);
  const vigia = useRef<ReturnType<typeof setInterval> | null>(null);

  const dispensar = useCallback((id: number) => {
    setAvisos((atuais) => atuais.filter((a) => a.id !== id));
  }, []);

  const mostrar = useCallback(() => {
    const novo = pegarAviso();
    if (!novo) return false;

    const id = proximoId.current++;
    setAvisos((atuais) => [...atuais, { ...novo, id }]);
    // O relógio é por aviso, e não um só para a pilha: assim o segundo aviso
    // não herda o tempo que o primeiro já gastou.
    setTimeout(() => dispensar(id), DURACAO_MS);
    return true;
  }, [dispensar]);

  useEffect(() => {
    // Ao montar: cobre quem foi levado a outra tela pela ação.
    mostrar();

    function aoEnviar() {
      if (vigia.current) clearInterval(vigia.current);

      const limite = Date.now() + ESPERA_MS;
      vigia.current = setInterval(() => {
        if (mostrar() || Date.now() > limite) {
          if (vigia.current) clearInterval(vigia.current);
          vigia.current = null;
        }
      }, INTERVALO_MS);
    }

    // Na fase de captura: um formulário que chame preventDefault não deve
    // impedir o painel de escutar o próprio envio.
    document.addEventListener("submit", aoEnviar, true);

    return () => {
      document.removeEventListener("submit", aoEnviar, true);
      if (vigia.current) clearInterval(vigia.current);
    };
  }, [mostrar]);

  return (
    // Colado no canto, por cima de tudo, sem roubar clique: só o cartão
    // recebe ponteiro. Sem isso, uma faixa invisível cobriria o canto da tela
    // mesmo quando não houvesse aviso nenhum.
    //
    // No celular ele encosta nas duas laterais e vira uma faixa no pé, que é
    // onde o polegar já está.
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-stretch gap-2.5 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[min(23rem,calc(100vw-3rem))]"
    >
      <AnimatePresence initial={false}>
        {avisos.map((aviso) => (
          <motion.div
            key={aviso.id}
            role="status"
            layout={!semMovimento}
            initial={semMovimento ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={semMovimento ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.97 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto relative overflow-hidden rounded-2xl border border-contorno bg-cartao pl-5 pr-3 py-3.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)]"
          >
            {/* O fio de cor na borda esquerda diz o tom antes de a frase ser
                lida. É o mesmo gesto da régua de lançamento dos cards. */}
            <span
              aria-hidden
              className={`absolute inset-y-0 left-0 w-[3px] ${CORES[aviso.tom].fio}`}
            />

            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${CORES[aviso.tom].disco}`}
              >
                <Icone tom={aviso.tom} />
              </span>

              <p className="min-w-0 flex-1 text-sm leading-snug text-tinta">
                {aviso.mensagem}
              </p>

              <button
                type="button"
                onClick={() => dispensar(aviso.id)}
                aria-label="Fechar aviso"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-tinta/45 transition-colors duration-300 hover:text-tinta"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* A barra que escoa: diz quanto falta para o aviso sumir, em vez
                de ele desaparecer de repente no meio da leitura. */}
            {!semMovimento && (
              <motion.span
                aria-hidden
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: DURACAO_MS / 1000, ease: "linear" }}
                className={`absolute inset-x-0 bottom-0 h-[2px] origin-left ${CORES[aviso.tom].fio} opacity-40`}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
