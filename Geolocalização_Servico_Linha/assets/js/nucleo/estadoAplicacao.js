export const estadoAplicacao = {
  mapa: null,
  onibus: [],
  pontos: [],
  linhas: [],
  linhasCadastradas: [],
  mapaNumeroLinha: new Map(),
  linhaSelecionada: "",
  localizacaoUsuario: null,
  pontoMaisProximo: null,
  temporizadorAtualizacao: null,
  atualizando: false,
  dadosCarregados: false,
  ultimaAtualizacao: null
};
