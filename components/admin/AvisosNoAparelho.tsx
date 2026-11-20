"use client";

import { useEffect, useState } from "react";

// O botão que liga os avisos do chat neste aparelho.
//
// Cada navegador se cadastra por conta própria: ligar no computador não liga
// no celular. O estado vem do próprio navegador (há inscrição ou não), e não
// do servidor, porque é o navegador que sabe se a permissão continua dada.

type Estado =
  | "carregando"
  | "sem-suporte"
  | "iphone-instalar"
  | "bloqueado"
  | "desligado"
  | "ligado";

function base64ParaBytes(base64: string) {
  const preenchido = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const bruto = atob(preenchido);
  return Uint8Array.from(bruto, (c) => c.charCodeAt(0));
}

async function registro() {
  return navigator.serviceWorker.register("/sw-painel.js", { scope: "/lncadmin/" });
}

export default function AvisosNoAparelho() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    void (async () => {
      const temSuporte =
        "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

      if (!temSuporte) {
        // No iPhone, push só existe com o painel aberto da tela de início.
        const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
        setEstado(iphone ? "iphone-instalar" : "sem-suporte");
        return;
      }
      if (Notification.permission === "denied") {
        setEstado("bloqueado");
        return;
      }
      const r = await registro();
      const inscricao = await r.pushManager.getSubscription();
      setEstado(inscricao ? "ligado" : "desligado");
    })().catch(() => setEstado("sem-suporte"));
  }, []);

  async function ligar() {
    setOcupado(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setEstado(permissao === "denied" ? "bloqueado" : "desligado");
        return;
      }
      const { chave } = (await (await fetch("/api/lncadmin/push")).json()) as {
        chave: string;
      };
      const r = await registro();
      await navigator.serviceWorker.ready;
      const inscricao = await r.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ParaBytes(chave),
      });
      const resposta = await fetch("/api/lncadmin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inscricao.toJSON()),
      });
      setEstado(resposta.ok ? "ligado" : "desligado");
    } catch {
      setEstado("desligado");
    } finally {
      setOcupado(false);
    }
  }

  async function desligar() {
    setOcupado(true);
    try {
      const r = await registro();
      const inscricao = await r.pushManager.getSubscription();
      if (inscricao) {
        await fetch("/api/lncadmin/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: inscricao.endpoint }),
        });
        await inscricao.unsubscribe();
      }
      setEstado("desligado");
    } finally {
      setOcupado(false);
    }
  }

  const BOTAO =
    "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-contorno px-3 text-xs transition-colors duration-300 disabled:opacity-50";

  if (estado === "carregando") return null;

  if (estado === "ligado") {
    return (
      <button
        type="button"
        onClick={desligar}
        disabled={ocupado}
        title="Este aparelho recebe aviso quando alguém pede a equipe ou escreve. Clique para desligar."
        className={`${BOTAO} text-destaque hover:text-tinta`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-destaque" />
        Avisos ligados neste aparelho
      </button>
    );
  }

  if (estado === "desligado") {
    return (
      <button
        type="button"
        onClick={ligar}
        disabled={ocupado}
        className={`${BOTAO} text-tinta/70 hover:border-salmon hover:text-tinta`}
      >
        {ocupado ? "Ligando…" : "Ligar avisos neste aparelho"}
      </button>
    );
  }

  return (
    <span className="text-[0.7rem] leading-snug text-tinta/45">
      {estado === "bloqueado"
        ? "Avisos bloqueados neste navegador: libere nas configurações do site."
        : estado === "iphone-instalar"
          ? "Para avisos no iPhone: Compartilhar → Adicionar à Tela de Início, e abra o painel por lá."
          : "Este navegador não recebe avisos."}
    </span>
  );
}
