import type { Resumo } from "@/lib/acessos";

// O movimento do site, na primeira tela do painel.
//
// ---------- Por que barras desenhadas à mão ----------
//
// Um gráfico de catorze colunas não justifica uma biblioteca: a mais magra
// passa de cinquenta kilobytes, e o painel é a tela que a agência abre todo
// dia. Aqui cada barra é uma div com uma altura em porcentagem — o mesmo
// desenho, sem nada para baixar.
//
// ---------- O que estes números são, e o que não são ----------
//
// São carregamentos de página, contados no servidor (ver lib/acessos.ts).
// Não são "usuários únicos" no sentido do Google: a mesma pessoa voltando
// amanhã conta como outra, porque a impressão que a distingue troca de dia,
// de propósito.
//
// "Agora" é quem carregou alguma página nos últimos cinco minutos. É o mais
// perto de tempo real que dá para chegar sem manter conexão aberta com cada
// visitante, e é bem mais honesto do que o "ativos agora" que estima.

const CARTAO = "rounded-2xl border border-contorno bg-cartao p-5";

function Numero({
  valor,
  rotulo,
  ajuda,
  destaque,
}: {
  valor: number;
  rotulo: string;
  ajuda: string;
  destaque?: boolean;
}) {
  return (
    <div className={CARTAO}>
      <div className="flex items-center gap-2">
        {destaque && (
          // O ponto só existe quando há gente: um ponto verde piscando com
          // zero pessoas no site seria uma mentirinha de interface.
          <span className="relative flex h-2 w-2">
            {valor > 0 && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-salmon opacity-60" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                valor > 0 ? "bg-salmon" : "bg-tinta/20"
              }`}
            />
          </span>
        )}
        <span className="text-xs text-tinta/55">{rotulo}</span>
      </div>

      <p className="numeral-fantasma mt-2 text-3xl font-semibold leading-none text-tinta">
        {valor.toLocaleString("pt-BR")}
      </p>
      <p className="mt-1.5 text-xs text-tinta/45">{ajuda}</p>
    </div>
  );
}

/** Catorze dias, inclusive os que não tiveram visita nenhuma. */
function completarDias(porDia: Resumo["porDia"]) {
  const mapa = new Map(porDia.map((d) => [d.dia, d]));
  const dias: Resumo["porDia"] = [];

  for (let i = 13; i >= 0; i -= 1) {
    const data = new Date();
    data.setDate(data.getDate() - i);
    const chave = data.toISOString().slice(0, 10);
    // Dia sem visita precisa existir como zero. Pulando, o gráfico ficaria
    // com catorze rótulos e oito barras, e a queda de um fim de semana
    // simplesmente não apareceria.
    dias.push(mapa.get(chave) ?? { dia: chave, visitas: 0, pessoas: 0 });
  }

  return dias;
}

export default function PainelDeAcessos({ resumo }: { resumo: Resumo }) {
  const dias = completarDias(resumo.porDia);
  const teto = Math.max(1, ...dias.map((d) => d.visitas));
  const vazio = resumo.trintaDias === 0;

  return (
    <section className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Numero
          valor={resumo.agora}
          rotulo="No site agora"
          ajuda="Nos últimos 5 minutos"
          destaque
        />
        <Numero valor={resumo.hoje} rotulo="Hoje" ajuda="Páginas abertas" />
        <Numero
          valor={resumo.seteDias}
          rotulo="7 dias"
          ajuda="Páginas abertas"
        />
        <Numero
          valor={resumo.trintaDias}
          rotulo="30 dias"
          ajuda="Páginas abertas"
        />
      </div>

      {vazio && (
        <p className={`${CARTAO} mt-4 text-sm leading-relaxed text-tinta/65`}>
          Ainda não há movimento registrado. A contagem começa agora: o site
          passa a anotar cada página aberta a partir desta versão, e os
          números aparecem aqui conforme as visitas acontecem.
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* ---------- Gráfico ---------- */}
        <div className={CARTAO}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold text-tinta">
              Últimos 14 dias
            </h2>
            <span className="text-xs text-tinta/45">
              {teto.toLocaleString("pt-BR")} no pico
            </span>
          </div>

          <div className="mt-5 flex h-36 items-end gap-1.5">
            {dias.map((dia) => {
              const altura = (dia.visitas / teto) * 100;
              const data = new Date(`${dia.dia}T12:00:00`);

              return (
                <div
                  key={dia.dia}
                  className="group flex h-full flex-1 flex-col justify-end"
                  // O title é a leitura exata, para quem precisar do número e
                  // para quem usa leitor de tela.
                  title={`${data.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}: ${dia.visitas} páginas, ${dia.pessoas} visitantes`}
                >
                  <div
                    className="w-full rounded-t-md bg-salmon/35 transition-colors duration-300 group-hover:bg-salmon"
                    // Altura mínima para o dia zerado não sumir: barra de
                    // altura zero some, e some junto a informação de que
                    // aquele dia existiu e não teve ninguém.
                    style={{ height: `${Math.max(altura, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex justify-between text-[0.7rem] text-tinta/40">
            <span>
              {new Date(`${dias[0].dia}T12:00:00`).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              })}
            </span>
            <span>hoje</span>
          </div>
        </div>

        {/* ---------- Páginas e origens ---------- */}
        <div className="grid gap-4">
          <div className={CARTAO}>
            <h2 className="text-sm font-semibold text-tinta">
              Páginas mais abertas
            </h2>
            <p className="mt-0.5 text-xs text-tinta/45">Últimos 30 dias</p>

            <ul className="mt-4 grid gap-2">
              {resumo.paginas.length === 0 && (
                <li className="text-sm text-tinta/45">Nada ainda.</li>
              )}
              {resumo.paginas.map((pagina) => (
                <li
                  key={pagina.caminho}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate text-tinta/75">
                    {pagina.caminho === "/" ? "/ (início)" : pagina.caminho}
                  </span>
                  <span className="numeral-fantasma shrink-0 text-tinta/45">
                    {pagina.visitas.toLocaleString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className={CARTAO}>
            <h2 className="text-sm font-semibold text-tinta">De onde vieram</h2>
            <p className="mt-0.5 text-xs text-tinta/45">
              Últimos 30 dias. &quot;Direto&quot; é quem digitou o endereço ou
              veio de um link sem origem.
            </p>

            <ul className="mt-4 grid gap-2">
              {resumo.origens.length === 0 && (
                <li className="text-sm text-tinta/45">Nada ainda.</li>
              )}
              {resumo.origens.map((origem) => (
                <li
                  key={origem.origem}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate text-tinta/75">
                    {origem.origem}
                  </span>
                  <span className="numeral-fantasma shrink-0 text-tinta/45">
                    {origem.visitas.toLocaleString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
