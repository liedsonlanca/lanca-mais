// O arquivo anexado a uma mensagem, no chat do site e no painel.
//
// Imagem aparece em miniatura (clicar abre inteira, em outra aba); PDF vira
// um cartão com o nome. <img> comum, e não next/image: o arquivo já sai do
// armazenamento no tamanho em que foi mandado, e a otimização da Vercel
// gastaria cota para cada print de cliente.

export default function AnexoDaMensagem({
  url,
  tipo,
  nome,
}: {
  url: string;
  tipo: string;
  nome: string;
}) {
  if (tipo.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={nome || "Imagem enviada"}
          loading="lazy"
          className="max-h-56 w-auto max-w-full rounded-xl border border-contorno object-contain"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 rounded-xl border border-contorno bg-cartao/60 px-3 py-2 text-sm text-tinta/80 transition-colors duration-300 hover:border-salmon"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0 text-destaque"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
      <span className="min-w-0 truncate">{nome || "Arquivo"}</span>
    </a>
  );
}
