// A prévia que aparece dentro de cada card de serviço em destaque.
//
// Desenho, e não foto. A referência que inspirou o bloco usa capturas de tela
// dos trabalhos dentro do card; aqui isso seria propaganda enganosa enquanto a
// vitrine real não estiver cadastrada, e repetiria as mesmas peças que a seção
// "Nosso trabalho", duas rolagens abaixo. Então cada serviço ganhou um desenho
// abstrato do que ele entrega: um perfil, um relatório, uma linha do tempo de
// edição. Ninguém confunde com trabalho de cliente, e nenhum deles depende de
// arquivo nenhum para existir.
//
// Tudo em SVG, com as cores vindas das variáveis do tema: no dia em que o site
// tiver um modo claro, a prévia acompanha sozinha.

const tinta = (o: number) => `color-mix(in srgb, var(--color-tinta) ${o}%, transparent)`;

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 320 220"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <rect
        x="24"
        y="18"
        width="272"
        height="184"
        rx="18"
        fill="var(--color-cartao)"
        stroke="var(--color-contorno)"
      />
      {children}
    </svg>
  );
}

// Marketing Pessoal: o perfil de quem é a própria marca. Avatar, nome, botão
// de seguir e a grade do feed logo abaixo.
function Perfil() {
  return (
    <Moldura>
      <circle cx="58" cy="54" r="17" fill="color-mix(in srgb, var(--color-salmon) 22%, transparent)" />
      <circle cx="58" cy="50" r="6" fill="var(--color-salmon)" />
      <path d="M47 64a11 11 0 0 1 22 0" fill="var(--color-salmon)" />

      <rect x="86" y="44" width="92" height="9" rx="4.5" fill={tinta(55)} />
      <rect x="86" y="60" width="58" height="8" rx="4" fill={tinta(22)} />

      <rect x="230" y="44" width="50" height="22" rx="11" fill="var(--color-salmon)" />

      <g>
        <rect x="40" y="94" width="72" height="46" rx="10" fill={tinta(10)} />
        <rect x="124" y="94" width="72" height="46" rx="10" fill="color-mix(in srgb, var(--color-salmon) 30%, transparent)" />
        <rect x="208" y="94" width="72" height="46" rx="10" fill={tinta(10)} />
        <rect x="40" y="150" width="72" height="46" rx="10" fill={tinta(6)} />
        <rect x="124" y="150" width="72" height="46" rx="10" fill={tinta(10)} />
        <rect x="208" y="150" width="72" height="46" rx="10" fill={tinta(6)} />
      </g>
    </Moldura>
  );
}

// Marketing Empresarial: o relatório do mês. Barras que sobem e a linha que
// confirma a direção.
function Relatorio() {
  const barras = [
    { x: 56, h: 40 },
    { x: 100, h: 64 },
    { x: 144, h: 54 },
    { x: 188, h: 88 },
    { x: 232, h: 112 },
  ];

  return (
    <Moldura>
      <rect x="48" y="40" width="76" height="9" rx="4.5" fill={tinta(45)} />
      <rect x="48" y="56" width="46" height="8" rx="4" fill={tinta(20)} />

      <rect x="232" y="38" width="48" height="22" rx="11" fill="color-mix(in srgb, var(--color-salmon) 20%, transparent)" />
      <path d="M249 49h14M256 42v14" stroke="var(--color-salmon)" strokeWidth="2.5" strokeLinecap="round" />

      <path d="M40 182h240" stroke="var(--color-contorno)" strokeWidth="1.5" />

      {barras.map((b, i) => (
        <rect
          key={b.x}
          x={b.x}
          y={182 - b.h}
          width="32"
          height={b.h}
          rx="9"
          fill={
            i === barras.length - 1
              ? "var(--color-salmon)"
              : `color-mix(in srgb, var(--color-salmon) ${16 + i * 9}%, transparent)`
          }
        />
      ))}

      <path
        d="M72 132 116 112 160 122 204 90 248 64"
        fill="none"
        stroke={tinta(40)}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="5 6"
      />
    </Moldura>
  );
}

// Audiovisual: a tomada vertical no centro, as duas de apoio ao lado e a
// linha do tempo da edição embaixo.
function Edicao() {
  return (
    <Moldura>
      <rect x="46" y="58" width="58" height="96" rx="12" fill={tinta(8)} />
      <rect x="216" y="58" width="58" height="96" rx="12" fill={tinta(8)} />

      <rect
        x="122"
        y="34"
        width="76"
        height="128"
        rx="14"
        fill="var(--color-preto)"
        stroke="color-mix(in srgb, var(--color-salmon) 45%, transparent)"
        strokeWidth="1.5"
      />
      <path d="M152 84 175 98l-23 14z" fill="var(--color-salmon)" />

      <rect x="46" y="180" width="228" height="8" rx="4" fill={tinta(12)} />
      <rect x="46" y="180" width="104" height="8" rx="4" fill="var(--color-salmon)" />
      <circle cx="150" cy="184" r="8" fill="var(--color-salmon)" />
      <circle cx="150" cy="184" r="3" fill="var(--color-preto)" />
    </Moldura>
  );
}

const desenhos: Record<string, () => React.ReactNode> = {
  "marketing-pessoal": Perfil,
  "marketing-empresarial": Relatorio,
  audiovisual: Edicao,
};

export default function PreviaServico({ slug }: { slug: string }) {
  const Desenho = desenhos[slug];
  if (!Desenho) return null;
  return <Desenho />;
}
