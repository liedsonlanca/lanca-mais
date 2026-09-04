import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { PaginaLegal, Secao, Lista } from "@/components/TextoLegal";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Aviso Legal",
  description:
    "Condições de uso do site da LANÇA+, o que os conteúdos publicados aqui são e o que não são, e a identificação da empresa.",
};

// Renderizada a cada visita, e não congelada no build.
//
// A moldura muda conforme o site esteja aberto ou não, e essa resposta mora
// no banco. Congelada, a página nasceria com o estado do dia da publicação e
// continuaria mostrando a moldura de pré-lançamento depois que o site
// abrisse — inclusive quando ele abre sozinho, pela contagem regressiva, sem
// ninguém tocar no painel para disparar uma revalidação.
export const dynamic = "force-dynamic";

// Aviso Legal.
//
// Divide função com os Termos de Uso, e a divisa é clara: aqui fica o que o
// conteúdo é e o que ele não promete; lá ficam as regras de uso do site, a
// propriedade intelectual e o foro.
//
// A referência que o cliente trouxe repetia essas seções nos dois documentos.
// Documento repetido envelhece torto: um é atualizado, o outro não, e passam
// a se contradizer.
//
// É o documento que separa o que a agência promete do que ela não promete, e a
// seção que mais importa é a de resultados: marketing depende de mercado,
// concorrência, sazonalidade e do produto do cliente, e um case publicado é a
// experiência de uma marca, não uma média.
//
// Sobre a isenção de responsabilidade: ela é redigida com limites de propósito.
// Cláusula que se isenta de tudo, em qualquer hipótese, não se sustenta no
// direito brasileiro — o Código de Defesa do Consumidor considera nula a
// renúncia prévia de direitos —, e uma cláusula nula protege menos do que uma
// cláusula honesta, porque cai inteira quando é questionada.
export default function AvisoLegal() {
  return (
    <>
      <PageHero
        eyebrow="Aviso Legal"
        titulo={[
          { texto: "O que este site é," },
          { texto: "e o que ele não é.", acento: "não é." },
        ]}
        lead="As condições de uso, e o que esperar do que está publicado aqui."
      />

      <PaginaLegal atualizadoEm="4 de setembro de 2026">
        <Secao titulo="De quem é este site">
          <p>
            {siteConfig.name}, CNPJ {siteConfig.cnpj}, com sede em{" "}
            {siteConfig.address}, {siteConfig.city}. Contato por{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              {siteConfig.email}
            </a>{" "}
            ou pelo WhatsApp divulgado no rodapé.
          </p>
          <p>
            Usar este site significa concordar com as condições descritas nesta
            página. Se alguma delas não fizer sentido para você, fale com a
            gente antes de nos contratar.
          </p>
        </Secao>

        <Secao titulo="O conteúdo aqui é informativo">
          <p>
            Os cases, os vídeos e os materiais publicados
            neste site existem para explicar como pensamos e o que fazemos. Eles
            não são consultoria, nem parecer técnico, nem recomendação
            individual para o seu negócio.
          </p>
          <p>
            Uma marca é um caso específico. O que vale para uma clínica de
            estética em Cajazeiras pode não valer para um escritório de
            advocacia, e é por isso que todo trabalho nosso começa por um
            diagnóstico, e não por um modelo pronto.
          </p>
        </Secao>

        <Secao titulo="Sobre resultados">
          <p>
            Esta é a seção que você deve ler com atenção antes de contratar
            qualquer agência, inclusive a nossa.
          </p>
          <p>
            Trabalhamos com método, medimos o que fazemos e ajustamos a
            estratégia com base em dado. O que{" "}
            <strong className="font-medium text-preto">não</strong> fazemos é
            garantir número: não prometemos volume de vendas, quantidade de
            seguidores, alcance de publicação nem retorno sobre investimento.
          </p>
          <p>
            Não é ressalva de rodapé, é honestidade sobre como marketing
            funciona. O resultado depende de coisas que estão fora do nosso
            alcance:
          </p>
          <Lista
            itens={[
              "A qualidade do produto ou serviço que a marca entrega",
              "O preço praticado e a estrutura para atender a demanda",
              "A concorrência do setor e o momento do mercado",
              "A sazonalidade do nicho",
              "A velocidade e o cuidado do atendimento a quem chega",
            ]}
          />
          <p>
            Quem promete número específico antes de conhecer esses fatores está
            vendendo previsão, não estratégia.
          </p>
        </Secao>

        <Secao titulo="Cases e depoimentos">
          <p>
            Os trabalhos e depoimentos publicados aqui são verdadeiros e foram
            divulgados com autorização de cada cliente. Cada um deles é a
            experiência de uma marca específica, num setor específico, com um
            investimento e um período específicos.
          </p>
          <p>
            São exemplos do que já aconteceu, e não previsão do que vai
            acontecer com a sua marca.
          </p>
        </Secao>

        <Secao titulo="Links para fora">
          <p>
            Este site aponta para outros lugares da internet, como as nossas
            redes sociais e o WhatsApp. O que existe do outro lado não é
            controlado por nós, e cada um desses serviços tem regras e políticas
            próprias, que valem a partir do momento em que você sai daqui.
          </p>
        </Secao>

        <Secao titulo="Disponibilidade">
          <p>
            Fazemos o razoável para manter o site no ar, rápido e correto, mas
            não há site que funcione sem interrupção. Manutenção, falha de
            fornecedor e problema de conexão acontecem, e nesses momentos alguma
            informação pode ficar indisponível ou desatualizada.
          </p>
          <p>
            Os canais de contato do rodapé continuam valendo mesmo quando o site
            não está.
          </p>
        </Secao>

        <Secao titulo="Limites da nossa responsabilidade">
          <p>
            Respondemos pelo que fazemos e pelo que prometemos em contrato. Não
            respondemos por decisão que alguém tome por conta própria a partir
            de um conteúdo informativo publicado aqui, nem por prejuízo causado
            por serviço de terceiro que este site apenas aponta.
          </p>
          <p>
            Não escrevemos aqui uma renúncia geral de direitos, e isso é
            deliberado: o Código de Defesa do Consumidor considera nula a
            cláusula que tenta afastar toda responsabilidade de antemão. Um
            texto que promete o impossível protege menos, não mais.
          </p>
        </Secao>

        <Secao titulo="Os outros documentos">
          <p>
            As regras de uso do site, a quem pertence o que está publicado e o
            foro aplicável estão nos{" "}
            <Link
              href="/termos-de-uso"
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              Termos de Uso
            </Link>
            . O tratamento de dados pessoais está na{" "}
            <Link
              href="/politica-de-privacidade"
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              Política de Privacidade
            </Link>{" "}
            e na{" "}
            <Link
              href="/politica-de-cookies"
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              Política de Cookies
            </Link>
            .
          </p>
          <p>
            Esta página pode mudar, e a versão que vale é sempre a publicada
            aqui, com a data no topo.
          </p>
        </Secao>      </PaginaLegal>
    </>
  );
}
