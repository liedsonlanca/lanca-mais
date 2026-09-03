"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";

export default function FormularioAcesso() {
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });

      if (resposta.ok) {
        // Recarrega na mesma URL: o porteiro reescreve, então quem chegou por
        // um link interno volta direto para a página que queria ver.
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
    <div className="mt-12">
      <AnimatePresence mode="wait">
        {!aberto ? (
          <motion.button
            key="botao"
            type="button"
            onClick={() => setAberto(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-full border border-bege/25 px-7 py-3.5 text-sm font-medium text-bege transition-colors duration-500 hover:border-salmon hover:text-salmon"
          >
            Acessar site
          </motion.button>
        ) : (
          <motion.form
            key="formulario"
            onSubmit={aoEnviar}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex w-full max-w-sm flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="senha" className="sr-only">
              Senha de acesso
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha de acesso"
              className="w-full rounded-full border border-bege/25 bg-bege/[0.06] px-6 py-3.5 text-bege outline-none transition-colors duration-300 placeholder:text-bege/40 focus:border-salmon"
            />
            <button
              type="submit"
              disabled={enviando || senha.length === 0}
              className="shrink-0 rounded-full bg-salmon-texto px-7 py-3.5 font-medium text-branco transition-opacity duration-300 disabled:opacity-50"
            >
              {enviando ? "Entrando" : "Entrar"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {erro && (
        <p role="alert" className="mt-4 text-sm text-salmon">
          {erro}
        </p>
      )}
    </div>
  );
}
