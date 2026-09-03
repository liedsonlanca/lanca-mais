import type { NextConfig } from "next";

// Cabeçalhos de segurança.
//
// Nenhum deles muda o que a pessoa vê; todos fecham porta que estava aberta
// por omissão. Sem Content-Security-Policy por enquanto: o site usa estilos
// embutidos e um script de dados estruturados, e uma política mal calibrada
// quebra a página em silêncio. Fica anotado como próximo passo.
const CABECALHOS = [
  {
    // O site não deve poder ser embutido em iframe de terceiro. É o que
    // impede clickjacking: uma página maliciosa sobrepor botões invisíveis
    // sobre o painel e colher cliques.
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Impede o navegador de "adivinhar" que um arquivo é de outro tipo do que
    // diz o servidor — o truque clássico para fazer um upload virar script.
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Ao sair do site, manda só o domínio, nunca o caminho. Evita que o
    // endereço de uma página do painel vaze no histórico de terceiros.
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // O site não usa câmera, microfone nem localização. Declarar isso impede
    // que um script embutido peça essas permissões em nome do domínio.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    // Só HTTPS, por dois anos, incluindo subdomínios.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: {
    // As fotos e vídeos enviados pelo painel ficam no Vercel Blob, num
    // subdomínio sorteado por loja. Sem liberar o padrão aqui, o next/image
    // recusa a imagem e o card aparece vazio.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },

  async headers() {
    return [
      { source: "/:path*", headers: CABECALHOS },
      {
        // O painel nunca deve ser guardado em cache nem indexado.
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
