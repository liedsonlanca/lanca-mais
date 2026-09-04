import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { PaginaLegal, Secao, Lista } from "@/components/TextoLegal";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Quais dados a LANÇA+ coleta neste site, por que, com quem compartilha e como você pede para apagá-los.",
};

// Política de Privacidade.
//
// Descreve o que o site faz hoje, e não o que um modelo genérico costuma
// prometer: o formulário de contato, os dois cookies necessários e os dois
// rastreadores opcionais. Quando um novo tratamento de dados entrar no site,
// esta página precisa entrar junto — documento desatualizado é pior do que
// documento nenhum, porque afirma o que não é verdade.
export default function PoliticaDePrivacidade() {
  return (
    <>
      <PageHero
        eyebrow="Política de Privacidade"
        titulo={[
          { texto: "Seus dados," },
          { texto: "em português claro.", acento: "claro." },
        ]}
        lead="O que coletamos, por quê, por quanto tempo, e como pedir para apagar."
      />

      <PaginaLegal atualizadoEm="4 de setembro de 2026">
        <Secao titulo="Quem é o responsável">
          <p>
            {siteConfig.name}, inscrita no CNPJ {siteConfig.cnpj}, com endereço
            em {siteConfig.address}, {siteConfig.city}. Para qualquer assunto
            desta política, incluindo pedidos sobre os seus dados, o contato é{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              {siteConfig.email}
            </a>
            .
          </p>
        </Secao>

        <Secao titulo="O que coletamos">
          <p>
            Navegar pelo site sem preencher nada e sem aceitar cookies não deixa
            nenhum dado pessoal conosco.
          </p>
          <Lista
            itens={[
              <>
                <strong className="font-medium text-preto">
                  O que você escreve no formulário
                </strong>{" "}
                — nome, e-mail, telefone e a mensagem sobre o seu negócio. São
                enviados por você, quando decide falar com a gente.
              </>,
              <>
                <strong className="font-medium text-preto">
                  Medição de audiência
                </strong>{" "}
                — só se você aceitar. Páginas visitadas, origem do acesso e
                dados aproximados de região, tratados em conjunto.
              </>,
              <>
                <strong className="font-medium text-preto">Marketing</strong> —
                só se você aceitar. Identificadores usados pela Meta para medir
                anúncios e formar público.
              </>,
            ]}
          />
        </Secao>

        <Secao titulo="Com que base legal">
          <p>
            A Lei Geral de Proteção de Dados exige uma base legal para cada
            tratamento. Aqui são três, e cada uma cobre uma coisa só:
          </p>
          <Lista
            itens={[
              <>
                <strong className="font-medium text-preto">
                  Procedimentos preliminares de contrato
                </strong>{" "}
                (art. 7º, V) — para o que você escreve no formulário. Você pede
                contato, nós respondemos e, se fizer sentido, apresentamos uma
                proposta.
              </>,
              <>
                <strong className="font-medium text-preto">Consentimento</strong>{" "}
                (art. 7º, I) — para medição e marketing, e apenas enquanto ele
                durar. Nada é carregado antes do seu sim.
              </>,
              <>
                <strong className="font-medium text-preto">Obrigação legal</strong>{" "}
                (art. 7º, II) — para guardar o que a lei manda guardar, como
                registros fiscais de contratos fechados.
              </>,
            ]}
          />
          <p>
            Não invocamos legítimo interesse para medir ou anunciar. É uma base
            usada com frequência para isso, mas dispensaria o seu consentimento
            justamente onde ele deveria valer, e a autoridade brasileira já
            sinalizou que a leitura correta é a outra.
          </p>
          <p>
            Retirar o consentimento é tão simples quanto dar: o link{" "}
            <strong className="font-medium text-preto">Gerenciar cookies</strong>{" "}
            no rodapé reabre a escolha.
          </p>
        </Secao>

        <Secao titulo="Com quem compartilhamos">
          <p>
            Não vendemos dados, e não os entregamos a quem queira montar mala
            direta. Existem apenas os fornecedores necessários para o site
            funcionar:
          </p>
          <Lista
            itens={[
              <>
                <strong className="font-medium text-preto">Vercel</strong> —
                hospeda o site e o banco de dados do conteúdo.
              </>,
              <>
                <strong className="font-medium text-preto">Cloudflare</strong> —
                guarda e entrega as imagens e os vídeos do portfólio.
              </>,
              <>
                <strong className="font-medium text-preto">
                  Google e Meta
                </strong>{" "}
                — apenas se você aceitou medição e marketing, respectivamente.
              </>,
            ]}
          />
          <p>
            Parte desses serviços mantém servidores fora do Brasil, o que
            caracteriza transferência internacional de dados (art. 33 da LGPD).
            Ela se apoia nas cláusulas contratuais padrão e nos compromissos de
            proteção que cada um desses fornecedores publica.
          </p>
        </Secao>

        <Secao titulo="Por quanto tempo guardamos">
          <p>
            Mensagens de contato ficam conosco enquanto durar a conversa
            comercial e, depois disso, pelo prazo necessário para cumprir
            obrigações legais. Passado esse prazo, são apagadas. Os dados de
            medição e marketing seguem os prazos de cada ferramenta, e param de
            ser coletados assim que você retira o consentimento.
          </p>
        </Secao>

        <Secao titulo="Os seus direitos">
          <p>
            A lei garante a você, sobre os seus dados, os direitos abaixo. Basta
            escrever para{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              {siteConfig.email}
            </a>
            , e respondemos no prazo legal.
          </p>
          <Lista
            itens={[
              "Saber se tratamos dados seus, e quais são",
              "Corrigir o que estiver errado ou incompleto",
              "Pedir uma cópia, ou a portabilidade para outro fornecedor",
              "Pedir a eliminação do que foi tratado com o seu consentimento",
              "Retirar o consentimento a qualquer momento",
              "Saber com quem compartilhamos",
              "Reclamar à Autoridade Nacional de Proteção de Dados",
            ]}
          />
        </Secao>

        <Secao titulo="Como protegemos">
          <p>
            O site é servido apenas por conexão criptografada. O acesso ao painel
            de administração exige senha e verificação em duas etapas, e as
            sessões são assinadas e expiram sozinhas. As tentativas de acesso são
            limitadas por origem, para dificultar quem tente adivinhar senha.
          </p>
          <p>
            Nenhuma medida elimina risco por completo. Se ocorrer um incidente
            que possa trazer risco relevante a você, comunicamos você e a
            autoridade, como manda a lei.
          </p>
        </Secao>

        <Secao titulo="Quem responde por isso">
          <p>
            Pedidos sobre os seus dados, dúvidas e reclamações vão para{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              {siteConfig.email}
            </a>
            , que é o canal do encarregado pelo tratamento de dados pessoais da{" "}
            {siteConfig.name}, previsto no art. 41 da LGPD. Respondemos por esse
            mesmo canal, no prazo legal.
          </p>
          <p>
            Se a resposta não resolver, você pode levar o caso à Autoridade
            Nacional de Proteção de Dados.
          </p>
        </Secao>

        <Secao titulo="Mudanças nesta política">
          <p>
            Quando algo mudar no que o site faz com dados, esta página muda
            junto, e a data no topo é atualizada. Vale a pena reler se você for
            enviar dados novamente depois de muito tempo.
          </p>
          <p>
            Para o detalhe do que fica guardado no seu navegador, veja a{" "}
            <Link
              href="/politica-de-cookies"
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              Política de Cookies
            </Link>
            .
          </p>
        </Secao>
      </PaginaLegal>
    </>
  );
}
