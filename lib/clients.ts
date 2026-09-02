export type Cliente = {
  nome: string;
  /** Caminho do logo em public/images/clientes. Prefira PNG ou SVG com fundo transparente. */
  logo: string;
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
