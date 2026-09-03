import { sql, lerDoBanco, garantirEsquema, jaFeito, marcarFeito } from "@/lib/db";
import { vitrine as vitrineEstatica, type PecaVitrine } from "@/lib/showcase";
import { testimonials, stats } from "@/lib/site-config";
import { caseStudies, type CaseStudy } from "@/lib/portfolio";
import { clientes, type Cliente } from "@/lib/clients";
import { blogPosts, type BlogPost } from "@/lib/blog-posts";

// Leitura do conteúdo editável do site.
//
// Cada função devolve o que está no banco. Enquanto o banco não existir — ou
// se a consulta falhar — devolve o conteúdo que sempre viveu nos arquivos de
// lib/. É o mesmo princípio do porteiro em proxy.ts: falhar para o estado
// seguro em vez de derrubar a página.
//
// Na primeira leitura de cada tabela, o conteúdo dos arquivos é copiado para o
// banco. Assim o painel nasce com o que já está no ar, pronto para editar, em
// vez de uma tela vazia. A cópia acontece uma vez só (ver tabela `meta`).

export type Depoimento = { citacao: string; nome: string; cargo: string };
export type Numero = {
  prefixo: string;
  valor: number;
  sufixo: string;
  rotulo: string;
};

async function semear(chave: string, inserir: () => Promise<void>) {
  if (!sql) return;
  if (await jaFeito(`semear:${chave}`)) return;
  await inserir();
  await marcarFeito(`semear:${chave}`);
}

/* ---------------- Nosso trabalho ---------------- */

export async function lerVitrine(): Promise<PecaVitrine[]> {
  return lerDoBanco(async () => {
    await semear("vitrine", async () => {
      for (const [i, peca] of vitrineEstatica.entries()) {
        await sql!.query(
          "INSERT INTO vitrine (src, alt, tipo, video, legenda, ordem) VALUES ($1,$2,$3,$4,$5,$6)",
          [peca.src, peca.alt, peca.tipo ?? "imagem", peca.video ?? null, peca.legenda ?? null, i]
        );
      }
    });

    const linhas = (await sql!.query(
      "SELECT src, alt, tipo, video, legenda FROM vitrine ORDER BY ordem, id"
    )) as Array<{
      src: string;
      alt: string;
      tipo: string;
      video: string | null;
      legenda: string | null;
    }>;

    return linhas.map((l) => ({
      src: l.src,
      alt: l.alt,
      tipo: l.tipo === "video" ? ("video" as const) : ("imagem" as const),
      video: l.video ?? undefined,
      legenda: l.legenda ?? undefined,
    }));
  }, vitrineEstatica);
}

/* ---------------- Depoimentos ---------------- */

export async function lerDepoimentos(): Promise<Depoimento[]> {
  const reserva = testimonials.map((d) => ({
    citacao: d.quote,
    nome: d.name,
    cargo: d.role,
  }));

  return lerDoBanco(async () => {
    await semear("depoimentos", async () => {
      for (const [i, d] of reserva.entries()) {
        await sql!.query(
          "INSERT INTO depoimentos (citacao, nome, cargo, ordem) VALUES ($1,$2,$3,$4)",
          [d.citacao, d.nome, d.cargo, i]
        );
      }
    });

    return (await sql!.query(
      "SELECT citacao, nome, cargo FROM depoimentos ORDER BY ordem, id"
    )) as Depoimento[];
  }, reserva);
}

/* ---------------- Cases ---------------- */

export async function lerCases(): Promise<CaseStudy[]> {
  return lerDoBanco(async () => {
    await semear("cases", async () => {
      for (const [i, c] of caseStudies.entries()) {
        await sql!.query(
          "INSERT INTO cases (slug, cliente, nicho, imagem, resumo, servicos, resultado, ordem) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (slug) DO NOTHING",
          [c.slug, c.client, c.niche, c.image, c.summary, c.services, c.result, i]
        );
      }
    });

    const linhas = (await sql!.query(
      "SELECT slug, cliente, nicho, imagem, resumo, servicos, resultado FROM cases ORDER BY ordem, id"
    )) as Array<{
      slug: string;
      cliente: string;
      nicho: string;
      imagem: string;
      resumo: string;
      servicos: string[];
      resultado: string;
    }>;

    return linhas.map((l) => ({
      slug: l.slug,
      client: l.cliente,
      niche: l.nicho,
      image: l.imagem,
      summary: l.resumo,
      services: l.servicos ?? [],
      result: l.resultado,
    }));
  }, caseStudies);
}

/* ---------------- Logos de clientes ---------------- */

export async function lerLogos(): Promise<Cliente[]> {
  return lerDoBanco(async () => {
    await semear("logos", async () => {
      for (const [i, c] of clientes.entries()) {
        await sql!.query("INSERT INTO logos (nome, logo, ordem) VALUES ($1,$2,$3)", [
          c.nome,
          c.logo,
          i,
        ]);
      }
    });

    return (await sql!.query(
      "SELECT nome, logo FROM logos ORDER BY ordem, id"
    )) as Cliente[];
  }, clientes);
}

/* ---------------- Números de prova social ---------------- */

export async function lerNumeros(): Promise<Numero[]> {
  const reserva: Numero[] = stats.map((s) => ({
    prefixo: s.prefixo,
    valor: s.valor,
    sufixo: s.sufixo,
    rotulo: s.label,
  }));

  return lerDoBanco(async () => {
    await semear("numeros", async () => {
      for (const [i, n] of reserva.entries()) {
        await sql!.query(
          "INSERT INTO numeros (prefixo, valor, sufixo, rotulo, ordem) VALUES ($1,$2,$3,$4,$5)",
          [n.prefixo, n.valor, n.sufixo, n.rotulo, i]
        );
      }
    });

    return (await sql!.query(
      "SELECT prefixo, valor, sufixo, rotulo FROM numeros ORDER BY ordem, id"
    )) as Numero[];
  }, reserva);
}

/* ---------------- Blog ---------------- */

export async function lerPosts(): Promise<BlogPost[]> {
  return lerDoBanco(async () => {
    await semear("posts", async () => {
      for (const p of blogPosts) {
        await sql!.query(
          "INSERT INTO posts (slug, titulo, resumo, categoria, data, tempo_leitura, conteudo) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (slug) DO NOTHING",
          [p.slug, p.title, p.excerpt, p.category, p.date, p.readingTime, p.content]
        );
      }
    });

    const linhas = (await sql!.query(
      // A data volta como Date do driver; normalizamos para AAAA-MM-DD, que é
      // o formato que as páginas já sabem formatar.
      "SELECT slug, titulo, resumo, categoria, to_char(data, 'YYYY-MM-DD') AS data, tempo_leitura, conteudo FROM posts WHERE publicado ORDER BY data DESC, id DESC"
    )) as Array<{
      slug: string;
      titulo: string;
      resumo: string;
      categoria: string;
      data: string;
      tempo_leitura: string;
      conteudo: string[];
    }>;

    return linhas.map((l) => ({
      slug: l.slug,
      title: l.titulo,
      excerpt: l.resumo,
      date: l.data,
      readingTime: l.tempo_leitura,
      category: l.categoria,
      content: l.conteudo ?? [],
    }));
  }, blogPosts);
}

/** Usada pelo painel: garante que as tabelas existem antes de qualquer escrita. */
export { garantirEsquema };
