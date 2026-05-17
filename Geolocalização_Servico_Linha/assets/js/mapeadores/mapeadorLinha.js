import {
  normalizarCodigoLinha,
  obterCodigoBaseLinha
} from "../utilitarios/utilitariosLinha.js";

export function mapearLinhaCsv(registro) {
  const codigoCompleto = normalizarCodigoLinha(registro.Linha);
  const codigo = obterCodigoBaseLinha(codigoCompleto);
  const numeroLinha = normalizarCodigoLinha(registro.NumeroLinha);

  if (!codigo) {
    return null;
  }

  return {
    numeroLinha,
    codigo,
    codigoCompleto,
    nome: String(registro.Nome ?? "")
  };
}

export function mapearLinhaPonto(ponto) {
  return {
    codigo: ponto.linha,
    nome: ponto.nomeLinha
  };
}
