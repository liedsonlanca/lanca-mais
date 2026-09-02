import localFont from "next/font/local";

export const palmore = localFont({
  variable: "--font-palmore",
  display: "swap",
  src: [
    { path: "../public/fonts/palmore/PalmoreLight.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/palmore/PalmoreRegular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/palmore/PalmoreSemibold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/palmore/PalmoreBold.ttf", weight: "700", style: "normal" },
  ],
});

export const googleSans = localFont({
  variable: "--font-google-sans",
  display: "swap",
  src: [
    { path: "../public/fonts/google-sans/GoogleSans-Variable.ttf", weight: "300 700", style: "normal" },
    { path: "../public/fonts/google-sans/GoogleSans-Italic-Variable.ttf", weight: "300 700", style: "italic" },
  ],
});
