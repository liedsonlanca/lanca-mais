"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Rastreadores, { temRastreadores } from "@/components/Rastreadores";
import {
  lerDecisao,
  guardarDecisao,
  NADA,
  TUDO,
  type Categorias,
} from "@/lib/consentimento";

// Aviso de consentimento.
//
// Fica ancorado no rodapé da tela, e não cobrindo a página. Um bloqueio no meio
// da tela no primeiro segundo é o que mais afasta visitante num site feito para
// converter, e a lei não pede isso: pede escolha informada, livre e reversível.
//
// Recusar tem o mesmo peso visual de aceitar, de propósito. Botão de recusa
// escondido ou apagado é consentimento arrancado, não dado, e é justamente o
// que a ANPD aponta como irregular.
//
// Ele monta os rastreadores por dentro, em vez de avisar alguém por evento:
// assim existe um lugar só onde a decisão vive, e fica impossível o site
// carregar um rastreador enquanto o aviso discorda.

// A primeira linha não tem chave: ela existe para mostrar, e não para
// escolher. Cookie necessário ao funcionamento não depende de permissão, e
// esconder isso de quem abriu as preferências seria justamente o oposto do
// que a tela promete.
const LINHAS: Array<{
  chave: keyof Categorias | null;
  titulo: string;
  texto: string;
}> = [
  {
    chave: null,
    titulo: "Necessários",
    texto:
      "Lembram a senha de acesso ao site e mantêm a equipe conectada ao painel. Sem eles o site não funciona, e nenhum deles observa o que você faz.",
  },
  {
    chave: "medicao",
    titulo: "Medição de audiência",
    texto:
      "Quantas pessoas visitam, de onde vêm e quais páginas leem. Serve para melhorarmos o site, e os números são olhados em conjunto, nunca pessoa a pessoa.",
  },
  {
    chave: "marketing",
    titulo: "Marketing",
    texto:
      "Permite medir o resultado dos nossos anúncios e mostrar conteúdo da LANÇA+ para quem já demonstrou interesse.",
  },
];

export default function Consentimento() {
  // Começa nulo, e não como "ainda não decidiu": no servidor não existe
  // localStorage, e assumir qualquer coisa faria o aviso piscar na tela de
  // quem já respondeu.
  const [decidido, setDecidido] = useState<Categorias | null>(null);
  const [aberto, setAberto] = useState(false);
  const [detalhando, setDetalhando] = useState(false);
  const [escolha, setEscolha] = useState<Categorias>(NADA);

  useEffect(() => {
    const salvo = lerDecisao();
    if (salvo) {
      setDecidido(salvo.categorias);
      setEscolha(salvo.categorias);
    } else {
      setAberto(true);
    }

    // O link do rodapé reabre o aviso. Vai por evento, e não por estado
    // compartilhado, porque o rodapé é servidor e este componente é cliente.
    const reabrir = () => {
      setEscolha(lerDecisao()?.categorias ?? NADA);
      setDetalhando(true);
      setAberto(true);
    };
    window.addEventListener("lanca:consentimento", reabrir);
    return () => window.removeEventListener("lanca:consentimento", reabrir);
  }, []);

  function decidir(categorias: Categorias) {
    guardarDecisao(categorias);
    setAberto(false);
    setDetalhando(false);

    // Recarrega quando algo foi retirado: script já baixado não se desfaz, e
    // deixá-lo rodando até a próxima página seria desrespeitar a escolha que a
    // pessoa acabou de fazer.
    const retirou =
      (decidido?.medicao && !categorias.medicao) ||
      (decidido?.marketing && !categorias.marketing);

    setDecidido(categorias);
    if (retirou) window.location.reload();
  }

  // Sem nenhum rastreador configurado no ambiente não há o que consentir, e o
  // aviso some. Pedir permissão para nada é ruído, não conformidade.
  if (!temRastreadores) return null;

  return (
    <>
      {decidido && <Rastreadores de={decidido} />}

      {aberto && (
        /* z-[110] fica acima de tudo, inclusive das capas de Em breve e de
           manutenção, que ocupam a tela inteira em z-[100]. Atrás delas o
           aviso existia no documento e não podia ser respondido — e como
           nada carrega sem resposta, a página que todo visitante vê antes do
           lançamento não media nada. */
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="consentimento-titulo"
          className="fixed inset-x-0 bottom-0 z-[110] p-3 sm:p-5"
        >
          <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-linha bg-branco shadow-[0_30px_70px_-30px_rgba(10,10,8,0.45)]">
            <div className="p-6 sm:p-8">
              <p
                id="consentimento-titulo"
                className="font-heading text-xl font-semibold text-preto sm:text-2xl"
              >
                Um minuto sobre{" "}
                <span className="text-salmon-texto">cookies</span>
              </p>

              <p className="mt-3 text-sm leading-relaxed text-preto/70">
                O site funciona sem guardar nada sobre você. Se permitir, usamos
                duas ferramentas para entender o que traz visitantes até aqui e
                para medir nossos anúncios. Você escolhe, e pode mudar de ideia
                quando quiser, pelo rodapé.
              </p>

              {detalhando && (
                <div className="mt-6 grid gap-2.5">
                  {LINHAS.map((linha) => {
                    const chave = linha.chave;

                    const descricao = (
                      <span>
                        <span className="block text-sm font-medium text-preto">
                          {linha.titulo}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-preto/62">
                          {linha.texto}
                        </span>
                      </span>
                    );

                    // Necessários: mostra, não pergunta. Sai como div, e não
                    // como label, porque não há nada para rotular.
                    if (chave === null) {
                      return (
                        <div
                          key={linha.titulo}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-linha bg-areia/60 p-4"
                        >
                          {descricao}
                          <span className="eyebrow shrink-0 pt-1 text-salmon-texto">
                            Sempre ativo
                          </span>
                        </div>
                      );
                    }

                    const ligada = escolha[chave];

                    return (
                      <label
                        key={linha.titulo}
                        className={`flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4 transition-colors duration-300 ${
                          ligada
                            ? "border-salmon bg-salmon/10"
                            : "border-linha bg-areia hover:border-salmon/40"
                        }`}
                      >
                        {descricao}

                        {/* O interruptor é o próprio checkbox, escondido da
                            vista mas não do teclado nem do leitor de tela:
                            quem navega por Tab continua chegando nele e
                            alternando com a barra de espaço. */}
                        <input
                          type="checkbox"
                          checked={ligada}
                          onChange={(e) =>
                            setEscolha((v) => ({ ...v, [chave]: e.target.checked }))
                          }
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden
                          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-salmon peer-focus-visible:ring-offset-2 ${
                            ligada ? "bg-salmon-texto" : "bg-preto/20"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-branco transition-all duration-300 ${
                              ligada ? "left-6" : "left-1"
                            }`}
                          />
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => decidir(detalhando ? escolha : TUDO)}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-salmon-texto px-6 font-medium text-branco transition-opacity duration-300 hover:opacity-90"
                >
                  {detalhando ? "Salvar escolha" : "Aceitar"}
                </button>

                <button
                  type="button"
                  onClick={() => decidir(NADA)}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-preto/25 px-6 font-medium text-preto transition-colors duration-300 hover:border-salmon hover:text-salmon-texto"
                >
                  Recusar
                </button>

                {!detalhando && (
                  <button
                    type="button"
                    onClick={() => setDetalhando(true)}
                    className="flex min-h-11 items-center justify-center rounded-full px-6 text-sm text-preto/60 transition-colors duration-300 hover:text-salmon-texto"
                  >
                    Escolher
                  </button>
                )}
              </div>

              <p className="mt-2 flex flex-wrap items-center text-xs text-preto/50">
                <Link
                  href="/politica-de-cookies"
                  className="flex min-h-11 items-center underline underline-offset-4 hover:text-salmon-texto"
                >
                  Política de Cookies
                </Link>
                <span className="mx-2">·</span>
                <Link
                  href="/politica-de-privacidade"
                  className="flex min-h-11 items-center underline underline-offset-4 hover:text-salmon-texto"
                >
                  Política de Privacidade
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
