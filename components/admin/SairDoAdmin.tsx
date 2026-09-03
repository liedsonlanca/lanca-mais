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
      className="text-preto/55 transition-colors duration-300 hover:text-salmon-texto"
    >
      Sair
    </button>
  );
}
