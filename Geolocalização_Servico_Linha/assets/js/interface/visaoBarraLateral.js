const elementos = {
  buscaLinha: document.getElementById("busca-linha"),
  seletorLinha: document.getElementById("seletor-linha"),
  botaoUsarLocalizacao: document.getElementById("botao-usar-localizacao"),
  botaoLimparFiltro: document.getElementById("botao-limpar-filtro"),
  botaoAtualizar: document.getElementById("botao-atualizar"),
  botaoCentralizarMapa: document.getElementById("botao-centralizar-mapa")
};

let linhasDisponiveis = [];

function textoLinha(linha) {
  return linha.nome
    ? `${linha.codigo} - ${linha.nome}`
    : linha.codigo;
}

function renderizarOpcoesLinhas(linhas, linhaSelecionada = elementos.seletorLinha.value) {
  elementos.seletorLinha.innerHTML = "";

  const opcaoTodas = document.createElement("option");
  opcaoTodas.value = "";
  opcaoTodas.textContent = "Todas as linhas";
  elementos.seletorLinha.appendChild(opcaoTodas);

  linhas.forEach((linha) => {
    const opcao = document.createElement("option");
    opcao.value = linha.codigo;
    opcao.textContent = textoLinha(linha);
    elementos.seletorLinha.appendChild(opcao);
  });

  elementos.seletorLinha.value = linhaSelecionada;
}

function filtrarLinhas(textoBusca) {
  const termo = textoBusca.trim().toUpperCase();

  if (!termo) {
    return linhasDisponiveis;
  }

  return linhasDisponiveis.filter((linha) =>
    textoLinha(linha).toUpperCase().includes(termo)
  );
}

export function preencherSeletorLinhas(linhas) {
  linhasDisponiveis = linhas;
  renderizarOpcoesLinhas(linhas);
  elementos.buscaLinha.disabled = false;
  elementos.seletorLinha.disabled = false;
}

export function configurarEventosBarraLateral({
  aoSelecionarLinha,
  aoUsarLocalizacao,
  aoLimparFiltro,
  aoAtualizar,
  aoCentralizar
}) {
  elementos.buscaLinha.addEventListener("input", (evento) => {
    renderizarOpcoesLinhas(filtrarLinhas(evento.target.value));
  });

  elementos.buscaLinha.addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter") {
      return;
    }

    evento.preventDefault();

    const linhasFiltradas = filtrarLinhas(elementos.buscaLinha.value);
    const linhaExata = linhasFiltradas.find((linha) =>
      linha.codigo === elementos.buscaLinha.value.trim().toUpperCase()
    );
    const linhaEscolhida = linhaExata ?? linhasFiltradas[0];

    if (linhaEscolhida) {
      elementos.seletorLinha.value = linhaEscolhida.codigo;
      aoSelecionarLinha(linhaEscolhida.codigo);
    }
  });

  elementos.seletorLinha.addEventListener("change", (evento) => {
    aoSelecionarLinha(evento.target.value);
  });

  elementos.botaoUsarLocalizacao.addEventListener("click", aoUsarLocalizacao);
  elementos.botaoLimparFiltro.addEventListener("click", aoLimparFiltro);
  elementos.botaoAtualizar.addEventListener("click", aoAtualizar);
  elementos.botaoCentralizarMapa.addEventListener("click", aoCentralizar);
}

export function atualizarControlesBarraLateral({ linhaSelecionada, dadosCarregados }) {
  elementos.buscaLinha.disabled = !dadosCarregados;
  elementos.seletorLinha.disabled = !dadosCarregados;
  elementos.botaoUsarLocalizacao.disabled = !dadosCarregados || !linhaSelecionada;
  elementos.botaoLimparFiltro.disabled = !dadosCarregados || !linhaSelecionada;
  elementos.botaoAtualizar.disabled = !dadosCarregados;
}

export function selecionarLinhaNaInterface(linha) {
  if (!linha) {
    elementos.buscaLinha.value = "";
    renderizarOpcoesLinhas(linhasDisponiveis, "");
  }

  elementos.seletorLinha.value = linha;
}
