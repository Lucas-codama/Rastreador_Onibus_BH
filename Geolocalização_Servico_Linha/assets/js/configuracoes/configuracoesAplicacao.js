export const CONFIGURACOES_APLICACAO = {
  urlApi: "https://corsproxy.io/?url=https%3A%2F%2Ftemporeal.pbh.gov.br%2F%3Fparam%3DD",
  urlsApiAlternativas: [
  "https://corsproxy.io/?url=https://temporeal.pbh.gov.br/?param=D",
  "https://proxy.corsfix.com/?https://temporeal.pbh.gov.br/?param=D"
  ],
  tempoLimiteApiMs: 10000,
  idadeMaximaPosicaoMinutos: 240,
  limiteAnimacaoOnibus: 120,

  intervaloAtualizacaoMs: 20 * 1000,

  caminhosCsv: {
    linhas: "assets/data/bhtrans_bdlinha.csv",
    pontos: "assets/data/20260401_ponto_onibus.csv"
  },

  mapa: {
    centro: [-19.87418, -43.96510],
    zoomInicial: 15,
    zoomFiltrado: 15,
    zoomMinimoAjuste: 11,
    zoomMaximoAjuste: 16
  },

  projecao: {
    utm: "EPSG:31983",
    latLng: "EPSG:4326",
    definicaoUtm: "+proj=utm +zone=23 +south +ellps=GRS80 +units=m +no_defs"
  },

  camposApi: {
    latitude: "LT",
    longitude: "LG",
    linha: "NL",
    veiculo: "NV",
    horario: "HR",
    velocidade: "VL",
    direcao: "DG"
  },

  cores: {
    onibus: "#7c3aed",
    ponto: "#f59f00",
    pontoMaisProximo: "#bb35dc",
    usuario: "#198754"
  },

  marcadorOnibus: {
    largura: 30,
    altura: 30,
    larguraVisaoGeral: 10,
    alturaVisaoGeral: 10 
  },

  marcadorPonto: {
    raio: 5,
    espessuraBorda: 2,
    opacidadePreenchimento: 0.85
  },

  marcadorPontoMaisProximo: {
    raio: 8,
    espessuraBorda: 3,
    opacidadePreenchimento: 0.95
  },

  marcadorUsuario: {
    raio: 9,
    espessuraBorda: 3,
    opacidadePreenchimento: 0.9
  }
};

export const CONFIGURACOES_CAMADA_MAPA = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  atribuicao: "&copy; OpenStreetMap contributors"
};
