import type { MetadataRoute } from "next";
import { services, siteUrl, BLOG_ATIVO } from "@/lib/site-config";
import { blogPosts } from "@/lib/blog-posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const rotasFixas: MetadataRoute.Sitemap = [
    { url: `${siteUrl}`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    {
      url: `${siteUrl}/servicos`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/portfolio`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/sobre`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },

    {
      url: `${siteUrl}/contato`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.9,
    },
    // As políticas entram com prioridade baixa: precisam ser encontráveis
    // por quem procura, sem competir com as páginas que vendem.
    {
      url: `${siteUrl}/politica-de-privacidade`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/politica-de-cookies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/aviso-legal`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/termos-de-uso`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const rotasServicos: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${siteUrl}/servicos/${service.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const rotasPosts: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00`),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  // Com o blog fora do ar, os posts saem do sitemap: anunciar aos buscadores
  // um endereço que responde 404 é pedir para ser penalizado por isso.
  return [
    ...rotasFixas,
    ...rotasServicos,
    ...(BLOG_ATIVO ? rotasPosts : []),
  ];
}
