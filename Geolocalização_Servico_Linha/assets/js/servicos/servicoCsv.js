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
