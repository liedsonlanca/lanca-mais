import { services, type Service } from "@/lib/site-config";
import { servicePages, type ServicePage } from "@/lib/service-pages";
import { sintomas, metodo, entregaveis, type Sintoma, type Etapa } from "@/lib/home";
import { lerTextos } from "@/lib/conteudo";
import { texto, lista, type Textos } from "@/lib/textos";

// O conteúdo de texto do site, já com o que o painel reescreveu aplicado.
//
// ---------- Por que existe um arquivo só para isto ----------
//
// As páginas poderiam ler os textos e montar cada frase na mão, mas então
// cada uma precisaria saber o formato das chaves — e uma chave digitada errado
// numa página que ninguém abriu em meses viraria um buraco na tela sem
// ninguém notar.
//
// Aqui a remontagem acontece uma vez, devolvendo os mesmos objetos que o site
// já usava. Do lado de fora, `servico.heroSubtitle` continua sendo
// `servico.heroSubtitle`: nenhuma página precisou aprender chave nenhuma.
//
// ---------- Por que a forma é a mesma de antes ----------
//
// Os objetos devolvidos têm exatamente o tipo dos originais. É o que permitiu
// ligar o painel sem reescrever as páginas: onde havia `servicePages[slug]`,
// passou a haver `await lerPaginaDeServico(slug)`, e o resto do arquivo não
// mudou uma linha. Se um dia a tabela sumir, tudo volta ao texto de código
// sem nenhuma página perceber.

/** A home: sintomas, método e entregáveis. */
export async function lerTextosDaHome(): Promise<{
  sintomas: Sintoma[];
  metodo: Etapa[];
  entregaveis: string[];
}> {
  const t = await lerTextos();

  return {
    sintomas: sintomas.map((s, i) => ({
      titulo: texto(t, `home.sintomas.${i}.titulo`) || s.titulo,
      descricao: texto(t, `home.sintomas.${i}.descricao`) || s.descricao,
    })),
    metodo: metodo.map((e, i) => ({
      // O número da etapa não é texto de leitura: é a contagem, e deixá-la
      // editável só convidaria a uma sequência 01, 02, 04.
      numero: e.numero,
      titulo: texto(t, `home.metodo.${i}.titulo`) || e.titulo,
      descricao: texto(t, `home.metodo.${i}.descricao`) || e.descricao,
    })),
    entregaveis: aplicarLista(t, "home.entregaveis", entregaveis),
  };
}

/** Lista reescrita, com a original como reserva se a caixa ficar vazia. */
function aplicarLista(t: Textos, chave: string, reserva: string[]) {
  const itens = lista(t, chave);
  return itens.length > 0 ? itens : reserva;
}

/** Os oito serviços, com nome, resumo, descrição e tópicos do painel. */
export async function lerServicos(): Promise<Service[]> {
  const t = await lerTextos();
  return services.map((s) => aplicarServico(t, s));
}

function aplicarServico(t: Textos, s: Service): Service {
  const raiz = `servico.${s.slug}.resumo`;
  return {
    // O slug é endereço, e não texto: mudá-lo quebraria todos os links.
    slug: s.slug,
    name: texto(t, `${raiz}.name`) || s.name,
    shortDescription: texto(t, `${raiz}.shortDescription`) || s.shortDescription,
    description: texto(t, `${raiz}.description`) || s.description,
    bullets: aplicarLista(t, `${raiz}.bullets`, s.bullets),
  };
}

/** Um serviço só, quando a página já sabe qual quer. */
export async function lerServico(slug: string): Promise<Service | undefined> {
  const encontrado = services.find((s) => s.slug === slug);
  if (!encontrado) return undefined;
  return aplicarServico(await lerTextos(), encontrado);
}

/** A página inteira de um serviço, com todo o texto do painel aplicado. */
export async function lerPaginaDeServico(
  slug: string
): Promise<ServicePage | undefined> {
  const pagina = servicePages[slug];
  if (!pagina) return undefined;

  const t = await lerTextos();
  const raiz = `servico.${slug}.pagina`;
  const campo = (caminho: string, reserva: string) =>
    texto(t, `${raiz}.${caminho}`) || reserva;

  return {
    slug: pagina.slug,
    heroKicker: campo("heroKicker", pagina.heroKicker),
    heroSubtitle: campo("heroSubtitle", pagina.heroSubtitle),
    deliverables: aplicarLista(t, `${raiz}.deliverables`, pagina.deliverables),
    manifesto: {
      statement: campo("manifesto.statement", pagina.manifesto.statement),
      body: aplicarLista(t, `${raiz}.manifesto.body`, pagina.manifesto.body),
    },
    features: pagina.features.map((f, i) => ({
      title: campo(`features.${i}.title`, f.title),
      description: campo(`features.${i}.description`, f.description),
    })),
    process: pagina.process.map((p, i) => ({
      title: campo(`process.${i}.title`, p.title),
      description: campo(`process.${i}.description`, p.description),
    })),
    results: aplicarLista(t, `${raiz}.results`, pagina.results),
    faq: pagina.faq.map((q, i) => ({
      question: campo(`faq.${i}.question`, q.question),
      answer: campo(`faq.${i}.answer`, q.answer),
    })),
    ctaLabel: campo("ctaLabel", pagina.ctaLabel),
  };
}

/** Todas as páginas de serviço de uma vez, para quem monta o FAQ da home. */
export async function lerPaginasDeServico(): Promise<Record<string, ServicePage>> {
  const mapa: Record<string, ServicePage> = {};
  for (const slug of Object.keys(servicePages)) {
    const pagina = await lerPaginaDeServico(slug);
    if (pagina) mapa[slug] = pagina;
  }
  return mapa;
}
