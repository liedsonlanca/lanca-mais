// O recado que o painel dá depois de cada ação.
//
// ---------- Por que cookie, e não um valor devolvido pela ação ----------
//
// O painel inteiro é feito de <form> nativo com `action={umaServerAction}`,
// para funcionar mesmo sem JavaScript no navegador. Nesse formato a ação não
// devolve nada para a tela: ela grava e o Next redesenha a página.
//
// Passar a devolver exigiria trocar as quarenta ações para o formato de
// `useActionState`, com estado anterior no primeiro argumento, e envolver cada
// um dos vinte e cinco formulários num componente de navegador. Seria trocar a
// simplicidade que faz o painel funcionar sem JavaScript por um aviso.
//
// O cookie faz o mesmo caminho de volta. A documentação do Next é explícita:
// cookie definido numa Server Action volta junto com a interface atualizada,
// numa viagem só. O navegador guarda, o aviso aparece, e ele se apaga sozinho.
//
// Não é httpOnly de propósito: o conteúdo é uma frase de interface, escrita
// por nós, e quem precisa lê-la é o próprio navegador. Nada de sessão, nada de
// identidade, nada que valha esconder.
//
// ---------- Por que a ação avisa até quando não faz nada ----------
//
// Várias ações desistem no meio: nome em branco, arquivo que não veio, id que
// não existe. Antes disso elas simplesmente voltavam, a tela se redesenhava
// igual, e quem estava usando ficava sem saber se salvou. Por isso `avisar`
// também é chamada nessas saídas, com tom de atenção: "não salvei, e este é o
// motivo" vale mais do que silêncio.

export const COOKIE_AVISO = "painel_aviso";

export type TomDoAviso = "feito" | "atencao" | "erro";

// A função que grava o cookie vive em lib/painel.ts, junto das outras peças
// das Server Actions. Aqui ficam só o nome do cookie e o tipo do tom, porque
// este arquivo é lido também pelo componente de navegador que mostra o aviso
// — e ele não pode arrastar next/headers para dentro do pacote do visitante.
