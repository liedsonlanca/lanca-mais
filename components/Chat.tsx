"use client";

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
  const [falhou, setFalhou] = useState(false);

  // A preferência de som é lida de onde ela mora, e não copiada para cá.
  //
  // O terceiro argumento é o que o servidor devolve ao montar o HTML: lá não
  // existe armazenamento de navegador, e "com som" é o padrão. Sem ele, o
  // React acusaria diferença entre o HTML do servidor e o primeiro desenho
  // no navegador.
  const comSom = useSyncExternalStore(assinarSom, somLigado, () => true);

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
        novas: Mensagem[];
      };

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
        minha?: number;
        respostas?: Mensagem[];
      };

      if (!resposta.ok || !dados.ok) {
        setFalhou(true);
        return;
      }

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
            {estado === "fechada"
              ? "Atendimento encerrado."
              : estado === "equipe"
                ? "A equipe foi avisada e responde por aqui."
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
        {estado === "fechada" && (
          <p
            role="status"
            className="mt-4 border-t border-contorno pt-4 text-center text-xs leading-relaxed text-tinta/45"
          >
            A equipe encerrou este atendimento.
            <br />
            Se precisar de mais alguma coisa, é só escrever aqui embaixo — a
            gente começa uma conversa nova, sem você repetir seus dados.
          </p>
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
  onPronto,
}: {
  obterChave: () => string;
  onPronto: () => void;
}) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

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
