import { CONFIGURACOES_APLICACAO } from "../configuracoes/configuracoesAplicacao.js";

/**
 * Registra a projeção UTM usada pela aplicação na biblioteca proj4.
 */
export function registrarProjecaoUtm() {
  const { utm, definicaoUtm } = CONFIGURACOES_APLICACAO.projecao;
  window.proj4.defs(utm, definicaoUtm);
}

/**
 * Extrai as coordenadas UTM de uma geometria no formato POINT.
 *
 * @param {string | null | undefined} geometria - Texto contendo a geometria.
 * @returns {{ x: number, y: number } | null} Coordenadas UTM extraídas ou null se o formato for inválido.
 */
export function extrairCoordenadasUtm(geometria) {
  const texto = String(geometria ?? "").trim();

  if (texto.toUpperCase().startsWith("POINT")) {
    const inicio = texto.indexOf("(");
    const fim = texto.indexOf(")");

    if (inicio === -1 || fim === -1) return null;

    const conteudo = texto.slice(inicio + 1, fim).trim();

    const partes = conteudo.split(" ");

    if (partes.length < 2) return null;

    const x = Number(partes[0]);
    const y = Number(partes[1]);

    if (isNaN(x) || isNaN(y)) return null;

    return { x, y };

  } else return null;
}

/**
 * Converte coordenadas UTM para latitude e longitude.
 *
 * @param {number} x - Coordenada X em UTM.
 * @param {number} y - Coordenada Y em UTM.
 * @returns {{ lat: number, lng: number }} Coordenadas convertidas para latitude e longitude.
 */
export function converterUtmParaLatLng(x, y) {
  const { utm, latLng } = CONFIGURACOES_APLICACAO.projecao;
  const [lng, lat] = window.proj4(utm, latLng, [x, y]);

  return { lat, lng };
}

/**
 * Verifica se uma latitude e uma longitude são válidas.
 *
 * @param {number} lat - Latitude.
 * @param {number} lng - Longitude.
 * @returns {boolean} Retorna true se as coordenadas forem válidas; caso contrário, false.
 */
export function coordenadasValidas(lat, lng) {
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= -90
    && lat <= 90
    && lng >= -180
    && lng <= 180;
}