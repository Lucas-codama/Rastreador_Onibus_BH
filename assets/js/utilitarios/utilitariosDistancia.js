const RAIO_TERRA_METROS = 6371000;




/**
 * Converte um valor angular de graus para radianos.
 * Essa conversão é necessária antes de aplicar operações como seno, cosseno e arco seno.
 *
 * @param {number} valor - Valor angular em graus.
 * @returns {number} Valor angular convertido para radianos.
 */
function grausParaRadianos(valor) {
  return valor * Math.PI / 180;
}




/**
 * Calcula a distância aproximada entre dois pontos geográficos.
 *
 * A função utiliza a fórmula de Haversine para calcular a distância entre
 * duas coordenadas na superfície da Terra, considerando a curvatura do
 * planeta.
 *
 * @param {{ lat: number, lng: number }} origem - Coordenada geográfica inicial.
 * @param {{ lat: number, lng: number }} destino - Coordenada geográfica final.
 * @returns {number} Distância aproximada entre os pontos, em metros.
 */
export function calcularDistanciaMetros(origem, destino) {
  const latitudeOrigem = grausParaRadianos(origem.lat);
  const latitudeDestino = grausParaRadianos(destino.lat);

  const longitudeOrigem = grausParaRadianos(origem.lng);
  const longitudeDestino = grausParaRadianos(destino.lng);

  const parteInternaDaRaiz =
    Math.sin((latitudeDestino - latitudeOrigem) / 2) ** 2 +
    Math.cos(latitudeOrigem) *
      Math.cos(latitudeDestino) *
      Math.sin((longitudeDestino - longitudeOrigem) / 2) ** 2;

  return 2 * RAIO_TERRA_METROS * Math.asin(Math.sqrt(parteInternaDaRaiz));
}




/**
 * Formata uma distância em metros para exibição textual.
 * 
 * @param {number} metros - Distância em metros.
 * @returns {string} Distância formatada para exibição.
 */
export function formatarDistancia(metros) {
  if (Number.isFinite(metros)) {
    if (metros < 1000) return Math.round(metros) + " m";

    const quilometros = metros / 1000;
    const texto = quilometros.toFixed(2).replace(".", ",");

    return texto + " km";
  } else {
    return "";
  }
}