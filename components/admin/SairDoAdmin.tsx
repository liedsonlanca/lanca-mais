"use client";

export default function SairDoAdmin() {
  async function sair() {
    await fetch("/api/admin/entrar", { method: "DELETE" });
    window.location.href = "/admin";
  }

  return (
    <button
      type="button"
      onClick={sair}
      className="flex min-h-11 items-center rounded-full px-3 text-preto/55 transition-colors duration-300 hover:text-salmon-texto"
    >
      Sair
    </button>
  );
}
