import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  // Em pré-lançamento o site inteiro fica fora dos buscadores.
  if (process.env.SITE_PUBLICO !== "1") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // O painel fica fora dos buscadores mesmo com o site aberto.
      //
      // Ele ja exige senha, entao isto nao e o que o protege: e o que evita
      // anunciar o endereco. Uma pagina de login indexada vira alvo de quem
      // varre o Google atras de formularios para tentar senha em massa, e o
      // freio de tentativas passa a trabalhar sem necessidade.
      disallow: ["/lncadmin", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
