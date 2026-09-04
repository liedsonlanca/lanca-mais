import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { PaginaLegal, Secao, Lista } from "@/components/TextoLegal";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "As regras de uso do site da LANÇA+: para que ele serve, o que é permitido, o que não é, e a quem pertence o que está publicado aqui.",
};

// Termos de Uso.
//
// Divide função com o Aviso Legal de propósito, e a divisa é clara: aqui ficam
// as regras de uso do site; lá fica o que o conteúdo é e o que ele não promete.
//
// A referência que o cliente trouxe repetia propriedade intelectual, links
// externos, responsabilidade e foro nos dois documentos. Documento repetido
// envelhece torto: um é atualizado, o outro não, e passam a se contradizer.
//
// Também não há seção de cadastro nem de newsletter: o site não tem nem uma
// coisa nem outra, e prometer regra para o que não existe é o defeito que já
// encontramos naquelas páginas.
export default function TermosDeUso() {
  return (
    <>
      <PageHero
        eyebrow="Termos de Uso"
        titulo={[
          { texto: "As regras de" },
          { texto: "uso deste site.", acento: "site." },
        ]}
        lead="Curtas, porque o site é simples: ele apresenta o nosso trabalho e abre um canal de conversa."
      />

      <PaginaLegal atualizadoEm="4 de setembro de 2026">
        <Secao titulo="Quem opera este site">
          <p>
            {siteConfig.name}, CNPJ {siteConfig.cnpj}, com sede em{" "}
            {siteConfig.address}, {siteConfig.city}.
          </p>
          <p>
            Navegar por aqui significa aceitar as regras desta página. Elas valem
            para o uso do site, e não substituem o contrato de prestação de
            serviço, que é assinado à parte por quem nos contrata.
          </p>
        </Secao>

        <Secao titulo="Para que o site serve">
          <p>
            Apresentar as sete frentes de trabalho da {siteConfig.name}, mostrar
            o portfólio e os cases, e abrir um canal para quem quiser conversar
            sobre a própria marca. Nada aqui é loja: não há venda, pagamento nem
            cadastro de conta neste site.
          </p>
        </Secao>

        <Secao titulo="O que é permitido">
          <p>
            Ler, navegar, compartilhar os links, e entrar em contato. Se quiser
            citar algo que publicamos, cite com atribuição e link para a página
            de origem, que é o que pedimos de qualquer pessoa.
          </p>
        </Secao>

        <Secao titulo="O que não é">
          <p>
            Não é permitido, e algumas destas condutas são crime, não apenas
            violação destes termos:
          </p>
          <Lista
            itens={[
              "Copiar, reproduzir ou adaptar o conteúdo do site para uso comercial sem autorização por escrito",
              "Coletar conteúdo em massa por robô, raspador ou automação equivalente",
              "Tentar acessar a área de administração, servidores ou qualquer parte restrita",
              "Testar falhas, forçar senhas ou contornar os limites de acesso",
              "Enviar código malicioso, ou usar o site para prejudicar terceiros",
              "Usar a marca, o nome ou o material da LANÇA+ de forma a sugerir vínculo ou parceria que não existe",
            ]}
          />
          <p>
            Encontrou uma falha de segurança e quer relatar? Escreva para{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              {siteConfig.email}
            </a>
            . Relato feito de boa-fé e sem exploração é bem-vindo, e agradecido.
          </p>
        </Secao>

        <Secao titulo="Área de administração">
          <p>
            O site tem uma área restrita, usada pela equipe da{" "}
            {siteConfig.name} para atualizar o conteúdo. O acesso é pessoal,
            protegido por senha e por verificação em duas etapas, e as tentativas
            são registradas e limitadas.
          </p>
          <p>
            Tentar entrar sem autorização é invasão de dispositivo informático,
            prevista no art. 154-A do Código Penal.
          </p>
        </Secao>

        <Secao titulo="O que você nos envia">
          <p>
            Ao preencher o formulário de contato, você declara que os dados são
            seus e estão corretos. É o que nos permite responder ao lugar certo.
          </p>
          <p>
            O que fazemos com esses dados está na{" "}
            <Link
              href="/politica-de-privacidade"
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </Secao>

        <Secao titulo="A quem pertence o que está aqui">
          <p>
            Textos, fotos, vídeos, logotipo, identidade visual, layout e código
            deste site pertencem à {siteConfig.name} ou aos clientes que
            autorizaram a publicação. A reprodução sem autorização por escrito
            viola a Lei de Direitos Autorais, a Lei nº 9.610 de 1998.
          </p>
          <p>
            As marcas de clientes exibidas pertencem a cada uma delas, e aparecem
            aqui apenas para identificar trabalhos realizados.
          </p>
        </Secao>

        <Secao titulo="Mudanças, legislação e foro">
          <p>
            Estes termos podem mudar. A versão que vale é sempre a publicada
            nesta página, com a data no topo, e continuar usando o site depois de
            uma mudança significa aceitá-la.
          </p>
          <p>
            Aplica-se a legislação brasileira. Fica eleito o foro da comarca de
            Cajazeiras, na Paraíba, ressalvado o direito do consumidor de
            escolher o foro do seu próprio domicílio, que é uma garantia legal e
            não pode ser afastada por contrato.
          </p>
        </Secao>

        <Secao titulo="Os outros documentos">
          <p>
            O que o conteúdo publicado aqui é, e o que ele não promete, está no{" "}
            <Link
              href="/aviso-legal"
              className="font-medium text-salmon-texto underline decoration-salmon/40 underline-offset-4"
            >
              Aviso Legal
            </Link>
            . O que fica guardado no seu navegador está na{" "}
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
