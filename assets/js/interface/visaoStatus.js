const elementos = {
  alerta: document.getElementById("alerta-status"),
  quantidadeOnibus: document.getElementById("quantidade-onibus"),
  quantidadePontos: document.getElementById("quantidade-pontos"),
  linhaSelecionada: document.getElementById("linha-selecionada"),
  pontoMaisProximo: document.getElementById("ponto-mais-proximo"),
  ultimaAtualizacao: document.getElementById("ultima-atualizacao"),
  atualizadoHa: document.getElementById("atualizado-ha")
};

/**
 * Atualiza a mensagem de alerta exibida no painel de status.
 *
 * @param {string} mensagem - Texto que sera exibido para o usuario.
 * @param {string} [tipo="info"] - Tipo visual do alerta, como info, success, warning ou danger.
 * @returns {void}
 */
export function atualizarAlertaStatus(mensagem, tipo = "info") {
  elementos.alerta.textContent = mensagem;
  elementos.alerta.className = `alert alert-${tipo} py-2 mb-3`;
}

/**
 * Atualiza os dados resumidos exibidos no painel de status.
 *
 * @param {object} resumo - Dados atuais que devem aparecer na interface.
 * @param {number} [resumo.quantidadeOnibus=0] - Quantidade de onibus exibidos no mapa.
 * @param {number} [resumo.quantidadePontos=0] - Quantidade de pontos de onibus carregados.
 * @param {string} [resumo.linhaSelecionada=""] - Codigo da linha filtrada no momento.
 * @param {string} [resumo.pontoMaisProximo="Nao calculado"] - Texto do ponto mais proximo do usuario.
 * @param {Date | null} [resumo.ultimaAtualizacao=null] - Data e hora da ultima atualizacao dos dados.
 * @returns {void}
 */
export function atualizarResumoStatus({
  quantidadeOnibus = 0,
  quantidadePontos = 0,
  linhaSelecionada = "",
  pontoMaisProximo = "Nao calculado",
  ultimaAtualizacao = null
}) {
  elementos.quantidadeOnibus.textContent = quantidadeOnibus;
  elementos.quantidadePontos.textContent = quantidadePontos;
  elementos.linhaSelecionada.textContent = linhaSelecionada || "Todas";
  elementos.pontoMaisProximo.textContent = pontoMaisProximo;
  elementos.ultimaAtualizacao.textContent = ultimaAtualizacao
    ? ultimaAtualizacao.toLocaleTimeString("pt-BR")
    : "--:--:--";
  atualizarTempoDesdeAtualizacao(ultimaAtualizacao);
}

/**
 * Mostra quanto tempo passou desde a ultima atualizacao dos dados.
 *
 * @param {Date | null} ultimaAtualizacao - Data e hora da ultima atualizacao feita pela aplicacao.
 * @returns {void}
 */
export function atualizarTempoDesdeAtualizacao(ultimaAtualizacao) {
  if (!ultimaAtualizacao) {
    elementos.atualizadoHa.textContent = "--";
    return;
  }

  const milissegundosDesdeAtualizacao = Date.now() - ultimaAtualizacao.getTime();
  const segundos = Math.max(0, Math.floor(milissegundosDesdeAtualizacao / 1000));

  if (segundos < 60) {
    elementos.atualizadoHa.textContent = `${segundos}s`;
    return;
  }

  elementos.atualizadoHa.textContent = `${Math.floor(segundos / 60)}min`;
}
