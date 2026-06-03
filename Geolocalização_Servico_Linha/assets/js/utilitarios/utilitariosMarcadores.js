import { CONFIGURACOES_APLICACAO } from "../configuracoes/configuracoesAplicacao.js";

/**
 * Converte um valor para texto seguro antes de inserir em HTML.
 *
 * @param {*} valor - Valor que será convertido para texto seguro.
 * @returns {string} Texto tratado para uso dentro de HTML.
 */
function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Cria o estilo visual de um marcador circular do Leaflet.
 *
 * @param {Object} tipo - Configurações visuais do marcador.
 * @param {string} cor - Cor de preenchimento do marcador.
 * @returns {Object} Objeto de estilo usado pelo L.circleMarker.
 */
function criarEstiloMarcador(tipo, cor) {
  return {
    radius: tipo.raio,
    weight: tipo.espessuraBorda,
    color: "#ffffff",
    fillColor: cor,
    fillOpacity: tipo.opacidadePreenchimente
  };
}

/**
 * Remove todos os marcadores de uma camada do mapa.
 *
 * @param {L.LayerGroup} camada - Camada do Leaflet que será limpa.
 */
export function limparCamada(camada) {
  camada.clearLayers();
}

/**
 * Cria o conteúdo HTML interno do marcador de ônibus.
 *
 * @param {Object} onibus - Dados do ônibus.
 * @param {Object} [opcoes={}] - Opções de exibição do marcador.
 * @returns {string} HTML usado dentro do ícone do ônibus.
 */
function criarConteudoOnibus(onibus, opcoes = {}) {
  const direcao = Number.isFinite(onibus.direcao) ? onibus.direcao : 0;

  const classes = [
    "marcador-onibus-roxo",
    opcoes.pequeno ? "marcador-onibus-roxo-pequeno" : "",
    onibus.velocidade <= 0 ? "marcador-onibus-parado" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="${classes}" style="transform: rotate(${direcao}deg)">
      <span class="triangulo-onibus-roxo"></span>
    </div>
  `;
}

/**
 * Cria um ícone personalizado de ônibus para o Leaflet.
 *
 * @param {Object} onibus - Dados do ônibus.
 * @param {Object} [opcoes={}] - Opções de exibição do ícone.
 * @returns {L.DivIcon} Ícone personalizado do ônibus.
 */
function criarIconeOnibus(onibus, opcoes = {}) {
  const { marcadorOnibus } = CONFIGURACOES_APLICACAO;

  const largura = opcoes.pequeno
    ? marcadorOnibus.larguraVisaoGeral
    : marcadorOnibus.largura;

  const altura = opcoes.pequeno
    ? marcadorOnibus.alturaVisaoGeral
    : marcadorOnibus.altura;

  return L.divIcon({
    className: "icone-onibus-roxo",
    html: criarConteudoOnibus(onibus, opcoes),
    iconSize: [largura, altura],
    iconAnchor: [largura / 2, altura / 2],
    popupAnchor: [0, -altura / 2]
  });
}

/**
 * Cria o HTML do popup de um ônibus.
 *
 * @param {Object} onibus - Dados do ônibus exibido no popup.
 * @returns {string} HTML do popup do ônibus.
 */
function criarPopupOnibus(onibus) {
  return `
    <strong class="popup-titulo">Onibus ${escaparHtml(onibus.veiculo)}</strong>
    <p class="popup-linha">Linha: ${escaparHtml(onibus.linha || "Nao informada")}</p>
    <p class="popup-linha">Velocidade: ${escaparHtml(onibus.velocidade)} km/h</p>
    <p class="popup-linha">Horario: ${escaparHtml(onibus.horarioFormatado)}</p>
  `;
}

/**
 * Cria um marcador de ônibus no mapa.
 *
 * @param {Object} onibus - Dados do ônibus.
 * @param {Object} [opcoes={}] - Opções de criação do marcador.
 * @returns {L.Marker|L.CircleMarker} Marcador do ônibus no Leaflet.
 */
export function criarMarcadorOnibus(onibus, opcoes = {}) {
  if (opcoes.pequeno) {
    const marcadorLeve = L.circleMarker(
      [onibus.lat, onibus.lng],
      {
        radius: 3,
        weight: 1,
        color: "#ffffff",
        fillColor: onibus.velocidade <= 0
          ? "#a78bfa"
          : CONFIGURACOES_APLICACAO.cores.onibus,
        fillOpacity: onibus.velocidade <= 0 ? 0.55 : 0.88,
        interactive: false
      }
    );

    return marcadorLeve;
  }

  const marcador = L.marker(
    [onibus.lat, onibus.lng],
    {
      icon: criarIconeOnibus(onibus, opcoes),
      keyboard: false,
      riseOnHover: true
    }
  );

  marcador.bindPopup(criarPopupOnibus(onibus));

  return marcador;
}

/**
 * Atualiza um marcador de ônibus já existente.
 *
 * @param {L.Marker|L.CircleMarker} marcador - Marcador já existente no mapa.
 * @param {Object} onibus - Dados atualizados do ônibus.
 * @param {Object} [opcoes={}] - Opções de atualização.
 */
export function atualizarMarcadorOnibus(marcador, onibus, opcoes = {}) {
  if (opcoes.pequeno) {
    return;
  }

  marcador.setIcon(criarIconeOnibus(onibus, opcoes));
  marcador.setPopupContent(criarPopupOnibus(onibus));
}

/**
 * Cria um marcador para um ponto de ônibus.
 *
 * A função pode criar um ponto comum ou o ponto mais próximo do usuário.
 * A diferença visual entre eles é definida pelas configurações de cor,
 * raio e borda.
 *
 * @param {Object} ponto - Dados do ponto de ônibus.
 * @param {boolean} [ehMaisProximo=false] - Indica se o ponto é o mais próximo do usuário.
 * @returns {L.CircleMarker} Marcador do ponto de ônibus.
 */
export function criarMarcadorPonto(ponto, ehMaisProximo = false) {
  const { cores, marcadorPonto, marcadorPontoMaisProximo } =
    CONFIGURACOES_APLICACAO;

  const tipo = ehMaisProximo ? marcadorPontoMaisProximo : marcadorPonto;
  const cor = ehMaisProximo ? cores.pontoMaisProximo : cores.ponto;

  const marcador = L.circleMarker(
    [ponto.lat, ponto.lng],
    criarEstiloMarcador(tipo, cor)
  );

  marcador.bindPopup(`
    <strong class="popup-titulo">${ehMaisProximo ? "Ponto mais proximo" : "Ponto de onibus"}</strong>
    <p class="popup-linha">Linha: ${escaparHtml(ponto.linha)}</p>
    <p class="popup-linha">${escaparHtml(ponto.nomeLinha)}</p>
    <p class="popup-linha">Parada: ${escaparHtml(ponto.identificador)}</p>
  `);

  return marcador;
}

/**
 * Cria um marcador para representar a localização do usuário.
 *
 * @param {Object} localizacao - Coordenadas da localização do usuário.
 * @returns {L.CircleMarker} Marcador da localização do usuário.
 */
export function criarMarcadorUsuario(localizacao) {
  const { cores, marcadorUsuario } = CONFIGURACOES_APLICACAO;

  const marcador = L.circleMarker(
    [localizacao.lat, localizacao.lng],
    criarEstiloMarcador(marcadorUsuario, cores.usuario)
  );

  marcador.bindPopup(`
    <strong class="popup-titulo">Sua localizacao</strong>
    <p class="popup-linha">Usada para calcular o ponto mais proximo.</p>
  `);

  return marcador;
}