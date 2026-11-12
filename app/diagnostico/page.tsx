import Link from "next/link";
import type { Metadata } from "next";

// O diagnóstico, dentro do site.
//
// ---------- Por que um embutido, e não uma cópia ----------
//
// O fluxo de catorze passos vive no CRM da agência, em cliente.lancamais.com,
// e é lá que os leads caem. Reconstruí-lo aqui criaria duas versões do mesmo
// formulário: a agência ajustaria uma pergunta num lado e o outro continuaria
// perguntando a antiga, e os leads passariam a chegar por dois caminhos.
//
// Embutido, existe uma implementação só. Mexeu no CRM, valeu aqui.
//
// A política de segurança do site precisou abrir para esse endereço: ver
// frame-src em next.config.ts. É o segundo embutido que o site aceita, ao lado
// do mapa do rodapé, e os dois são de origem conhecida.
//
// ---------- Por que a moldura do site sai daqui ----------
//
// O fluxo traz o próprio logo e a própria barra de progresso. Com o cabeçalho
// do site por cima, apareciam dois LANÇA+ a cem pixels um do outro, com o
// botão de voltar espremido entre eles, e o botão do WhatsApp boiava sobre o
// formulário. Lido de fora, parecia defeito.
//
// Então a página é imersiva: o fluxo recebe a tela, e no lugar do cabeçalho
// fica só a faixa fina daqui, com a saída. Esconder a navegação numa tela de
// conversão é o mesmo que um checkout faz — e por isso a faixa existe, para
// que sair continue sendo uma escolha, e não um beco.
//
// O conserto definitivo é do outro lado: se o CRM aceitar um parâmetro que
// esconda o logo dele quando a página for embutida, o cabeçalho do site pode
// voltar e os dois conviverem.
//
// ---------- Por que ocupa toda a altura ----------
//
// Formulário de catorze passos dentro de uma caixinha com rolagem própria é o
// jeito mais confiável de fazer alguém desistir no meio. Aqui cada passo cabe
// sem rolar.
//
// svh, e não vh: no celular a barra do navegador entra e sai, e vh conta a
// tela sem ela — o que deixaria o pé do fluxo escondido atrás da barra.

const ENDERECO = "https://cliente.lancamais.com/flow/diagnostico";

/** Altura da faixa de saída. O resto da tela é do fluxo. */
const FAIXA = 48;

export const metadata: Metadata = {
  title: "Diagnóstico",
  description:
    "Descubra em menos de dois minutos como está o posicionamento da sua marca, e o que a LANÇA+ faria por ela.",
  alternates: { canonical: "/diagnostico" },
};

export default function DiagnosticoPage() {
  return (
    <div className="pagina-imersiva flex h-[100svh] flex-col bg-abismo">
      {/* A faixa de saída. Texto, e não logo: um segundo LANÇA+ aqui traria
          de volta exatamente o problema que esta página resolve. */}
      <div
        className="flex shrink-0 items-center px-6 lg:px-10"
        style={{ height: FAIXA }}
      >
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-sm font-medium text-bege/70 transition-colors duration-500 hover:text-bege"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 transition-transform duration-500 group-hover:-translate-x-1"
          >
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Voltar ao site
        </Link>
      </div>

      <iframe
        src={ENDERECO}
        title="Diagnóstico LANÇA+"
        className="block w-full flex-1 border-0"
      />
    </div>
  );
}
