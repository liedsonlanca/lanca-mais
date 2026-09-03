"use client";

import { useState, type FormEvent } from "react";

export default function LoginAdmin() {
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // O campo do código só aparece depois que o servidor avisa que existe
  // segunda etapa. Assim quem não ativou não vê um campo que não usa.
  const [pedeCodigo, setPedeCodigo] = useState(false);

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/admin/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha, codigo }),
      });

      if (resposta.ok) {
        window.location.reload();
        return;
      }

      const dados = await resposta.json().catch(() => null);
      if (dados?.exigeCodigo) setPedeCodigo(true);
      setErro(dados?.erro ?? "Não foi possível entrar.");
    } catch {
      setErro("Não foi possível entrar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  const campo =
    "mt-3 w-full rounded-2xl border border-linha bg-branco px-5 py-3.5 text-preto shadow-[var(--sombra-cartao)] outline-none transition-colors duration-300 focus:border-salmon";

  return (
    <form onSubmit={aoEnviar} className="w-full max-w-sm text-left">
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
        className={campo}
      />

      {pedeCodigo && (
        <div className="mt-6">
          <label htmlFor="codigo-admin" className="eyebrow block text-preto/55">
            Código do aplicativo
          </label>
          <input
            id="codigo-admin"
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className={`${campo} text-center text-lg tracking-[0.4em]`}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={enviando || senha.length === 0}
        className="mt-6 w-full rounded-full bg-salmon-texto px-7 py-3.5 font-medium text-branco transition-opacity duration-300 disabled:opacity-50"
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
