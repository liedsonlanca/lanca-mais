export type Cliente = {
  nome: string;
  /** Caminho do logo em public/images/clientes. Prefira PNG ou SVG com fundo transparente. */
  logo: string;
  /**
   * Tamanho relativo na faixa, em porcentagem. 100 é o padrão.
   *
   * Existe porque cada arquivo traz uma margem interna própria: dois logos na
   * mesma caixa aparecem com pesos visuais diferentes, e só o olho resolve.
   */
  escala?: number;
};

// Marcas atendidas pela LANÇA+.
//
// A lista nasce vazia de propósito: preencher com nomes inventados afirmaria
// relações comerciais que não existem. Enquanto estiver vazia, a faixa não é
// renderizada — ela aparece sozinha assim que o primeiro logo entrar aqui.
//
// Para preencher: coloque os arquivos em public/images/clientes e liste abaixo.
// Ex.: { nome: "Clínica Exemplo", logo: "/images/clientes/clinica-exemplo.png" }
export const clientes: Cliente[] = [];
