"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin";
import { sql, garantirEsquema } from "@/lib/db";
import {
  CHAVE_MODO,
  CHAVE_LANCAMENTO,
  esquecerConfig,
  type ModoSite,
} from "@/lib/modo-site";

async function gravar(chave: string, valor: string | null) {
  if (!sql) throw new Error("Banco de dados não configurado.");
  await garantirEsquema();

  if (valor === null) {
    await sql.query("DELETE FROM meta WHERE chave = $1", [chave]);
    return;
  }

  await sql.query(
    "INSERT INTO meta (chave, valor) VALUES ($1, $2) ON CONFLICT (chave) DO UPDATE SET valor = $2, em = now()",
    [chave, valor]
  );
}

// O porteiro guarda a configuração por trinta segundos na memória da
// instância. Limpar aqui adianta a mudança nesta instância; as outras pegam
// no vencimento. Por isso o painel avisa que pode levar até meio minuto.
function aplicar() {
  esquecerConfig();
  revalidatePath("/lncadmin/site");
  revalidatePath("/em-breve");
  revalidatePath("/", "layout");
}

export async function salvarModo(dados: FormData) {
  await exigirAdmin();

  const bruto = String(dados.get("modo") ?? "");
  const modo: ModoSite =
    bruto === "publico" || bruto === "manutencao" ? bruto : "em-breve";

  await gravar(CHAVE_MODO, modo);
  aplicar();
}

export async function salvarLancamento(dados: FormData) {
  await exigirAdmin();

  const data = String(dados.get("data") ?? "").trim();
  const hora = String(dados.get("hora") ?? "").trim() || "00:00";

  if (!data) {
    await gravar(CHAVE_LANCAMENTO, null);
    aplicar();
    return;
  }

  // O campo do navegador entrega hora local de quem digitou. Guardamos em ISO
  // com o fuso de Brasília fixo: sem isso, alterar a data de um celular
  // configurado em outro fuso moveria o lançamento sem ninguém perceber.
  const iso = `${data}T${hora}:00-03:00`;

  if (!Number.isFinite(Date.parse(iso))) {
    throw new Error("Data ou hora inválida.");
  }

  await gravar(CHAVE_LANCAMENTO, iso);
  aplicar();
}

export async function limparLancamento() {
  await exigirAdmin();
  await gravar(CHAVE_LANCAMENTO, null);
  aplicar();
}
