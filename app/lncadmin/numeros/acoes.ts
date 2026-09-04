"use server";

import { revalidatePath } from "next/cache";
import { sql, garantirEsquema } from "@/lib/db";
import { exigirAdmin } from "@/lib/admin";

async function preparar() {
  await exigirAdmin();
  await garantirEsquema();
  if (!sql) throw new Error("Banco de dados não configurado.");
  return sql;
}

// Os números aparecem no hero e na apresentação da agência, as duas na home.
function atualizarSite() {
  revalidatePath("/");
  revalidatePath("/lncadmin/numeros");
}

function texto(dados: FormData, campo: string) {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

// O valor é contado de 0 até ele na animação, então precisa ser inteiro.
// Texto como "40+" iria para o sufixo, e não para cá.
function inteiro(dados: FormData, campo: string) {
  const valor = Number(texto(dados, campo));
  return Number.isFinite(valor) ? Math.trunc(valor) : 0;
}

export async function criarNumero(dados: FormData) {
  const banco = await preparar();

  const rotulo = texto(dados, "rotulo");
  if (!rotulo) return;

  const ultimo = (await banco.query(
    "SELECT COALESCE(MAX(ordem), -1) + 1 AS proxima FROM numeros"
  )) as Array<{ proxima: number }>;

  await banco.query(
    "INSERT INTO numeros (prefixo, valor, sufixo, rotulo, ordem) VALUES ($1,$2,$3,$4,$5)",
    [
      texto(dados, "prefixo"),
      inteiro(dados, "valor"),
      texto(dados, "sufixo"),
      rotulo,
      ultimo[0]?.proxima ?? 0,
    ]
  );

  atualizarSite();
}

export async function salvarNumero(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  await banco.query(
    "UPDATE numeros SET prefixo = $1, valor = $2, sufixo = $3, rotulo = $4 WHERE id = $5",
    [
      texto(dados, "prefixo"),
      inteiro(dados, "valor"),
      texto(dados, "sufixo"),
      texto(dados, "rotulo"),
      id,
    ]
  );

  atualizarSite();
}

export async function apagarNumero(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  await banco.query("DELETE FROM numeros WHERE id = $1", [id]);
  atualizarSite();
}

export async function moverNumero(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  const direcao = Number(dados.get("direcao"));
  if (!Number.isFinite(id) || (direcao !== 1 && direcao !== -1)) return;

  const lista = (await banco.query(
    "SELECT id FROM numeros ORDER BY ordem, id"
  )) as Array<{ id: number }>;

  const atual = lista.findIndex((l) => l.id === id);
  const destino = atual + direcao;
  if (atual === -1 || destino < 0 || destino >= lista.length) return;

  const nova = [...lista];
  [nova[atual], nova[destino]] = [nova[destino], nova[atual]];

  for (const [posicao, item] of nova.entries()) {
    await banco.query("UPDATE numeros SET ordem = $1 WHERE id = $2", [
      posicao,
      item.id,
    ]);
  }

  atualizarSite();
}
