export type PecaVitrine = {
  /** Miniatura exibida no trilho. Formato 4:5 (feed). */
  src: string;
  alt: string;
  /** Imagem abre ampliada; vídeo abre com player. */
  tipo?: "imagem" | "video";
  /** Arquivo do vídeo, quando `tipo` for "video". */
  video?: string;
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
