"use server";

import { revalidatePath } from "next/cache";
import { apagarArquivo } from "@/lib/upload";
import {
  preparar,
  texto,
  urlEnviada,
  proximaOrdem,
  moverItem,
  paraSlug,
} from "@/lib/painel";

// Cases aparecem na home e na página de portfólio.
function atualizarSite() {
  revalidatePath("/");
  revalidatePath("/portfolio");
  revalidatePath("/lncadmin/cases");
}

// Os serviços vêm numa linha só, separados por vírgula: é mais rápido de
// escrever do que uma lista de campos, e a lista é curta.
function servicos(dados: FormData) {
  return texto(dados, "servicos")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function criarCase(dados: FormData) {
  const banco = await preparar();

  const cliente = texto(dados, "cliente");
  if (!cliente) throw new Error("Escreva o nome do cliente.");

  const imagem = urlEnviada(dados, "imagem");
  if (!imagem) throw new Error("Escolha a imagem do case.");

  // O slug é o endereço do case. Nasce do nome do cliente e ganha um número
  // no fim se já existir outro igual, em vez de recusar o cadastro.
  const base = paraSlug(cliente) || "case";
  let slug = base;
  for (let n = 2; n < 50; n += 1) {
    const existe = (await banco.query("SELECT 1 FROM cases WHERE slug = $1", [
      slug,
    ])) as unknown[];
    if (existe.length === 0) break;
    slug = `${base}-${n}`;
  }

  await banco.query(
    "INSERT INTO cases (slug, cliente, nicho, imagem, resumo, servicos, resultado, ordem) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      slug,
      cliente,
      texto(dados, "nicho"),
      imagem,
      texto(dados, "resumo"),
      servicos(dados),
      texto(dados, "resultado"),
      await proximaOrdem("cases"),
    ]
  );

  atualizarSite();
}

export async function salvarCase(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const nova = urlEnviada(dados, "imagem");

  const antes = (await banco.query("SELECT imagem FROM cases WHERE id = $1", [
    id,
  ])) as Array<{ imagem: string }>;

  await banco.query(
    `UPDATE cases
        SET cliente = $1, nicho = $2, resumo = $3, servicos = $4,
            resultado = $5, imagem = COALESCE($6, imagem)
      WHERE id = $7`,
    [
      texto(dados, "cliente"),
      texto(dados, "nicho"),
      texto(dados, "resumo"),
      servicos(dados),
      texto(dados, "resultado"),
      nova,
      id,
    ]
  );

  if (nova) await apagarArquivo(antes[0]?.imagem);

  atualizarSite();
}

export async function apagarCase(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const antes = (await banco.query("SELECT imagem FROM cases WHERE id = $1", [
    id,
  ])) as Array<{ imagem: string }>;

  await banco.query("DELETE FROM cases WHERE id = $1", [id]);
  await apagarArquivo(antes[0]?.imagem);

  atualizarSite();
}

export async function moverCase(dados: FormData) {
  await preparar();
  await moverItem("cases", Number(dados.get("id")), Number(dados.get("direcao")));
  atualizarSite();
}
