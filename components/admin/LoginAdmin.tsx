"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Etapa = "senha" | "codigo";

// Entrada do painel em duas etapas.
//
// A senha vai sozinha primeiro. Se ela estiver certa e houver segundo fator, o
// campo trava e o do código aparece: a partir daí a pessoa sabe que a senha
// não é mais o problema, e só tem um campo à frente.
//
// O campo travado é readOnly, e não disabled: campo desabilitado sai do
// formulário e o gerenciador de senhas do navegador não oferece guardar o que
// acabou de dar certo, que é exatamente a hora em que ele deveria oferecer.
export default function LoginAdmin() {
  const [etapa, setEtapa] = useState<Etapa>("senha");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const campoCodigo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (etapa === "codigo") campoCodigo.current?.focus();
  }, [etapa]);

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/admin/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Na primeira etapa o código nem é enviado: é ele que faz o servidor
        // responder "agora o código" em vez de abrir a sessão.
        body: JSON.stringify(
          etapa === "senha" ? { senha } : { senha, codigo }
        ),
      });

      const dados = await resposta.json().catch(() => null);

      if (resposta.ok) {
        // Senha aceita, mas ainda falta o segundo fator.
        if (dados?.etapa === "codigo") {
          setEtapa("codigo");
          setMostrarSenha(false);
          return;
        }
        window.location.reload();
        return;
      }

      // Senha recusada na segunda etapa devolve a pessoa ao começo: continuar
      // digitando código sobre uma senha que o servidor não aceita não leva a
      // lugar nenhum.
      if (dados?.campo === "senha") {
        setEtapa("senha");
        setCodigo("");
      }

      setErro(dados?.erro ?? "Não foi possível entrar.");
      if (dados?.campo === "codigo") setCodigo("");
    } catch {
      setErro("Não foi possível entrar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  function voltarParaSenha() {
    setEtapa("senha");
    setCodigo("");
    setErro(null);
  }

  const campo =
    "mt-3 w-full rounded-2xl border border-linha bg-branco px-5 py-3.5 text-preto shadow-[var(--sombra-cartao)] outline-none transition-colors duration-300 focus:border-salmon";

  const naSegunda = etapa === "codigo";

  return (
    <form onSubmit={aoEnviar} className="w-full max-w-sm text-left">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="senha-admin" className="eyebrow block text-preto/55">
          Senha do painel
        </label>

        {naSegunda && (
          <button
            type="button"
            onClick={voltarParaSenha}
            className="text-xs text-preto/45 underline underline-offset-4 transition-colors duration-300 hover:text-salmon-texto"
          >
            trocar
          </button>
        )}
      </div>

      <div className="relative">
        <input
          id="senha-admin"
          name="senha"
          type={mostrarSenha && !naSegunda ? "text" : "password"}
          autoFocus={!naSegunda}
          autoComplete="current-password"
          readOnly={naSegunda}
          aria-readonly={naSegunda}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className={`${campo} pr-12 ${
            naSegunda
              ? "cursor-default border-salmon/40 bg-areia text-preto/50"
              : ""
          }`}
        />

        {/* Olho para conferir o que foi digitado. Some quando o campo trava:
            ali a senha já foi aceita e não há mais o que conferir. */}
        {!naSegunda && (
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={mostrarSenha}
            className="absolute right-2 top-1/2 mt-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-preto/40 transition-colors duration-300 hover:text-salmon-texto"
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
              <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
              <circle cx="12" cy="12" r="3" />
              {mostrarSenha && <path d="M4 20 20 4" />}
            </svg>
          </button>
        )}

        {/* Confere: a senha já passou. */}
        {naSegunda && (
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute right-5 top-1/2 mt-1.5 h-4 w-4 -translate-y-1/2 text-salmon-texto"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </div>

      {naSegunda && (
        <div className="mt-6">
          <label htmlFor="codigo-admin" className="eyebrow block text-preto/55">
            Código do aplicativo
          </label>
          <input
            id="codigo-admin"
            ref={campoCodigo}
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={codigo}
            // Só dígitos, e o corte em seis vive aqui e não em maxLength: o
            // navegador aplica maxLength ao texto bruto, antes do filtro, então
            // um código colado como "12 34 56" perderia dígitos no caminho.
            onChange={(e) =>
              setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className={`${campo} text-center text-lg tracking-[0.4em]`}
          />
          <p className="mt-3 text-xs leading-relaxed text-preto/50">
            Os seis dígitos do aplicativo autenticador. Eles mudam a cada 30
            segundos.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={
          enviando || (naSegunda ? codigo.length < 6 : senha.length === 0)
        }
        className="mt-6 w-full rounded-full bg-salmon-texto px-7 py-3.5 font-medium text-branco transition-opacity duration-300 disabled:opacity-50"
      >
        {enviando ? "Conferindo" : naSegunda ? "Entrar" : "Continuar"}
      </button>

      {erro && (
        <p role="alert" className="mt-4 text-sm text-salmon-texto">
          {erro}
        </p>
      )}
    </form>
  );
}
