import { services } from "@/lib/site-config";
import { servicePages } from "@/lib/service-pages";
import { sintomas, metodo, entregaveis } from "@/lib/home";

// Os textos do site, editáveis pelo painel.
//
// ---------- Por que o catálogo é gerado, e não escrito à mão ----------
//
// São mais de quinhentos textos: 41 perguntas de FAQ com as respostas, 75
// títulos de benefício, etapa e diferencial, 238 itens de lista, mais a cópia
// da home e os oito serviços. Escrever uma entrada por texto seria um arquivo
// de milhares de linhas que passaria a mentir no dia em que alguém mexesse na
// estrutura dos dados.
//
// Então o catálogo é derivado dos próprios dados. Cada texto vira uma chave
// pelo caminho onde ele mora:
//
//   servico.marketing-pessoal.faq.2.question
//   home.sintomas.0.titulo
//
// Acrescentar uma pergunta no FAQ faz a chave nascer sozinha; tirar uma faz a
// chave sumir. O banco guarda só o que foi reescrito, e uma chave que deixou
// de existir é ignorada na leitura — o mesmo desenho do catálogo de imagens.
//
// ---------- Por que lista vira uma caixa de várias linhas ----------
//
// Entregáveis, resultados e tópicos são listas de frases. Dar a cada item um
// campo próprio, com botão de acrescentar e setas de ordem, seria uma tela
// enorme para editar seis linhas de texto.
//
// Uma caixa de texto com uma frase por linha faz o mesmo: apagar a linha tira
// o item, escrever uma linha nova acrescenta, e mover a linha muda a ordem.
// É como a agência já pensa nessas listas.

export type TipoDeTexto = "linha" | "paragrafo" | "lista";

export type Campo = {
  chave: string;
  grupo: string;
  rotulo: string;
  tipo: TipoDeTexto;
  padrao: string;
};

export type Grupo = { id: string; rotulo: string; descricao: string };

/* ---------------- Os nomes bonitos de cada campo ---------------- */

const ROTULOS: Record<string, string> = {
  heroKicker: "Letreirinho da abertura",
  heroSubtitle: "Frase de abertura",
  ctaLabel: "Texto do botão principal",
  deliverables: "Entregáveis",
  results: "Resultados",
  "manifesto.statement": "Frase do manifesto",
  "manifesto.body": "Parágrafos do manifesto",
  question: "Pergunta",
  answer: "Resposta",
  title: "Título",
  description: "Descrição",
  name: "Nome do serviço",
  shortDescription: "Resumo de uma linha",
  bullets: "Tópicos",
  titulo: "Título",
  descricao: "Descrição",
};

const FAMILIAS: Record<string, string> = {
  features: "Diferencial",
  process: "Etapa",
  faq: "Dúvida",
  sintomas: "Sintoma",
  metodo: "Etapa do método",
};

/** Transforma um caminho em algo que uma pessoa lê. */
function rotularCaminho(caminho: string): string {
  const partes = caminho.split(".");

  // features.2.title  →  "Diferencial 3 — Título"
  if (partes.length >= 3) {
    const familia = FAMILIAS[partes[partes.length - 3]];
    const indice = Number(partes[partes.length - 2]);
    const campo = ROTULOS[partes[partes.length - 1]] ?? partes[partes.length - 1];
    if (familia && Number.isInteger(indice)) {
      return `${familia} ${indice + 1} — ${campo}`;
    }
  }

  // manifesto.body  →  "Parágrafos do manifesto"
  const doisUltimos = partes.slice(-2).join(".");
  if (ROTULOS[doisUltimos]) return ROTULOS[doisUltimos];

  const ultimo = partes[partes.length - 1];
  if (ROTULOS[ultimo]) return ROTULOS[ultimo];

  // deliverables.3  →  "Entregáveis — item 4"
  const indice = Number(ultimo);
  if (Number.isInteger(indice)) {
    const pai = ROTULOS[partes[partes.length - 2]] ?? partes[partes.length - 2];
    return `${pai} — item ${indice + 1}`;
  }

  return ultimo;
}

/**
 * Achata um objeto em pares de caminho e texto.
 *
 * Só strings e listas de strings viram campo: número, booleano e o slug ficam
 * de fora, porque não são texto de leitura — mexer neles quebraria endereço e
 * cálculo em vez de melhorar a cópia.
 */
function achatar(
  valor: unknown,
  caminho: string,
  saida: Array<{ caminho: string; texto: string; tipo: TipoDeTexto }>
) {
  if (typeof valor === "string") {
    // O slug é endereço, não texto: editá-lo quebraria todos os links.
    if (caminho.endsWith(".slug")) return;
    saida.push({
      caminho,
      texto: valor,
      tipo: valor.length > 90 ? "paragrafo" : "linha",
    });
    return;
  }

  if (Array.isArray(valor)) {
    // Lista de frases vira uma caixa só, uma por linha.
    if (valor.every((v) => typeof v === "string")) {
      saida.push({ caminho, texto: valor.join("\n"), tipo: "lista" });
      return;
    }
    valor.forEach((item, i) => achatar(item, `${caminho}.${i}`, saida));
    return;
  }

  if (valor && typeof valor === "object") {
    for (const [chave, dentro] of Object.entries(valor)) {
      achatar(dentro, `${caminho}.${chave}`, saida);
    }
  }
}

/* ---------------- O que o catálogo cobre ---------------- */

/** As raízes achatadas, com o grupo a que cada uma pertence. */
function raizes() {
  const lista: Array<{ grupo: string; prefixo: string; dados: unknown }> = [
    { grupo: "home", prefixo: "home.sintomas", dados: sintomas },
    { grupo: "home", prefixo: "home.metodo", dados: metodo },
    { grupo: "home", prefixo: "home.entregaveis", dados: entregaveis },
  ];

  for (const servico of services) {
    lista.push({
      grupo: `servico-${servico.slug}`,
      prefixo: `servico.${servico.slug}.resumo`,
      dados: {
        name: servico.name,
        shortDescription: servico.shortDescription,
        description: servico.description,
        bullets: servico.bullets,
      },
    });

    const pagina = servicePages[servico.slug];
    if (pagina) {
      lista.push({
        grupo: `servico-${servico.slug}`,
        prefixo: `servico.${servico.slug}.pagina`,
        dados: pagina,
      });
    }
  }

  return lista;
}

export const CAMPOS: Campo[] = raizes().flatMap(({ grupo, prefixo, dados }) => {
  const achatados: Array<{ caminho: string; texto: string; tipo: TipoDeTexto }> = [];
  achatar(dados, prefixo, achatados);
  return achatados.map(({ caminho, texto, tipo }) => ({
    chave: caminho,
    grupo,
    rotulo: rotularCaminho(caminho),
    tipo,
    padrao: texto,
  }));
});

export const GRUPOS: Grupo[] = [
  {
    id: "home",
    rotulo: "Página inicial",
    descricao: "Os sintomas, as etapas do método e a lista de entregáveis.",
  },
  ...services.map((servico) => ({
    id: `servico-${servico.slug}`,
    rotulo: servico.name,
    descricao: "O resumo que aparece nos cards e a página inteira do serviço.",
  })),
];

export const POR_CHAVE = new Map(CAMPOS.map((c) => [c.chave, c]));

export function camposDoGrupo(id: string) {
  return CAMPOS.filter((c) => c.grupo === id);
}

export type Textos = Record<string, string>;

/** Tudo no padrão de fábrica. É a reserva quando não há banco. */
export function textosPadrao(): Textos {
  const mapa: Textos = {};
  for (const campo of CAMPOS) mapa[campo.chave] = campo.padrao;
  return mapa;
}

/**
 * O texto de um campo, com o padrão como rede.
 *
 * Chave desconhecida devolve string vazia em vez de `undefined`: um texto que
 * some é um buraco na página; um `undefined` impresso é um defeito à vista.
 */
export function texto(textos: Textos, chave: string): string {
  return textos[chave] ?? POR_CHAVE.get(chave)?.padrao ?? "";
}

/** A mesma coisa para os campos de lista, já quebrada em itens. */
export function lista(textos: Textos, chave: string): string[] {
  return texto(textos, chave)
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);
}
