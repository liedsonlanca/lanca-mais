/**
 * Pastas onde o painel pode gravar arquivos.
 *
 * Vive num arquivo só, sozinha, por dois motivos.
 *
 * O primeiro é ser a mesma verdade nos dois lados: a rota de envio confere a
 * pasta pedida contra esta lista, e os campos do painel só aceitam um nome que
 * esteja nela. Quando a lista era escrita à mão na rota, acrescentar a tela da
 * equipe passou batido: o campo pedia a pasta "equipe", a rota não a conhecia e
 * recusava o envio com "Destino inválido". Agora falta um nome aqui quebra a
 * compilação, e não o envio de quem está usando o painel.
 *
 * O segundo é o peso: os campos são componentes de navegador, e o lib/upload
 * carrega o cliente da Amazon S3. Importar a lista de lá levaria a biblioteca
 * inteira para dentro do pacote que o visitante baixa.
 */
export const PASTAS = [
  "vitrine",
  "depoimentos",
  "equipe",
  "cases",
  "logos",
  "blog",
] as const;

export type Pasta = (typeof PASTAS)[number];

/** A pasta chega da rede como texto qualquer; aqui ela vira uma das nossas. */
export function pastaValida(valor: string): valor is Pasta {
  return (PASTAS as readonly string[]).includes(valor);
}
