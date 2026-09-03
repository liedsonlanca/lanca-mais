"use server";

import { revalidatePath } from "next/cache";
import { apagarArquivo } from "@/lib/upload";
import {
  preparar,
  texto,
  arquivoEnviado,
  proximaOrdem,
  moverItem,
} from "@/lib/painel";

// A faixa de logos vive na home, logo abaixo dos depoimentos, e só aparece
// quando há pelo menos um logo cadastrado.
function atualizarSite() {
  revalidatePath("/");
  revalidatePath("/admin/logos");
}

export async function criarLogo(dados: FormData) {
  const banco = await preparar();

  const nome = texto(dados, "nome");
  if (!nome) throw new Error("Escreva o nome da marca.");

  const logo = await arquivoEnviado(dados, "logo", "logos", "imagem");
  if (!logo) throw new Error("Escolha o arquivo do logo.");

  await banco.query("INSERT INTO logos (nome, logo, ordem) VALUES ($1,$2,$3)", [
    nome,
    logo,
    await proximaOrdem("logos"),
  ]);

  atualizarSite();
}

export async function salvarLogo(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const novo = await arquivoEnviado(dados, "logo", "logos", "imagem");

  const antes = (await banco.query("SELECT logo FROM logos WHERE id = $1", [
    id,
  ])) as Array<{ logo: string }>;

  await banco.query(
    "UPDATE logos SET nome = $1, logo = COALESCE($2, logo) WHERE id = $3",
    [texto(dados, "nome"), novo, id]
  );

  if (novo) await apagarArquivo(antes[0]?.logo);

  atualizarSite();
}

export async function apagarLogo(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const antes = (await banco.query("SELECT logo FROM logos WHERE id = $1", [
    id,
  ])) as Array<{ logo: string }>;

  await banco.query("DELETE FROM logos WHERE id = $1", [id]);
  await apagarArquivo(antes[0]?.logo);

  atualizarSite();
}

export async function moverLogo(dados: FormData) {
  await preparar();
  await moverItem("logos", Number(dados.get("id")), Number(dados.get("direcao")));
  atualizarSite();
}
