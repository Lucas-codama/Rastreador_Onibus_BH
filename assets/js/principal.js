import { CONFIGURACOES_APLICACAO } from "./configuracoes/configuracoesAplicacao.js";
import { estadoAplicacao } from "./nucleo/estadoAplicacao.js";
import { registrarProjecaoUtm } from "./utilitarios/utilitariosCoordenadas.js";
import { linhasCorrespondem } from "./utilitarios/utilitariosLinha.js";
import { calcularDistanciaMetros, formatarDistancia } from "./utilitarios/utilitariosDistancia.js";
import { buscarOnibusAtivos } from "./servicos/servicoApiOnibus.js";
import { carregarPontos, filtrarPontosPorLinha, obterLinhasDosPontos } from "./servicos/servicoPontos.js";
import { carregarLinhasCadastradas, criarMapaNumeroLinha, enriquecerLinhasComCadastro } from "./servicos/servicoLinhas.js";
import { obterLocalizacaoUsuario } from "./servicos/servicoGeolocalizacao.js";
import { configurarEventosBarraLateral, preencherSeletorLinhas, selecionarLinhaNaInterface, atualizarControlesBarraLateral } from "./interface/visaoBarraLateral.js";
import { ajustarMapaAosItens, centralizarMapaEmBh, inicializarMapa, renderizarLocalizacaoUsuario, renderizarOnibus, renderizarPontos } from "./interface/visaoMapa.js";
import { atualizarAlertaStatus, atualizarResumoStatus, atualizarTempoDesdeAtualizacao } from "./interface/visaoStatus.js";




/**
 * Retorna os onibus que devem aparecer no mapa conforme a linha selecionada.
 *
 * @returns {Object[]} Lista de onibus visiveis no estado atual da aplicacao.
 */
function obterOnibusVisiveis() {
  if (!estadoAplicacao.linhaSelecionada) return estadoAplicacao.onibus;
  return estadoAplicacao.onibus.filter((onibus) => linhasCorrespondem(onibus.linha, estadoAplicacao.linhaSelecionada));
}




/**
 * Retorna os pontos de onibus visiveis para a linha selecionada.
 *
 * @returns {Object[]} Lista de pontos filtrados ou lista vazia quando nenhuma linha esta selecionada.
 */
function obterPontosVisiveis() {
  if (!estadoAplicacao.linhaSelecionada) return [];
  return filtrarPontosPorLinha(estadoAplicacao.pontos, estadoAplicacao.linhaSelecionada);
}




/**
 * Calcula qual ponto de onibus esta mais proximo da localizacao do usuario.
 *
 * @param {Object[]} pontos - Pontos candidatos ao calculo de proximidade.
 * @returns {Object|null} Ponto mais proximo com distancia em metros ou null quando nao for possivel calcular.
 */
function calcularPontoMaisProximo(pontos) {
  if (!estadoAplicacao.localizacaoUsuario || pontos.length === 0) return null;
  
  return pontos.reduce((maisProximo, ponto) => {
    const distancia = calcularDistanciaMetros(estadoAplicacao.localizacaoUsuario, ponto);

    if (!maisProximo || distancia < maisProximo.distanciaMetros) 
      return { ...ponto, distanciaMetros: distancia};

    return maisProximo;

  }, null);
}




/**
 * Atualiza o painel de resumo com as quantidades e informacoes do estado atual.
 *
 * @param {Object[]} onibusVisiveis - Onibus exibidos no mapa.
 * @param {Object[]} pontosVisiveis - Pontos exibidos no mapa.
 */
function atualizarResumo(onibusVisiveis, pontosVisiveis) {

  const pontoMaisProximo = estadoAplicacao.pontoMaisProximo
    ? `${estadoAplicacao.pontoMaisProximo.identificador} (${formatarDistancia(estadoAplicacao.pontoMaisProximo.distanciaMetros)})`
    : "Nao calculado";

  atualizarResumoStatus({
    quantidadeOnibus: onibusVisiveis.length,
    quantidadePontos: pontosVisiveis.length,
    linhaSelecionada: estadoAplicacao.linhaSelecionada,
    pontoMaisProximo,
    ultimaAtualizacao: estadoAplicacao.ultimaAtualizacao
  });
}




/**
 * Renderiza todos os elementos visuais que dependem do estado da aplicacao.
 *
 * @param {Object} [opcoes={}] - Opcoes de renderizacao.
 * @param {boolean} [opcoes.ajustarMapa=false] - Indica se o mapa deve ser ajustado aos itens visiveis.
 */
function renderizarEstado({ ajustarMapa = false } = {}) {
  const onibusVisiveis = obterOnibusVisiveis();
  const pontosVisiveis = obterPontosVisiveis();

  estadoAplicacao.pontoMaisProximo = calcularPontoMaisProximo(pontosVisiveis);

  renderizarOnibus(onibusVisiveis);
  renderizarPontos(pontosVisiveis, estadoAplicacao.pontoMaisProximo);
  renderizarLocalizacaoUsuario(estadoAplicacao.localizacaoUsuario);
  atualizarResumo(onibusVisiveis, pontosVisiveis);
  atualizarControlesBarraLateral(estadoAplicacao);

  if (ajustarMapa) {
    ajustarMapaAosItens([
      ...onibusVisiveis,
      ...pontosVisiveis,
      estadoAplicacao.localizacaoUsuario
    ].filter(Boolean));
  }
}




/**
 * Busca as posicoes atuais dos onibus e atualiza o estado da aplicacao.
 *
 * @param {Object} [opcoes={}] - Opcoes da atualizacao.
 * @param {boolean} [opcoes.exibirMensagem=false] - Indica se a mensagem de carregamento deve ser exibida.
 * @returns {Promise<void>}
 */
async function atualizarOnibus({ exibirMensagem = false } = {}) {
  if (estadoAplicacao.atualizando) return;
  
  estadoAplicacao.atualizando = true;

  if (exibirMensagem) atualizarAlertaStatus("Atualizando posicoes dos onibus...", "info");

  try {
    estadoAplicacao.onibus = await buscarOnibusAtivos(estadoAplicacao.mapaNumeroLinha);
    estadoAplicacao.ultimaAtualizacao = new Date();
    renderizarEstado();
    atualizarAlertaStatus("Dados atualizados com sucesso.", "success");

  } catch (erro) {
    console.error(erro);
    atualizarAlertaStatus("Nao foi possivel carregar os onibus agora. Verifique a conexao e tente novamente.", "danger");

  } finally {
    estadoAplicacao.atualizando = false;

  }
}




/**
 * Carrega os dados fixos de pontos e linhas usados pela aplicacao.
 *
 * @returns {Promise<void>}
 */
async function carregarDadosFixos() {
  atualizarAlertaStatus("Carregando pontos e linhas...", "info");

  estadoAplicacao.pontos = await carregarPontos();
  const linhasDosPontos = obterLinhasDosPontos(estadoAplicacao.pontos);

  try {
    estadoAplicacao.linhasCadastradas = await carregarLinhasCadastradas();
    estadoAplicacao.mapaNumeroLinha = criarMapaNumeroLinha(estadoAplicacao.linhasCadastradas);
    estadoAplicacao.linhas = enriquecerLinhasComCadastro(linhasDosPontos, estadoAplicacao.linhasCadastradas);

  } catch (erro) {
    console.warn("Nao foi possivel carregar o cadastro de linhas.", erro);
    estadoAplicacao.linhas = linhasDosPontos;

  }

  preencherSeletorLinhas(estadoAplicacao.linhas);
  estadoAplicacao.dadosCarregados = true;
}




/**
 * Aplica uma linha selecionada ao estado e atualiza a interface.
 *
 * @param {string} linha - Codigo da linha selecionada ou texto vazio para limpar o filtro.
 */
function selecionarLinha(linha) {
  estadoAplicacao.linhaSelecionada = linha;
  estadoAplicacao.pontoMaisProximo = null;

  if (!linha) {
    estadoAplicacao.localizacaoUsuario = null;
    renderizarEstado();
    atualizarAlertaStatus("Visao geral: todos os onibus ativos no mapa.", "info");
    centralizarMapaEmBh();
    return;
  }

  renderizarEstado({ ajustarMapa: true });
  atualizarAlertaStatus(`Filtro aplicado para a linha ${linha}.`, "info");
}




/**
 * Solicita a localizacao do usuario e recalcula o ponto mais proximo.
 *
 * @returns {Promise<void>}
 */
async function usarLocalizacao() {
  if (!estadoAplicacao.linhaSelecionada) {
    atualizarAlertaStatus("Selecione uma linha antes de usar a localizacao.", "warning");
    return;
  }

  atualizarAlertaStatus("Solicitando sua localizacao...", "info");

  try {
    estadoAplicacao.localizacaoUsuario = await obterLocalizacaoUsuario();
    renderizarEstado({ ajustarMapa: true });
    atualizarAlertaStatus("Ponto mais proximo calculado.", "success");

  } catch (erro) {
    console.error(erro);
    atualizarAlertaStatus(erro.message, "warning");

  }
}




/**
 * Remove o filtro de linha e restaura a visualizacao geral do mapa.
 */
function limparFiltro() {
  estadoAplicacao.linhaSelecionada = "";
  estadoAplicacao.localizacaoUsuario = null;
  estadoAplicacao.pontoMaisProximo = null;
  selecionarLinhaNaInterface("");
  renderizarEstado();
  centralizarMapaEmBh();
  atualizarAlertaStatus("Filtro removido. Exibindo todos os onibus ativos.", "info");
}




/**
 * Inicia a atualizacao automatica das posicoes dos onibus.
 */
function iniciarAtualizacaoAutomatica() {
  window.clearInterval(estadoAplicacao.temporizadorAtualizacao);
  estadoAplicacao.temporizadorAtualizacao = window.setInterval(
    () => atualizarOnibus(),
    CONFIGURACOES_APLICACAO.intervaloAtualizacaoMs
  );
}




/**
 * Inicia o relogio que mostra quanto tempo passou desde a ultima atualizacao.
 */
function iniciarRelogioAtualizacao() {
  window.setInterval(
    () => atualizarTempoDesdeAtualizacao(estadoAplicacao.ultimaAtualizacao),
    1000
  );
}




/**
 * Inicializa a aplicacao, carrega dados, configura eventos e inicia atualizacoes.
 *
 * @returns {Promise<void>}
 */
async function inicializarAplicacao() {
  try {
    registrarProjecaoUtm();
    estadoAplicacao.mapa = inicializarMapa();

    configurarEventosBarraLateral({
      aoSelecionarLinha: selecionarLinha,
      aoUsarLocalizacao: usarLocalizacao,
      aoLimparFiltro: limparFiltro,
      aoAtualizar: () => atualizarOnibus({ exibirMensagem: true }),
      aoCentralizar: centralizarMapaEmBh
    });

    await carregarDadosFixos();
    renderizarEstado();
    await atualizarOnibus({ exibirMensagem: true });
    iniciarAtualizacaoAutomatica();
    iniciarRelogioAtualizacao();

  } catch (erro) {
    console.error(erro);
    atualizarAlertaStatus("Erro ao iniciar o sistema. Confira os arquivos CSV e as bibliotecas carregadas.", "danger");

  }
}




document.addEventListener("DOMContentLoaded", inicializarAplicacao);