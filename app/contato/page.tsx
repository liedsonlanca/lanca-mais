import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import PageHero from "@/components/PageHero";
import { siteConfig } from "@/lib/site-config";
import Reveal from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Solicite um orçamento com a LANÇA+ e receba um diagnóstico inicial da sua presença digital.",
};

const canais = [
  { rotulo: "WhatsApp", valor: "(83) 99106-0691" },
  { rotulo: "E-mail", valor: siteConfig.email },
  { rotulo: "Instagram", valor: siteConfig.instagram },
  { rotulo: "Endereço", valor: `${siteConfig.address}, ${siteConfig.city}` },
];

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        titulo={[
          { texto: "Vamos falar" },
          { texto: "sobre a sua marca.", acento: "marca." },
        ]}
        lead="Preencha o formulário com um pouco do seu momento atual. A equipe da LANÇA+ responde com os próximos passos e, se fizer sentido, agenda uma conversa."
      />

      <section className="relative overflow-hidden bg-papel">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-10 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
            <Reveal>
              <dl className="space-y-8">
                {canais.map((canal) => (
                  <div key={canal.rotulo} className="border-b border-linha pb-6">
                    <dt className="eyebrow text-preto/55">{canal.rotulo}</dt>
                    <dd className="mt-2 text-lg text-preto/85">{canal.valor}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-8 text-sm leading-relaxed text-preto/62">
                Atendemos marcas de todos os nichos, presencialmente em Cajazeiras
                e remotamente no Brasil inteiro.
              </p>
            </Reveal>

            <Reveal delay={0.15} distance={40}>
              <div className="rounded-3xl border border-linha bg-branco p-8 shadow-[0_24px_60px_-40px_rgba(10,10,8,0.35)] lg:p-10">
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
