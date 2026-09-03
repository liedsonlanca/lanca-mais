import Image from "next/image";
import Link from "next/link";
import { navLinks, services, siteConfig } from "@/lib/site-config";
import FooterMap from "@/components/FooterMap";
import { lerPosts } from "@/lib/conteudo";

const socials = [
  {
    label: "WhatsApp",
    href: `https://wa.me/${siteConfig.whatsappNumber}`,
  },
  {
    label: "Instagram",
    href: `https://instagram.com/${siteConfig.instagram.replace("@", "")}`,
  },
  {
    label: "TikTok",
    href: `https://tiktok.com/${siteConfig.tiktok}`,
  },
];

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function Footer() {
  const blogPosts = await lerPosts();

  return (
    <footer className="border-t border-borda bg-abismo text-bege">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <Image
            src="/images/logo-1.png"
            alt="LANÇA+"
            width={140}
            height={39}
            className="h-8 w-auto"
          />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-bege/85">
            {siteConfig.slogan.slice(0, -1).join(" ")}{" "}
            <span className="text-salmon">{siteConfig.slogan.at(-1)}</span>
          </p>
          <ul className="mt-6 space-y-1 text-sm text-bege/92">
            <li>{siteConfig.email}</li>
            <li>{siteConfig.instagram}</li>
          </ul>
          <div className="mt-6 flex gap-3">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-borda px-4 py-1.5 text-xs font-medium text-bege/92 transition-colors hover:border-salmon hover:text-salmon"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="eyebrow text-salmon">
            Navegação
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-bege/92 hover:text-branco">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow text-salmon">
            Serviços
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/servicos/${service.slug}`}
                  className="text-bege/92 hover:text-branco"
                >
                  {service.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow text-salmon">
            Últimos posts
          </h3>
          <ul className="mt-4 space-y-4 text-sm">
            {blogPosts.slice(0, 3).map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-bege/92 hover:text-branco"
                >
                  {post.title}
                </Link>
                <span className="mt-1 block text-xs text-bege/70">
                  {formatDate(post.date)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        </div>

        <div className="mt-14">
          <FooterMap />
        </div>
      </div>

      <div className="border-t border-borda px-6 py-6 text-center text-xs text-bege/70">
        © {new Date().getFullYear()} {siteConfig.name}. Todos os direitos reservados.
        <span className="mx-2 text-bege/45">·</span>
        CNPJ {siteConfig.cnpj}
      </div>
    </footer>
  );
}
