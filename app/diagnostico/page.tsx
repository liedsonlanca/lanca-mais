import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import SinalDeLead from "@/components/SinalDeLead";

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
// ---------- Por que o cabeçalho voltou ----------
//
// Esta página já foi imersiva: escondia cabeçalho, rodapé e o botão do
// WhatsApp, e punha no lugar uma faixa fina com "Voltar ao site". Existia por
// um motivo real — o fluxo traz o próprio logo, e com o do site por cima
// apareciam dois LANÇA+ a cem pixels um do outro, com o botão de voltar
// espremido entre eles.
//
// O preço disso era alto: quem chegava aqui por um anúncio ou por um link
// solto caía numa tela sem navegação nenhuma, sem saber que havia um site em
// volta. Uma faixa com "Voltar" é menos que um menu — diz que existe uma
// saída, e não o que há do outro lado dela.
//
// O conserto certo era mais estreito do que esconder tudo: o cabeçalho ficou,
// e só o logo saiu dele (ver noDiagnostico em components/Header.tsx). A
// duplicata some, a navegação volta, e o rodapé abaixo entrega os canais a
// quem rolar. O botão de "Fazer diagnóstico" também sai, porque levaria para
// esta mesma página.
//
// ---------- Por que o fluxo ocupa a tela toda menos o cabeçalho ----------
//
// Formulário de catorze passos dentro de uma caixinha com rolagem própria é o
// jeito mais confiável de fazer alguém desistir no meio. Aqui cada passo cabe
// sem rolar, e quem quiser o rodapé rola a página, não o fluxo.
//
// svh, e não vh: no celular a barra do navegador entra e sai, e vh conta a
// tela sem ela — o que deixaria o pé do fluxo escondido atrás da barra.
//
// A reserva do cabeçalho é a mesma medida nos dois lugares, por isso mora numa
// constante só: se o cabeçalho mudar de altura, muda aqui e o fluxo acompanha.

/**
 * Quanto o cabeçalho fixo ocupa no topo.
 *
 * Medido no cabeçalho montado: 85px. Arredondado para cima, porque sobrar dois
 * pixels não aparece e faltar dois corta a borda do primeiro passo do fluxo.
 */
const CABECALHO = "88px";

export const metadata: Metadata = {
  title: "Diagnóstico",
  description:
    "Descubra em menos de dois minutos como está o posicionamento da sua marca, e o que a LANÇA+ faria por ela.",
  alternates: { canonical: "/diagnostico" },
};

export default function DiagnosticoPage() {
  return (
    <div
      className="sem-botao-flutuante bg-abismo"
      style={{ paddingTop: CABECALHO }}
    >
      <SinalDeLead caminho="/diagnostico" />

      <iframe
        src={siteConfig.diagnosticoUrl}
        title="Diagnóstico LANÇA+"
        className="block w-full border-0"
        style={{ height: `calc(100svh - ${CABECALHO})` }}
      />
    </div>
  );
}
