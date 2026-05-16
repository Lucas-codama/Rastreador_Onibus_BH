import {
  CONFIGURACOES_APLICACAO,
  CONFIGURACOES_CAMADA_MAPA
} from "../configuracoes/configuracoesAplicacao.js";
import {
  criarMarcadorOnibus,
  criarMarcadorPonto,
  criarMarcadorUsuario,
  atualizarMarcadorOnibus,
  limparCamada
} from "../utilitarios/utilitariosMarcadores.js";

let mapa;
let camadaOnibus;
let camadaPontos;
let camadaUsuario;
const marcadoresOnibus = new Map();
const animacoesOnibus = new Map();
let quadroAnimacaoOnibus = null;
let modoVisaoGeralAnterior = null;
let assinaturaPontos = "";
let assinaturaUsuario = "";
let mapaInvalidadoAposOnibus = false;
let mapaEmInteracao = false;
let onibusPendenteDuranteInteracao = null;

/**
 * Calcula um valor intermediario entre dois numeros para animar os marcadores.
 *
 * @param {number} inicio - Valor inicial da animacao.
 * @param {number} fim - Valor final da animacao.
 * @param {number} progresso - Progresso da animacao entre 0 e 1.
 * @returns {number} Valor intermediario calculado.
 */
function interpolar(inicio, fim, progresso) {
  return inicio + (fim - inicio) * progresso;
}

/**
 * Executa o loop de animacao dos onibus que estao mudando de posicao.
 *
 * @param {number} agora - Momento atual informado pelo requestAnimationFrame.
 * @returns {void}
 */
function executarAnimacoesOnibus(agora) {
  animacoesOnibus.forEach((animacao, id) => {
    const progresso = Math.min((agora - animacao.inicioMs) / animacao.duracaoMs, 1);
    const lat = interpolar(animacao.inicioLat, animacao.fimLat, progresso);
    const lng = interpolar(animacao.inicioLng, animacao.fimLng, progresso);

    animacao.marcador.setLatLng([lat, lng]);

    if (progresso >= 1) {
      animacao.marcador.setLatLng([animacao.fimLat, animacao.fimLng]);
      animacoesOnibus.delete(id);
    }
  });

  quadroAnimacaoOnibus = animacoesOnibus.size > 0
    ? window.requestAnimationFrame(executarAnimacoesOnibus)
    : null;
}

/**
 * Inicia o loop de animacao dos onibus quando ainda nao existe um loop ativo.
 *
 * @returns {void}
 */
function iniciarLoopAnimacaoOnibus() {
  if (!quadroAnimacaoOnibus) {
    quadroAnimacaoOnibus = window.requestAnimationFrame(executarAnimacoesOnibus);
  }
}

/**
 * Agenda a animacao de um marcador de onibus ate sua nova posicao.
 *
 * @param {string} id - Identificador unico do onibus.
 * @param {L.Marker} marcador - Marcador do Leaflet que sera animado.
 * @param {{ lat: number, lng: number }} onibus - Dados atualizados do onibus.
 * @returns {void}
 */
function animarOnibusAteNovaPosicao(id, marcador, onibus) {
  const posicaoAtual = marcador.getLatLng();
  const mesmaLatitude = posicaoAtual.lat === onibus.lat;
  const mesmaLongitude = posicaoAtual.lng === onibus.lng;

  if (mesmaLatitude && mesmaLongitude) {
    return;
  }

  animacoesOnibus.set(id, {
    marcador,
    inicioLat: posicaoAtual.lat,
    inicioLng: posicaoAtual.lng,
    fimLat: onibus.lat,
    fimLng: onibus.lng,
    inicioMs: performance.now(),
    duracaoMs: CONFIGURACOES_APLICACAO.intervaloAtualizacaoMs
  });

  iniciarLoopAnimacaoOnibus();
}

/**
 * Remove a animacao pendente de um onibus especifico.
 *
 * @param {string} id - Identificador do onibus que tera a animacao cancelada.
 * @returns {void}
 */
function pararAnimacaoOnibus(id) {
  animacoesOnibus.delete(id);
}

/**
 * Cria o mapa Leaflet, adiciona a camada base e prepara as camadas da aplicacao.
 *
 * @returns {L.Map} Instancia do mapa criada e pronta para uso.
 */
export function inicializarMapa() {
  mapa = L.map("mapa", { preferCanvas: true }).setView(
    CONFIGURACOES_APLICACAO.mapa.centro,
    CONFIGURACOES_APLICACAO.mapa.zoomInicial
  );

  L.tileLayer(CONFIGURACOES_CAMADA_MAPA.url, {
    attribution: CONFIGURACOES_CAMADA_MAPA.atribuicao
  }).addTo(mapa);

  camadaPontos = L.layerGroup().addTo(mapa);
  camadaOnibus = L.layerGroup().addTo(mapa);
  camadaUsuario = L.layerGroup().addTo(mapa);

  mapa.on("movestart zoomstart", () => {
    mapaEmInteracao = true;
  });

  mapa.on("moveend zoomend", () => {
    mapaEmInteracao = false;

    if (onibusPendenteDuranteInteracao) {
      const { onibus: onibusPendentes } = onibusPendenteDuranteInteracao;
      onibusPendenteDuranteInteracao = null;
      renderizarOnibus(onibusPendentes);
    }
  });

  window.setTimeout(() => mapa.invalidateSize(), 0);
  window.setTimeout(() => mapa.invalidateSize(), 300);
  window.setTimeout(() => mapa.invalidateSize(), 1000);

  return mapa;
}

/**
 * Renderiza os onibus no mapa e atualiza os marcadores que ja existem.
 *
 * @param {Array<{ id: string, lat: number, lng: number }>} onibus - Lista de onibus a serem exibidos.
 * @returns {void}
 */
export function renderizarOnibus(onibus) {
  if (mapaEmInteracao) {
    onibusPendenteDuranteInteracao = { onibus };
    return;
  }

  const idsVisiveis = new Set(onibus.map((item) => item.id));
  const modoVisaoGeral = onibus.length > CONFIGURACOES_APLICACAO.limiteAnimacaoOnibus;

  if (modoVisaoGeral) {
    animacoesOnibus.clear();
  }

  if (modoVisaoGeralAnterior !== null && modoVisaoGeralAnterior !== modoVisaoGeral) {
    animacoesOnibus.clear();
    marcadoresOnibus.forEach((marcador) => camadaOnibus.removeLayer(marcador));
    marcadoresOnibus.clear();
  }

  modoVisaoGeralAnterior = modoVisaoGeral;

  marcadoresOnibus.forEach((marcador, id) => {
    if (!idsVisiveis.has(id)) {
      animacoesOnibus.delete(id);
      camadaOnibus.removeLayer(marcador);
      marcadoresOnibus.delete(id);
    }
  });

  onibus.forEach((item) => {
    const marcadorExistente = marcadoresOnibus.get(item.id);
    const opcoesMarcador = {
      pequeno: modoVisaoGeral
    };

    if (!marcadorExistente) {
      const novoMarcador = criarMarcadorOnibus(item, opcoesMarcador).addTo(camadaOnibus);
      marcadoresOnibus.set(item.id, novoMarcador);
      return;
    }

    atualizarMarcadorOnibus(marcadorExistente, item, opcoesMarcador);

    if (modoVisaoGeral) {
      const posicaoAtual = marcadorExistente.getLatLng();
      const mudouLatitude = posicaoAtual.lat !== item.lat;
      const mudouLongitude = posicaoAtual.lng !== item.lng;

      if (mudouLatitude || mudouLongitude) {
        pararAnimacaoOnibus(item.id);
        marcadorExistente.setLatLng([item.lat, item.lng]);
      }
    } else {
      animarOnibusAteNovaPosicao(item.id, marcadorExistente, item);
    }
  });

  if (!mapaInvalidadoAposOnibus) {
    mapa.invalidateSize();
    mapaInvalidadoAposOnibus = true;
  }
}

/**
 * Renderiza os pontos de onibus no mapa e destaca o ponto mais proximo quando existir.
 *
 * @param {Array<{ id: string, lat: number, lng: number }>} pontos - Pontos de onibus que devem aparecer no mapa.
 * @param {{ id: string, lat: number, lng: number } | null} pontoMaisProximo - Ponto mais proximo da localizacao do usuario.
 * @returns {void}
 */
export function renderizarPontos(pontos, pontoMaisProximo) {
  const idsDosPontos = pontos.map((ponto) => ponto.id).join("|");
  const idPontoMaisProximo = pontoMaisProximo?.id ?? "";
  const novaAssinatura = `${idsDosPontos}:${idPontoMaisProximo}`;

  if (novaAssinatura === assinaturaPontos) {
    return;
  }

  assinaturaPontos = novaAssinatura;
  limparCamada(camadaPontos);

  pontos.forEach((ponto) => {
    const ehMaisProximo = pontoMaisProximo && ponto.id === pontoMaisProximo.id;
    criarMarcadorPonto(ponto, ehMaisProximo).addTo(camadaPontos);
  });
}

/**
 * Renderiza a localizacao atual do usuario no mapa.
 *
 * @param {{ lat: number, lng: number } | null} localizacao - Coordenadas atuais do usuario.
 * @returns {void}
 */
export function renderizarLocalizacaoUsuario(localizacao) {
  const novaAssinatura = localizacao
    ? `${localizacao.lat.toFixed(6)},${localizacao.lng.toFixed(6)}`
    : "";

  if (novaAssinatura === assinaturaUsuario) {
    return;
  }

  assinaturaUsuario = novaAssinatura;
  limparCamada(camadaUsuario);

  if (localizacao) {
    criarMarcadorUsuario(localizacao).addTo(camadaUsuario);
  }
}

/**
 * Centraliza o mapa na posicao inicial configurada para Belo Horizonte.
 *
 * @returns {void}
 */
export function centralizarMapaEmBh() {
  mapa.setView(
    CONFIGURACOES_APLICACAO.mapa.centro,
    CONFIGURACOES_APLICACAO.mapa.zoomInicial
  );
}

/**
 * Ajusta o enquadramento do mapa para exibir todos os itens informados.
 *
 * @param {Array<{ lat: number, lng: number }>} itens - Itens com coordenadas validas para enquadramento.
 * @returns {void}
 */
export function ajustarMapaAosItens(itens) {
  const coordenadas = itens
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
    .map((item) => [item.lat, item.lng]);

  if (coordenadas.length === 0) {
    return;
  }

  const limites = L.latLngBounds(coordenadas);
  mapa.fitBounds(limites, {
    padding: [24, 24],
    maxZoom: CONFIGURACOES_APLICACAO.mapa.zoomMaximoAjuste
  });
}
