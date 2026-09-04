import { siteConfig } from "@/lib/site-config";

const endereco = `${siteConfig.address}, ${siteConfig.city}`;
const consulta = encodeURIComponent(endereco);

// Faixa da sede no rodapé.
//
// Usa o embed do Google Maps por consulta de endereço: não exige chave de API
// nem coordenadas, e a geocodificação acontece do lado deles.
//
// O iframe é lazy: o rodapé existe em todas as páginas, e sem isso cada visita
// carregaria um mapa de terceiro mesmo sem ninguém chegar até o fim da página.
//
// Em repouso o mapa é apenas dessaturado, o bastante para conversar com o
// rodapé escuro sem deixar de ser legível — no celular não há hover para
// reverter o efeito. No hover ele volta à cor cheia.
export default function FooterMap() {
  return (
    <div className="grid gap-8 border-t border-borda pt-12 md:grid-cols-[1fr_1.5fr] md:items-center md:gap-12">
      <div>
        <h3 className="eyebrow text-salmon">Onde estamos</h3>

        <p className="mt-5 text-lg leading-relaxed text-bege/92">
          {siteConfig.address}
        </p>
        <p className="mt-1 text-bege/70">{siteConfig.city}</p>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${consulta}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-salmon"
        >
          Abrir no Google Maps
          <span
            aria-hidden
            className="transition-transform duration-500 group-hover:translate-x-1"
          >
            →
          </span>
        </a>
      </div>

      <div className="group overflow-hidden rounded-2xl border border-borda">
        <iframe
          src={`https://www.google.com/maps?q=${consulta}&output=embed`}
          title={`Mapa da localização da ${siteConfig.name}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-56 w-full grayscale-[0.55] brightness-[0.92] transition-all duration-700 group-hover:grayscale-0 group-hover:brightness-100 lg:h-64"
        />
      </div>
    </div>
  );
}
