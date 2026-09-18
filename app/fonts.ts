import localFont from "next/font/local";

// A Palmore saiu da web em 18/09/2026, quando os títulos passaram para a sans.
// Os arquivos continuam em public/fonts/palmore porque a imagem de
// compartilhamento (opengraph-image.tsx) ainda os lê direto do disco.

export const googleSans = localFont({
  variable: "--font-google-sans",
  display: "swap",
  src: [
    { path: "../public/fonts/google-sans/GoogleSans-Variable.ttf", weight: "300 700", style: "normal" },
    { path: "../public/fonts/google-sans/GoogleSans-Italic-Variable.ttf", weight: "300 700", style: "italic" },
  ],
});

