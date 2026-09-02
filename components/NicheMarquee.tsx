const niches = [
  "Saúde",
  "Estética",
  "Direito",
  "Imóveis",
  "Gastronomia",
  "Moda",
  "Educação",
  "Fitness",
  "Varejo",
  "Arquitetura",
  "Pet",
  "Tecnologia",
];

export default function NicheMarquee() {
  return (
    <div className="relative overflow-hidden border-y border-linha bg-areia py-6">
      {/* Máscaras laterais para o texto surgir e sumir em vez de cortar seco. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-areia to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-areia to-transparent" />

      <div className="animate-marquee flex w-max items-center gap-10">
        {[...niches, ...niches].map((niche, i) => (
          <span
            key={i}
            className="flex items-center gap-10 whitespace-nowrap text-sm uppercase tracking-[0.25em] text-preto/58"
          >
            {niche}
            <span aria-hidden className="text-salmon-texto/78">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
