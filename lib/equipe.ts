export type Pessoa = {
  nome: string;
  /** Cargo, como aparece na etiqueta salmão sobre a foto. */
  funcao: string;
  /** Retrato em pé. O card é 3:4 e mostra a imagem alinhada pelo topo. */
  foto: string;
};

// A equipe da LANÇA+, na página Sobre.
//
// Esta lista é a semente: na primeira leitura ela é copiada para o banco, e a
// partir daí quem manda é o painel. Continua aqui porque é também a reserva —
// se o banco cair, a página mostra isto em vez de uma seção vazia.
//
// Editar este arquivo depois da primeira publicação não muda o site: a cópia
// acontece uma vez só. O lugar de mexer passa a ser o painel.
export const equipe: Pessoa[] = [
  {
    nome: "Liédson Rodrigues",
    funcao: "CEO & Social Media",
    foto: "/images/team/liedson-rodrigues.jpg",
  },
  {
    nome: "Vitória Dantas",
    funcao: "Designer e Arquiteta",
    foto: "/images/team/vitoria-dantas.jpg",
  },
  {
    nome: "Diógenes Mesquita",
    funcao: "Designer",
    foto: "/images/team/diogenes-mesquita.jpg",
  },
  {
    nome: "Silas Oliveira",
    funcao: "Filmmaker e Fotógrafo",
    foto: "/images/team/silas-oliveira.jpg",
  },
];
