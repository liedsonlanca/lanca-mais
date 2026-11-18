import { painelLiberado } from "@/lib/admin";
import { listarContatos } from "@/lib/contatos";
import TabelaDeContatos from "@/components/admin/TabelaDeContatos";

export const dynamic = "force-dynamic";

// Quem chegou pelo site.
//
// ---------- O que esta tela é, e o que ela não é ----------
//
// Não é um funil. O DGFLOW já tem o funil, com etapa, valor e histórico, e
// duas listas com as mesmas colunas divergem em duas semanas: alguém move no
// CRM, ninguém move aqui, e a do site passa a mentir.
//
// Aqui a pergunta é outra, e é uma que o CRM não responde: quem chegou por
// este site, por qual porta e o que perguntou. Sem colunas em comum, não há
// o que divergir.

export default async function AdminContatos() {
  if (!(await painelLiberado())) return null;

  const contatos = await listarContatos();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-tinta">Vieram do site</h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-tinta/55">
        Todo mundo que deixou contato aqui — pelo chat ou pelo formulário de
        orçamento. O negócio continua sendo trabalhado no DGFLOW; esta tela
        responde o que o CRM não responde, que é quanta gente o site trouxe e
        o que ela veio perguntar.
      </p>

      <div className="mt-6">
        <TabelaDeContatos lista={contatos} />
      </div>
    </div>
  );
}
