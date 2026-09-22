"use server";

import { revalidatePath } from "next/cache";
import { avisar } from "@/lib/painel";
import { exigirAdmin, guardarSegredoTotp, removerSegredoTotp, segredoTotp } from "@/lib/admin";
import { codigoValido } from "@/lib/totp";

// Ativar e desativar a verificação em duas etapas.
//
// O segredo só é gravado depois que a pessoa digita um código válido. Sem essa
// confirmação, um erro ao escanear o QR trancaria o painel: o servidor exigiria
// um código que o aplicativo não sabe gerar.
export async function ativarDuasEtapas(dados: FormData) {
  await exigirAdmin();

  const segredo = String(dados.get("segredo") ?? "").trim();
  const codigo = String(dados.get("codigo") ?? "").trim();

  if (!segredo) return avisar("Segredo ausente. Recarregue a página.", "erro");

  if (!(await codigoValido(segredo, codigo))) {
    return avisar(
      "Código incorreto. Confira se o relógio do celular está automático e tente com o código atual.",
      "erro"
    );
  }

  await guardarSegredoTotp(segredo);
  await avisar("Verificação em duas etapas ativada.");
  revalidatePath("/lncadmin/seguranca");
}

// Desativar exige um código válido também: quem estiver com a sessão aberta
// numa máquina esquecida não deve conseguir baixar a proteção sozinho.
export async function desativarDuasEtapas(dados: FormData) {
  await exigirAdmin();

  const atual = await segredoTotp();
  if (!atual) return;

  const codigo = String(dados.get("codigo") ?? "").trim();
  if (!(await codigoValido(atual, codigo))) {
    return avisar("Código incorreto. A verificação continua ativa.", "erro");
  }

  await removerSegredoTotp();
  await avisar("Verificação em duas etapas desativada.", "atencao");
  revalidatePath("/lncadmin/seguranca");
}
