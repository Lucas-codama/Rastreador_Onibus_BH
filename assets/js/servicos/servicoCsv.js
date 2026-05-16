/**
 * Carrega dados de um arquivo CSV usando a biblioteca PapaParse.
 *
 * @param {string} caminho - Caminho ou URL do arquivo CSV.
 * @returns {Promise<Object[]>} Promise com os dados do CSV em formato de objetos.
 */
export function carregarCsv(caminho) {
  return new Promise((resolve, reject) => {
    if (!window.Papa) {
      reject(new Error("A biblioteca PapaParse nao foi carregada."));
      return;
    }

    window.Papa.parse(caminho, {
      download: true,
      header: true,
      delimiter: ";",
      skipEmptyLines: true,
      complete: (resultado) => resolve(resultado.data),
      error: (erro) => reject(erro)
    });
  });
}