import { faq } from "@/lib/site-config";

type Item = { question: string; answer: string };

// Marcação FAQPage para o Google. Sem argumento usa a FAQ do site (home);
// as páginas de serviço passam a sua própria lista, para que cada uma
// concorra com as suas próprias perguntas na busca.
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
