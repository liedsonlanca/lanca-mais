// Os avisos sonoros do chat.
//
// ---------- Por que não há arquivo de áudio ----------
//
// Dois bipes de um décimo de segundo não justificam baixar arquivo: o MP3
// mais magro passa de 5 KB, precisa ser hospedado, versionado e esperado
// pela rede antes do primeiro toque — que é justamente o toque que importa.
// Aqui a nota é gerada pelo próprio navegador, não pesa nada e toca na hora.
//
// ---------- O que o navegador não deixa fazer ----------
//
// Som sem gesto da pessoa é bloqueado, e é bloqueado com razão: site que
// apita sozinho ao abrir é a praga que a regra existe para conter. Então o
// convite dos 30 segundos pode sair calado se o visitante ainda não clicou
// em nada na página — e, nesse caso, o aviso visual é o que resta.
//
// Depois do primeiro clique (abrir o chat já é um), todo toque seguinte sai.
// Não há como contornar isso, e tentar contornar é como sites ganham a fama
// de barulhentos.
//
// ---------- Por que dá para silenciar ----------
//
// Porque a escolha é de quem ouve. A preferência fica no navegador da
// pessoa, e um chat que apita sem como desligar é um chat que ela fecha.

const GUARDA = "lanca:chat-som";

type Toque = "mensagem" | "convite";

/**
 * As notas de cada aviso, em hertz, e quanto cada uma dura.
 *
 * Duas notas subindo para mensagem: é o desenho que o ouvido já reconhece
 * como "chegou algo", sem precisar aprender. O convite é uma nota só e mais
 * baixa — ele interrompe menos, porque não aconteceu nada ainda; é só a
 * agência batendo na porta.
 */
const TOQUES: Record<Toque, { notas: number[]; duracao: number; volume: number }> = {
  mensagem: { notas: [660, 880], duracao: 0.09, volume: 0.07 },
  convite: { notas: [520], duracao: 0.14, volume: 0.05 },
};

let contexto: AudioContext | null = null;

/**
 * A escolha desta visita, quando houve uma.
 *
 * Vem antes do armazenamento porque o armazenamento pode recusar a escrita —
 * aba privada, site bloqueado — e sem isto o botão de silenciar não teria
 * efeito nenhum nesses casos: a pessoa clicaria, o ícone não mudaria e o
 * bipe continuaria tocando.
 */
let preferencia: boolean | null = null;

export function somLigado() {
  if (preferencia !== null) return preferencia;

  try {
    return localStorage.getItem(GUARDA) !== "off";
  } catch {
    // Sem armazenamento, o padrão é com som: é o que a pessoa espera de um
    // chat, e ela tem o botão para desligar.
    return true;
  }
}

/**
 * Quem quer saber quando a preferência muda.
 *
 * Existe para a tela poder ler a preferência direto daqui, em vez de guardar
 * uma segunda cópia dela em estado de componente. Duas cópias da mesma
 * verdade é como o ícone de som acaba mostrando "ligado" com o som
 * desligado — e quem recarrega a página vê justamente isso.
 */
const ouvintes = new Set<() => void>();

export function assinarSom(aviso: () => void) {
  ouvintes.add(aviso);
  return () => {
    ouvintes.delete(aviso);
  };
}

export function guardarSom(ligado: boolean) {
  preferencia = ligado;

  try {
    localStorage.setItem(GUARDA, ligado ? "on" : "off");
  } catch {
    // Vale para esta visita, e pronto.
  }

  for (const aviso of ouvintes) aviso();
}

/**
 * Toca um aviso. Falha em silêncio — literalmente.
 *
 * Nenhum erro daqui pode subir: um bipe que não saiu não é motivo para a
 * mensagem não aparecer na tela.
 */
export function tocar(qual: Toque) {
  if (!somLigado()) return;

  try {
    // O contexto é criado no primeiro toque, e não ao carregar a página:
    // criado cedo, ele fica suspenso e, em alguns navegadores, aparece como
    // "este site está tocando áudio" sem nada ter tocado.
    type ComPrefixo = typeof window & { webkitAudioContext?: typeof AudioContext };
    const Classe =
      window.AudioContext ?? (window as ComPrefixo).webkitAudioContext;
    if (!Classe) return;

    contexto ??= new Classe();

    // Suspenso significa que ainda não houve gesto. Pedir para retomar é
    // legítimo e, se o navegador recusar, o `catch` do próprio pedido
    // encerra o assunto.
    if (contexto.state === "suspended") void contexto.resume().catch(() => {});
    if (contexto.state !== "running") return;

    const { notas, duracao, volume } = TOQUES[qual];

    notas.forEach((nota, posicao) => {
      const inicio = contexto!.currentTime + posicao * duracao;

      const oscilador = contexto!.createOscillator();
      const ganho = contexto!.createGain();

      // Senoide, e não a onda quadrada que vem por padrão: quadrada tem o
      // timbre de alarme de videogame, e isto é um recado, não um alerta.
      oscilador.type = "sine";
      oscilador.frequency.value = nota;

      // A rampa existe para não estalar. Volume que começa e termina seco
      // produz um clique no alto-falante, que é mais audível do que a nota.
      ganho.gain.setValueAtTime(0, inicio);
      ganho.gain.linearRampToValueAtTime(volume, inicio + 0.012);
      ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);

      oscilador.connect(ganho).connect(contexto!.destination);
      oscilador.start(inicio);
      oscilador.stop(inicio + duracao + 0.02);
    });
  } catch {
    // Silêncio proposital, em todos os sentidos.
  }
}
