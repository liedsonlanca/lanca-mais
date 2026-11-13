"use client";

import { useRef, useState } from "react";
import { services, siteConfig } from "@/lib/site-config";

// O pedido de orçamento, no fim da página de contato.
//
// ---------- Por que existe, se o outro formulário foi removido ----------
//
// Havia um formulário aqui e ele foi tirado, com razão: montava uma mensagem
// e abria o WhatsApp, ou seja, era o WhatsApp com quatro campos na frente.
// Quem chega decidido a falar não deve pagar pedágio na porta.
//
// Este é outra coisa, e a diferença está em três escolhas:
//
//   - Ele vem DEPOIS dos canais diretos, e não antes. A porta continua
//     aberta; isto é uma segunda porta, mais larga, para quem quer passar
//     por ela.
//   - Ele é para orçamento, e orçamento precisa de contexto. "Oi, quanto
//     custa?" custa à agência três perguntas antes da primeira resposta —
//     e custa à pessoa esperar por elas.
//   - O botão diz o que faz. O pecado do antigo não era abrir o WhatsApp,
//     era parecer que fazia outra coisa.
//
// ---------- Por que não guarda nada ----------
//
// Não há banco nem rota aqui de propósito. Um pedido guardado num lugar que
// ninguém abre é pior do que pedido nenhum: cria a sensação de que foi
// recebido. O WhatsApp é onde a agência de fato atende, então é lá que o
// pedido chega — inteiro, e já organizado.
//
// Quando houver chave da API do CRM, este é o ponto em que o pedido passa a
// virar card no pipeline também, sem mudar nada do que a pessoa vê.

/**
 * Quando a pessoa ainda não sabe o que pedir, isso também é uma resposta —
 * e continua na lista, como opção escolhível.
 *
 * O que mudou é que ela deixou de ser o valor inicial. Com o campo
 * obrigatório, deixar "Ainda não sei" pré-selecionado faria todo mundo
 * passar reto e mandar isso sem querer, e a agência receberia um pedido
 * de orçamento sem saber do quê.
 */
const INDECISO = "Ainda não sei";

/** O valor vazio do select, que força uma escolha de verdade. */
const NADA_ESCOLHIDO = "";

type Erros = {
  nome?: string;
  whatsapp?: string;
  email?: string;
  servico?: string;
  mensagem?: string;
};

/** O número brasileiro como se lê, montado enquanto digita. */
function mascarar(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const corte = d.length > 10 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`;
}

export default function FormularioOrcamento() {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [servico, setServico] = useState(NADA_ESCOLHIDO);
  const [mensagem, setMensagem] = useState("");
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);
  const [desfecho, setDesfecho] = useState<null | "crm" | "conversa">(null);
  // O campo-isca: pessoa nenhuma o vê, então pessoa nenhuma o preenche.
  const [sobrenome, setSobrenome] = useState("");

  const refNome = useRef<HTMLInputElement>(null);
  const refZap = useRef<HTMLInputElement>(null);
  const refEmail = useRef<HTMLInputElement>(null);
  const refServico = useRef<HTMLSelectElement>(null);
  const refMensagem = useRef<HTMLTextAreaElement>(null);

  // Todos os campos são exigidos, a pedido do cliente.
  //
  // O custo é real e está assumido: cada campo obrigatório a mais é gente
  // que desiste no meio. A contrapartida é que o pedido chega completo, e a
  // agência responde de primeira em vez de perguntar.
  //
  // Cada mensagem diz o que fazer, e não que algo está errado. "Campo
  // obrigatório" informa o óbvio; "Diga como podemos te chamar" diz o que
  // falta fazer.
  function validar(): Erros {
    const achados: Erros = {};

    if (!nome.trim()) achados.nome = "Diga como podemos te chamar.";

    const digitos = whatsapp.replace(/\D/g, "");
    if (!digitos) achados.whatsapp = "Precisamos do seu WhatsApp para responder.";
    else if (digitos.length < 10) achados.whatsapp = "Faltam dígitos neste número.";

    // Checagem frouxa de propósito: arroba, ponto depois, sem espaço.
    // Expressão rigorosa de e-mail recusa endereço válido, e recusar o
    // e-mail certo de um cliente é pior do que aceitar um errado.
    const correio = email.trim();
    if (!correio) achados.email = "Precisamos do seu e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correio))
      achados.email = "Confira este e-mail.";

    if (!servico) achados.servico = "Escolha o que você precisa.";

    if (!mensagem.trim())
      achados.mensagem = "Conte um pouco do que você precisa.";

    return achados;
  }

  /** A conversa, com o pedido já escrito. Rede de segurança e saída manual. */
  function pelaConversa() {
    const linhas = [
      `Olá! Sou ${nome.trim()} e quero um orçamento.`,
      "",
      `Serviço: ${servico}`,
    ];
    if (mensagem.trim()) linhas.push(`Detalhes: ${mensagem.trim()}`);

    window.open(
      `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
        linhas.join("\n")
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();

    const achados = validar();
    setErros(achados);
    if (Object.keys(achados).length > 0) {
      // O foco vai para o primeiro campo com problema: sem isso, quem navega
      // por teclado recebe o erro e continua no botão, longe do que errou.
      // Na ordem da tela, e não na da validação: o primeiro erro que a
      // pessoa vê é o que deve receber o cursor.
      const alvo = achados.nome
        ? refNome
        : achados.whatsapp
          ? refZap
          : achados.email
            ? refEmail
            : achados.servico
              ? refServico
              : refMensagem;
      alvo.current?.focus();
      return;
    }

    setEnviando(true);
    try {
      const resposta = await fetch("/api/orcamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          whatsapp,
          email: email.trim(),
          servico,
          mensagem: mensagem.trim(),
          sobrenome,
        }),
      });

      if (!resposta.ok) throw new Error(String(resposta.status));
      setDesfecho("crm");
    } catch {
      // O pedido não se perde porque um servidor caiu.
      setDesfecho("conversa");
      pelaConversa();
    } finally {
      setEnviando(false);
    }
  }

  const rotuloCampo =
    "mb-2 block text-sm font-medium text-tinta/75";
  const caixaCampo =
    "w-full rounded-2xl border bg-fundo-alt px-4 py-3.5 text-[0.95rem] text-tinta placeholder:text-tinta/35 transition-colors duration-500 focus:outline-none focus:ring-2 focus:ring-salmon/35";

  // Recebido: o formulário sai de cena.
  //
  // Deixar os campos preenchidos embaixo de um "recebemos" convida a pessoa
  // a mandar de novo, e o CRM ganha o mesmo lead duas vezes.
  if (desfecho) {
    return (
      <div className="rounded-3xl border border-salmon/40 bg-cartao p-8 text-center lg:p-10">
        <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] text-tinta lg:text-2xl">
          Recebemos seu pedido.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-tinta/60">
          {desfecho === "crm"
            ? "A LANÇA+ chama você no WhatsApp em horário comercial."
            : "Abrimos o WhatsApp com os detalhes. Se a janela não apareceu, o navegador pode ter bloqueado — é só tocar no botão verde do canto."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-contorno bg-cartao p-6 lg:p-8">
      <h2 className="font-heading text-xl font-semibold leading-tight tracking-[-0.02em] text-tinta lg:text-2xl">
        Peça um orçamento.
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-tinta/60">
        Conte o essencial e a conversa já começa com contexto, em vez de três
        perguntas antes da primeira resposta. Prefere falar direto? Os canais
        estão logo abaixo.
      </p>

      <form onSubmit={enviar} noValidate className="mt-7 grid gap-5">
        {/* O campo-isca.

            Fica fora da tela e fora da ordem de tabulação, e o rótulo diz ao
            leitor de tela para ignorá-lo. Pessoa nenhuma o encontra; robô que
            despeja texto em todo campo que acha, sim — e o servidor descarta
            o envio quando ele vem preenchido.

            autoComplete="off" porque o preenchimento automático do navegador
            também cairia nele, e aí a pessoa seria tratada como robô. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="orc-sobrenome">Não preencha este campo</label>
          <input
            id="orc-sobrenome"
            name="sobrenome"
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="orc-nome" className={rotuloCampo}>
              Seu nome
            </label>
            <input
              id="orc-nome"
              ref={refNome}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
              placeholder="Como podemos te chamar"
              aria-invalid={Boolean(erros.nome)}
              aria-describedby={erros.nome ? "orc-nome-erro" : undefined}
              className={`${caixaCampo} ${
                erros.nome ? "border-salmon" : "border-contorno focus:border-salmon/60"
              }`}
            />
            <p
              id="orc-nome-erro"
              aria-live="polite"
              className="mt-1.5 text-[0.8rem] text-destaque empty:hidden"
            >
              {erros.nome ?? ""}
            </p>
          </div>

          <div>
            <label htmlFor="orc-zap" className={rotuloCampo}>
              WhatsApp
            </label>
            <input
              id="orc-zap"
              ref={refZap}
              value={whatsapp}
              onChange={(e) => setWhatsapp(mascarar(e.target.value))}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(83) 99999-9999"
              aria-invalid={Boolean(erros.whatsapp)}
              aria-describedby={erros.whatsapp ? "orc-zap-erro" : undefined}
              className={`${caixaCampo} ${
                erros.whatsapp
                  ? "border-salmon"
                  : "border-contorno focus:border-salmon/60"
              }`}
            />
            <p
              id="orc-zap-erro"
              aria-live="polite"
              className="mt-1.5 text-[0.8rem] text-destaque empty:hidden"
            >
              {erros.whatsapp ?? ""}
            </p>
          </div>
        </div>

        {/* E-mail e serviço dividem a linha. O e-mail entrou depois, e
            sozinho numa linha inteira pareceria o campo mais importante do
            formulário — sendo o único opcional dos quatro. */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="orc-email" className={rotuloCampo}>
              E-mail
            </label>
            <input
              id="orc-email"
              ref={refEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="voce@suaempresa.com"
              aria-invalid={Boolean(erros.email)}
              aria-describedby={erros.email ? "orc-email-erro" : undefined}
              className={`${caixaCampo} ${
                erros.email
                  ? "border-salmon"
                  : "border-contorno focus:border-salmon/60"
              }`}
            />
            <p
              id="orc-email-erro"
              aria-live="polite"
              className="mt-1.5 text-[0.8rem] text-destaque empty:hidden"
            >
              {erros.email ?? ""}
            </p>
            </div>

            <div>
            <label htmlFor="orc-servico" className={rotuloCampo}>
              O que você precisa
            </label>
            {/* A ordem é a mesma de todo lugar que lista serviços no site, e
                "Ainda não sei" vem primeiro porque é a resposta mais honesta
                de quem está pedindo orçamento pela primeira vez. */}
            <select
              id="orc-servico"
              ref={refServico}
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              aria-invalid={Boolean(erros.servico)}
              aria-describedby={erros.servico ? "orc-servico-erro" : undefined}
              className={`${caixaCampo} ${
                erros.servico
                  ? "border-salmon"
                  : "border-contorno focus:border-salmon/60"
              }`}
            >
              <option value={NADA_ESCOLHIDO} disabled>
                Escolha uma frente
              </option>
              <option value={INDECISO}>{INDECISO}</option>
              {services.map((s) => (
                <option key={s.slug} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <p
              id="orc-servico-erro"
              aria-live="polite"
              className="mt-1.5 text-[0.8rem] text-destaque empty:hidden"
            >
              {erros.servico ?? ""}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="orc-mensagem" className={rotuloCampo}>
            Detalhes
          </label>
          <textarea
            id="orc-mensagem"
            ref={refMensagem}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={4}
            placeholder="Conte do seu negócio, do que já tentou e do que espera."
            aria-invalid={Boolean(erros.mensagem)}
            aria-describedby={erros.mensagem ? "orc-mensagem-erro" : undefined}
            className={`${caixaCampo} resize-y ${
              erros.mensagem
                ? "border-salmon"
                : "border-contorno focus:border-salmon/60"
            }`}
          />
          <p
            id="orc-mensagem-erro"
            aria-live="polite"
            className="mt-1.5 text-[0.8rem] text-destaque empty:hidden"
          >
            {erros.mensagem ?? ""}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* O rótulo mudou junto com o destino: agora o pedido vai para o
              CRM da agência, e só cai no WhatsApp se isso falhar. Prometer
              WhatsApp aqui seria descrever a exceção como se fosse a regra. */}
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-botao px-7 py-4 text-sm font-semibold text-branco transition-colors duration-500 hover:bg-salmon-escuro focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salmon disabled:cursor-default disabled:opacity-60"
          >
            {enviando ? "Enviando…" : "Enviar pedido de orçamento"}
            {!enviando && (
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>

          <p className="text-[0.8rem] leading-relaxed text-tinta/45">
            Seus dados ficam só com a LANÇA+. Sem disparo em massa.
          </p>
        </div>
      </form>
    </div>
  );
}
