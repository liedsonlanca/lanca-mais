import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { PaginaLegal, Secao, Lista } from "@/components/TextoLegal";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "O que o site da LANÇA+ guarda no seu navegador, para quê, e como mudar a sua escolha a qualquer momento.",
};

// Política de Cookies.
//
// Escrita a partir do que o site realmente faz, e não de um modelo genérico:
// cada item aqui corresponde a um cookie que existe no código. Um documento que
// promete menos do que o site faz é um problema jurídico; um que promete mais é
// um problema de confiança.
export default function PoliticaDeCookies() {
  return (
    <>
      <PageHero
        eyebrow="Política de Cookies"
        titulo={[
          { texto: "O que guardamos" },
          { texto: "no seu navegador.", acento: "navegador." },
        ]}
        lead="Uma lista honesta e curta, porque a lista é curta mesmo."
      />

      <PaginaLegal atualizadoEm="4 de setembro de 2026">
        <Secao titulo="O que é um cookie">
          <p>
            É um pedacinho de informação que um site guarda no seu navegador
            para se lembrar de algo entre uma página e outra. Alguns são
            indispensáveis para o site funcionar. Outros servem para observar o
            que você faz, e esses só existem se você permitir.
          </p>
        </Secao>

        <Secao titulo="Os que existem sempre">
          <p>
            São necessários para o site funcionar e não dependem de permissão,
            porque sem eles não há site a ser usado. Nenhum deles acompanha você
            fora daqui.
          </p>
          <Lista
            itens={[
              <>
                <strong className="font-medium text-preto">
                  lanca_acesso
                </strong>{" "}
                — lembra que você digitou a senha de acesso antecipado, enquanto
                o site não está aberto ao público. Dura 30 minutos parado.
              </>,
              <>
                <strong className="font-medium text-preto">lanca_admin</strong>{" "}
                — mantém a equipe da {siteConfig.name} conectada ao painel de
                administração. Dura uma jornada de trabalho.
              </>,
            ]}
          />
          <p>
            Os dois guardam apenas um carimbo de tempo assinado. Não guardam a
            senha, não guardam nome, não guardam e-mail.
          </p>
        </Secao>

        <Secao titulo="Os que dependem de você">
          <p>
            Só são carregados depois que você aceita. Se recusar, os arquivos
            nem chegam a ser baixados pelo seu navegador.
          </p>
          <Lista
            itens={[
              <>
                <strong className="font-medium text-preto">
                  Medição de audiência
                </strong>{" "}
                — Google Analytics. Mostra quantas pessoas visitam, de onde vêm
                e quais páginas leem. Olhamos números em conjunto, para melhorar
                o site.
              </>,
              <>
                <strong className="font-medium text-preto">Marketing</strong> —
                Pixel da Meta. Mede o resultado dos nossos anúncios e permite
                mostrar conteúdo da {siteConfig.name} para quem já demonstrou
                interesse.
              </>,
            ]}
          />
        </Secao>

        <Secao titulo="Como mudar de ideia">
          <p>
            No rodapé de qualquer página existe o link{" "}
            <strong className="font-medium text-preto">Gerenciar cookies</strong>
            . Ele reabre a mesma escolha, com o que você marcou da última vez. Ao
            retirar uma permissão, a página recarrega para que nada continue
            rodando por inércia.
          </p>
          <p>
            Você também pode apagar cookies e bloquear novos pelas configurações
            do seu navegador. Se bloquear tudo, o site continua funcionando; o
            que deixa de funcionar é o acesso ao painel e a lembrança da senha
            de acesso antecipado.
          </p>
        </Secao>

        <Secao titulo="Outros conteúdos">
          <p>
            O mapa no rodapé é fornecido pelo Google Maps e carrega direto dos
            servidores do Google, que pode registrar o acesso segundo as
            políticas dele. Os vídeos e imagens do site são servidos por
            armazenamento próprio da {siteConfig.name} e não observam ninguém.
          </p>
        </Secao>

        <Secao titulo="Dúvidas">
          <p>
            Escreva para{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              {siteConfig.email}
            </a>
            . Para entender o que fazemos com dados pessoais de forma geral, veja
            a{" "}
            <Link
              href="/politica-de-privacidade"
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </Secao>
      </PaginaLegal>
    </>
  );
}
