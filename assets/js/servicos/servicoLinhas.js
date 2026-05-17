import { CONFIGURACOES_APLICACAO } from "../configuracoes/configuracoesAplicacao.js";
import { mapearLinhaCsv } from "../mapeadores/mapeadorLinha.js";
import { carregarCsv } from "./servicoCsv.js";
import { linhasCorrespondem, ordenarLinhas } from "../utilitarios/utilitariosLinha.js";

/**
 * Carrega as linhas cadastradas no arquivo CSV.
 * @returns {Promise<Array>}
 */
export async function carregarLinhasCadastradas() {
  const caminho = CONFIGURACOES_APLICACAO.caminhosCsv.linhas;
  const registros = await carregarCsv(caminho);

  return registros
    .map(mapearLinhaCsv)
    .filter((linha) => Boolean(linha));
}

/**
 * Adiciona os nomes cadastrados às linhas vindas dos pontos.
 * @param {Array} linhasDosPontos
 * @param {Array} linhasCadastradas
 * @returns {Array}
 */
export function enriquecerLinhasComCadastro(linhasDosPontos, linhasCadastradas) {
  const linhas = linhasDosPontos.map((linha) => {
    const cadastro = linhasCadastradas.find((item) => {
      return linhasCorrespondem(item.codigo, linha.codigo);
    });

    return {
      ...linha,
      nome: linha.nome || cadastro?.nome || ""
    };
  });

  return ordenarLinhas(linhas);
}

/**
 * Cria um mapa relacionando número da linha e código.
 * @param {Array} linhasCadastradas
 * @returns {Map}
 */
export function criarMapaNumeroLinha(linhasCadastradas) {
  const mapa = new Map();

  for (const linha of linhasCadastradas) {
    if (linha.numeroLinha && !mapa.has(linha.numeroLinha)) {
      mapa.set(linha.numeroLinha, linha.codigo);
    }
  }

  return mapa;
}
