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
    // Faixa em papel, e não em areia: ela é a primeira coisa depois do hero
    // escuro, e a seção seguinte (serviços) é areia. Trocá-la aqui foi o que
    // permitiu mover o bloco "sobre" para o fim sem inverter a paridade
    // papel/areia — e o fundo dos cards — de todas as seções do meio.
    <div className="relative overflow-hidden border-y border-linha bg-papel py-6">
      {/* Máscaras laterais para o texto surgir e sumir em vez de cortar seco. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-papel to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-papel to-transparent" />

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
