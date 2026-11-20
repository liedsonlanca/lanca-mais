"use client";

import { useTransition } from "react";

// "Quem está atendendo neste navegador": o nome que assina as respostas.
//
// O visitante passa a ver "Liédson · LANÇA+" em vez de uma equipe sem rosto,
// e a conversa ganha um responsável. Salva ao escolher, como o seletor de
// disponibilidade ao lado.

export default function SeletorDeAtendente({
  acao,
  atual,
  nomes,
}: {
  acao: (dados: FormData) => Promise<void>;
  atual: string;
  nomes: string[];
}) {
  const [salvando, comecar] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 text-xs text-tinta/55">
      <span>Atendendo como</span>
      <select
        defaultValue={atual}
        disabled={salvando}
        onChange={(e) => {
          const dados = new FormData();
          dados.set("nome", e.target.value);
          comecar(() => acao(dados));
        }}
        className={`min-h-9 rounded-full border bg-cartao px-3 text-xs text-tinta outline-none disabled:opacity-50 ${
          atual ? "border-contorno" : "border-salmon"
        }`}
      >
        <option value="">Escolha seu nome</option>
        {nomes.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}
