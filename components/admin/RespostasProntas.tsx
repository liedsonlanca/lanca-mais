"use client";

import { RESPOSTAS_PRONTAS } from "@/lib/respostas-prontas";

// Os atalhos de resposta da tela de conversas.
//
// ---------- Por que escreve no campo em vez de enviar ----------
//
// Resposta que sai sem ninguém reler é o que faz o cliente perceber que
// falou com um botão. O texto cola no campo, quem atende ajusta o que for
// daquela pessoa, e envia. Um clique a mais, e é o clique que separa isto
// de um robô.
//
// ---------- Por que mexe no campo pelo DOM ----------
//
// O campo é um textarea sem valor controlado pelo React — o formulário é
// nativo e o que vale é o que está no DOM na hora do envio. Escrever direto
// nele é o caminho curto e o certo: transformar o campo em controlado só
// para isto obrigaria a tela inteira a virar componente de cliente, e ela é
// de servidor de propósito.
//
// ---------- Por que acrescenta em vez de substituir ----------
//
// Porque dois atalhos seguidos são uma resposta comum: a frase do serviço
// mais a do próximo passo. E porque apagar o que a pessoa já tinha digitado
// é o tipo de coisa que ninguém perdoa na segunda vez.

const CHIP =
  "rounded-full border border-contorno px-3 py-1.5 text-xs text-tinta/70 transition-colors duration-300 hover:border-salmon/50 hover:text-tinta";

export default function RespostasProntas({ campo }: { campo: string }) {
  function colar(texto: string) {
    const area = document.getElementById(campo);
    if (!(area instanceof HTMLTextAreaElement)) return;

    const atual = area.value.trim();
    area.value = atual ? `${atual}\n\n${texto}` : texto;

    // O cursor vai para o fim e a área rola até lá: colada uma frase longa,
    // quem atende precisa ver o fim do que acabou de inserir para continuar
    // escrevendo, e não o começo.
    area.focus();
    area.setSelectionRange(area.value.length, area.value.length);
    area.scrollTop = area.scrollHeight;
  }

  return (
    <details className="group mt-4">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm text-tinta/50 transition-colors duration-300 hover:text-tinta">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 transition-transform duration-300 group-open:rotate-90"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
        Respostas prontas
      </summary>

      {/* Fechado por padrão: aberto, vinte botões empurram o campo de
          resposta para fora da tela, e o campo é o que a pessoa veio usar. */}
      <div className="mt-3 grid gap-3">
        {RESPOSTAS_PRONTAS.map((grupo) => (
          <div key={grupo.grupo}>
            <p className="text-[0.7rem] uppercase tracking-wide text-tinta/35">
              {grupo.grupo}
            </p>

            <div className="mt-1.5 flex flex-wrap gap-2">
              {grupo.itens.map((item) => (
                <button
                  key={item.rotulo}
                  type="button"
                  onClick={() => colar(item.texto)}
                  // O texto inteiro no title: quem não lembra o que o atalho
                  // escreve descobre sem ter de colar e apagar.
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
    </details>
  );
}
