"use server";

import { revalidatePath } from "next/cache";
import { sql, garantirEsquema } from "@/lib/db";
import { exigirAdmin } from "@/lib/admin";
import { apagarArquivo } from "@/lib/upload";
import { urlEnviada } from "@/lib/painel";

// Server Actions do bloco da equipe.
//
// exigirAdmin() abre cada uma. Não é exagero: Server Actions são endpoints
// POST de verdade, alcançáveis sem passar pela interface, então o layout ter
// checado a sessão não protege isto aqui.
async function preparar() {
  await exigirAdmin();
  await garantirEsquema();
  if (!sql) throw new Error("Banco de dados não configurado.");
  return sql;
}

// A equipe aparece na página Sobre, que é gerada antecipadamente. Sem
// revalidar, a edição só apareceria no próximo deploy.
function atualizarSite() {
  revalidatePath("/sobre");
  revalidatePath("/lncadmin/equipe");
}

function texto(dados: FormData, campo: string) {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

// A foto já foi enviada ao R2 pelo navegador; aqui chega só a URL.
function fotoEnviada(dados: FormData) {
  return urlEnviada(dados, "foto");
}

export async function criarPessoa(dados: FormData) {
  const banco = await preparar();

  const nome = texto(dados, "nome");
  const foto = fotoEnviada(dados);

  // A foto é obrigatória, e não opcional como a do depoimentista: o card da
  // equipe é a foto. Sem ela sobraria um retângulo vazio com um nome dentro.
  if (!nome || !foto) return;

  // Entra no fim da fileira.
  const ultimo = (await banco.query(
    "SELECT COALESCE(MAX(ordem), -1) + 1 AS proxima FROM equipe"
  )) as Array<{ proxima: number }>;

  await banco.query(
    "INSERT INTO equipe (nome, funcao, foto, ordem) VALUES ($1,$2,$3,$4)",
    [nome, texto(dados, "funcao"), foto, ultimo[0]?.proxima ?? 0]
  );

  atualizarSite();
}

export async function salvarPessoa(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const nome = texto(dados, "nome");
  // Nome em branco apagaria a legenda do card e deixaria um retrato anônimo.
  // Ignorar é melhor que gravar: o campo continua na tela com o valor antigo.
  if (!nome) return;

  const nova = fotoEnviada(dados);

  if (nova) {
    // Foto trocada: a antiga sai do R2, senão fica ocupando espaço para
    // sempre, sem estar em lugar nenhum do site.
    //
    // Só as enviadas pelo painel. As quatro primeiras vieram no repositório,
    // em public/images/team, e apagarArquivo sabe distinguir: um caminho que
    // não é do R2 nem do Blob passa batido.
    const antes = (await banco.query("SELECT foto FROM equipe WHERE id = $1", [
      id,
    ])) as Array<{ foto: string | null }>;
    await apagarArquivo(antes[0]?.foto);
  }

  await banco.query(
    `UPDATE equipe
        SET nome = $1, funcao = $2,
            foto = COALESCE($3, foto)
      WHERE id = $4`,
    [nome, texto(dados, "funcao"), nova, id]
  );

  atualizarSite();
}

export async function apagarPessoa(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  if (!Number.isFinite(id)) return;

  const antes = (await banco.query("SELECT foto FROM equipe WHERE id = $1", [
    id,
  ])) as Array<{ foto: string | null }>;

  await banco.query("DELETE FROM equipe WHERE id = $1", [id]);
  await apagarArquivo(antes[0]?.foto);

  atualizarSite();
}

/** Troca a posição com o vizinho, para trás (-1) ou para frente (1). */
export async function moverPessoa(dados: FormData) {
  const banco = await preparar();

  const id = Number(dados.get("id"));
  const direcao = Number(dados.get("direcao"));
  if (!Number.isFinite(id) || (direcao !== 1 && direcao !== -1)) return;

  const lista = (await banco.query(
    "SELECT id FROM equipe ORDER BY ordem, id"
  )) as Array<{ id: number }>;

  const atual = lista.findIndex((l) => l.id === id);
  const destino = atual + direcao;
  if (atual === -1 || destino < 0 || destino >= lista.length) return;

  // Reescreve a ordem inteira: mais simples de acertar do que trocar dois
  // valores, e a lista aqui é sempre curta.
  const nova = [...lista];
  [nova[atual], nova[destino]] = [nova[destino], nova[atual]];

  for (const [posicao, item] of nova.entries()) {
    await banco.query("UPDATE equipe SET ordem = $1 WHERE id = $2", [
      posicao,
      item.id,
    ]);
  }

  atualizarSite();
}
