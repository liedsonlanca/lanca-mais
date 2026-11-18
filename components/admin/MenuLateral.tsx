"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A lista de seções da barra lateral do painel.
//
// É client component por um motivo só: marcar onde a pessoa está. São onze
// destinos, e sem a marca a lateral vira uma lista de links iguais — quem
// chega de um atalho não sabe em qual está sem reler o título da página.
//
// O ícone não é enfeite: num menu longo, a forma é o que o olho acha antes da
// palavra, e é como se volta à seção de ontem sem ler as onze. São desenhos
// de traço, do mesmo peso, para não virarem onze cores disputando atenção.

type Secao = { href: string; rotulo: string; icone: React.ReactNode };

/** Todos os desenhos herdam estes traços, então ficam do mesmo peso. */
function Icone({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] shrink-0"
    >
      {children}
    </svg>
  );
}

const SECOES: Secao[] = [
  {
    href: "/lncadmin",
    rotulo: "Visão geral",
    icone: (
      <Icone>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </Icone>
    ),
  },
  {
    // Logo abaixo da visão geral: é a seção que pede ação de alguém, e o
    // olho procura o que é urgente no topo da lista, não no meio dela.
    href: "/lncadmin/conversas",
    rotulo: "Conversas",
    icone: (
      <Icone>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
      </Icone>
    ),
  },
  {
    href: "/lncadmin/contatos",
    rotulo: "Vieram do site",
    icone: (
      <Icone>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </Icone>
    ),
  },
  {
    href: "/lncadmin/site",
    rotulo: "Estado do site",
    icone: (
      <Icone>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
      </Icone>
    ),
  },
  {
    href: "/lncadmin/vitrine",
    rotulo: "Nosso trabalho",
    icone: (
      <Icone>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <path d="m10 9 5 3-5 3V9Z" />
      </Icone>
    ),
  },
  {
    href: "/lncadmin/depoimentos",
    rotulo: "Depoimentos",
    icone: (
      <Icone>
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-3.3A8.4 8.4 0 1 1 21 11.5Z" />
      </Icone>
    ),
  },
  {
    href: "/lncadmin/depoimentos-video",
    rotulo: "Depoimentos em vídeo",
    icone: (
      <Icone>
        <rect x="2" y="6" width="13" height="12" rx="2.5" />
        <path d="m15 11 7-4v10l-7-4" />
      </Icone>
    ),
  },
  {
    href: "/lncadmin/imagens",
    rotulo: "Imagens do site",
    icone: (
      <Icone>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <circle cx="8.5" cy="9.5" r="1.6" />
        <path d="m5 18 5-5 4 4 2-2 3 3" />
      </Icone>
    ),
  },
  {
    href: "/lncadmin/textos",
    rotulo: "Textos do site",
    icone: (
      <Icone>
        <path d="M4 6h16M4 12h16M4 18h10" />
      </Icone>
    ),
  },
  {
    href: "/lncadmin/equipe",
    rotulo: "Equipe",
    icone: (
      <Icone>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 11a3 3 0 1 0 0-6M18 20c0-2.4-1-4.2-2.6-5.2" />
      </Icone>
    ),
  },
  {
    href: "/lncadmin/cases",
    rotulo: "Cases",
    icone: (
      <Icone>
        <rect x="3" y="7" width="18" height="13" rx="2.5" />
        <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      </Icone>
    ),
  },
  {
    href: "/lncadmin/logos",
    rotulo: "Logos",
    icone: (
      <Icone>
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="9" />
      </Icone>
    ),
  },
  {
    href: "/lncadmin/numeros",
    rotulo: "Números",
    icone: (
      <Icone>
        <path d="M5 20V10M12 20V4M19 20v-7" />
      </Icone>
    ),
  },
  {
    href: "/lncadmin/seguranca",
    rotulo: "Segurança",
    icone: (
      <Icone>
        <path d="M12 3 5 6v6c0 4.2 2.9 7.8 7 9 4.1-1.2 7-4.8 7-9V6l-7-3Z" />
      </Icone>
    ),
  },
];

export default function MenuLateral() {
  const pathname = usePathname();

  return (
    // No celular rola de lado em vez de quebrar em várias fileiras; do lg para
    // cima vira a coluna.
    <nav className="sem-barra flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-4">
      {SECOES.map((secao) => {
        // A visão geral é a raiz do painel: sem a comparação exata, ela
        // ficaria marcada em todas as outras telas.
        const atual =
          secao.href === "/lncadmin"
            ? pathname === "/lncadmin"
            : pathname.startsWith(secao.href);

        return (
          <Link
            key={secao.href}
            href={secao.href}
            // Sem pre-busca, e isto nao e economia de bytes.
            //
            // O Next busca de antemao os links que estao na tela, e refaz
            // isso a cada atualizacao do painel. Medido: de seis requisicoes
            // por rodada, so uma era a tela aberta — as outras cinco eram
            // estas, cada uma rodando as consultas da sua propria pagina. A
            // cada quinze segundos o painel consultava telas que ninguem
            // estava vendo.
            //
            // O preco de desligar e a navegacao esperar a resposta, que nas
            // telas do painel mede uns trezentos milissegundos. Barato perto
            // de multiplicar a conta do banco por seis.
            prefetch={false}
            aria-current={atual ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3.5 text-sm transition-colors duration-300 ${
              atual
                ? "bg-fundo-alt font-medium text-tinta"
                : "text-tinta/60 hover:bg-fundo-alt hover:text-tinta"
            }`}
          >
            <span className={atual ? "text-destaque" : "text-tinta/40"}>
              {secao.icone}
            </span>
            {secao.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
