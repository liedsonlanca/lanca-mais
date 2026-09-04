// Consentimento de cookies.
//
// A LGPD não exige permissão para cookie necessário ao funcionamento — os dois
// que o site grava por conta própria (a senha do site e a sessão do painel) são
// desse tipo e não passam por aqui. O que passa é o que observa a pessoa: a
// medição de audiência e o rastreamento para anúncios.
//
// A decisão fica no navegador de quem visita, e não no servidor. Ela não é
// dado de negócio, é preferência de quem está lendo: guardá-la do nosso lado
// criaria um cadastro de visitantes para resolver um problema que uma linha no
// próprio aparelho resolve.

export type Categorias = {
  /** Google Analytics: quantas pessoas vêm, de onde, o que leem. */
  medicao: boolean;
  /** Pixel da Meta: público para anúncios e medição de campanha. */
  marketing: boolean;
};

export type Decisao = {
  categorias: Categorias;
  /** Quando foi decidido, em ISO. Serve de prova de consentimento. */
  em: string;
};

export const NADA: Categorias = { medicao: false, marketing: false };
export const TUDO: Categorias = { medicao: true, marketing: true };

// A versão no nome da chave existe para o dia em que uma categoria nova
// entrar: a decisão antiga não cobriria a nova, e perguntar de novo é o certo.
const CHAVE = "lanca:consentimento:1";

export function lerDecisao(): Decisao | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;

    const salvo = JSON.parse(bruto) as Decisao;
    if (typeof salvo?.categorias?.medicao !== "boolean") return null;
    if (typeof salvo?.categorias?.marketing !== "boolean") return null;

    return salvo;
  } catch {
    // Navegador anônimo, armazenamento bloqueado, JSON estragado. Em qualquer
    // um deles a resposta certa é "ainda não decidiu", e não um erro na tela.
    return null;
  }
}

export function guardarDecisao(categorias: Categorias) {
  const decisao: Decisao = { categorias, em: new Date().toISOString() };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(decisao));
  } catch {
    // Sem armazenamento, a escolha vale só para esta visita. É o máximo que dá
    // para respeitar sem gravar nada em lugar nenhum.
  }
  return decisao;
}

export function esquecerDecisao() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* idem */
  }
}
