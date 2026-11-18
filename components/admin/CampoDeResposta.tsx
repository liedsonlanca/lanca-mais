"use client";

import { campo } from "@/components/admin/estilos";

// A caixa de resposta da tela de conversas.
//
// ---------- Por que Enter envia ----------
//
// Porque isto é um chat, e em chat Enter envia. Quem atende vem do WhatsApp
// e do Instagram, onde o dedo já sabe o caminho — obrigar a procurar o botão
// a cada mensagem é um atrito pequeno repetido cinquenta vezes por dia.
//
// Shift+Enter continua quebrando linha, que é a outra metade da convenção.
// Sem isso, quem quisesse escrever dois parágrafos mandaria o primeiro sem
// querer.
//
// ---------- Por que requestSubmit, e não submit ----------
//
// `form.submit()` ignora o React e a validação do navegador: a ação de
// servidor nem rodaria. `requestSubmit()` é o mesmo que clicar no botão —
// passa por tudo que um envio normal passa.

export default function CampoDeResposta() {
  return (
    <>
      <textarea
        id="resposta"
        name="texto"
        rows={4}
        maxLength={2000}
        placeholder="Escreva como escreveria no WhatsApp."
        onKeyDown={(evento) => {
          if (evento.key !== "Enter" || evento.shiftKey) return;

          // Enter no meio de uma sugestão do corretor do sistema está
          // confirmando a palavra, e não enviando a mensagem. Enviar aqui
          // mandaria texto pela metade em teclado de celular.
          if (evento.nativeEvent.isComposing) return;

          evento.preventDefault();
          evento.currentTarget.form?.requestSubmit();
        }}
        className={`${campo} mt-3 min-h-28 resize-y`}
      />

      <p className="mt-1.5 text-[0.7rem] text-tinta/35">
        Enter envia. Shift+Enter quebra a linha.
      </p>
    </>
  );
}
