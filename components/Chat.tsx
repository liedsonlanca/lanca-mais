"use client";

import { usePathname } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { assinarSom, guardarSom, somLigado, tocar } from "@/lib/som";
import { siteConfig } from "@/lib/site-config";
import AnexoDaMensagem from "@/components/AnexoDaMensagem";

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
// Mas só enquanto o atendimento está aberto. Encerrado, o navegador esquece
// tudo: a chave, as mensagens e os dados. A próxima conversa começa do zero
// e pede os dados de novo — foi o que a agência pediu, e é o certo num
// computador que mais de uma pessoa usa.
//
// Armazenamento pode falhar: aba privada, site bloqueado. Toda leitura e
// escrita vão em try/catch, e sem ele o chat funciona igual, só não lembra.

type Autor = "cliente" | "assistente" | "equipe";

type Mensagem = {
  id: number;
  autor: Autor;
  texto: string;
  /** Quando foi gravada, em ISO. Ausente na saudação, que não é gravada. */
  quando?: string;
  /** Quem da equipe escreveu. */
  autorNome?: string;
  anexoUrl?: string;
  anexoTipo?: string;
};

/** A hora da mensagem, no relógio de quem lê. */
function hora(quando?: string) {
  if (!quando) return "";
  const data = new Date(quando);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** De quanto em quanto tempo, no máximo, o "digitando…" é renovado. */
const SINAL_DIGITANDO_MS = 3000;

const GUARDA = "lanca:chat";
const GUARDA_CONVITE = "lanca:chat-convite";

/**
 * Onde versões antigas do chat guardavam nome, WhatsApp e e-mail.
 *
 * O chat não guarda mais nada disso. A chave continua aqui só para apagar o
 * que tiver ficado de antes, na primeira visita depois da mudança.
 */
const GUARDA_DADOS = "lanca:chat-dados";

/** O contato da pessoa nesta conversa, só em memória, para o link do WhatsApp. */
type Contato = { nome: string; email: string };

/**
 * O link do WhatsApp com a mensagem já escrita.
 *
 * Nome, e-mail e assunto vão no texto para quem atende no WhatsApp não
 * começar perguntando o que a pessoa já disse no chat. Cada linha só entra
 * se houver o dado: mensagem com "Nome: " em branco parece formulário
 * quebrado.
 */
function linkDoWhatsApp(contato: Contato | null, assunto: string) {
  const linhas = ["Olá! Vim pelo chat do site da LANÇA+."];
  if (contato?.nome) linhas.push(`Nome: ${contato.nome}`);
  if (contato?.email) linhas.push(`E-mail: ${contato.email}`);
  if (assunto) linhas.push(`Assunto: ${assunto}`);
  if (linhas.length === 1) linhas.push("Gostaria de falar com a equipe.");
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(linhas.join("\n"))}`;
}

const LINK_DO_INSTAGRAM = `https://www.instagram.com/${siteConfig.instagram.replace(/^@/, "")}/`;

const SAUDACAO: Mensagem = {
  id: 0,
  autor: "assistente",
  texto:
    "Oi! Sou o atendimento da LANÇA+. Pode perguntar sobre os serviços, " +
    "como o trabalho começa ou o que a gente faz — e se precisar falar com " +
    "a equipe, eu chamo.",
};

/** De quanto em quanto tempo a página pergunta se chegou resposta. */
const ESPERANDO_EQUIPE_MS = 3000;
const CONVERSA_NORMAL_MS = 20000;

/**
 * De quanto em quanto tempo o chat fechado pergunta se chegou resposta.
 *
 * Mais lento que o aberto de proposito: ninguem esta olhando, e o unico
 * efeito de uma resposta aqui e acender o aviso no balao. Meio minuto e
 * tempo de sobra para quem voltou a ler a pagina perceber.
 */
const FECHADO_MS = 30000;

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

  /**
   * O nome, pedido antes da primeira mensagem.
   *
   * `nome` é o que a pessoa disse nesta página; `temNome` é o servidor
   * dizendo que a conversa já tem um (quem recarregou no meio da conversa
   * não precisa dizer de novo). Vai junto com a primeira mensagem, e é o que
   * faz a conversa aparecer no painel com o nome da pessoa, e não como
   * "Visitante sem nome".
   */
  const [nome, setNome] = useState("");
  const [temNome, setTemNome] = useState(false);
  const [avaliada, setAvaliada] = useState(false);

  /** Nome e e-mail desta conversa, depois da ficha. Nunca vão para o armazenamento. */
  const [contato, setContato] = useState<Contato | null>(null);

  /** Acabou de avaliar e recomeçar: um obrigado no topo da conversa nova. */
  const [agradecido, setAgradecido] = useState(false);

  const [encerrando, setEncerrando] = useState(false);

  /** Quantas mensagens chegaram enquanto o balao estava fechado. */
  const [naoLidas, setNaoLidas] = useState(0);

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

  /** Alguém da equipe está escrevendo agora. */
  const [equipeDigitando, setEquipeDigitando] = useState(false);

  /** A equipe já abriu a conversa depois da última mensagem da pessoa. */
  const [vistoPelaEquipe, setVistoPelaEquipe] = useState(false);

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

  /** O piso: ids até aqui não entram mais na tela. */
  const pisoDeId = useRef(0);

  /** Se esta carga de página já leu a conversa do servidor uma vez. */
  const jaCarregou = useRef(false);

  /**
   * A conversa veio pelo link do e-mail ("Continuar a conversa"). Aí a
   * pessoa quer ver a resposta, mesmo que o atendimento já tenha encerrado
   * enquanto ela estava fora — a regra de recomeçar do zero não vale.
   */
  const veioPorLink = useRef(false);

  const seletorDeArquivo = useRef<HTMLInputElement | null>(null);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [erroArquivo, setErroArquivo] = useState("");

  /** Quando o "digitando…" foi mandado pela última vez. */
  const ultimoSinal = useRef(0);

  /** Quando a última busca saiu, para espaçar as de aba escondida. */
  const ultimaBusca = useRef(0);

  /**
   * Esquece a conversa inteira e volta à saudação.
   *
   * Roda depois da avaliação, e ao reabrir a página com o atendimento já
   * encerrado. Apaga a chave do navegador: sem ela, a próxima mensagem abre
   * uma conversa nova no servidor, sem nome, WhatsApp nem e-mail da anterior.
   */
  const limpar = useCallback(() => {
    try {
      localStorage.removeItem(GUARDA);
      localStorage.removeItem(GUARDA_DADOS);
    } catch {
      // Sem armazenamento, não havia o que apagar.
    }
    chave.current = "";
    pisoDeId.current = 0;
    jaCarregou.current = false;
    setMensagens([SAUDACAO]);
    setEstado("assistente");
    setTemFicha(false);
    setNome("");
    setTemNome(false);
    setAvaliada(false);
    setContato(null);
    setFalhou(false);
    setNaoLidas(0);
    setEquipeDigitando(false);
    setVistoPelaEquipe(false);
  }, []);

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
    ultimaBusca.current = Date.now();

    try {
      const desde = Math.max(ultima, pisoDeId.current);

      // "Lendo" só com o balão aberto e a aba à vista: é o que acende o
      // "visto" no painel, e marcar isso com o chat fechado seria dizer à
      // equipe que a pessoa leu o que nem apareceu na tela dela.
      const lendo = aberto && !document.hidden ? "&lendo=1" : "";

      const resposta = await fetch(
        `/api/chat?chave=${chave.current}&depois=${desde}${lendo}`,
        { cache: "no-store" }
      );
      if (!resposta.ok) return;

      const dados = (await resposta.json()) as {
        estado: "assistente" | "equipe" | "fechada" | null;
        temFicha?: boolean;
        temNome?: boolean;
        avaliada?: boolean;
        equipeDigitando?: boolean;
        vistoPelaEquipe?: boolean;
        expediente?: { aberto: boolean; volta: string };
        novas: Mensagem[];
      };

      if (dados.expediente) setExpediente(dados.expediente);
      setEquipeDigitando(Boolean(dados.equipeDigitando));
      setVistoPelaEquipe(Boolean(dados.vistoPelaEquipe));

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

      /* ---------- Reabriu a página depois de encerrado: começa do zero ----------
       *
       * Atendimento findo é assunto findo. A pessoa saiu da página com a
       * conversa encerrada, então volta para uma conversa nova, sem o
       * histórico e sem os dados de antes.
       *
       * Só na primeira leitura desta carga de página: se a equipe encerrar
       * com o chat aberto na frente da pessoa, ela vê o aviso e a avaliação,
       * que é o certo.
       */
      if (primeiraLeitura && dados.estado === "fechada" && !veioPorLink.current) {
        limpar();
        return;
      }

      if (dados.estado) {
        // O encerramento também é notícia que vem de fora, então apita como
        // uma mensagem apita. A comparação fica aqui, e não dentro do
        // `setEstado`: função de atualização tem de ser pura, e o React pode
        // chamá-la duas vezes em desenvolvimento — o bipe sairia dobrado.
        if (dados.estado === "fechada" && estado !== "fechada") {
          tocar("mensagem");
        }
        setEstado(dados.estado);
      }

      if (typeof dados.temFicha === "boolean") setTemFicha(dados.temFicha);
      if (typeof dados.temNome === "boolean" && dados.temNome) setTemNome(true);

      // Chegou resposta com o balão fechado: acende o aviso.
      //
      // Sem isto, a equipe respondia e a pessoa não ficava sabendo — a
      // mensagem esperava dentro de um balão fechado que não dá sinal
      // nenhum, e quem respondeu fica achando que foi ignorado.
      //
      // Só conta o que veio de fora: a própria mensagem da pessoa, enviada
      // antes de ela fechar, não é novidade para ela.
      //
      // Vale também para o chat aberto numa aba escondida: aí quem avisa é o
      // título da aba (ver o efeito do título, mais abaixo).
      if (!aberto || document.hidden) {
        const deFora = novas.filter((m) => m.autor !== "cliente").length;
        if (deFora > 0) setNaoLidas((n) => n + deFora);
      }

      juntar(novas);
    } catch {
      // Rede instável: a próxima rodada tenta de novo.
    }
  }, [aberto, estado, juntar, limpar, ultima]);

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

  // A chave é lida assim que a página monta, e não só ao abrir o balão.
  //
  // É o que permite escutar de balão fechado: sem a chave em mãos não há o
  // que perguntar ao servidor, e a resposta da equipe só apareceria se a
  // pessoa abrisse o chat por conta própria — justamente o que ela não vai
  // fazer, porque nada a avisou.
  useEffect(() => {
    // Chegou pelo link do e-mail: a conversa do link passa a ser a desta
    // página, o chat abre sozinho e o código sai da barra de endereço (para
    // não ficar no histórico nem ir junto num link copiado).
    const doLink = new URLSearchParams(window.location.search)
      .get("conversa")
      ?.replace(/[^a-f0-9]/g, "");
    if (doLink && doLink.length === 32) {
      guardar(GUARDA, doLink);
      guardar(GUARDA_CONVITE, "visto");
      veioPorLink.current = true;
      const limpa = new URL(window.location.href);
      limpa.searchParams.delete("conversa");
      window.history.replaceState(null, "", limpa.toString());
      // No quadro seguinte, e não no meio da montagem: abrir dispara a
      // leitura da conversa, que precisa da chave já guardada acima.
      requestAnimationFrame(() => setAberto(true));
    }

    chave.current = ler(GUARDA);

    // Dados de contato que versões antigas do chat deixavam guardados.
    try {
      localStorage.removeItem(GUARDA_DADOS);
    } catch {
      // Nada a apagar.
    }

    // E pergunta uma vez na hora, sem esperar a primeira rodada do relógio.
    //
    // Quem volta ao site depois de a equipe ter respondido veria o aviso
    // meio minuto depois de a página abrir — e meio minuto é tempo de a
    // pessoa já ter rolado, lido e ido embora.
    if (chave.current) void buscar();
    // Só na montagem: `buscar` muda de identidade a cada mensagem, e
    // incluí-lo aqui faria a conversa ser pedida de novo a cada troca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // Mais rápida enquanto se espera a equipe, lenta no resto, e mais lenta
  // ainda de balão fechado: o minuto em que alguém digita a resposta é o
  // único em que meio segundo importa, e com o balão fechado o efeito de uma
  // resposta é só acender um aviso.
  useEffect(() => {
    if (!chave.current) return;

    const intervalo = !aberto
      ? FECHADO_MS
      : estado === "equipe"
        ? ESPERANDO_EQUIPE_MS
        : CONVERSA_NORMAL_MS;

    const relogio = setInterval(() => {
      // Aba escondida pergunta devagar, de meio em meio minuto, e não para:
      // é o que deixa o título da aba avisar "(1) Nova mensagem" a quem foi
      // ler outra coisa enquanto esperava a equipe. Parando de vez, a
      // resposta chegava e ninguém ficava sabendo.
      if (
        document.hidden &&
        Date.now() - ultimaBusca.current < FECHADO_MS
      ) {
        return;
      }
      void buscar();
    }, intervalo);

    return () => clearInterval(relogio);
  }, [aberto, buscar, estado]);

  // O título da aba pisca com mensagem nova, como nos chats de atendimento.
  //
  // É o único aviso que alcança quem trocou de aba: o balão e o número só
  // existem dentro da página. Alterna com o título original a cada segundo
  // e meio, e devolve o original assim que a pessoa volta e lê.
  useEffect(() => {
    if (naoLidas === 0) return;

    const original = document.title;
    const alerta =
      naoLidas === 1 ? "(1) Nova mensagem · LANÇA+" : `(${naoLidas}) Novas mensagens · LANÇA+`;
    let ligado = false;

    const relogio = setInterval(() => {
      ligado = !ligado;
      document.title = ligado ? alerta : original;
    }, 1500);

    return () => {
      clearInterval(relogio);
      document.title = original;
    };
  }, [naoLidas]);

  // Voltou à aba com o chat aberto: leu. O aviso apaga e o "visto" segue
  // para a equipe na hora, sem esperar a próxima rodada.
  useEffect(() => {
    function aoVoltar() {
      if (document.hidden || !aberto) return;
      setNaoLidas(0);
      void buscar();
    }
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [aberto, buscar]);

  // Disse o nome: o cursor vai direto para o campo da primeira pergunta.
  useEffect(() => {
    if (nome) campo.current?.focus();
  }, [nome]);

  // Rola para o fim quando chega mensagem, e quando o atendimento encerra: o
  // aviso de encerramento entra no fim da lista, e sem rolar ele ficava
  // escondido até a pessoa descer por conta própria.
  useEffect(() => {
    if (aberto) fim.current?.scrollIntoView({ block: "end" });
  }, [aberto, mensagens, enviando, estado, equipeDigitando]);

  function abrir() {
    setConvidando(false);
    guardar(GUARDA_CONVITE, "visto");

    // Abriu, leu: o aviso de mensagem nova perde a razão de existir no
    // mesmo instante.
    setNaoLidas(0);
    setAberto(true);
  }

  function trocarSom() {
    const novo = !comSom;
    guardarSom(novo);
    // Toca ao ligar, para a pessoa ouvir o que acabou de escolher.
    if (novo) tocar("mensagem");
  }

  /**
   * Avisa a equipe de que a pessoa está escrevendo.
   *
   * Só com a conversa na equipe (com o assistente não há ninguém olhando), e
   * no máximo a cada três segundos: o sinal vale por seis no servidor, então
   * quem digita sem parar fica com o "digitando…" aceso sem uma chamada por
   * tecla.
   */
  function sinalizarDigitando() {
    if (estado !== "equipe" || !chave.current) return;
    const agora = Date.now();
    if (agora - ultimoSinal.current < SINAL_DIGITANDO_MS) return;
    ultimoSinal.current = agora;
    void fetch("/api/chat/digitando", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ chave: chave.current }),
    }).catch(() => {});
  }

  /** Manda uma imagem ou PDF. Só com a equipe na conversa. */
  async function anexar(arquivo: File) {
    if (!chave.current) return;
    setErroArquivo("");
    if (arquivo.size > 4 * 1024 * 1024) {
      setErroArquivo("Arquivo grande demais. O limite é 4 MB.");
      return;
    }
    setEnviandoArquivo(true);
    try {
      const dados = new FormData();
      dados.set("chave", chave.current);
      dados.set("arquivo", arquivo);
      const resposta = await fetch("/api/chat/anexo", { method: "POST", body: dados });
      const corpo = (await resposta.json().catch(() => ({}))) as {
        ok?: boolean;
        erro?: string;
        mensagem?: Mensagem;
      };
      if (!resposta.ok || !corpo.ok) {
        setErroArquivo(corpo.erro ?? "O arquivo não foi. Tente de novo.");
        return;
      }
      if (corpo.mensagem) juntar([corpo.mensagem]);
      setVistoPelaEquipe(false);
    } catch {
      setErroArquivo("O arquivo não foi. Tente de novo.");
    } finally {
      setEnviandoArquivo(false);
      if (seletorDeArquivo.current) seletorDeArquivo.current.value = "";
    }
  }

  /** O visitante encerra a conversa: vem a avaliação, depois o recomeço. */
  async function encerrar() {
    if (!chave.current || encerrando) return;
    setEncerrando(true);
    try {
      const resposta = await fetch("/api/chat/encerrar", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ chave: chave.current }),
      });
      if (resposta.ok) {
        setEstado("fechada");
        setAvaliada(false);
        void buscar();
      } else {
        setFalhou(true);
      }
    } catch {
      setFalhou(true);
    } finally {
      setEncerrando(false);
    }
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
      {
        id: provisorio,
        autor: "cliente",
        texto: pergunta,
        quando: new Date().toISOString(),
      },
    ]);
    setVistoPelaEquipe(false);

    try {
      const resposta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          chave: chave.current,
          texto: pergunta,
          // Em toda mensagem, e não só na primeira: o servidor só grava se a
          // conversa ainda não tiver nome, e assim um envio que falhou não
          // deixa a conversa sem ele.
          nome: nome || undefined,
        }),
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

      setAgradecido(false);

      if (dados.chave) {
        // A conversa nasceu (ou continua) nesta página: a próxima leitura
        // não é a "primeira" de uma página reaberta. Sem isto, encerrar logo
        // depois caía na regra de quem reabre a página com a conversa já
        // encerrada, e o chat recomeçava sem pedir a avaliação.
        jaCarregou.current = true;
        chave.current = dados.chave;
        guardar(GUARDA, dados.chave);
      }

      if (dados.novaConversa) {
        // O atendimento anterior tinha sido encerrado, e esta mensagem abriu
        // outra conversa. A tela recomeça: deixar o histórico antigo em cima
        // faria a pessoa achar que a equipe continua lendo aquilo, e no
        // painel aquilo é outro assunto, já fechado.
        setMensagens([
          SAUDACAO,
          {
            id: dados.minha ?? provisorio,
            autor: "cliente",
            texto: pergunta,
            quando: new Date().toISOString(),
          },
        ]);

        // A conversa é outra: o piso e os dados eram do atendimento anterior.
        pisoDeId.current = 0;
        setContato(null);
      } else if (dados.minha) {
        // Troca o id provisório pelo do banco, senão a busca periódica traria
        // a mesma mensagem de novo e ela apareceria duas vezes.
        setMensagens((atuais) =>
          atuais.map((m) => (m.id === provisorio ? { ...m, id: dados.minha! } : m))
        );
      }

      if (dados.estado) setEstado(dados.estado);
      if (typeof dados.temFicha === "boolean") setTemFicha(dados.temFicha);
      if (nome) setTemNome(true);
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
      // z-[105] e nao z-50: a tela de "em breve" e a de manutencao sao capas
      // `fixed inset-0 z-[100]` que cobrem a janela inteira. Em z-50 o balao
      // ficava desenhado atras delas — visivel, e sem receber clique nenhum.
      //
      // Abaixo do aviso de cookies, que mora em z-[110]: consentimento vem
      // antes de conversa, e um chat por cima do aviso seria o site pedindo
      // permissao com a mao na frente do papel.
      <div className="fixed bottom-24 right-6 z-[105] flex items-center gap-2">
        {(convidando || naoLidas > 0) && (
          <>
            {/* O convite abre à esquerda do balão, e não acima: acima ele
                cobriria o botão do WhatsApp, que é o atalho que mais gente
                usa.

                Com mensagem nova, o recado deixa de ser convite e passa a
                ser notícia — e notícia não depende de nenhuma regra de
                tempo: ela aparece na hora em que chega. */}
            <button
              type="button"
              onClick={abrir}
              className="convite-do-chat max-w-[min(14rem,calc(100vw-7rem))] rounded-2xl rounded-br-md border border-contorno bg-cartao px-3.5 py-2.5 text-left text-sm leading-snug text-tinta shadow-lg shadow-preto/20"
            >
              {naoLidas > 0
                ? naoLidas === 1
                  ? "Nova mensagem da LANÇA+"
                  : `${naoLidas} mensagens novas`
                : "Fale com a nossa equipe!"}
            </button>

            <button
              type="button"
              onClick={() => {
                setConvidando(false);
                guardar(GUARDA_CONVITE, "visto");
                // Dispensar também apaga o aviso de mensagem nova: quem
                // fecha o recado está dizendo que viu.
                setNaoLidas(0);
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
          aria-label={
            naoLidas > 0
              ? `Conversa com a LANÇA+: ${naoLidas} ${naoLidas === 1 ? "mensagem nova" : "mensagens novas"}`
              : "Abrir conversa com a LANÇA+"
          }
          // Acima do botão do WhatsApp, e não ao lado: lado a lado, os dois
          // disputam o canto e nenhum fica onde o dedo já procura.
          className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-contorno bg-cartao text-tinta shadow-lg shadow-preto/20 transition-transform duration-300 hover:scale-105 ${
            convidando || naoLidas > 0 ? "balao-chamando" : ""
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

          {/* O número, e não só um ponto.

              Um ponto diz "tem algo"; o número diz quanto, e a diferença
              entre uma e quatro mensagens esperando muda se a pessoa abre
              agora ou depois. Acima de nove vira "9+", porque o que importa
              daí em diante é "bastante". */}
          {naoLidas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-salmon px-1 text-[0.65rem] font-semibold text-preto">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </button>
      </div>
    );
  }

  /* ---------------- O chat aberto ---------------- */

  const pedindoFicha = estado === "equipe" && !temFicha;

  // Encerrado e sem nota: a avaliação toma o lugar do campo de mensagem.
  //
  // Ela ficava no fim da lista, visível só rolando, e o campo continuava
  // ali embaixo — a pessoa escrevia por cima de um atendimento encerrado sem
  // nem ver que havia uma pergunta. No rodapé ela é a única coisa a fazer.
  const aguardandoNota = estado === "fechada" && !avaliada;

  const assunto =
    mensagens.find((m) => m.autor === "cliente")?.texto.slice(0, 140) ?? "";
  const whatsapp = linkDoWhatsApp(
    contato ?? (nome ? { nome, email: "" } : null),
    assunto
  );

  // Sem nome, a conversa não começa: o campo de mensagem só aparece depois.
  const pedindoNome = estado !== "fechada" && !temNome && !nome;
  const primeiroNome = nome.split(/\s+/)[0];
  const conversando =
    estado !== "fechada" && mensagens.some((m) => m.autor === "cliente");
  const ultimaDoCliente = mensagens.reduce(
    (maior, m) => (m.autor === "cliente" ? Math.max(maior, m.id) : maior),
    0
  );

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
      // No telefone ele encosta mais na borda: 24px de margem de cada lado
      // num aparelho estreito sao 48px perdidos de uma tela que ja e pequena.
      className="altura-do-chat fixed bottom-4 right-4 z-[106] flex w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-contorno bg-cartao shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] sm:bottom-6 sm:right-6"
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

        <div className="-mr-1 -mt-1 flex shrink-0 items-center">
          {conversando && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Encerrar este atendimento?")) void encerrar();
              }}
              disabled={encerrando}
              className="mr-1 min-h-9 rounded-xl px-2 text-xs text-tinta/50 transition-colors duration-300 hover:bg-fundo-alt hover:text-tinta disabled:opacity-50"
            >
              {encerrando ? "Encerrando…" : "Encerrar"}
            </button>
          )}

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

      {/* Os canais, sempre à mão.

          O WhatsApp vai com a mensagem pronta — nome, e-mail e o assunto que
          a pessoa trouxe para o chat —, para quem atende lá não recomeçar
          do zero. */}
      <div className="flex gap-2 border-b border-contorno px-4 py-2">
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-contorno px-3 text-xs text-tinta/70 transition-colors duration-300 hover:border-salmon hover:text-tinta"
        >
          <IconeWhatsApp />
          WhatsApp
        </a>
        <a
          href={LINK_DO_INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-contorno px-3 text-xs text-tinta/70 transition-colors duration-300 hover:border-salmon hover:text-tinta"
        >
          <IconeInstagram />
          Instagram
        </a>
      </div>

      {/* aria-live para quem usa leitor de tela ouvir a resposta chegar, em
          vez de ter de voltar e varrer a lista procurando o que mudou. */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        aria-live="polite"
        aria-atomic="false"
      >
        {agradecido && (
          <p role="status" className="mb-3 text-center text-xs text-tinta/45">
            Obrigado pela avaliação! Esta é uma conversa nova.
          </p>
        )}

        <ul className="grid gap-3">
          {mensagens.map((m, i) => (
            <Fragment key={m.id}>
            <li
              className={
                m.autor === "cliente"
                  ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-salmon/15 px-3.5 py-2.5"
                  : "mr-auto max-w-[85%] rounded-2xl rounded-bl-md bg-fundo-alt px-3.5 py-2.5"
              }
            >
              {m.autor === "equipe" && (
                <p className="mb-1 text-[0.7rem] font-medium text-destaque">
                  {/* Com nome, a resposta tem rosto: "Liédson · LANÇA+". */}
                  {m.autorNome
                    ? `${m.autorNome.split(/\s+/)[0]} · LANÇA+`
                    : "Equipe LANÇA+"}
                </p>
              )}
              {m.anexoUrl ? (
                <AnexoDaMensagem
                  url={m.anexoUrl}
                  tipo={m.anexoTipo ?? ""}
                  nome={m.texto}
                />
              ) : (
                <p className="whitespace-pre-line text-sm leading-relaxed text-tinta/85">
                  {m.texto}
                </p>
              )}

              {/* A hora, e o "visto" na última mensagem da pessoa.

                  O visto só existe com a conversa na equipe: é a resposta à
                  pergunta "alguém leu?", que com o assistente não se faz —
                  ele responde na hora. */}
              {(m.quando || m.id < 0) && (
                <p
                  className={`mt-1 text-[0.65rem] text-tinta/35 ${
                    m.autor === "cliente" ? "text-right" : ""
                  }`}
                >
                  {m.id < 0 ? "Enviando…" : hora(m.quando)}
                  {m.autor === "cliente" &&
                    m.id === ultimaDoCliente &&
                    estado === "equipe" &&
                    vistoPelaEquipe &&
                    " · Visto"}
                </p>
              )}

              {/* Falou em WhatsApp, entrega o botão.

                  O número escrito no texto obriga a pessoa a copiar, trocar
                  de aplicativo e colar. O botão abre a conversa direto, com a
                  mensagem já escrita. */}
              {m.autor !== "cliente" && /whatsapp/i.test(m.texto) && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-salmon px-3 text-xs font-medium text-preto transition-opacity duration-300 hover:opacity-90"
                >
                  <IconeWhatsApp />
                  Chamar no WhatsApp
                </a>
              )}
            </li>

            {/* A resposta ao nome, logo abaixo da saudação: a pessoa disse
                como se chama e a conversa começa chamando-a assim. Escrita
                aqui, e não gravada — como a saudação, não precisa pensar. */}
            {i === 0 && primeiroNome && (
              <li className="mr-auto max-w-[85%] rounded-2xl rounded-bl-md bg-fundo-alt px-3.5 py-2.5">
                <p className="text-sm leading-relaxed text-tinta/85">
                  Prazer, {primeiroNome}! Como posso te ajudar?
                </p>
              </li>
            )}
            </Fragment>
          ))}

          {/* A equipe escrevendo: o mesmo balão de três pontos do
              assistente, com o nome de quem escreve. */}
          {!enviando && estado === "equipe" && equipeDigitando && (
            <li className="mr-auto rounded-2xl rounded-bl-md bg-fundo-alt px-3.5 py-2.5">
              <p className="mb-1 text-[0.7rem] font-medium text-destaque">
                Equipe LANÇA+
              </p>
              <span className="flex items-center gap-1" aria-label="A equipe está digitando">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tinta/40 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tinta/40 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-tinta/40 [animation-delay:300ms]" />
              </span>
            </li>
          )}

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
            Este atendimento foi encerrado.
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

      {estado === "fechada" ? (
        aguardandoNota ? (
          <div className="border-t border-contorno px-4 pb-4">
            <Avaliacao
              titulo="Como foi o atendimento?"
              obterChave={() => chave.current}
              onConcluir={() => {
                limpar();
                setAgradecido(true);
              }}
            />
          </div>
        ) : (
          <div className="border-t border-contorno px-4 py-3">
            <button
              type="button"
              onClick={limpar}
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-salmon text-sm font-medium text-preto"
            >
              Começar nova conversa
            </button>
          </div>
        )
      ) : pedindoNome ? (
        <PerguntaDoNome onPronto={setNome} />
      ) : pedindoFicha ? (
        <FichaDeContato
          // Passada como função, e não como valor: ler `ref.current` durante
          // o desenho entrega o que havia no desenho anterior, e a chave pode
          // ter acabado de nascer na primeira mensagem.
          obterChave={() => chave.current}
          nomeConhecido={nome}
          onPronto={(dados) => {
            setContato(dados);
            setTemFicha(true);
            void buscar();
          }}
        />
      ) : (
        <form
          onSubmit={enviar}
          className="flex flex-wrap items-center gap-2 border-t border-contorno px-3 py-3"
        >
          {erroArquivo && (
            <p role="alert" className="w-full px-1 text-xs text-destaque">
              {erroArquivo}
            </p>
          )}

          {/* O clipe só com a equipe na conversa: arquivo é para gente ver,
              e o assistente não lê imagem nem PDF. */}
          {estado === "equipe" && (
            <>
              <input
                ref={seletorDeArquivo}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const arquivo = e.target.files?.[0];
                  if (arquivo) void anexar(arquivo);
                }}
              />
              <button
                type="button"
                onClick={() => seletorDeArquivo.current?.click()}
                disabled={enviandoArquivo}
                aria-label="Enviar imagem ou PDF"
                title="Enviar imagem ou PDF (até 4 MB)"
                className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl text-tinta/50 transition-colors duration-300 hover:text-tinta disabled:opacity-40"
              >
                {enviandoArquivo ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-tinta/30 border-t-tinta/80" />
                ) : (
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                )}
              </button>
            </>
          )}

          <input
            ref={campo}
            value={rascunho}
            onChange={(e) => {
              setRascunho(e.target.value);
              sinalizarDigitando();
            }}
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
  onConcluir,
}: {
  titulo: string;
  obterChave: () => string;
  /** Depois da nota (com ou sem comentário): o chat recomeça do zero. */
  onConcluir: () => void;
}) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");

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

  return (
    <div className="mt-4">
      <p className="text-center text-sm font-medium text-tinta">{titulo}</p>
      <p className="mt-0.5 text-center text-xs text-tinta/45">
        Avalie para começar uma nova conversa.
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
              className={`h-7 w-7 ${valor <= nota ? "text-salmon" : "text-tinta/30"}`}
            >
              <path d="m12 3 2.6 5.6 6.4.8-4.7 4.3 1.2 6.3L12 17l-5.5 3 1.2-6.3L3 9.4l6.4-.8z" />
            </svg>
          </button>
        ))}
      </div>

      {/* A nota já foi gravada no clique da estrela; o comentário é bônus.
          Os dois botões levam ao mesmo lugar, a conversa nova. */}
      {nota > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const texto = comentario.trim();
            if (texto) void mandar(nota, texto);
            onConcluir();
          }}
          className="mt-3 grid gap-2"
        >
          <input
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={500}
            placeholder="Quer contar o porquê? (opcional)"
            aria-label="Comentário sobre o atendimento"
            className="min-h-11 rounded-xl border border-contorno bg-fundo-alt px-3.5 text-sm text-tinta outline-none transition-colors duration-300 placeholder:text-tinta/35 focus:border-salmon"
          />
          <button
            type="submit"
            className="flex min-h-11 items-center justify-center rounded-xl bg-salmon text-sm font-medium text-preto"
          >
            {comentario.trim() ? "Enviar e começar nova conversa" : "Começar nova conversa"}
          </button>
        </form>
      )}
    </div>
  );
}

/* ---------------- O nome, antes de tudo ---------------- */

/**
 * Nome e sobrenome, pedidos antes da primeira mensagem.
 *
 * Nome e sobrenome, e não só o primeiro nome: é a mesma regra da ficha de
 * contato, e a ficha não pergunta de novo o que já foi dito aqui. Se o
 * começo aceitasse "João", a ficha teria de cobrar o sobrenome depois — a
 * pessoa responderia a mesma pergunta duas vezes.
 */
function PerguntaDoNome({ onPronto }: { onPronto: (nome: string) => void }) {
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        const limpo = valor.trim().replace(/\s+/g, " ");
        if (limpo.split(" ").filter((p) => p.length > 1).length < 2) {
          setErro("Escreva nome e sobrenome.");
          return;
        }
        onPronto(limpo.slice(0, 120));
      }}
      className="border-t border-contorno px-4 py-4"
    >
      <p className="text-sm font-medium text-tinta">Antes de começar, como você se chama?</p>

      <div className="mt-3 flex gap-2">
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          autoFocus
          autoComplete="name"
          maxLength={120}
          placeholder="Nome e sobrenome"
          aria-label="Nome e sobrenome"
          className="min-h-11 flex-1 rounded-xl border border-contorno bg-fundo-alt px-3.5 text-sm text-tinta outline-none transition-colors duration-300 placeholder:text-tinta/35 focus:border-salmon"
        />
        <button
          type="submit"
          className="min-h-11 shrink-0 rounded-xl bg-salmon px-4 text-sm font-medium text-preto"
        >
          Começar
        </button>
      </div>

      {erro && <p className="mt-2 text-xs text-destaque">{erro}</p>}
    </form>
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
  nomeConhecido,
  onPronto,
}: {
  obterChave: () => string;
  /** O nome dito no começo da conversa. Com ele, a ficha não pede de novo. */
  nomeConhecido: string;
  onPronto: (dados: Contato) => void;
}) {
  const [nome, setNome] = useState(nomeConhecido);
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
      onPronto({ nome: nome.trim(), email: email.trim() });
    } catch {
      setErro("Não deu para enviar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={mandar} className="border-t border-contorno px-4 py-4">
      <p className="text-xs leading-relaxed text-tinta/55">
        {nomeConhecido
          ? `${nomeConhecido.split(/\s+/)[0]}, deixe seu WhatsApp e e-mail que a equipe te procura. Respondemos aqui mesmo e no seu WhatsApp.`
          : "Deixe seus dados que a equipe te procura. Respondemos aqui mesmo e no seu WhatsApp."}
      </p>

      <div className="mt-3 grid gap-2">
        {!nomeConhecido && (
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
        )}

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

/* ---------------- Ícones dos canais ---------------- */

function IconeWhatsApp() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zm8.4-18.2A11.8 11.8 0 0 0 1.9 17.9L.2 24l6.3-1.6A11.8 11.8 0 0 0 24 12c0-3.2-1.2-6.1-3.5-8.4z" />
    </svg>
  );
}

function IconeInstagram() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}
