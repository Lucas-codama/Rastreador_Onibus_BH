const elementos = {
  alerta: document.getElementById("alerta-status"),
  quantidadeOnibus: document.getElementById("quantidade-onibus"),
  quantidadePontos: document.getElementById("quantidade-pontos"),
  linhaSelecionada: document.getElementById("linha-selecionada"),
  pontoMaisProximo: document.getElementById("ponto-mais-proximo"),
  ultimaAtualizacao: document.getElementById("ultima-atualizacao"),
  atualizadoHa: document.getElementById("atualizado-ha")
};

export function atualizarAlertaStatus(mensagem, tipo = "info") {
  elementos.alerta.textContent = mensagem;
  elementos.alerta.className = `alert alert-${tipo} py-2 mb-3`;
}

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

export function atualizarTempoDesdeAtualizacao(ultimaAtualizacao) {
  if (!ultimaAtualizacao) {
    elementos.atualizadoHa.textContent = "--";
    return;
  }

  const segundos = Math.max(0, Math.floor((Date.now() - ultimaAtualizacao.getTime()) / 1000));

  if (segundos < 60) {
    elementos.atualizadoHa.textContent = `${segundos}s`;
    return;
  }

  elementos.atualizadoHa.textContent = `${Math.floor(segundos / 60)}min`;
}
