import { CONFIGURACOES_APLICACAO } from "../configuracoes/configuracoesAplicacao.js";
import { coordenadasValidas } from "../utilitarios/utilitariosCoordenadas.js";
import { normalizarCodigoLinha } from "../utilitarios/utilitariosLinha.js";

function formatarHorarioApi(valor) {
  const texto = String(valor ?? "");

  if (!/^\d{14}$/.test(texto)) {
    return "Nao informado";
  }

  return `${texto.slice(8, 10)}:${texto.slice(10, 12)}:${texto.slice(12, 14)}`;
}

function obterDataHorarioApi(valor) {
  const texto = String(valor ?? "");

  if (!/^\d{14}$/.test(texto)) {
    return null;
  }

  return new Date(
    Number(texto.slice(0, 4)),
    Number(texto.slice(4, 6)) - 1,
    Number(texto.slice(6, 8)),
    Number(texto.slice(8, 10)),
    Number(texto.slice(10, 12)),
    Number(texto.slice(12, 14))
  );
}

export function mapearOnibus(registro) {
  const campos = CONFIGURACOES_APLICACAO.camposApi;
  const lat = Number.parseFloat(registro[campos.latitude]);
  const lng = Number.parseFloat(registro[campos.longitude]);
  const veiculo = String(registro[campos.veiculo] ?? "Nao informado");
  const linhaApi = normalizarCodigoLinha(registro[campos.linha]);
  const dataHorario = obterDataHorarioApi(registro[campos.horario]);

  if (coordenadasValidas(lat, lng)){
    return {
      id: veiculo !== "Nao informado" ? veiculo : `${lat},${lng}`,
      veiculo,
      linha: linhaApi,
      linhaApi,
      lat,
      lng,
      velocidade: Number.parseInt(registro[campos.velocidade] ?? 0, 10) || 0,
      direcao: Number.parseInt(registro[campos.direcao] ?? 0, 10) || 0,
      horario: String(registro[campos.horario] ?? ""),
      horarioMs: dataHorario ? dataHorario.getTime() : 0,
      horarioFormatado: formatarHorarioApi(registro[campos.horario])
    };
  }
}