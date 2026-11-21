import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";
import { siteEstaAberto } from "@/lib/modo-site";

// O robots.txt segue o "Estado do site" do painel.
//
// Antes ele olhava só a variável SITE_PUBLICO, que não existe na Vercel: o
// site seria aberto pelo painel e o robots continuaria dizendo ao Google
// "não entre" — o site no ar e invisível nas buscas, sem nenhum aviso.
//
// Agora vale a mesma regra do resto do site (siteEstaAberto: a variável OU o
// painel), e o arquivo é montado a cada pedido, para acompanhar a troca de
// estado sem esperar uma nova publicação.

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!(await siteEstaAberto())) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/lncadmin", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
