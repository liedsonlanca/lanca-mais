import { sql, garantirEsquema } from "@/lib/db";

// Quem chegou pelo site.
//
// ---------- Por que esta lista existe, se há um CRM ----------
//
// Ela não é um CRM de segunda. O DGFLOW responde "como está o negócio com
// esta pessoa" — etapa, valor, histórico. Esta tela responde outra pergunta,
// que o CRM não responde: quem chegou por este site, por qual porta e o que
// perguntou.
//
// Por isso não há etapa, valor, nem ganha/perdida aqui. Duas listas com as
// mesmas colunas divergem em duas semanas — alguém move no CRM, ninguém move
// aqui, e a do site passa a mentir. Sem colunas em comum, não há o que
// divergir.
//
// ---------- Por que vem de duas tabelas ----------
//
// São duas portas de entrada, e cada uma já guarda o que precisa: o chat em
// `conversas`, o formulário em `pedidos`. Copiar tudo para uma terceira
// tabela criaria o problema de sincronia dentro da própria casa.

export type Porta = "chat" | "orcamento";

export type Contato = {
  chave: string;
  porta: Porta;
  nome: string;
  whatsapp: string;
  email: string;
  assunto: string;
  quando: string;
  /** Id da conversa, quando veio do chat: serve para abrir o fio. */
  conversa: number | null;
  nota: number | null;
  /** Falso num pedido que o CRM recusou: alguém precisa levá-lo à mão. */
  noCrm: boolean;
};

const QUANDO = `to_char(criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

/** Guarda um pedido do formulário. Falha em silêncio: o CRM é o destino. */
export async function registrarPedido(pedido: {
  nome: string;
  whatsapp: string;
  email: string;
  servico: string;
  mensagem: string;
}) {
  if (!sql) return 0;

  try {
    await garantirEsquema();
    const linhas = (await sql.query(
      `INSERT INTO pedidos (nome, whatsapp, email, servico, mensagem)
            VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [
        pedido.nome,
        pedido.whatsapp,
        pedido.email,
        pedido.servico,
        pedido.mensagem.slice(0, 2000),
      ]
    )) as Array<{ id: number }>;

    return Number(linhas[0]?.id ?? 0);
  } catch {
    return 0;
  }
}

/** Marca que o pedido chegou ao CRM. */
export async function pedidoNoCrm(id: number) {
  if (!sql || !id) return;
  try {
    await sql.query("UPDATE pedidos SET no_crm = true WHERE id = $1", [id]);
  } catch {
    // O pedido já está gravado; esta marca é informativa.
  }
}

/**
 * Todo mundo que o site trouxe, do mais recente para o mais antigo.
 *
 * Duas consultas em paralelo e a junção aqui, em vez de um UNION: as duas
 * tabelas têm formas diferentes e o UNION obrigaria a forçar colunas vazias
 * de um lado e do outro para elas combinarem — SQL mais longo para fazer o
 * que três linhas de JavaScript fazem com clareza.
 */
export async function listarContatos(limite = 200): Promise<Contato[]> {
  if (!sql) return [];

  try {
    await garantirEsquema();

    const [doChat, doFormulario] = await Promise.all([
      // Só quem se identificou: conversa sem ficha é dúvida anônima, não
      // contato — e uma lista de contatos cheia de "Visitante sem nome" não
      // serve para ligar para ninguém.
      sql.query(
        `SELECT c.id, c.nome, c.contato, c.email, c.nota,
                ${QUANDO.replace(/criado_em/g, "c.criado_em")} AS quando,
                (SELECT m.texto FROM mensagens m
                  WHERE m.conversa = c.id AND m.autor = 'cliente'
                  ORDER BY m.id LIMIT 1) AS primeira
           FROM conversas c
          WHERE c.nome <> '' AND c.contato <> ''
          ORDER BY c.criado_em DESC
          LIMIT $1`,
        [limite]
      ),

      sql.query(
        `SELECT id, nome, whatsapp, email, servico, mensagem, no_crm,
                ${QUANDO} AS quando
           FROM pedidos
          ORDER BY criado_em DESC
          LIMIT $1`,
        [limite]
      ),
    ]);

    const contatos: Contato[] = [
      ...(doChat as Array<Record<string, unknown>>).map((l) => ({
        chave: `c-${l.id}`,
        porta: "chat" as const,
        nome: String(l.nome ?? ""),
        whatsapp: String(l.contato ?? ""),
        email: String(l.email ?? ""),
        assunto: String(l.primeira ?? ""),
        quando: String(l.quando),
        conversa: Number(l.id),
        nota: l.nota == null ? null : Number(l.nota),
        noCrm: true,
      })),

      ...(doFormulario as Array<Record<string, unknown>>).map((l) => ({
        chave: `p-${l.id}`,
        porta: "orcamento" as const,
        nome: String(l.nome ?? ""),
        whatsapp: String(l.whatsapp ?? ""),
        email: String(l.email ?? ""),
        assunto: [String(l.servico ?? ""), String(l.mensagem ?? "")]
          .filter(Boolean)
          .join(" — "),
        quando: String(l.quando),
        conversa: null,
        nota: null,
        noCrm: Boolean(l.no_crm),
      })),
    ];

    return contatos
      .sort(
        (a, b) => new Date(b.quando).getTime() - new Date(a.quando).getTime()
      )
      .slice(0, limite);
  } catch {
    return [];
  }
}
