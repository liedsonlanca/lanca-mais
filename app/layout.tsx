import type { Metadata } from "next";
import { googleSans } from "./fonts";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import BotaoVoltar from "@/components/BotaoVoltar";
import Consentimento from "@/components/Consentimento";
import JsonLd from "@/components/JsonLd";
import SmoothScroll from "@/components/motion/SmoothScroll";
import MotionProvider from "@/components/motion/MotionProvider";
import ScrollTopOnNavigate from "@/components/motion/ScrollTopOnNavigate";
import { siteConfig, siteUrl } from "@/lib/site-config";
import { lerImagens } from "@/lib/conteudo";
import { imagem } from "@/lib/imagens";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} | Agência de Marketing`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Agência de Marketing`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Agência de Marketing`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// O logo do topo e do rodapé é editável pelo painel, e topo e rodapé vivem
// aqui, no layout — não numa página. Então é aqui que ele é lido, uma vez
// por renderização, e entregue aos dois.
//
// Ler no layout tem custo: ele participa da geração de toda página do site.
// Sai barato porque isso acontece na geração, e não a cada visita, e porque
// lerImagens cai no logo do repositório se o banco não responder. Nenhuma
// tela do site depende deste banco para existir.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const imagens = await lerImagens();
  const marcaClara = imagem(imagens, "marca-clara");
  const marcaEscura = imagem(imagens, "marca-escura");

  return (
    <html
      lang="pt-BR"
      className={`${googleSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <JsonLd />
        <SmoothScroll />
        <ScrollTopOnNavigate />
        <MotionProvider>
          <Header marcaClara={marcaClara} marcaEscura={marcaEscura} />
          {/* relative: o "Voltar" se pendura no alto do conteudo sem
              ocupar espaco no fluxo. */}
          <main className="relative flex-1">
            <BotaoVoltar />
            {children}
          </main>
          <Footer marca={marcaClara} />
          <WhatsAppButton />

          {/* Monta os rastreadores por dentro, quando houver permissão.
              Fica no fim para não atrasar nada do que a pessoa veio ver. */}
          <Consentimento />
        </MotionProvider>
      </body>
    </html>
  );
}
