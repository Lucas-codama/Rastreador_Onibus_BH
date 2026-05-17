/**
 * Obtém a localização atual do usuário.
 * @returns {Promise<Object>}
 */
export function obterLocalizacaoUsuario() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalizacao nao esta disponivel neste navegador."));
      return;
    }

    const opcoes = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 30000
    };

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const coordenadas = posicao.coords;

        resolve({
          lat: coordenadas.latitude,
          lng: coordenadas.longitude,
          precisao: coordenadas.accuracy
        });
      },
      () => {
        reject(new Error("Nao foi possivel acessar sua localizacao."));
      },
      opcoes
    );
  });
}
