"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { assinarSom, guardarSom, somLigado, tocar } from "@/lib/som";

// O chat do site.
//
// ---------- Por que a saudação não é gravada ----------
//
// Ela aparece ao abrir, antes de qualquer mensagem, e é escrita aqui. Pedir
// essa frase ao modelo custaria uma chamada por aba aberta — a maioria das
// quais nunca vira conversa — e ainda poria uma espera de dois segundos
// antes da primeira palavra. Saudação é a única fala que não precisa pensar.
//
// ---------- Por que a conversa continua depois de fechar a aba ----------
//
// A chave fica no armazenamento do navegador. Quem fecha e volta cai na
// mesma conversa, com o que já foi dito — e sem isso a pessoa teria de
// explicar tudo de novo, que é o motivo mais comum de alguém desistir de um
// chat de site.
//
// Armazenamento pode falhar: aba privada, site bloqueado. Toda leitura e
// escrita vão em try/catch, e sem ele o chat funciona igual, só não lembra.

type Autor = "cliente" | "assistente" | "equipe";

type Mensagem = {
  id: number;
  autor: Autor;
  texto: string;
};

const GUARDA = "lanca:chat";
const GUARDA_CONVITE = "lanca:chat-convite";

/**
 * Os dados da pessoa, guardados no navegador dela a pedido dela.
 *
 * Servem para a próxima conversa começar com a ficha preenchida. Ficam só
 * aqui: o servidor já tem os mesmos dados na conversa, então isto não é
 * espalhar informação, é não cobrar duas vezes.
 */
const GUARDA_DADOS = "lanca:chat-dados";

type DadosSalvos = { nome: string; whatsapp: string; email: string };

function lerDados(): DadosSalvos | null {
  try {
    const cru = localStorage.getItem(GUARDA_DADOS);
    if (!cru) return null;
    const d = JSON.parse(cru) as Partial<DadosSalvos>;
    if (!d?.nome || !d?.whatsapp || !d?.email) return null;
    return { nome: d.nome, whatsapp: d.whatsapp, email: d.email };
  } catch {
    // Armazenamento recusado ou conteúdo estragado: segue sem lembrar.
    return null;
  }
}

const SAUDACAO: Mensagem = {
  id: 0,
  autor: "assistente",
  texto:
    "Oi! Sou o atendimento da LANÇA+. Pode perguntar sobre os serviços, " +
    "como o trabalho começa ou o que a gente faz — e se precisar falar com " +
    "a equipe, eu chamo.",
};

/** De quanto em quanto tempo a página pergunta se chegou resposta. */
const ESPERANDO_EQUIPE_MS = 5000;
const CONVERSA_NORMAL_MS = 20000;

/**
 * Quanto tempo de página aberta antes de o balão chamar atenção.
 *
 * Trinta segundos é tempo de ler o começo de uma página. Antes disso o
 * convite atropela quem acabou de chegar; muito depois, a pessoa já decidiu
 * sozinha se ia perguntar algo.
 */
const ESPERA_DO_CONVITE_MS = 30000;

function ler(chave: string) {
  try {
    return localStorage.getItem(chave) ?? "";
  } catch {
    return "";
  }
}

function guardar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // Sem memória, o chat ainda conversa.
  }
}

export default function Chat() {
  const [aberto, setAberto] = useState(false);
  const [convidando, setConvidando] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([SAUDACAO]);
  const [rascunho, setRascunho] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState<"assistente" | "equipe" | "fechada">(
    "assistente"
  );
  const [temFicha, setTemFicha] = useState(false);
  const [avaliada, setAvaliada] = useState(false);
  const [dadosSalvos, setDadosSalvos] = useState<DadosSalvos | null>(null);

  /** Começou limpo por cima de um atendimento que ninguém avaliou. */
  const [notaPendente, setNotaPendente] = useState(false);

  /**
   * O expediente, como o servidor o ve.
   *
   * Nao calculado aqui: o relogio do aparelho da pessoa pode estar errado, e
   * fuso certo nao conserta relogio adiantado. Quem sabe que horas sao para
   * a LANCA+ e o servidor.
   */
  const [expediente, setExpediente] = useState<{
    aberto: boolean;
    volta: string;
  } | null>(null);
  const [falhou, setFalhou] = useState(false);

  // A preferência de som é lida de onde ela mora, e não copiada para cá.
  //
  // O terceiro argumento é o que o servidor devolve ao montar o HTML: lá não
  // existe armazenamento de navegador, e "com som" é o padrão. Sem ele, o
  // React acusaria diferença entre o HTML do servidor e o primeiro desenho
  // no navegador.
  const comSom = useSyncExternalStore(assinarSom, somLigado, () => true);

  const caminho = usePathname();

  const chave = useRef("");
  const fim = useRef<HTMLDivElement | null>(null);
  const campo = useRef<HTMLInputElement | null>(null);

  /**
   * O piso: ids até aqui não entram mais na tela.
   *
   * Serve ao recomeço limpo. A chave continua guardada — é ela que faz a
   * próxima mensagem herdar nome, WhatsApp e e-mail — mas as mensagens do
   * atendimento encerrado não devem voltar a aparecer, nem na carga da
   * página nem na busca periódica seguinte.
   */
  const pisoDeId = useRef(0);

  /** Se esta carga de página já leu a conversa do servidor uma vez. */
  const jaCarregou = useRef(false);

  /** Se esta carga de página começou limpa por cima de um atendimento findo. */
  const recomecado = useRef(false);

  /**
   * A chave do atendimento que será avaliado.
   *
   * Guardada à parte porque a nota é do atendimento anterior, e a chave
   * corrente passa a ser outra assim que a pessoa escreve a primeira
   * mensagem da conversa nova. Sem isto, avaliar depois de escrever
   * carimbaria a nota na conversa errada.
   */
  const chaveParaNota = useRef("");

  // O id da última mensagem conhecida, para pedir só o que vier depois.
  const ultima = mensagens.reduce((maior, m) => Math.max(maior, m.id), 0);

  const juntar = useCallback((novas: Mensagem[]) => {
    if (novas.length === 0) return;

    setMensagens((atuais) => {
      // Filtra por id em vez de confiar na ordem: a busca periódica e o
      // envio podem trazer a mesma mensagem, e mensagem repetida na tela faz
      // a pessoa achar que mandou duas vezes.
      const vistos = new Set(atuais.map((m) => m.id));
      const extras = novas.filter((m) => !vistos.has(m.id));
      if (extras.length === 0) return atuais;

      // O bipe toca pelo que chegou de fora, e nunca pelo que a própria
      // pessoa acabou de escrever.
      if (extras.some((m) => m.autor !== "cliente")) tocar("mensagem");

      return [...atuais, ...extras];
    });
  }, []);

  const buscar = useCallback(async () => {
    if (!chave.current) return;

    try {
      const desde = Math.max(ultima, pisoDeId.current);

      const resposta = await fetch(
        `/api/chat?chave=${chave.current}&depois=${desde}`,
        { cache: "no-store" }
      );
      if (!resposta.ok) return;

      const dados = (await resposta.json()) as {
        estado: "assistente" | "equipe" | "fechada" | null;
        temFicha?: boolean;
        avaliada?: boolean;
        expediente?: { aberto: boolean; volta: string };
        novas: Mensagem[];
      };

      if (dados.expediente) setExpediente(dados.expediente);

      // Só na primeira leitura desta carga de página.
      //
      // A estrela grava no clique, então a busca seguinte já volta com
      // "avaliada" — e, se isso escondesse o bloco, o campo de comentário
      // sumiria no meio da digitação de quem estava escrevendo. Quem fecha o
      // bloco é o envio, não o servidor.
      if (!jaCarregou.current && typeof dados.avaliada === "boolean") {
        setAvaliada(dados.avaliada);
      }

      const primeiraLeitura = !jaCarregou.current;
      jaCarregou.current = true;

      const novas = dados.novas ?? [];

      /* ---------- Recarregou depois de encerrado: começa limpo ----------
       *
       * Atendimento findo é assunto findo. Abrir a página no dia seguinte e
       * encontrar a conversa de ontem com "a equipe encerrou" no fim não
       * convida ninguém a nada — é um bilhete velho preso na porta.
       *
       * Enquanto o atendimento está em andamento, com o assistente ou com a
       * equipe, recarregar não perde nada: ali a conversa continua, e quem
       * recarregou foi a página, não a pessoa.
       *
       * A distinção é esta: encerrada **e** é a primeira leitura desta carga
       * de página. Se a equipe encerrar com o chat aberto na frente da
       * pessoa, isso não é primeira leitura — ela vê o aviso, que é o certo.
       *
       * A chave fica guardada de propósito: é ela que faz a próxima mensagem
       * abrir uma conversa nova já com os dados dela.
       */
      if (primeiraLeitura && dados.estado === "fechada") {
        pisoDeId.current = novas.reduce(
          (maior, m) => Math.max(maior, m.id),
          pisoDeId.current
        );
        recomecado.current = true;

        if (typeof dados.temFicha === "boolean") setTemFicha(dados.temFicha);

        // A avaliação do atendimento que acabou, pedida mesmo começando
        // limpo.
        //
        // Sem isto ela quase nunca seria pedida: a equipe encerra depois que
        // a pessoa já saiu, e quem volta cai justamente neste caminho. Fica
        // a pergunta sozinha, sem o histórico antigo em volta — é um convite
        // de duas estrelas, não a conversa de ontem ressuscitada.
        if (!dados.avaliada) {
          chaveParaNota.current = chave.current;
          setNotaPendente(true);
        }

        return;
      }

      if (dados.estado) {
        // O encerramento também é notícia que vem de fora, então apita como
        // uma mensagem apita. Sem o toque, quem está com a aba atrás de
        // outra janela continua esperando uma resposta que não vem mais.
        //
        // A comparação fica aqui, e não dentro do `setEstado`: função de
        // atualização tem de ser pura, e o React pode chamá-la duas vezes em
        // desenvolvimento — o bipe sairia dobrado.
        // Depois de um recomeço limpo o servidor continua dizendo "fechada"
        // até a pessoa escrever. Mostrar o aviso de encerramento numa tela
        // que acabou de começar do zero seria dizer que acabou algo que ela
        // nem viu começar.
        const visivel =
          dados.estado === "fechada" && recomecado.current
            ? "assistente"
            : dados.estado;

        if (visivel === "fechada" && estado !== "fechada") {
          tocar("mensagem");
        }
        setEstado(visivel);
      }

      if (typeof dados.temFicha === "boolean") setTemFicha(dados.temFicha);
      juntar(novas);
    } catch {
      // Rede instável: a próxima rodada tenta de novo.
    }
  }, [estado, juntar, ultima]);

  /**
   * O convite, depois de trinta segundos de página.
   *
   * Só para quem nunca abriu o chat: insistir com quem já conversou é o
   * comportamento que faz a pessoa procurar o X antes de ler o recado.
   */
  useEffect(() => {
    if (aberto || ler(GUARDA_CONVITE) === "visto" || ler(GUARDA)) return;

    const relogio = setTimeout(() => {
      setConvidando(true);
      // Pode sair calado: sem um clique antes, o navegador bloqueia áudio, e
      // é a regra que existe para conter site que apita sozinho. O aviso
      // visual é o que fica garantido.
      tocar("convite");
    }, ESPERA_DO_CONVITE_MS);

    return () => clearTimeout(relogio);
  }, [aberto]);

  // Ao abrir, recupera a conversa de antes.
  useEffect(() => {
    if (!aberto) return;

    chave.current = ler(GUARDA);
    if (chave.current) void buscar();
    campo.current?.focus();
    // Só na abertura: buscar muda de identidade a cada mensagem nova, e
    // incluí-lo aqui recarregaria a conversa a cada troca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  // A busca periódica.
  //
  // Mais rápida enquanto se espera a equipe, lenta no resto: o minuto em que
  // alguém digita a resposta é o único em que meio segundo importa.
  useEffect(() => {
    if (!aberto || !chave.current) return;

    const intervalo =
      estado === "equipe" ? ESPERANDO_EQUIPE_MS : CONVERSA_NORMAL_MS;

    const relogio = setInterval(() => {
      // Aba escondida não precisa perguntar nada: ninguém está lendo, e a
      // volta já traz o que chegou.
      if (!document.hidden) void buscar();
    }, intervalo);

    return () => clearInterval(relogio);
  }, [aberto, buscar, estado]);

  // Rola para o fim quando chega mensagem.
  useEffect(() => {
    if (aberto) fim.current?.scrollIntoView({ block: "end" });
  }, [aberto, mensagens, enviando]);

  function abrir() {
    setConvidando(false);
    guardar(GUARDA_CONVITE, "visto");

    // Os dados guardados são lidos aqui, num clique, e não durante o
    // desenho da tela: ler armazenamento no meio de um render é impuro, o
    // React desaprova com razão, e o valor ainda chegaria diferente entre o
    // HTML do servidor e o primeiro desenho no navegador.
    setDadosSalvos(lerDados());
    setAberto(true);
  }

  function trocarSom() {
    const novo = !comSom;
    guardarSom(novo);
    // Toca ao ligar, para a pessoa ouvir o que acabou de escolher.
    if (novo) tocar("mensagem");
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();

    const pergunta = rascunho.trim();
    if (!pergunta || enviando) return;

    setRascunho("");
    setFalhou(false);
    setEnviando(true);

    // A mensagem aparece antes de chegar ao servidor, com id negativo para
    // não colidir com os do banco. Esperar a volta para mostrar o que a
    // pessoa acabou de digitar faz o chat parecer travado.
    const provisorio = -Date.now();
    setMensagens((atuais) => [
      ...atuais,
      { id: provisorio, autor: "cliente", texto: pergunta },
    ]);

    try {
      const resposta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ chave: chave.current, texto: pergunta }),
      });

      const dados = (await resposta.json()) as {
        ok: boolean;
        chave?: string;
        estado?: "assistente" | "equipe";
        temFicha?: boolean;
        novaConversa?: boolean;
        expediente?: { aberto: boolean; volta: string };
        minha?: number;
        respostas?: Mensagem[];
      };

      if (!resposta.ok || !dados.ok) {
        setFalhou(true);
        return;
      }

      if (dados.expediente) setExpediente(dados.expediente);

      if (dados.chave) {
        chave.current = dados.chave;
        guardar(GUARDA, dados.chave);
      }

      if (dados.novaConversa) {
        // O atendimento anterior tinha sido encerrado, e esta mensagem abriu
        // outra conversa. A tela recomeça: deixar o histórico antigo em cima
        // faria a pessoa achar que a equipe continua lendo aquilo, e no
        // painel aquilo é outro assunto, já fechado.
        //
        // Os dados dela vão junto no servidor, então a ficha não volta.
        setMensagens([
          SAUDACAO,
          {
            id: dados.minha ?? provisorio,
            autor: "cliente",
            texto: pergunta,
          },
        ]);

        // A conversa é outra: o piso e a marca de recomeço eram do
        // atendimento anterior e não valem mais.
        pisoDeId.current = 0;
        recomecado.current = false;
      } else if (dados.minha) {
        // Troca o id provisório pelo do banco, senão a busca periódica traria
        // a mesma mensagem de novo e ela apareceria duas vezes.
        setMensagens((atuais) =>
          atuais.map((m) => (m.id === provisorio ? { ...m, id: dados.minha! } : m))
        );
      }

      if (dados.estado) setEstado(dados.estado);
      if (typeof dados.temFicha === "boolean") setTemFicha(dados.temFicha);
      juntar(dados.respostas ?? []);
    } catch {
      setFalhou(true);
    } finally {
      setEnviando(false);
      campo.current?.focus();
    }
  }

  /* ---------------- Fora do painel ---------------- */

  // O chat é para o visitante, e o painel é da agência.
  //
  // Ele é montado no layout raiz, que embrulha o site inteiro — e o painel
  // mora dentro desse mesmo layout, então o balão aparecia lá também. Quem
  // atende não precisa de um chat para falar com o próprio assistente, e o
  // balão ainda cobria o canto da tela de trabalho.
  //
  // A saída é esta, e não CSS escondendo: `display: none` deixaria o
  // componente vivo, buscando no servidor de tempo em tempo, por trás de uma
  // tela onde ele não serve para nada. Devolvendo nada, ele não existe.
  //
  // Depois de todos os ganchos, de propósito: a ordem dos ganchos não pode
  // mudar entre um desenho e outro, e sair antes deles quebraria isso.
  if (caminho.startsWith("/lncadmin")) return null;

  /* ---------------- O balão fechado ---------------- */

  if (!aberto) {
    return (
      <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2">
        {convidando && (
          <>
            {/* O convite abre à esquerda do balão, e não acima: acima ele
                cobriria o botão do WhatsApp, que é o atalho que mais gente
                usa. */}
            <button
              type="button"
              onClick={abrir}
              className="convite-do-chat max-w-[min(14rem,calc(100vw-7rem))] rounded-2xl rounded-br-md border border-contorno bg-cartao px-3.5 py-2.5 text-left text-sm leading-snug text-tinta shadow-lg shadow-preto/20"
            >
              Fale com a nossa equipe!
            </button>

            <button
              type="button"
              onClick={() => {
                setConvidando(false);
                guardar(GUARDA_CONVITE, "visto");
              }}
              aria-label="Dispensar o convite"
              // 4,25rem é a largura do balão (3,5rem) mais o vão (0,5rem)
              // menos um quarto do próprio X: assim ele pousa no canto do
              // recado, e não por cima do balão que está tremendo.
              className="absolute -top-2 right-[4.25rem] flex h-6 w-6 items-center justify-center rounded-full border border-contorno bg-cartao text-tinta/50 transition-colors duration-300 hover:text-tinta"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-3 w-3"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={abrir}
          aria-label="Abrir conversa com a LANÇA+"
          // Acima do botão do WhatsApp, e não ao lado: lado a lado, os dois
          // disputam o canto e nenhum fica onde o dedo já procura.
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-contorno bg-cartao text-tinta shadow-lg shadow-preto/20 transition-transform duration-300 hover:scale-105 ${
            convidando ? "balao-chamando" : ""
          }`}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
          </svg>
        </button>
      </div>
    );
  }

  /* ---------------- O chat aberto ---------------- */

  const pedindoFicha = estado === "equipe" && !temFicha;

  return (
    <div
      // data-lenis-prevent: a rolagem suave do site captura a roda do mouse
      // na página inteira, então rolar dentro do chat rolava o site atrás
      // dele e a conversa ficava parada. Este atributo devolve a rolagem
      // nativa a tudo que está aqui dentro.
      //
      // Vai no painel inteiro, e não só na lista: um painel flutuante não
      // deve empurrar a página por baixo de si em lugar nenhum dele.
      data-lenis-prevent
      className="fixed bottom-6 right-6 z-[60] flex w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-contorno bg-cartao shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)]"
      style={{ maxHeight: "min(600px, calc(100vh - 6rem))" }}
    >
      <div className="flex items-start justify-between gap-2 border-b border-contorno px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-tinta">Fale com a LANÇA+</p>
          <p className="mt-0.5 text-xs text-tinta/50">
            {/* O subtítulo é onde o horário mora.

                Ele estava só na frase de entrega, dita uma vez — e quando a
                conversa já está com a equipe o servidor não manda mensagem
                nenhuma, então da segunda mensagem em diante a pessoa
                escrevia no vazio, sem nada na tela dizendo quando alguém
                responde. Aqui fica à vista o tempo todo. */}
            {estado === "fechada"
              ? "Atendimento encerrado."
              : estado === "equipe"
                ? expediente && !expediente.aberto
                  ? `Fora do horário — a equipe responde ${expediente.volta}.`
                  : "A equipe foi avisada e responde por aqui."
                : expediente && !expediente.aberto
                  ? `Respondo agora; a equipe atende ${expediente.volta}.`
                  : "Resposta na hora, de segunda a segunda."}
          </p>
        </div>

        <div className="-mr-1 -mt-1 flex shrink-0">
          <button
            type="button"
            onClick={trocarSom}
            aria-label={comSom ? "Desligar o som" : "Ligar o som"}
            aria-pressed={comSom}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-tinta/50 transition-colors duration-300 hover:bg-fundo-alt hover:text-tinta"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M11 5 6 9H3v6h3l5 4z" />
              {comSom ? (
                <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
              ) : (
                <path d="M22 9l-6 6M16 9l6 6" />
              )}
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setAberto(false)}
            aria-label="Fechar conversa"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-tinta/50 transition-colors duration-300 hover:bg-fundo-alt hover:text-tinta"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* aria-live para quem usa leitor de tela ouvir a resposta chegar, em
          vez de ter de voltar e varrer a lista procurando o que mudou. */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        aria-live="polite"
        aria-atomic="false"
      >
        <ul className="grid gap-3">
          {mensagens.map((m) => (
            <li
              key={m.id}
              className={
                m.autor === "cliente"
                  ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-salmon/15 px-3.5 py-2.5"
                  : "mr-auto max-w-[85%] rounded-2xl rounded-bl-md bg-fundo-alt px-3.5 py-2.5"
              }
            >
              {m.autor === "equipe" && (
                <p className="mb-1 text-[0.7rem] font-medium text-destaque">
                  Equipe LANÇA+
                </p>
              )}
              <p className="whitespace-pre-line text-sm leading-relaxed text-tinta/85">
                {m.texto}
              </p>
            </li>
          ))}

          {enviando && (
            <li className="mr-auto rounded-2xl rounded-bl-md bg-fundo-alt px-3.5 py-3">
              <span className="flex gap-1" aria-label="Digitando">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tinta/40 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tinta/40 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tinta/40 [animation-delay:300ms]" />
              </span>
            </li>
          )}
        </ul>

        {/* O encerramento, dito na conversa.

            Sem isto, a equipe fecha o atendimento e quem está do outro lado
            continua olhando um chat que parece vivo, esperando uma resposta
            que não vem mais — e a sensação não é de atendimento concluído, é
            de ter sido ignorado.

            A nota é centrada e sem balão de propósito: é recado do sistema,
            e não fala de ninguém. E diz como voltar, porque conversa
            encerrada não é porta trancada. */}
        {(estado === "fechada" || notaPendente) && (
          <div className="mt-4 border-t border-contorno pt-4">
            {estado === "fechada" && (
              <p
                role="status"
                className="text-center text-xs leading-relaxed text-tinta/45"
              >
                A equipe encerrou este atendimento.
                <br />
                Se precisar de mais alguma coisa, é só escrever aqui embaixo —
                a gente começa uma conversa nova, sem você repetir seus dados.
              </p>
            )}

            {/* A avaliação, pedida aqui e não por e-mail no dia seguinte.

                Pesquisa que chega depois mede quem ficou com raiva e quem
                ficou encantado; o meio-termo, que é a maioria, nunca
                responde. No fim da conversa a pessoa ainda está aqui, e são
                duas estrelas de distância. */}
            {!avaliada && (
              <Avaliacao
                titulo={
                  estado === "fechada"
                    ? "Como foi o atendimento?"
                    : "Como foi o seu último atendimento?"
                }
                // Sem `onPronto` que desmonte o bloco: quem fecha o assunto
                // é o próprio componente, com o "obrigado". Desmontando
                // aqui, a pessoa clicava em enviar e o bloco sumia sem dizer
                // nada — parece que a avaliação se perdeu.
                obterChave={() => chaveParaNota.current || chave.current}
              />
            )}
          </div>
        )}

        <div ref={fim} />
      </div>

      {falhou && (
        <p className="border-t border-contorno bg-fundo-alt px-4 py-2.5 text-xs leading-relaxed text-tinta/60">
          A mensagem não foi. Tente de novo, ou chame no WhatsApp (83)
          99106-0691.
        </p>
      )}

      {pedindoFicha ? (
        <FichaDeContato
          // Passada como função, e não como valor: ler `ref.current` durante
          // o desenho entrega o que havia no desenho anterior, e a chave pode
          // ter acabado de nascer na primeira mensagem.
          obterChave={() => chave.current}
          salvos={dadosSalvos}
          onPronto={() => {
            setTemFicha(true);
            void buscar();
          }}
        />
      ) : (
        <form
          onSubmit={enviar}
          className="flex items-center gap-2 border-t border-contorno px-3 py-3"
        >
          <input
            ref={campo}
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            maxLength={1000}
            placeholder="Escreva sua dúvida"
            aria-label="Sua mensagem"
            className="min-h-11 flex-1 rounded-xl border border-contorno bg-fundo-alt px-3.5 text-sm text-tinta outline-none transition-colors duration-300 placeholder:text-tinta/35 focus:border-salmon"
          />

          <button
            type="submit"
            disabled={enviando || !rascunho.trim()}
            aria-label="Enviar mensagem"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-salmon text-preto transition-opacity duration-300 disabled:opacity-35"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
}

/* ---------------- A avaliação ---------------- */

/**
 * Cinco estrelas e um comentário opcional.
 *
 * ---------- Por que o comentário é opcional ----------
 *
 * Porque exigir texto reduz a amostra a quem tinha o que reclamar. A nota
 * sozinha já serve para comparar uma semana com a outra; o comentário é
 * bônus de quem quis explicar.
 *
 * ---------- Por que envia no clique da estrela ----------
 *
 * Uma estrela clicada já é a resposta. Pedir um segundo clique em "enviar"
 * perde gente no meio do caminho — e quem quiser escrever algo ainda tem o
 * campo, que aparece depois da nota.
 */
function Avaliacao({
  titulo,
  obterChave,
}: {
  titulo: string;
  obterChave: () => string;
}) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);

  async function mandar(valor: number, texto: string) {
    try {
      await fetch("/api/chat/avaliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ chave: obterChave(), nota: valor, comentario: texto }),
      });
    } catch {
      // Avaliação é bônus: falhar aqui não pode virar erro na cara de quem
      // acabou de ser bem atendido.
    }
  }

  if (enviado) {
    return (
      <p className="mt-3 text-center text-xs text-tinta/45">
        Obrigado pela avaliação.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-center text-xs text-tinta/55">
        {titulo}
      </p>

      <div className="mt-2 flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => {
              setNota(valor);
              void mandar(valor, "");
              tocar("convite");
            }}
            aria-label={`${valor} ${valor === 1 ? "estrela" : "estrelas"}`}
            aria-pressed={valor <= nota}
            className="p-1 transition-transform duration-200 hover:scale-110"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              // Preenchida até a nota escolhida, vazia depois: é como se lê
              // uma nota sem precisar de legenda.
              fill={valor <= nota ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
              className={`h-6 w-6 ${valor <= nota ? "text-salmon" : "text-tinta/30"}`}
            >
              <path d="m12 3 2.6 5.6 6.4.8-4.7 4.3 1.2 6.3L12 17l-5.5 3 1.2-6.3L3 9.4l6.4-.8z" />
            </svg>
          </button>
        ))}
      </div>

      {nota > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void mandar(nota, comentario.trim());
            setEnviado(true);
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={500}
            placeholder="Quer contar o porquê? (opcional)"
            aria-label="Comentário sobre o atendimento"
            className="min-h-11 flex-1 rounded-xl border border-contorno bg-fundo-alt px-3.5 text-sm text-tinta outline-none transition-colors duration-300 placeholder:text-tinta/35 focus:border-salmon"
          />
          <button
            type="submit"
            className="min-h-11 shrink-0 rounded-xl border border-contorno px-4 text-sm text-tinta/70 transition-colors duration-300 hover:text-tinta"
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}

/* ---------------- A ficha ---------------- */

/**
 * Nome e sobrenome, WhatsApp e e-mail, os três obrigatórios.
 *
 * ---------- Por que campos, e não o assistente perguntando ----------
 *
 * Perguntado em conversa, o dado chega torto: "João" sem sobrenome, telefone
 * sem DDD, e-mail com espaço no meio. Em campos, o navegador já cobra o que
 * falta antes de mandar, o teclado do celular vira numérico no telefone, e o
 * que chega ao CRM é um dado em vez de um palpite.
 */
function FichaDeContato({
  obterChave,
  salvos,
  onPronto,
}: {
  obterChave: () => string;
  salvos: DadosSalvos | null;
  onPronto: () => void;
}) {
  const [nome, setNome] = useState(salvos?.nome ?? "");
  const [whatsapp, setWhatsapp] = useState(salvos?.whatsapp ?? "");
  const [email, setEmail] = useState(salvos?.email ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  // Marcado por padrão, e dito com todas as letras ao lado.
  //
  // Quem já pediu para guardar na vez passada chega com os campos cheios e
  // só confirma; quem não quer, desmarca uma vez e nunca mais vê os dados
  // voltarem. Guardar nada é o oposto de um site que lembra de você.
  const [guardarDados, setGuardarDados] = useState(true);

  async function mandar(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    // As mesmas três checagens do servidor, aqui para avisar sem ida e
    // volta. A que vale é a de lá — esta é cortesia com quem digita.
    if (nome.trim().split(/\s+/).filter((p) => p.length > 1).length < 2) {
      setErro("Escreva nome e sobrenome.");
      return;
    }
    const digitos = whatsapp.replace(/\D/g, "");
    if (digitos.length < 10 || digitos.length > 13) {
      setErro("O WhatsApp precisa do DDD.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErro("Confira o e-mail.");
      return;
    }

    setErro("");
    setEnviando(true);

    try {
      const resposta = await fetch("/api/chat/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          chave: obterChave(),
          nome: nome.trim(),
          whatsapp,
          email: email.trim(),
        }),
      });

      if (!resposta.ok) {
        setErro("Não deu para enviar. Tente de novo.");
        return;
      }

      // Guardado só no navegador dela, e só se ela quis. O servidor já tem
      // os mesmos dados na conversa — isto não espalha informação, apenas
      // evita cobrar duas vezes a mesma coisa da mesma pessoa.
      try {
        if (guardarDados) {
          localStorage.setItem(
            GUARDA_DADOS,
            JSON.stringify({ nome: nome.trim(), whatsapp, email: email.trim() })
          );
        } else {
          localStorage.removeItem(GUARDA_DADOS);
        }
      } catch {
        // Aba privada: vale para esta visita, e pronto.
      }

      tocar("mensagem");
      onPronto();
    } catch {
      setErro("Não deu para enviar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={mandar} className="border-t border-contorno px-4 py-4">
      <p className="text-xs leading-relaxed text-tinta/55">
        Deixe seus dados que a equipe te procura. Respondemos aqui mesmo e no
        seu WhatsApp.
      </p>

      <div className="mt-3 grid gap-2">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          autoComplete="name"
          maxLength={120}
          placeholder="Nome e sobrenome"
          aria-label="Nome e sobrenome"
          className="min-h-11 rounded-xl border border-contorno bg-fundo-alt px-3.5 text-sm text-tinta outline-none transition-colors duration-300 placeholder:text-tinta/35 focus:border-salmon"
        />

        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          required
          // `tel` e não `number`: no celular abre o teclado de telefone, e
          // ainda aceita parênteses e traço de quem cola o número formatado.
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={25}
          placeholder="WhatsApp com DDD"
          aria-label="WhatsApp com DDD"
          className="min-h-11 rounded-xl border border-contorno bg-fundo-alt px-3.5 text-sm text-tinta outline-none transition-colors duration-300 placeholder:text-tinta/35 focus:border-salmon"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={160}
          placeholder="E-mail"
          aria-label="E-mail"
          className="min-h-11 rounded-xl border border-contorno bg-fundo-alt px-3.5 text-sm text-tinta outline-none transition-colors duration-300 placeholder:text-tinta/35 focus:border-salmon"
        />
      </div>

      <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-tinta/50">
        <input
          type="checkbox"
          checked={guardarDados}
          onChange={(e) => setGuardarDados(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--salmon)]"
        />
        Salvar meus dados neste navegador para a próxima conversa
      </label>

      {/* O horário dito aqui, no momento em que ele passa a importar.

          Antes disso é informação solta; aqui a pessoa acabou de pedir para
          falar com gente, e saber quando essa gente trabalha é a diferença
          entre esperar tranquila e achar que foi ignorada. */}
      <p className="mt-2 text-[0.7rem] leading-relaxed text-tinta/35">
        Equipe de segunda a sexta, 8h30 às 11h30 e 14h às 17h. O assistente
        responde a qualquer hora.
      </p>

      {erro && <p className="mt-2 text-xs text-destaque">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-salmon text-sm font-medium text-preto transition-opacity duration-300 disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Pedir atendimento"}
      </button>
    </form>
  );
}
