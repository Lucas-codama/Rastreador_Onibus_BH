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

function interpolar(inicio, fim, progresso) {
  return inicio + (fim - inicio) * progresso;
}

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

function iniciarLoopAnimacaoOnibus() {
  if (!quadroAnimacaoOnibus) {
    quadroAnimacaoOnibus = window.requestAnimationFrame(executarAnimacoesOnibus);
  }
}

function animarOnibusAteNovaPosicao(id, marcador, onibus) {
  const posicaoAtual = marcador.getLatLng();
  const mesmaPosicao = posicaoAtual.lat === onibus.lat && posicaoAtual.lng === onibus.lng;

  if (mesmaPosicao) {
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

function pararAnimacaoOnibus(id) {
  animacoesOnibus.delete(id);
}

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

      if (posicaoAtual.lat !== item.lat || posicaoAtual.lng !== item.lng) {
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

export function renderizarPontos(pontos, pontoMaisProximo) {
  const novaAssinatura = `${pontos.map((ponto) => ponto.id).join("|")}:${pontoMaisProximo?.id ?? ""}`;

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

export function centralizarMapaEmBh() {
  mapa.setView(
    CONFIGURACOES_APLICACAO.mapa.centro,
    CONFIGURACOES_APLICACAO.mapa.zoomInicial
  );
}

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
