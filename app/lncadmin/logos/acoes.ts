"use server";

import { revalidatePath } from "next/cache";
import { apagarArquivo } from "@/lib/upload";
import {
  preparar,
  texto,
  urlEnviada,
  inteiro,
  proximaOrdem,
  moverItem,
  avisar,
} from "@/lib/painel";

// A faixa de logos vive na home, logo abaixo dos depoimentos, e só aparece
// quando há pelo menos um logo cadastrado.
function atualizarSite() {
  revalidatePath("/");
  revalidatePath("/lncadmin/logos");
}

export async function criarLogo(dados: FormData) {
  const banco = await preparar();

  const nome = texto(dados, "nome");
  // Recado em vez de erro: nome em branco é engano de quem preenche, e
  // não falha do sistema. Lançar trocaria o formulário por uma tela de
  // erro, e quem estava usando perderia o que já tinha digitado.
  if (!nome) return avisar("Escreva o nome da marca.", "atencao");

  const logo = urlEnviada(dados, "logo");
  if (!logo) return avisar("Escolha o arquivo do logo.", "atencao");

  await banco.query("INSERT INTO logos (nome, logo, ordem) VALUES ($1,$2,$3)", [
    nome,
    logo,
    await proximaOrdem("logos"),
  ]);

  await avisar(`${nome} entrou na faixa de clientes.`);
  atualizarSite();
}

export async function salvarLogo(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const novo = urlEnviada(dados, "logo");

  const antes = (await banco.query("SELECT logo FROM logos WHERE id = $1", [
    id,
  ])) as Array<{ logo: string }>;

  // A escala é presa entre 40% e 200%: fora disso o logo sai da caixa ou some,
  // e um zero digitado por engano apagaria a marca da faixa.
  const escala = Math.min(Math.max(inteiro(dados, "escala") || 100, 40), 200);

  await banco.query(
    "UPDATE logos SET nome = $1, logo = COALESCE($2, logo), escala = $3 WHERE id = $4",
    [texto(dados, "nome"), novo, escala, id]
  );

  if (novo) await apagarArquivo(antes[0]?.logo);

  await avisar("Logo salvo.");
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

  await avisar("Logo retirado da faixa.");
  atualizarSite();
}

export async function moverLogo(dados: FormData) {
  await preparar();
  await moverItem("logos", Number(dados.get("id")), Number(dados.get("direcao")));
  await avisar("Ordem da faixa alterada.");
  atualizarSite();
}
