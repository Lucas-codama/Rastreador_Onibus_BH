import { CONFIGURACOES_APLICACAO } from "./configuracoes/configuracoesAplicacao.js";
import { estadoAplicacao } from "./nucleo/estadoAplicacao.js";
import { registrarProjecaoUtm } from "./utilitarios/utilitariosCoordenadas.js";
import { linhasCorrespondem } from "./utilitarios/utilitariosLinha.js";
import { calcularDistanciaMetros, formatarDistancia } from "./utilitarios/utilitariosDistancia.js";
import { buscarOnibusAtivos } from "./servicos/servicoApiOnibus.js";
import {
  carregarPontos,
  filtrarPontosPorLinha,
  obterLinhasDosPontos
} from "./servicos/servicoPontos.js";
import {
  carregarLinhasCadastradas,
  criarMapaNumeroLinha,
  enriquecerLinhasComCadastro
} from "./servicos/servicoLinhas.js";
import { obterLocalizacaoUsuario } from "./servicos/servicoGeolocalizacao.js";
import {
  configurarEventosBarraLateral,
  preencherSeletorLinhas,
  selecionarLinhaNaInterface,
  atualizarControlesBarraLateral
} from "./interface/visaoBarraLateral.js";
import {
  ajustarMapaAosItens,
  centralizarMapaEmBh,
  inicializarMapa,
  renderizarLocalizacaoUsuario,
  renderizarOnibus,
  renderizarPontos
} from "./interface/visaoMapa.js";
import {
  atualizarAlertaStatus,
  atualizarResumoStatus,
  atualizarTempoDesdeAtualizacao
} from "./interface/visaoStatus.js";

function obterOnibusVisiveis() {
  if (!estadoAplicacao.linhaSelecionada) {
    return estadoAplicacao.onibus;
  }

  return estadoAplicacao.onibus.filter((onibus) =>
    linhasCorrespondem(onibus.linha, estadoAplicacao.linhaSelecionada)
  );
}

function obterPontosVisiveis() {
  if (!estadoAplicacao.linhaSelecionada) {
    return [];
  }

  return filtrarPontosPorLinha(estadoAplicacao.pontos, estadoAplicacao.linhaSelecionada);
}

function calcularPontoMaisProximo(pontos) {
  if (!estadoAplicacao.localizacaoUsuario || pontos.length === 0) {
    return null;
  }

  return pontos.reduce((maisProximo, ponto) => {
    const distancia = calcularDistanciaMetros(estadoAplicacao.localizacaoUsuario, ponto);

    if (!maisProximo || distancia < maisProximo.distanciaMetros) {
      return {
        ...ponto,
        distanciaMetros: distancia
      };
    }

    return maisProximo;
  }, null);
}

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

async function atualizarOnibus({ exibirMensagem = false } = {}) {
  if (estadoAplicacao.atualizando) {
    return;
  }

  estadoAplicacao.atualizando = true;

  if (exibirMensagem) {
    atualizarAlertaStatus("Atualizando posicoes dos onibus...", "info");
  }

  try {
    estadoAplicacao.onibus = await buscarOnibusAtivos(estadoAplicacao.mapaNumeroLinha);
    estadoAplicacao.ultimaAtualizacao = new Date();
    renderizarEstado();
    atualizarAlertaStatus("Dados atualizados com sucesso.", "success");
  } catch (erro) {
    console.error(erro);
    atualizarAlertaStatus(
      "Nao foi possivel carregar os onibus agora. Verifique a conexao e tente novamente.",
      "danger"
    );
  } finally {
    estadoAplicacao.atualizando = false;
  }
}

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

function limparFiltro() {
  estadoAplicacao.linhaSelecionada = "";
  estadoAplicacao.localizacaoUsuario = null;
  estadoAplicacao.pontoMaisProximo = null;
  selecionarLinhaNaInterface("");
  renderizarEstado();
  centralizarMapaEmBh();
  atualizarAlertaStatus("Filtro removido. Exibindo todos os onibus ativos.", "info");
}

function iniciarAtualizacaoAutomatica() {
  window.clearInterval(estadoAplicacao.temporizadorAtualizacao);
  estadoAplicacao.temporizadorAtualizacao = window.setInterval(
    () => atualizarOnibus(),
    CONFIGURACOES_APLICACAO.intervaloAtualizacaoMs
  );
}

function iniciarRelogioAtualizacao() {
  window.setInterval(
    () => atualizarTempoDesdeAtualizacao(estadoAplicacao.ultimaAtualizacao),
    1000
  );
}

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
    atualizarAlertaStatus(
      "Erro ao iniciar o sistema. Confira os arquivos CSV e as bibliotecas carregadas.",
      "danger"
    );
  }
}

document.addEventListener("DOMContentLoaded", inicializarAplicacao);
