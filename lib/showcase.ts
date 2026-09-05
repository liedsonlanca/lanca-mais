export type PecaVitrine = {
  /**
   * Capa exibida no trilho. Formato 4:5 (feed).
   *
   * No carrossel é a primeira imagem: o trilho mostra só ela, e as demais
   * aparecem ao abrir a peça.
   */
  src: string;
  alt: string;
  /**
   * Estático abre ampliado; vídeo abre com player; carrossel abre
   * folheável.
   *
   * O valor guardado para o estático continua sendo "imagem", e não
   * "estatico": renomear obrigaria a migrar as peças já cadastradas, e um
   * banco meio migrado é pior do que um nome menos bonito. Na tela do
   * painel ele aparece como "Estático", que é como a agência fala.
   */
  tipo?: "imagem" | "video" | "carrossel";
  /** Arquivo do vídeo, quando `tipo` for "video". */
  video?: string;
  /**
   * Imagens do carrossel, em ordem, incluindo a capa na primeira posição.
   *
   * Fica só no carrossel. Peça estática tem uma imagem, e ela vive em
   * `src` — duplicá-la aqui criaria duas fontes para a mesma verdade.
   */
  imagens?: string[];
  /** Legenda mostrada no rodapé da visualização em tela cheia. */
  legenda?: string;
};

// [SUBSTITUIR] — provisórios. O certo aqui são capturas de posts reais e vídeos
// produzidos pela LANÇA+, no formato 4:5 do feed. Coloque os arquivos em
// IMAGENS/, processe para public/images/vitrine e troque a lista abaixo.
//
// Para uma peça em vídeo:
//   { src: "/images/vitrine/capa.jpg", alt: "…", tipo: "video", video: "/videos/peca.mp4" }
export const vitrine: PecaVitrine[] = [
  { src: "/images/team/equipe-1.jpg", alt: "Produção da LANÇA+" },
  { src: "/images/team/liedson-rodrigues.jpg", alt: "Produção da LANÇA+" },
  { src: "/images/team/equipe-2.jpg", alt: "Produção da LANÇA+" },
  { src: "/images/team/vitoria-dantas.jpg", alt: "Produção da LANÇA+" },
  { src: "/images/team/silas-oliveira.jpg", alt: "Produção da LANÇA+" },
  { src: "/images/team/diogenes-mesquita.jpg", alt: "Produção da LANÇA+" },
  { src: "/images/team/renato-lima.jpg", alt: "Produção da LANÇA+" },
];
