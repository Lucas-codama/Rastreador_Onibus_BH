import { CONFIGURACOES_APLICACAO } from "../configuracoes/configuracoesAplicacao.js";
import { coordenadasValidas } from "../utilitarios/utilitariosCoordenadas.js";
import { normalizarCodigoLinha } from "../utilitarios/utilitariosLinha.js";




/**
 * Formata o horário retornado pela API para o padrão HH:MM:SS.
 *
 * @param {*} valor - Valor de data e horário retornado pela API.
 * @returns {string} Horário formatado ou "Nao informado" caso o valor seja inválido.
 */
function formatarHorarioApi(valor) {
  const texto = String(valor ?? "");

  if (texto.length !== 14) return "Nao informado";
  
  for (let i = 0; i < texto.length; i++) {
    const codigo = texto.charCodeAt(i);
    if (codigo < 48 || codigo > 57) return "Nao informado";
  }

  return `${texto.slice(8, 10)}:${texto.slice(10, 12)}:${texto.slice(12, 14)}`;
}




/**
 * Converte a data e o horário retornados pela API em um objeto Date.
 *
 * @param {*} valor - Valor de data e horário retornado pela API.
 * @returns {Date|null} Objeto Date correspondente ao horário ou null caso o valor seja inválido.
 */
function obterDataHorarioApi(valor) {
  const texto = String(valor ?? "");

  if (texto.length !== 14) return null;
  
  for (let i = 0; i < texto.length; i++){
    const codigo = texto.charCodeAt(i);

    if (codigo < 48 || codigo > 57) return null;
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




/**
 * Converte um registro bruto da API em um objeto de ônibus usado pela aplicação.
 *
 * A função extrai os campos definidos nas configurações da aplicação,
 * converte latitude, longitude, velocidade, direção e horário para formatos
 * mais adequados, além de normalizar o código da linha.
 *
 * @param {Object} registro - Registro bruto de um ônibus retornado pela API.
 * @returns {Object|undefined} Objeto formatado do ônibus ou undefined caso as coordenadas sejam inválidas.
 */
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