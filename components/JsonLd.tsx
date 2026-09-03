import { services, siteConfig, siteUrl } from "@/lib/site-config";

// Campos ainda em placeholder (contêm colchetes) não são publicados nos dados
// estruturados — melhor omitir do que informar dado falso ao Google.
function real(value: string) {
  return value.includes("[") ? undefined : value;
}

// JSON.stringify não escapa "</script>": um texto vindo do painel com essa
// sequência fecharia a tag e o que viesse depois seria executado como código.
// Trocar "<" pelo escape equivalente resolve, e o JSON continua válido.
function jsonSeguro(dados: unknown) {
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}

export default function JsonLd() {
  const sameAs = [
    real(siteConfig.instagram) &&
      `https://instagram.com/${siteConfig.instagram.replace("@", "")}`,
    real(siteConfig.tiktok) &&
      `https://tiktok.com/${siteConfig.tiktok}`,
  ].filter(Boolean);

  const organization = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#organization`,
    name: siteConfig.name,
    url: siteUrl,
    description: siteConfig.description,
    slogan: siteConfig.tagline,
    image: `${siteUrl}/opengraph-image`,
    email: real(siteConfig.email),
    taxID: real(siteConfig.cnpj),
    telephone: `+${siteConfig.whatsappNumber}`,
    address: real(siteConfig.address)
      ? {
          "@type": "PostalAddress",
          streetAddress: siteConfig.address,
          addressLocality: real(siteConfig.city),
          addressCountry: "BR",
        }
      : undefined,
    areaServed: { "@type": "Country", name: "Brasil" },
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços da LANÇA+",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.shortDescription,
          url: `${siteUrl}/servicos/${service.slug}`,
        },
      })),
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: siteConfig.name,
    inLanguage: "pt-BR",
    publisher: { "@id": `${siteUrl}/#organization` },
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify remove as chaves com valor undefined.
      dangerouslySetInnerHTML={{
        __html: jsonSeguro([organization, website]),
      }}
    />
  );
}
