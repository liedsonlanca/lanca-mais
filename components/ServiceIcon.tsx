// Ícone de cada serviço, num só lugar: a lista da home e a grade da página de
// serviços precisam do mesmo desenho. Traço de 1.5px, para acompanhar a leveza
// das réguas e bordas do site.
const desenhos: Record<string, React.ReactNode> = {
  "gestao-de-marketing": (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  consultoria: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.4.3.6.7.6 1.1v.5h5.8v-.5c0-.4.2-.8.6-1.1A6 6 0 0 0 12 3Z" />
    </>
  ),
  audiovisual: (
    <>
      <rect x="2" y="6" width="13" height="12" rx="2.5" />
      <path d="M15 10.5 22 7v10l-7-3.5z" />
    </>
  ),
  "trafego-pago": (
    <>
      <path d="M3 17.5 9.5 11l4 4L21 7.5" />
      <path d="M15 7.5h6v6" />
    </>
  ),
  "identidade-visual": (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7Z" />
      <circle cx="7.5" cy="11.5" r="1.2" />
      <circle cx="12" cy="7.5" r="1.2" />
      <circle cx="16.5" cy="11" r="1.2" />
    </>
  ),
  "desenvolvimento-web": (
    <>
      <rect x="2.5" y="4" width="19" height="15" rx="2.5" />
      <path d="M2.5 9h19" />
      <path d="m9 13 -1.8 1.8L9 16.6M15 13l1.8 1.8L15 16.6" />
    </>
  ),
  arquitetura: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V8l7-5 7 5v13" />
      <path d="M10 21v-5h4v5" />
    </>
  ),
};

export default function ServiceIcon({
  slug,
  className = "h-7 w-7",
}: {
  slug: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {desenhos[slug]}
    </svg>
  );
}
