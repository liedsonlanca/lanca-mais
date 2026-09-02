"use client";

import { useState, type FormEvent } from "react";
import { services, siteConfig } from "@/lib/site-config";

export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const businessName = String(data.get("business") ?? "").trim();
    const service = String(data.get("service") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const lines = [
      "Olá! Vim pelo site da LANÇA+ e gostaria de solicitar um orçamento.",
      "",
      `Nome: ${name}`,
      businessName && `Marca/empresa: ${businessName}`,
      service && `Serviço de interesse: ${service}`,
      message && `Mensagem: ${message}`,
    ].filter(Boolean);

    const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
      lines.join("\n")
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="eyebrow text-preto/75">
          Seu nome *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-2.5 w-full rounded-xl border border-preto/12 bg-preto/[0.04] px-4 py-3.5 text-preto outline-none transition-colors duration-300 placeholder:text-preto/55 hover:border-preto/20 focus:border-salmon focus:bg-preto/[0.06]"
          placeholder="Como podemos te chamar?"
        />
      </div>

      <div>
        <label htmlFor="business" className="eyebrow text-preto/75">
          Marca ou empresa
        </label>
        <input
          id="business"
          name="business"
          type="text"
          className="mt-2.5 w-full rounded-xl border border-preto/12 bg-preto/[0.04] px-4 py-3.5 text-preto outline-none transition-colors duration-300 placeholder:text-preto/55 hover:border-preto/20 focus:border-salmon focus:bg-preto/[0.06]"
          placeholder="Nome do seu negócio"
        />
      </div>

      <div>
        <label htmlFor="service" className="eyebrow text-preto/75">
          Serviço de interesse
        </label>
        <select
          id="service"
          name="service"
          className="mt-2.5 w-full rounded-xl border border-preto/12 bg-preto/[0.04] px-4 py-3.5 text-preto outline-none transition-colors duration-300 placeholder:text-preto/55 hover:border-preto/20 focus:border-salmon focus:bg-preto/[0.06]"
          defaultValue=""
        >
          <option value="" disabled>
            Selecione um serviço
          </option>
          {services.map((s) => (
            <option key={s.slug} value={s.name}>
              {s.name}
            </option>
          ))}
          <option value="Ainda não sei">Ainda não sei / quero orientação</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="eyebrow text-preto/75">
          Conte um pouco sobre seu momento atual
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="mt-2.5 w-full rounded-xl border border-preto/12 bg-preto/[0.04] px-4 py-3.5 text-preto outline-none transition-colors duration-300 placeholder:text-preto/55 hover:border-preto/20 focus:border-salmon focus:bg-preto/[0.06]"
          placeholder="Ex: já tenho presença digital mas quero reposicionar a marca..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-salmon px-7 py-4 font-medium text-preto shadow-[0_0_32px_-10px_var(--color-salmon)] transition-all duration-500 hover:shadow-[0_0_48px_-6px_var(--color-salmon)] disabled:opacity-60"
      >
        Enviar pelo WhatsApp
      </button>
      <p className="text-center text-xs text-preto/50">
        Ao enviar, você será redirecionado ao WhatsApp da LANÇA+ com a
        mensagem já preenchida.
      </p>
    </form>
  );
}
