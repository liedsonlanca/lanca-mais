"use client";

import Script from "next/script";
import type { Categorias } from "@/lib/consentimento";

// Google Analytics e Pixel da Meta, carregados só depois do sim.
//
// A abordagem é a mais estrita das duas possíveis: em vez de carregar as
// bibliotecas sempre e pedir a elas que se comportem (o "modo de
// consentimento" do Google), o site simplesmente não as baixa enquanto não
// houver permissão. Quem recusa não recebe um byte de nenhuma das duas, e não
// precisa confiar na palavra delas.
//
// O identificador de cada uma vem do ambiente. Sem ele, o bloco inteiro não
// existe: assim o site funciona igual antes de você criar as contas, e ligar
// cada rastreador é só acrescentar a variável.
const GA = process.env.NEXT_PUBLIC_GA_ID;
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export const temRastreadores = Boolean(GA || PIXEL);

export default function Rastreadores({ de }: { de: Categorias }) {
  return (
    <>
      {GA && de.medicao && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA}`}
            strategy="afterInteractive"
          />
          <Script id="ga-inicio" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {PIXEL && de.marketing && (
        <>
          <Script id="pixel-meta" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
              s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
              document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${PIXEL}');
              fbq('track', 'PageView');
            `}
          </Script>

          {/* Sem o <noscript> do Pixel de propósito: ele é uma imagem que
              rastreia sem depender de script, e portanto sem depender do que a
              pessoa decidiu aqui. Perder a medição de quem navega sem
              JavaScript é um preço pequeno por não furar a própria escolha. */}
        </>
      )}
    </>
  );
}
