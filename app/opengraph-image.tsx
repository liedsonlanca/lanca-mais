import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { siteConfig } from "@/lib/site-config";

export const alt = `${siteConfig.name}. ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const preto = "#0a0a08";
const bege = "#ede5d2";
const salmon = "#dd8a55";

export default async function Image() {
  const [palmoreBold, palmoreRegular] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/palmore/PalmoreBold.ttf")),
    readFile(join(process.cwd(), "public/fonts/palmore/PalmoreRegular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: preto,
          color: bege,
          fontFamily: "Palmore",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em" }}>
            LANÇA
          </span>
          <span style={{ fontSize: 44, fontWeight: 700, color: salmon }}>+</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 940,
            }}
          >
            Sua marca tem qualidade.
          </span>
          <span
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: salmon,
              maxWidth: 940,
            }}
          >
            Sua presença digital mostra isso?
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${bege}33`,
            paddingTop: 28,
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 400, color: `${bege}b3` }}>
            Agência de marketing completa
          </span>
          <span style={{ fontSize: 26, fontWeight: 400, color: salmon }}>
            {siteConfig.url.replace("https://", "")}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Palmore", data: palmoreBold, style: "normal", weight: 700 },
        { name: "Palmore", data: palmoreRegular, style: "normal", weight: 400 },
      ],
    }
  );
}
