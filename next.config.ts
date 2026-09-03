import type { NextConfig } from "next";

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
};

export default nextConfig;
