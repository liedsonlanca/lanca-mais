import { faq } from "@/lib/site-config";

type Item = { question: string; answer: string };

// Marcação FAQPage para o Google. Sem argumento usa a FAQ do site (home);
// as páginas de serviço passam a sua própria lista, para que cada uma
// concorra com as suas próprias perguntas na busca.
// JSON.stringify não escapa "</script>": um texto vindo do painel com essa
// sequência fecharia a tag e o que viesse depois seria executado como código.
// Trocar "<" pelo escape equivalente resolve, e o JSON continua válido.
function jsonSeguro(dados: unknown) {
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}

export default function FaqJsonLd({ itens = faq }: { itens?: Item[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: itens.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonSeguro(schema) }}
    />
  );
}
