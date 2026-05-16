import { CONFIGURACOES_APLICACAO } from "../configuracoes/configuracoesAplicacao.js";
import { mapearOnibus } from "../mapeadores/mapeadorOnibus.js";




/**
 * Obtém o timestamp de atualização de um ônibus.
 *
 * @param {Object} onibus - Objeto de ônibus já mapeado pela aplicação.
 * @returns {number} Timestamp do ônibus em milissegundos ou 0.
 */
function obterTimestampOnibus(onibus) {
  return onibus.horarioMs || 0;
}




/**
 * Remove ônibus duplicados com base no identificador do veículo.
 *
 * Quando existem vários registros do mesmo veículo, a função mantém
 * apenas o registro mais recente, comparando o horário em milissegundos
 * de cada item.
 *
 * @param {Object[]} onibus - Lista de ônibus mapeados.
 * @returns {Object[]} Lista de ônibus sem duplicidade por veículo.
 */
function deduplicarOnibusPorVeiculo(onibus) {
  const onibusPorVeiculo = new Map();

  onibus.forEach((item) => {
    const existente = onibusPorVeiculo.get(item.veiculo);

    if (!existente || obterTimestampOnibus(item) > obterTimestampOnibus(existente)) {
      onibusPorVeiculo.set(item.veiculo, item);
    }
  });

  return [...onibusPorVeiculo.values()];
}




/**
 * Aplica o nome ou número tratado das linhas aos objetos de ônibus.
 *
 * @param {Object[]} onibus - Lista de ônibus mapeados.
 * @param {Map<string, string>} mapaNumeroLinha - Mapa de conversão dos códigos das linhas.
 * @returns {Object[]} Lista de ônibus com a linha ajustada para exibição.
 */
function aplicarMapaLinhas(onibus, mapaNumeroLinha) {
  return onibus.map((item) => ({
    ...item,
    linha: mapaNumeroLinha.get(item.linhaApi) ?? item.linhaApi
  }));
}




/**
 * Filtra os ônibus que possuem posição recente.
 *
 * @param {Object[]} onibus - Lista de ônibus mapeados.
 * @returns {Object[]} Lista contendo apenas ônibus com posições recentes.
 */
function filtrarPosicoesRecentes(onibus) {
  const agora = Date.now();
  const idadeMaximaMs = CONFIGURACOES_APLICACAO.idadeMaximaPosicaoMinutos * 60 * 1000;

  return onibus.filter((item) =>
    item.horarioMs && agora - item.horarioMs <= idadeMaximaMs
  );
}




/**
 * Busca os dados de ônibus em uma URL da API.
 *
 * A função cria um limite de tempo para a requisição usando AbortController.
 * Se a API demorar mais do que o permitido nas configurações, a requisição
 * é cancelada. Após receber os dados, os registros são mapeados e os itens
 * inválidos são removidos.
 *
 * @param {string} url - URL da API que será consultada.
 * @returns {Promise<Object[]>} Lista de ônibus mapeados e válidos.
 * @throws {Error} Lança erro caso a resposta HTTP não seja bem-sucedida.
 */
async function buscarDadosEmUrl(url) {
  const controlador = new AbortController();

  const temporizador = window.setTimeout(() => {controlador.abort();}, CONFIGURACOES_APLICACAO.tempoLimiteApiMs);

  try {
    const resposta = await fetch(url, {
      cache: "no-store",
      signal: controlador.signal
    });

    if (!resposta.ok) {
      throw new Error(`Falha ao buscar onibus: HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();
    return dados.map(mapearOnibus).filter(Boolean);
    
  } finally {
    window.clearTimeout(temporizador);
  }
}




/**
 * Busca os ônibus ativos usando a URL principal e URLs alternativas.
 *
 * A função tenta consultar primeiro a URL principal da API. Caso ocorra erro,
 * tenta as URLs alternativas em sequência. Quando uma consulta funciona,
 * os dados são deduplicados por veículo, filtrados para manter apenas
 * posições recentes e ajustados com o mapa de linhas.
 *
 * @param {Map<string, string>} [mapaNumeroLinha=new Map()] - Mapa opcional para converter códigos de linha da API.
 * @returns {Promise<Object[]>} Lista final de ônibus ativos, recentes e prontos para exibição.
 * @throws {Error} Lança um erro com as mensagens de todas as tentativas caso nenhuma URL funcione.
 */
export async function buscarOnibusAtivos(mapaNumeroLinha = new Map()) {
  const urls = [ CONFIGURACOES_APLICACAO.urlApi, ...CONFIGURACOES_APLICACAO.urlsApiAlternativas];
  const erros = [];

  for (const url of urls) {
    try {
      const onibus = await buscarDadosEmUrl(url);
      return aplicarMapaLinhas( filtrarPosicoesRecentes(deduplicarOnibusPorVeiculo(onibus)), mapaNumeroLinha);

    } catch (erro) {
      erros.push(erro.message);
    }
  }

  throw new Error(erros.join(" | "));
}