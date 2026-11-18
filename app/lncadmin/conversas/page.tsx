import { painelLiberado } from "@/lib/admin";

export const dynamic = "force-dynamic";

// O miolo, quando nenhuma conversa está aberta.
//
// A lista fica no layout ao lado, então esta página é só o vazio do meio —
// e vazio de tela que a pessoa vai usar todo dia merece dizer o que fazer,
// em vez de ficar branco.

export default async function ConversasSemEscolha() {
  if (!(await painelLiberado())) return null;

  return (
    <div className="flex h-full min-h-56 items-center justify-center rounded-2xl border border-contorno bg-cartao p-8">
      <div className="max-w-xs text-center">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto h-10 w-10 text-tinta/20"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
        </svg>

        <p className="mt-4 text-sm leading-relaxed text-tinta/50">
          Escolha uma conversa à esquerda para ler e responder.
        </p>
      </div>
    </div>
  );
}
