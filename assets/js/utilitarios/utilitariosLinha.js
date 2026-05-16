/**
 * Remove espaços no começo e no fim, transforma em maiúsculo
 * e remove espaços internos.
 *
 * @param {string | number | null | undefined} valor - Código da linha recebido.
 * @returns {string} Código normalizado.
 */
export function normalizarCodigoLinha(valor) {
  return String(valor ?? "")
    .trim()
    .toUpperCase()
    .split(" ")
    .join("");
}

/**
 * Normaliza o código e remove o sufixo numérico após hífen,
 * como em "8001A-2", que vira "8001A".
 *
 * @param {string | number | null | undefined} valor - Código da linha recebido.
 * @returns {string} Código base da linha.
 */
export function obterCodigoBaseLinha(valor) {
  const valor_normalizado = normalizarCodigoLinha(valor);
  const partes = valor_normalizado.split("-");

  if (partes.length > 1) {
    const ultima_parte = partes[partes.length - 1];
    if (!isNaN(Number(ultima_parte))) partes.pop();
  }

  return partes.join("-");
}

/**
 * Mantém pelo menos um caractere caso o código seja composto apenas por zeros.
 *
 * @param {string | number} codigo - Código que terá os zeros iniciais removidos.
 * @returns {string} Código sem zeros iniciais.
 */
function removerZerosIniciais(codigo) {
  let texto = String(codigo);

  while (texto.length > 1 && texto[0] === "0") {
    texto = texto.slice(1);
  }

  return texto;
}

/**
 * Gera as possíveis chaves de comparação de uma linha.
 * Retorna o código base original e também uma versão sem zeros iniciais.
 *
 * @param {string | number | null | undefined} valor - Código da linha recebido.
 * @returns {Set<string>} Conjunto de chaves possíveis para comparação.
 */
export function obterChavesLinha(valor) {
  const codigo = obterCodigoBaseLinha(valor);

  if (!codigo) {
    return new Set();
  }

  return new Set([codigo, removerZerosIniciais(codigo)]);
}

/**
 * Compara as chaves possíveis das duas linhas, considerando variações
 * como zeros iniciais e sufixos numéricos após hífen.
 *
 * @param {string | number | null | undefined} linhaA - Primeira linha comparada.
 * @param {string | number | null | undefined} linhaB - Segunda linha comparada.
 * @returns {boolean} Retorna true se as linhas correspondem; caso contrário, false.
 */
export function linhasCorrespondem(linhaA, linhaB) {
  const chavesA = obterChavesLinha(linhaA);
  const chavesB = obterChavesLinha(linhaB);

  for (const chave of chavesA)
    if (chavesB.has(chave)) return true;

  return false;
}

/**
 * Cria uma cópia da lista original e ordena usando comparação numérica,
 * respeitando o padrão de idioma pt-BR.
 *
 * @param {{ codigo: string }[]} linhas - Lista de linhas a ser ordenada.
 * @returns {{ codigo: string }[]} Nova lista de linhas ordenada pelo código.
 */
export function ordenarLinhas(linhas) {
  return [...linhas].sort((linhaA, linhaB) =>linhaA.codigo.localeCompare(linhaB.codigo, "pt-BR", { numeric: true }));
}