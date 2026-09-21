import { siteConfig } from "@/lib/site-config";

const endereco = `${siteConfig.address}, ${siteConfig.city}`;
const consulta = encodeURIComponent(endereco);

/** O link do endereço no Google Maps, usado também pelo rodapé. */
export const linkDoMapa = `https://www.google.com/maps/search/?api=1&query=${consulta}`;

// O mapa da sede, em cartão compacto.
//
// Já foi uma faixa larga com o endereço de um lado e um mapa de 256px de
// altura do outro, e era o bloco mais pesado do rodapé: um mapa do Google traz
// azul, branco e alfinete vermelho, cores que não são da marca, e em tamanho
// grande ele domina tudo em volta. Agora é um cartão baixo ao lado do
// endereço, do tamanho de quem só precisa dizer "é por aqui".
//
// Usa o embed por consulta de endereço: não exige chave de API nem
// coordenadas, e a geocodificação acontece do lado deles.
//
// O iframe é lazy: o rodapé existe em todas as páginas, e sem isso cada visita
// carregaria um mapa de terceiro mesmo sem ninguém chegar ao fim da página.
//
// Em repouso fica dessaturado, o bastante para conversar com o rodapé escuro
// sem deixar de ser legível. No hover volta à cor cheia.
export default function FooterMap() {
  return (
    <div className="group overflow-hidden rounded-xl border border-borda">
      <iframe
        src={`https://www.google.com/maps?q=${consulta}&output=embed`}
        title={`Mapa da localização da ${siteConfig.name}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block h-32 w-full grayscale-[0.6] brightness-[0.9] transition-all duration-700 group-hover:grayscale-0 group-hover:brightness-100"
      />
    </div>
  );
}
