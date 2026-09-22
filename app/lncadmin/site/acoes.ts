"use server";

import { revalidatePath } from "next/cache";
import { avisar } from "@/lib/painel";
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
  // A frase diz o estado, e não um genérico "salvo": esta é a única tela
  // do painel que abre e fecha o site para o público, e confirmar em
  // palavras o que ficou valendo evita o susto de ter clicado no errado.
  const estado =
    modo === "publico"
      ? "Site aberto ao público."
      : modo === "manutencao"
        ? "Site em manutenção."
        : "Site em modo pré-lançamento.";
  await avisar(`${estado} Pode levar até meio minuto para valer em todo lugar.`);
  aplicar();
}

export async function salvarLancamento(dados: FormData) {
  await exigirAdmin();

  const data = String(dados.get("data") ?? "").trim();
  const hora = String(dados.get("hora") ?? "").trim() || "00:00";

  if (!data) {
    await gravar(CHAVE_LANCAMENTO, null);
    await avisar("Contagem regressiva desligada.");
    aplicar();
    return;
  }

  // O campo do navegador entrega hora local de quem digitou. Guardamos em ISO
  // com o fuso de Brasília fixo: sem isso, alterar a data de um celular
  // configurado em outro fuso moveria o lançamento sem ninguém perceber.
  const iso = `${data}T${hora}:00-03:00`;

  if (!Number.isFinite(Date.parse(iso))) {
    return avisar("Data ou hora inválida.", "erro");
  }

  await gravar(CHAVE_LANCAMENTO, iso);
  await avisar("Data do lançamento salva.");
  aplicar();
}

export async function limparLancamento() {
  await exigirAdmin();
  await gravar(CHAVE_LANCAMENTO, null);
  await avisar("Contagem regressiva desligada.");
  aplicar();
}
