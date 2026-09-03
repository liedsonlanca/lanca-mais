"use server";

import { revalidatePath } from "next/cache";
import { preparar, texto, marcado, paraSlug } from "@/lib/painel";

// Os posts aparecem na home, na lista do blog, no rodapé e cada um na sua
// própria página.
function atualizarSite(slug?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");
}

// O texto chega numa área única, com parágrafos separados por linha em branco,
// e é guardado como lista. É como escrever num editor comum, sem marcação.
function paragrafos(dados: FormData) {
  return texto(dados, "conteudo")
    .split(/\n\s*\n/)
    .map((p) => p.trim().replace(/\s*\n\s*/g, " "))
    .filter(Boolean);
}

// Leitura a 200 palavras por minuto, arredondando para cima. Poupa a pessoa de
// calcular isso à mão a cada texto.
function tempoDeLeitura(partes: string[]) {
  const palavras = partes.join(" ").split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(palavras / 200))} min de leitura`;
}

export async function criarPost(dados: FormData) {
  const banco = await preparar();

  const titulo = texto(dados, "titulo");
  if (!titulo) throw new Error("Escreva o título.");

  const base = paraSlug(titulo) || "post";
  let slug = base;
  for (let n = 2; n < 50; n += 1) {
    const existe = (await banco.query("SELECT 1 FROM posts WHERE slug = $1", [
      slug,
    ])) as unknown[];
    if (existe.length === 0) break;
    slug = `${base}-${n}`;
  }

  const partes = paragrafos(dados);
  const data = texto(dados, "data") || new Date().toISOString().slice(0, 10);

  await banco.query(
    "INSERT INTO posts (slug, titulo, resumo, categoria, data, tempo_leitura, conteudo, publicado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      slug,
      titulo,
      texto(dados, "resumo"),
      texto(dados, "categoria"),
      data,
      tempoDeLeitura(partes),
      partes,
      marcado(dados, "publicado"),
    ]
  );

  atualizarSite(slug);
}

export async function salvarPost(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const partes = paragrafos(dados);

  const linhas = (await banco.query(
    `UPDATE posts
        SET titulo = $1, resumo = $2, categoria = $3, data = $4,
            conteudo = $5, tempo_leitura = $6, publicado = $7
      WHERE id = $8
      RETURNING slug`,
    [
      texto(dados, "titulo"),
      texto(dados, "resumo"),
      texto(dados, "categoria"),
      texto(dados, "data") || new Date().toISOString().slice(0, 10),
      partes,
      tempoDeLeitura(partes),
      marcado(dados, "publicado"),
      id,
    ]
  )) as Array<{ slug: string }>;

  atualizarSite(linhas[0]?.slug);
}

export async function apagarPost(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const linhas = (await banco.query(
    "DELETE FROM posts WHERE id = $1 RETURNING slug",
    [id]
  )) as Array<{ slug: string }>;

  atualizarSite(linhas[0]?.slug);
}
