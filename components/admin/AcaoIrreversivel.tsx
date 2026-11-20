"use client";

import { useFormStatus } from "react-dom";

// Um botão de ação que não se desfaz (apagar, barrar), com confirmação.
//
// A gaveta "Mais ações" já tira estes botões do caminho do clique distraído,
// mas não do clique errado: dentro dela os dois ficam lado a lado. A
// pergunta diz o que vai acontecer com quem, e só segue no "OK".

function Botao({
  titulo,
  descricao,
  perigo,
}: {
  titulo: string;
  descricao: string;
  perigo: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full rounded-xl border border-contorno px-3 py-2 text-left text-xs leading-relaxed text-tinta/60 transition-colors duration-300 disabled:opacity-50 ${
        perigo ? "hover:border-destaque hover:text-destaque" : "hover:text-tinta"
      }`}
    >
      <span className="font-medium">{pending ? "Aguarde…" : titulo}</span>
      <br />
      {descricao}
    </button>
  );
}

export default function AcaoIrreversivel({
  acao,
  id,
  titulo,
  descricao,
  pergunta,
  perigo = false,
}: {
  acao: (dados: FormData) => Promise<void>;
  id: number;
  titulo: string;
  descricao: string;
  /** O texto da confirmação. Vazio pula a pergunta (para ações que se desfazem). */
  pergunta: string;
  perigo?: boolean;
}) {
  return (
    <form
      action={acao}
      onSubmit={(evento) => {
        if (pergunta && !window.confirm(pergunta)) evento.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Botao titulo={titulo} descricao={descricao} perigo={perigo} />
    </form>
  );
}
