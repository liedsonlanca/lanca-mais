import Link from "next/link";
import { painelLiberado } from "@/lib/admin";
import { lerConversa } from "@/lib/conversas";
import { campo, botaoPrimario } from "@/components/admin/estilos";
import RespostasProntas from "@/components/admin/RespostasProntas";
import {
  responderNoChat,
  encerrarConversa,
  devolverAoAssistente,
} from "../acoes";

export const dynamic = "force-dynamic";

// Uma conversa inteira, com o campo de resposta.
//
// ---------- Por que é uma página, e não um painel ao lado da lista ----------
//
// Escolher a conversa por `?id=` na mesma página não funciona: o App Router
// não refaz a tela quando só a parte depois da interrogação muda, e o clique
// não levava a nada. Endereço próprio resolve, e de brinde a conversa fica
// com um link que se manda para alguém.

const CARTAO = "rounded-2xl border border-contorno bg-cartao";

const AUTORES = {
  cliente: { rotulo: "Visitante", classe: "text-tinta" },
  assistente: { rotulo: "Assistente", classe: "text-tinta/55" },
  equipe: { rotulo: "Equipe LANÇA+", classe: "text-destaque" },
} as const;

function horaLegivel(iso: string) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminConversa({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await painelLiberado())) return null;

  const { id } = await params;
  const dados = await lerConversa(Number(id));

  if (!dados) {
    return (
      <div>
        <Link
          href="/lncadmin/conversas"
          className="text-sm text-tinta/50 transition-colors duration-300 hover:text-tinta"
        >
          ← Conversas
        </Link>
        <p className={`${CARTAO} mt-5 p-5 text-sm text-tinta/60`}>
          Essa conversa não existe mais.
        </p>
      </div>
    );
  }

  const { conversa, mensagens } = dados;

  return (
    <div>
      <Link
        href="/lncadmin/conversas"
        className="text-sm text-tinta/50 transition-colors duration-300 hover:text-tinta"
      >
        ← Conversas
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-tinta">
            {conversa.nome || "Visitante sem nome"}
          </h1>
          <p className="mt-1 text-sm text-tinta/50">
            começou em {horaLegivel(conversa.criadoEm)}
          </p>

          {/* Os dados da ficha, quando a pessoa preencheu.
              Clicáveis porque atender é ligar ou escrever, e copiar número à
              mão para outra janela é onde o atendimento perde um minuto. */}
          {(conversa.contato || conversa.email) && (
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {conversa.contato && (
                <a
                  href={`tel:${conversa.contato}`}
                  className="text-tinta/70 transition-colors duration-300 hover:text-tinta"
                >
                  {conversa.contato}
                </a>
              )}
              {conversa.email && (
                <a
                  href={`mailto:${conversa.email}`}
                  className="text-tinta/70 transition-colors duration-300 hover:text-tinta"
                >
                  {conversa.email}
                </a>
              )}
            </p>
          )}
        </div>

        {conversa.contato && (
          // O número vira link de WhatsApp quando é número.
          //
          // A conversa que começa no site quase sempre termina lá, e quem
          // está atendendo não deveria ter de copiar dígito a dígito para
          // outra janela.
          /^[\d\s()+-]{10,}$/.test(conversa.contato) && (
            <a
              href={`https://wa.me/55${conversa.contato.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-full border border-salmon/50 px-5 text-sm font-medium text-destaque transition-colors duration-300 hover:bg-salmon/10"
            >
              Continuar no WhatsApp
            </a>
          )
        )}
      </div>

      <ul className={`${CARTAO} mt-5 grid max-h-[55vh] gap-4 overflow-y-auto p-5`}>
        {mensagens.length === 0 && (
          <li className="text-sm text-tinta/45">Sem mensagens.</li>
        )}

        {mensagens.map((mensagem) => {
          const autor = AUTORES[mensagem.autor];

          return (
            <li key={mensagem.id}>
              <div className="flex items-baseline gap-2">
                <span className={`text-xs font-medium ${autor.classe}`}>
                  {autor.rotulo}
                </span>
                <span className="text-[0.7rem] text-tinta/30">
                  {horaLegivel(mensagem.quando)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-tinta/75">
                {mensagem.texto}
              </p>
            </li>
          );
        })}
      </ul>

      <form action={responderNoChat} className={`${CARTAO} mt-4 p-5`}>
        <input type="hidden" name="id" value={conversa.id} />

        <label
          htmlFor="resposta"
          className="block text-sm font-medium text-tinta"
        >
          Responder
        </label>
        <p className="mt-1 text-xs leading-relaxed text-tinta/45">
          Aparece no chat de quem está do outro lado em até cinco segundos, se
          a pessoa ainda estiver com a janela aberta. Se já tiver fechado, ela
          vê quando voltar — a conversa fica guardada no navegador dela.
        </p>

        <textarea
          id="resposta"
          name="texto"
          rows={4}
          maxLength={2000}
          placeholder="Escreva como escreveria no WhatsApp."
          className={`${campo} mt-3 min-h-28 resize-y`}
        />

        {/* Os atalhos ficam abaixo do campo, e não acima: acima, eles são a
            primeira coisa que a pessoa vê e sugerem que o certo é escolher
            um. O certo é escrever, e usar o atalho quando ele encurta. */}
        <RespostasProntas campo="resposta" />

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className={botaoPrimario}>
            Enviar resposta
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-3">
        {conversa.estado === "equipe" && (
          <form action={devolverAoAssistente}>
            <input type="hidden" name="id" value={conversa.id} />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-full border border-contorno px-5 text-sm text-tinta/60 transition-colors duration-300 hover:text-tinta"
            >
              Devolver ao assistente
            </button>
          </form>
        )}

        {conversa.estado !== "fechada" && (
          <form action={encerrarConversa}>
            <input type="hidden" name="id" value={conversa.id} />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-full border border-contorno px-5 text-sm text-tinta/60 transition-colors duration-300 hover:text-tinta"
            >
              Encerrar conversa
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
