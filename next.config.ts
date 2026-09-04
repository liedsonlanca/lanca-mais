import type { NextConfig } from "next";

// Content-Security-Policy: a lista do que a página pode carregar.
//
// Sem ela, um script injetado pode buscar o que quiser de onde quiser. Com
// ela, o navegador recusa qualquer origem fora desta lista, mesmo que o
// script já esteja rodando dentro da página.
//
// Sobre 'unsafe-inline' em script-src: o Next embute na página os dados da
// hidratação como script inline. A alternativa recomendada é um nonce por
// requisição, mas nonce obriga renderização dinâmica em toda página, e este
// site é quase todo estático — trocaríamos a estática do site inteiro por uma
// defesa contra um risco que aqui é pequeno, já que todo texto passa pelo
// escape do React e o conteúdo vem do painel, não do visitante.
//
// O que a política entrega mesmo assim, e que não depende de script-src:
//
//   base-uri     impede injetar <base> e sequestrar todo link relativo;
//   form-action  impede que um formulário da página poste em site de fora;
//   object-src   mata <object> e <embed>, que são plugins e não têm uso aqui;
//   frame-src    só o mapa do rodapé pode ser embutido, mais nada;
//   img/media    prendem imagem e vídeo ao próprio site e ao Blob da Vercel;
//   connect-src  limita para onde a página pode falar, então dado roubado não
//                tem para onde ir.
//
// 'unsafe-eval' e o websocket só entram em desenvolvimento: o React usa eval
// para remontar pilha de erro, e o recarregamento a quente fala por ws. Em
// produção nem um nem outro existem.

// Os arquivos do painel moram no Cloudflare R2. O domínio publico vem do
// ambiente porque muda por instalação, e este arquivo roda no build, onde a
// variável já existe. Sem ela a política não deixaria de valer: só ficaria
// sem a origem do R2, e imagem e vídeo não apareceriam — daí o aviso no
// painel quando as variáveis faltam.
const R2 = process.env.R2_PUBLIC_HOST
  ? `https://${process.env.R2_PUBLIC_HOST.replace(/^https?:\/\//, "")}`
  : "";

// O Blob segue liberado porque o banco ainda guarda endereços dele nas peças
// enviadas antes da mudança. Sai quando não houver mais nenhuma.
const BLOB = "https://*.public.blob.vercel-storage.com";

const MIDIA = [BLOB, R2].filter(Boolean).join(" ");

// Endereço para onde o painel ENVIA, que não é o mesmo de onde o site LÊ.
//
// A leitura sai do domínio público (pub-....r2.dev); o envio vai para o
// endpoint compatível com S3. São hosts diferentes, e connect-src precisa
// dos dois: sem o de envio, o navegador bloqueia antes de abrir conexão, e o
// erro que chega ao painel é uma falha de rede genérica que não diz nada
// sobre a causa — só o console do navegador nomeia o bloqueio.
//
// São duas formas de endereçar o mesmo endpoint, e o cliente S3 usa a
// primeira: o bucket vira subdomínio (lanca-midia.<conta>.r2...), e não um
// pedaço do caminho (<conta>.r2.../lanca-midia). Para o navegador são hosts
// distintos, então as duas entram — a segunda porque a biblioteca pode
// escolher o caminho em alguma operação.
//
// Vai o endereço exato da conta, e não um curinga em *.r2.cloudflarestorage
// .com: o curinga liberaria a conta de qualquer pessoa na Cloudflare.
const R2_ENVIO = process.env.R2_ACCOUNT_ID
  ? [
      process.env.R2_BUCKET
        ? `https://${process.env.R2_BUCKET}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : "",
      `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    ]
      .filter(Boolean)
      .join(" ")
  : "";

function politicaDeConteudo(desenvolvimento: boolean) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // O único iframe do site é o mapa do rodapé. Liberar a origem exata do
    // Google Maps mantém a porta fechada para todo o resto.
    "frame-src https://www.google.com",
    `script-src 'self' 'unsafe-inline'${desenvolvimento ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${MIDIA}`,
    `media-src 'self' blob: ${MIDIA}`,
    "font-src 'self' data:",
    // O envio do painel vai do navegador direto para o R2, então a origem
    // dele precisa estar aqui: sem isso o upload é bloqueado pela política.
    `connect-src 'self' ${[MIDIA, R2_ENVIO].filter(Boolean).join(" ")}${desenvolvimento ? " ws: http://localhost:*" : ""}`,
    "upgrade-insecure-requests",
  ].join("; ");
}

// Cabeçalhos de segurança.
//
// Nenhum deles muda o que a pessoa vê; todos fecham porta que estava aberta
// por omissão.
const CABECALHOS = [
  {
    key: "Content-Security-Policy",
    value: politicaDeConteudo(process.env.NODE_ENV === "development"),
  },
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
      ...(process.env.R2_PUBLIC_HOST
        ? [
            {
              protocol: "https" as const,
              hostname: process.env.R2_PUBLIC_HOST.replace(/^https?:\/\//, ""),
              pathname: "/**",
            },
          ]
        : []),
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
