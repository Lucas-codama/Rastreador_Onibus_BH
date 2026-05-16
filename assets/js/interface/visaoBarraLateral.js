const elementos = {
  buscaLinha: document.getElementById("busca-linha"),
  seletorLinha: document.getElementById("seletor-linha"),
  botaoUsarLocalizacao: document.getElementById("botao-usar-localizacao"),
  botaoLimparFiltro: document.getElementById("botao-limpar-filtro"),
  botaoAtualizar: document.getElementById("botao-atualizar"),
  botaoCentralizarMapa: document.getElementById("botao-centralizar-mapa")
};

let linhasDisponiveis = [];

/**
 * Monta o texto exibido para uma linha no seletor da barra lateral.
 *
 * @param {{ codigo: string, nome?: string }} linha - Linha de onibus usada na interface.
 * @returns {string} Texto formatado com codigo e nome da linha, quando existir.
 */
function formatarTextoLinha(linha) {
  if (linha.nome) {
    return `${linha.codigo} - ${linha.nome}`;
  }

  return linha.codigo;
}

/**
 * Cria uma opcao HTML para o seletor de linhas.
 *
 * @param {string} valor - Valor que sera enviado ao selecionar a opcao.
 * @param {string} texto - Texto visivel para o usuario.
 * @returns {HTMLOptionElement} Opcao pronta para ser adicionada ao seletor.
 */
function criarOpcaoLinha(valor, texto) {
  const opcao = document.createElement("option");
  opcao.value = valor;
  opcao.textContent = texto;

  return opcao;
}

/**
 * Atualiza as opcoes exibidas no seletor de linhas.
 *
 * @param {Array<{ codigo: string, nome?: string }>} linhas - Linhas que devem aparecer no seletor.
 * @param {string} [linhaSelecionada] - Codigo da linha que deve permanecer selecionada.
 * @returns {void}
 */
function renderizarOpcoesLinhas(linhas, linhaSelecionada = elementos.seletorLinha.value) {
  elementos.seletorLinha.innerHTML = "";
  elementos.seletorLinha.appendChild(criarOpcaoLinha("", "Todas as linhas"));

  linhas.forEach((linha) => {
    elementos.seletorLinha.appendChild(
      criarOpcaoLinha(linha.codigo, formatarTextoLinha(linha))
    );
  });

  elementos.seletorLinha.value = linhaSelecionada;
}

/**
 * Normaliza o texto digitado na busca para comparar com as linhas disponiveis.
 *
 * @param {string} texto - Texto digitado pelo usuario.
 * @returns {string} Texto sem espacos extras e em letras maiusculas.
 */
function normalizarTextoBusca(texto) {
  return texto.trim().toUpperCase();
}

/**
 * Filtra as linhas disponiveis de acordo com o texto digitado na busca.
 *
 * @param {string} textoBusca - Texto informado no campo de busca.
 * @returns {Array<{ codigo: string, nome?: string }>} Linhas correspondentes ao texto buscado.
 */
function filtrarLinhas(textoBusca) {
  const termo = normalizarTextoBusca(textoBusca);

  if (!termo) {
    return linhasDisponiveis;
  }

  return linhasDisponiveis.filter((linha) => {
    const textoDaLinha = formatarTextoLinha(linha).toUpperCase();
    return textoDaLinha.includes(termo);
  });
}

/**
 * Encontra a melhor linha para selecionar quando o usuario confirma a busca.
 *
 * @param {string} textoBusca - Texto digitado no campo de busca.
 * @returns {{ codigo: string, nome?: string } | undefined} Linha exata pelo codigo ou primeira linha filtrada.
 */
function buscarLinhaParaSelecao(textoBusca) {
  const termo = normalizarTextoBusca(textoBusca);
  const linhasFiltradas = filtrarLinhas(textoBusca);
  const linhaExata = linhasFiltradas.find((linha) => linha.codigo === termo);

  return linhaExata ?? linhasFiltradas[0];
}

/**
 * Preenche o seletor da barra lateral com as linhas carregadas pelo sistema.
 *
 * @param {Array<{ codigo: string, nome?: string }>} linhas - Lista de linhas disponiveis.
 * @returns {void}
 */
export function preencherSeletorLinhas(linhas) {
  linhasDisponiveis = linhas;
  renderizarOpcoesLinhas(linhas);
  elementos.buscaLinha.disabled = false;
  elementos.seletorLinha.disabled = false;
}

/**
 * Liga os eventos dos campos e botoes da barra lateral aos callbacks da aplicacao.
 *
 * @param {object} acoes - Funcoes executadas quando o usuario interage com a barra lateral.
 * @param {(codigoLinha: string) => void} acoes.aoSelecionarLinha - Executada ao selecionar uma linha.
 * @param {() => void} acoes.aoUsarLocalizacao - Executada ao pedir a localizacao atual.
 * @param {() => void} acoes.aoLimparFiltro - Executada ao limpar o filtro de linha.
 * @param {() => void} acoes.aoAtualizar - Executada ao atualizar os dados manualmente.
 * @param {() => void} acoes.aoCentralizar - Executada ao centralizar o mapa.
 * @returns {void}
 */
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

    const linhaEscolhida = buscarLinhaParaSelecao(elementos.buscaLinha.value);

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

/**
 * Habilita ou desabilita os controles da barra lateral conforme o estado da aplicacao.
 *
 * @param {object} estado - Estado atual usado para controlar os elementos.
 * @param {string} estado.linhaSelecionada - Codigo da linha atualmente selecionada.
 * @param {boolean} estado.dadosCarregados - Indica se os dados principais ja foram carregados.
 * @returns {void}
 */
export function atualizarControlesBarraLateral({ linhaSelecionada, dadosCarregados }) {
  elementos.buscaLinha.disabled = !dadosCarregados;
  elementos.seletorLinha.disabled = !dadosCarregados;
  elementos.botaoUsarLocalizacao.disabled = !dadosCarregados || !linhaSelecionada;
  elementos.botaoLimparFiltro.disabled = !dadosCarregados || !linhaSelecionada;
  elementos.botaoAtualizar.disabled = !dadosCarregados;
}

/**
 * Sincroniza a linha selecionada no estado da aplicacao com a interface.
 *
 * @param {string} linha - Codigo da linha que deve aparecer selecionada.
 * @returns {void}
 */
export function selecionarLinhaNaInterface(linha) {
  if (!linha) {
    elementos.buscaLinha.value = "";
    renderizarOpcoesLinhas(linhasDisponiveis, "");
  }

  elementos.seletorLinha.value = linha;
}
