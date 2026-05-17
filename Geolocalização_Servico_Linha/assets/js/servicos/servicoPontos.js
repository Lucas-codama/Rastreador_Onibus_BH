import { CONFIGURACOES_APLICACAO } from "../configuracoes/configuracoesAplicacao.js";
import { mapearPonto } from "../mapeadores/mapeadorPonto.js";
import { mapearLinhaPonto } from "../mapeadores/mapeadorLinha.js";
import { carregarCsv } from "./servicoCsv.js";
import { linhasCorrespondem, ordenarLinhas } from "../utilitarios/utilitariosLinha.js";

export async function carregarPontos() {
  const registros = await carregarCsv(CONFIGURACOES_APLICACAO.caminhosCsv.pontos);

  return registros
    .map(mapearPonto)
    .filter(Boolean);
}

export function filtrarPontosPorLinha(pontos, linhaSelecionada) {
  return pontos.filter((ponto) => linhasCorrespondem(ponto.linha, linhaSelecionada));
}

export function obterLinhasDosPontos(pontos) {
  const linhasPorCodigo = new Map();

  pontos.forEach((ponto) => {
    if (!linhasPorCodigo.has(ponto.linha)) {
      linhasPorCodigo.set(ponto.linha, mapearLinhaPonto(ponto));
    }
  });

  return ordenarLinhas([...linhasPorCodigo.values()]);
}
