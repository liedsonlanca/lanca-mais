// Freio por endereço, na memória do servidor, para rotas baratas e
// frequentes.
//
// O freio de lib/tentativas.ts lê e grava no banco a cada chamada — certo
// para senha e formulário, errado para rotas que o chat chama de 3 em 3
// segundos: o freio custaria mais que a própria rota. Aqui o contador vive
// na memória da instância.
//
// O limite é por instância, não global: quem bater em várias instâncias ao
// mesmo tempo passa um pouco mais. Não é a barreira contra um ataque
// grande (isso é com o firewall da Vercel); é o que impede um script simples
// de transformar uma rota de três em três segundos em mil chamadas por
// segundo no banco.

const janelas = new Map<string, { n: number; ate: number }>();

export function freioRapido(escopo: string, origem: string, limite: number, janelaMs = 60_000) {
  const agora = Date.now();
  const k = `${escopo}:${origem}`;
  const atual = janelas.get(k);

  // Faxina de passagem: o mapa não pode crescer sem fim com endereços que
  // nunca mais voltam.
  if (janelas.size > 5000) {
    for (const [chave, valor] of janelas) if (valor.ate < agora) janelas.delete(chave);
  }

  if (!atual || atual.ate < agora) {
    janelas.set(k, { n: 1, ate: agora + janelaMs });
    return true;
  }
  atual.n += 1;
  return atual.n <= limite;
}
