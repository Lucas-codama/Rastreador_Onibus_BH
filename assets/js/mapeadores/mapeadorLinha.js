import { normalizarCodigoLinha, obterCodigoBaseLinha } from "../utilitarios/utilitariosLinha.js";

/**
 * Converte um registro bruto do CSV de linhas em uma linha usada pela aplicacao.
 *
 * A funcao normaliza o codigo completo, extrai o codigo base e prepara o
 * numero da linha para comparacoes com os dados da API.
 *
 * @param {Object} registro - Registro bruto de linha vindo do CSV.
 * @returns {Object|null} Linha formatada ou null caso o codigo seja invalido.
 */
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

/**
 * Converte um ponto de onibus em uma linha usada nos filtros da aplicacao.
 *
 * @param {Object} ponto - Ponto de onibus ja mapeado pela aplicacao.
 * @returns {Object} Linha com codigo e nome obtidos a partir do ponto.
 */
export function mapearLinhaPonto(ponto) {
  return {
    codigo: ponto.linha,
    nome: ponto.nomeLinha
  };
}
