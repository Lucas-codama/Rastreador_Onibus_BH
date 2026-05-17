import {
  converterUtmParaLatLng,
  coordenadasValidas,
  extrairCoordenadasUtm
} from "../utilitarios/utilitariosCoordenadas.js";
import { normalizarCodigoLinha } from "../utilitarios/utilitariosLinha.js";

export function mapearPonto(registro) {
  const coordenadasUtm = extrairCoordenadasUtm(registro.GEOMETRIA);

  if (!coordenadasUtm) {
    return null;
  }

  const { lat, lng } = converterUtmParaLatLng(coordenadasUtm.x, coordenadasUtm.y);

  if (!coordenadasValidas(lat, lng)) {
    return null;
  }

  return {
    id: String(registro.ID_PONTO_ONIBUS_LINHA ?? registro.IDENTIFICADOR_PONTO_ONIBUS),
    linha: normalizarCodigoLinha(registro.COD_LINHA),
    nomeLinha: String(registro.NOME_LINHA ?? "Linha sem nome"),
    subLinha: String(registro.NOME_SUB_LINHA ?? ""),
    origem: String(registro.ORIGEM ?? ""),
    identificador: String(registro.IDENTIFICADOR_PONTO_ONIBUS ?? ""),
    lat,
    lng
  };
}
