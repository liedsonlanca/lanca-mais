"use client";

import { useState, type FormEvent } from "react";

export default function LoginAdmin() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/admin/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });

      if (resposta.ok) {
        window.location.reload();
        return;
      }

      const dados = await resposta.json().catch(() => null);
      setErro(dados?.erro ?? "Não foi possível entrar.");
    } catch {
      setErro("Não foi possível entrar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="w-full max-w-sm">
      <label htmlFor="senha-admin" className="eyebrow block text-preto/55">
        Senha do painel
      </label>

      <input
        id="senha-admin"
        name="senha"
        type="password"
        autoFocus
        autoComplete="current-password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        className="mt-3 w-full rounded-2xl border border-linha bg-branco px-5 py-3.5 text-preto shadow-[var(--sombra-cartao)] outline-none transition-colors duration-300 focus:border-salmon"
      />

      <button
        type="submit"
        disabled={enviando || senha.length === 0}
        className="mt-4 w-full rounded-full bg-salmon px-7 py-3.5 font-medium text-preto transition-opacity duration-300 disabled:opacity-50"
      >
        {enviando ? "Entrando" : "Entrar"}
      </button>

      {erro && (
        <p role="alert" className="mt-4 text-sm text-salmon-texto">
          {erro}
        </p>
      )}
    </form>
  );
}
