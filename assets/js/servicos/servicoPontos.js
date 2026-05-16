import { CONFIGURACOES_APLICACAO } from "../configuracoes/configuracoesAplicacao.js";
import { mapearPonto } from "../mapeadores/mapeadorPonto.js";
import { mapearLinhaPonto } from "../mapeadores/mapeadorLinha.js";
import { carregarCsv } from "./servicoCsv.js";
import { linhasCorrespondem, ordenarLinhas } from "../utilitarios/utilitariosLinha.js";

/**
 * Carrega e mapeia os pontos do CSV configurado na aplicação.
 *
 * @returns {Promise<Object[]>} Lista de pontos carregados.
 */
export async function carregarPontos() {
  const registros = await carregarCsv(CONFIGURACOES_APLICACAO.caminhosCsv.pontos);

  return registros
    .map(mapearPonto)
    .filter(Boolean);
}

/**
 * Filtra os pontos pela linha selecionada.
 *
 * @param {Object[]} pontos - Lista de pontos.
 * @param {Object} linhaSelecionada - Linha usada no filtro.
 * @returns {Object[]} Pontos correspondentes à linha selecionada.
 */
export function filtrarPontosPorLinha(pontos, linhaSelecionada) {
  return pontos.filter((ponto) => linhasCorrespondem(ponto.linha, linhaSelecionada));
}

/**
 * Retorna as linhas únicas presentes na lista de pontos.
 *
 * @param {Object[]} pontos - Lista de pontos.
 * @returns {Object[]} Lista ordenada de linhas.
 */
export function obterLinhasDosPontos(pontos) {
  const linhasPorCodigo = new Map();

  pontos.forEach((ponto) => {
    if (!linhasPorCodigo.has(ponto.linha)) {
      linhasPorCodigo.set(ponto.linha, mapearLinhaPonto(ponto));
    }
  });

  return ordenarLinhas([...linhasPorCodigo.values()]);
}
