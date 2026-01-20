// Dados globais
let produtos = [];
let movimentacoes = [];
let config = { formatoData: 'pt-BR', calcularValor: false, moeda: 'R$', theme: 'light' };

// Carregar dados
function carregarDados(callback) {
    const data = localStorage.getItem('almoxarifado');
    if (data) {
        const parsed = JSON.parse(data);
        produtos = parsed.produtos || [];
        movimentacoes = parsed.movimentacoes || [];
        config = { ...config, ...parsed.config };
        aplicarConfig();
        callback();
    } else {
        fetch('data/sample-data.json')
            .then(res => res.json())
            .then(data => {
                produtos = data.produtos || [];
                movimentacoes = data.movimentacoes || [];
                salvarDados();
                aplicarConfig();
                callback();
            })
            .catch(err => {
                console.log('Erro ao carregar sample data', err);
                aplicarConfig();
                callback();
            });
    }
}

// Salvar dados
function salvarDados() {
    localStorage.setItem('almoxarifado', JSON.stringify({ produtos, movimentacoes, config }));
}

// Aplicar config
function aplicarConfig() {
    document.getElementById('formatoData').value = config.formatoData;
    document.getElementById('calcularValor').checked = config.calcularValor;
    document.getElementById('moeda').value = config.moeda;
    toggleTheme();
}

// Navegação
function mostrarSecao(secao) {
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
    document.getElementById(secao).classList.remove('hidden');
    if (secao === 'dashboard') atualizarDashboard();
    if (secao === 'produtos') renderProdutos();
    if (secao === 'historico') renderHistorico();
}

// Dashboard
function atualizarDashboard() {
    const totalItens = produtos.reduce((sum, p) => sum + p.quantidade, 0);
    const baixoEstoque = produtos.filter(p => p.quantidade <= p.estoque_minimo).length;
    const valorEstimado = config.calcularValor ? produtos.reduce((sum, p) => sum + (p.quantidade * (p.preco_unitario || 0)), 0).toFixed(2) : 0;

    document.getElementById('totalItens').textContent = totalItens;
    document.getElementById('baixoEstoque').textContent = baixoEstoque;
    document.getElementById('valorEstimado').textContent = `${config.moeda} ${valorEstimado}`;

    const alertas = produtos.filter(p => p.quantidade <= p.estoque_minimo);
    const alertasDiv = document.getElementById('alertas');
    alertasDiv.innerHTML = alertas.length ? `<ul>${alertas.map(p => `<li>${p.nome} - Quantidade: ${p.quantidade}</li>`).join('')}</ul>` : '<p>Nenhum alerta.</p>';

    // Notificações de baixo estoque
    if (alertas.length > 0) {
        const lastNotified = localStorage.getItem('lastLowStockNotification');
        const now = Date.now();
        if (!lastNotified || (now - parseInt(lastNotified)) > 24 * 60 * 60 * 1000) { // 24 horas
            Toastify({
                text: `Alerta: ${alertas.length} produto(s) com estoque baixo - ${alertas.map(p => p.nome).join(', ')}`,
                backgroundColor: "red",
                duration: 10000,
                position: "top-right",
                close: true,
                onClick: () => mostrarSecao('produtos')
            }).showToast();
            localStorage.setItem('lastLowStockNotification', now.toString());
        }
    }

    // Gráfico de categorias
    renderChartCategoria();
}

let chartCategoria = null;

function renderChartCategoria() {
    const labels = produtos.map(p => p.nome);
    const data = produtos.map(p => p.quantidade);

    const ctx = document.getElementById('chartCategoria').getContext('2d');

    // Destruir gráfico anterior se existir
    if (chartCategoria) {
        chartCategoria.destroy();
    }

    chartCategoria = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}



// Produtos
function renderProdutos() {
    const tbody = document.getElementById('tabelaProdutos');
    const busca = document.getElementById('buscaProduto').value.toLowerCase();
    const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca) || p.id.toLowerCase().includes(busca));
    tbody.innerHTML = filtrados.map(p => `
        <tr>
            <td class="px-4 py-2">${p.id}</td>
            <td class="px-4 py-2">${p.nome}</td>
            <td class="px-4 py-2">${p.categoria}</td>
            <td class="px-4 py-2">${p.local}</td>
            <td class="px-4 py-2">${p.quantidade}</td>
            <td class="px-4 py-2">${p.unidade}</td>
            <td class="px-4 py-2">${p.estoque_minimo}</td>
            <td class="px-4 py-2">${p.fornecedor}</td>
            <td class="px-4 py-2">${p.preco_unitario || ''}</td>
            <td class="px-4 py-2" style="display: flex; gap: 4px;">
                <button onclick="editarProduto('${p.id}')" class="bg-yellow-500 text-white px-2 py-1 rounded">Editar</button>
                <button onclick="deletarProduto('${p.id}')" class="bg-red-500 text-white px-2 py-1 rounded">Deletar</button>
                <button onclick="gerarEtiqueta('${p.id}')" class="bg-blue-500 text-white px-2 py-1 rounded">Etiqueta</button>
            </td>
        </tr>
    `).join('');
}

function getNextId() {
    const ids = produtos.map(p => parseInt(p.id.substring(1))).filter(n => !isNaN(n));
    const max = ids.length ? Math.max(...ids) : 0;
    return 'P' + (max + 1).toString().padStart(3, '0');
}

function atualizarSelectProdutos() {
    const select = document.getElementById('produtoMov');
    select.innerHTML = '<option value="">Selecione Produto</option>' + produtos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
}

function editarProduto(id) {
    const p = produtos.find(prod => prod.id === id);
    if (!p) return;
    document.getElementById('campoId').classList.remove('hidden');
    document.getElementById('idProduto').value = p.id;
    document.getElementById('nomeProduto').value = p.nome;
    document.getElementById('categoriaProduto').value = p.categoria;
    document.getElementById('localProduto').value = p.local;
    document.getElementById('quantidadeProduto').value = p.quantidade;
    document.getElementById('unidadeProduto').value = p.unidade;
    document.getElementById('estoqueMinProduto').value = p.estoque_minimo;
    document.getElementById('fornecedorProduto').value = p.fornecedor;
    document.getElementById('precoProduto').value = p.preco_unitario || '';
    document.getElementById('descProduto').value = p.descricao || '';
    document.getElementById('modalProduto').classList.remove('hidden');
}

function deletarProduto(id) {
    if (confirm('Deletar produto?')) {
        produtos = produtos.filter(p => p.id !== id);
        salvarDados();
        renderProdutos();
        atualizarDashboard();
        if (!document.getElementById('historico').classList.contains('hidden')) renderHistorico();
        Toastify({ text: "Produto deletado!", backgroundColor: "green", duration: 3000, close: true }).showToast();
    }
}

function gerarEtiqueta(id) {
    const p = produtos.find(prod => prod.id === id);
    if (!p) return Toastify({ text: "Produto não encontrado!", backgroundColor: "red", duration: 3000, close: true }).showToast();

    if (typeof QRCode !== 'undefined') {
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, `${p.id} - ${p.nome}`, (error) => {
            if (error) {
                console.error(error);
                gerarEtiquetaTexto(p);
            } else {
                const img = canvas.toDataURL();
                abrirEtiqueta(p, img);
            }
        });
    } else {
        gerarEtiquetaTexto(p);
    }
}

function gerarEtiquetaTexto(p) {
    const quantidade = parseInt(prompt('Quantidade de etiquetas a imprimir:', '4')) || 4;
    const win = window.open('', '_blank');
    let etiquetas = '';
    for (let i = 0; i < quantidade; i++) {
        etiquetas += `
            <div class="etiqueta">
                <p style="font-size: 14px; font-weight: bold; margin: 0;">${p.nome}</p>
                <p style="font-size: 12px; margin: 2px 0;">ID: ${p.id}</p>
                <p style="font-size: 10px; margin: 2px 0;">Cat: ${p.categoria}</p>
                <p style="font-size: 10px; margin: 2px 0;">Loc: ${p.local}</p>
            </div>
        `;
    }
    win.document.write(`
        <style>
            body { margin: 0; padding: 10px; font-family: Arial, sans-serif; }
            .container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .etiqueta { border: 1px solid black; padding: 5px; text-align: center; background: white; height: 80px; display: flex; flex-direction: column; justify-content: center; }
            @media print { body { margin: 0; } .container { grid-template-columns: repeat(2, 1fr); } }
        </style>
        <div class="container">${etiquetas}</div>
    `);
    win.print();
    Toastify({ text: `${quantidade} etiquetas texto geradas!`, backgroundColor: "blue", duration: 3000 }).showToast();
}

function abrirEtiqueta(p, imgSrc) {
    const quantidade = parseInt(prompt('Quantidade de etiquetas a imprimir:', '4')) || 4;
    const win = window.open('', '_blank');
    let etiquetas = '';
    for (let i = 0; i < quantidade; i++) {
        etiquetas += `
            <div class="etiqueta">
                <p style="font-size: 12px; font-weight: bold; margin: 0;">${p.nome}</p>
                <p style="font-size: 10px; margin: 2px 0;">ID: ${p.id}</p>
                <img src="${imgSrc}" style="width: 50px; height: 50px; margin: 2px auto;" />
            </div>
        `;
    }
    win.document.write(`
        <style>
            body { margin: 0; padding: 10px; font-family: Arial, sans-serif; }
            .container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
            .etiqueta { border: 1px solid black; padding: 3px; text-align: center; background: white; height: 70px; display: flex; flex-direction: column; justify-content: center; }
            @media print { body { margin: 0; } .container { grid-template-columns: repeat(4, 1fr); } }
        </style>
        <div class="container">${etiquetas}</div>
    `);
    win.print();
    Toastify({ text: `${quantidade} etiquetas geradas!`, backgroundColor: "green", duration: 3000 }).showToast();
}

// Movimentações
document.getElementById('formMovimentacao').addEventListener('submit', (e) => {
    e.preventDefault();
    const produtoId = document.getElementById('produtoMov').value;
    const quantidade = parseFloat(document.getElementById('quantidadeMov').value);
    const tipo = document.getElementById('tipoMov').value;
    const motivo = document.getElementById('motivoMov').value;
    const documento = document.getElementById('documentoMov').value;
    const usuario = document.getElementById('usuarioMov').value;
    const data = new Date().toISOString();

    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return Toastify({ text: "Produto não encontrado!", backgroundColor: "red", duration: 3000 }).showToast();

    if (tipo === 'saida' && produto.quantidade < quantidade) {
        return Toastify({ text: "Estoque insuficiente!", backgroundColor: "red", duration: 3000, close: true }).showToast();
    }

    produto.quantidade += tipo === 'entrada' ? quantidade : -quantidade;
    movimentacoes.push({
        id: 'M' + Date.now(),
        produto_id: produtoId,
        tipo,
        quantidade,
        motivo,
        documento,
        usuario,
        data
    });

    salvarDados();
    e.target.reset();
    Toastify({ text: "Movimentação registrada!", backgroundColor: "green", duration: 3000, close: true }).showToast();
    atualizarDashboard();
});

// Histórico de Produtos Cadastrados
function renderHistorico() {
    const tbody = document.getElementById('tabelaHistorico');
    tbody.innerHTML = produtos.map(p => `
        <tr>
            <td class="px-4 py-2">${p.id}</td>
            <td class="px-4 py-2">${p.nome}</td>
            <td class="px-4 py-2">${p.categoria}</td>
            <td class="px-4 py-2">${p.quantidade}</td>
            <td class="px-4 py-2">${p.unidade}</td>
            <td class="px-4 py-2">${p.fornecedor}</td>
            <td class="px-4 py-2">${p.preco_unitario || ''}</td>
            <td class="px-4 py-2">${p.local}</td>
        </tr>
    `).join('');
}

// Relatórios
document.getElementById('btnRelInventario').addEventListener('click', () => {
    const win = window.open('', '_blank');
    win.document.write(`
        <div style="text-align: center; margin-bottom: 20px;">
            <h1>Diamond Service - Almoxarifado</h1>
            <h2>Inventário atual</h2>
        </div>
        <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr><th>ID</th><th>Nome</th><th>Quantidade</th><th>Local</th></tr>
            </thead>
            <tbody>
                ${produtos.map(p => `<tr><td>${p.id}</td><td>${p.nome}</td><td>${p.quantidade}</td><td>${p.local}</td></tr>`).join('')}
            </tbody>
        </table>
    `);
    win.print();
});

document.getElementById('btnRelBaixoEstoque').addEventListener('click', () => {
    const baixo = produtos.filter(p => p.quantidade <= p.estoque_minimo);
    const win = window.open('', '_blank');
    win.document.write(`
        <div style="text-align: center; margin-bottom: 20px;">
            <h1>Diamond Service - Almoxarifado</h1>
            <h2>Itens com baixo estoque</h2>
        </div>
        <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr><th>ID</th><th>Nome</th><th>Quantidade</th><th>Mínimo</th></tr>
            </thead>
            <tbody>
                ${baixo.map(p => `<tr><td>${p.id}</td><td>${p.nome}</td><td>${p.quantidade}</td><td>${p.estoque_minimo}</td></tr>`).join('')}
            </tbody>
        </table>
    `);
    win.print();
});

document.getElementById('btnRelMovimentacoes').addEventListener('click', () => {
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;
    if (!inicio || !fim) {
        Toastify({ text: "Selecione as datas inicial e final!", backgroundColor: "red", duration: 3000 }).showToast();
        return;
    }
    const filtrados = movimentacoes.filter(m => m.data >= inicio && m.data <= fim + 'T23:59:59Z');
    const periodo = `${inicio} a ${fim}`;
    const win = window.open('', '_blank');
    win.document.write(`
        <div style="text-align: center; margin-bottom: 20px;">
            <h1>Diamond Service - Almoxarifado</h1>
            <h2>Movimentações ${periodo}</h2>
        </div>
        <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr><th style="padding: 5px;">ID</th><th style="padding: 5px;">Produto</th><th style="padding: 5px;">Tipo</th><th style="padding: 5px;">Quantidade</th><th style="padding: 5px;">Motivo</th><th style="padding: 5px;">Documento</th><th style="padding: 5px;">Usuário</th><th style="padding: 5px;">Data</th></tr>
            </thead>
            <tbody>
                ${filtrados.map(m => {
                    const produto = produtos.find(p => p.id === m.produto_id);
                    return `<tr><td style="padding: 5px;">${m.id}</td><td style="padding: 5px;">${produto ? produto.nome : ''}</td><td style="padding: 5px;">${m.tipo}</td><td style="padding: 5px;">${m.quantidade}</td><td style="padding: 5px;">${m.motivo}</td><td style="padding: 5px;">${m.documento}</td><td style="padding: 5px;">${m.usuario}</td><td style="padding: 5px;">${new Date(m.data).toLocaleDateString()}</td></tr>`;
                }).join('')}
            </tbody>
        </table>
    `);
    win.print();
});

// Config
document.getElementById('formatoData').addEventListener('change', (e) => {
    config.formatoData = e.target.value;
    salvarDados();
});
document.getElementById('calcularValor').addEventListener('change', (e) => {
    config.calcularValor = e.target.checked;
    salvarDados();
});
document.getElementById('moeda').addEventListener('input', (e) => {
    config.moeda = e.target.value;
    salvarDados();
});

// Backup
document.getElementById('btnBackup').addEventListener('click', () => {
    const data = JSON.stringify({ produtos, movimentacoes, config }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    saveAs(blob, 'backup-almoxarifado.json');
});

// Restore
document.getElementById('btnRestore').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            produtos = data.produtos || [];
            movimentacoes = data.movimentacoes || [];
            config = { ...config, ...data.config };
            salvarDados();
            aplicarConfig();
            atualizarSelectProdutos();
            renderProdutos();
            renderHistorico();
            atualizarDashboard();
            Toastify({ text: "Dados restaurados!", backgroundColor: "green", duration: 3000, close: true }).showToast();
        } catch (err) {
            Toastify({ text: "Erro no arquivo!", backgroundColor: "red", duration: 3000, close: true }).showToast();
        }
    };
    reader.readAsText(file);
});

document.getElementById('btnLimparDados').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja excluir TODOS os dados? Esta ação não pode ser desfeita. O tema será mantido.')) {
        const theme = config.theme;
        produtos = [];
        movimentacoes = [];
        config = { formatoData: 'pt-BR', calcularValor: false, moeda: 'R$', theme: theme };
        salvarDados();
        aplicarConfig();
        renderProdutos();
        renderHistorico();
        atualizarDashboard();
        atualizarSelectProdutos();
        Toastify({ text: "Todos os dados foram excluídos!", backgroundColor: "red", duration: 3000, close: true }).showToast();
    }
});

// Tema
function toggleTheme() {
    const body = document.body;
    if (config.theme === 'dark') {
        body.classList.add('dark');
    } else {
        body.classList.remove('dark');
    }
}

document.getElementById('btnToggleTheme').addEventListener('click', () => {
    config.theme = config.theme === 'light' ? 'dark' : 'light';
    salvarDados();
    toggleTheme();
});

// Modal Produto
document.getElementById('btnNovoProduto').addEventListener('click', () => {
    document.getElementById('formProduto').reset();
    document.getElementById('campoId').classList.add('hidden');
    // Populate datalist with existing product names
    const datalist = document.getElementById('produtosList');
    datalist.innerHTML = produtos.map(p => `<option value="${p.nome}">`).join('');
    document.getElementById('modalProduto').classList.remove('hidden');
});

document.getElementById('btnPlanilha').addEventListener('click', () => {
    fetch('https://script.google.com/macros/s/AKfycbzj4vXz9v4hya2oD_BVKn7-aUXfpmCqbWwiRq9B1IkTLIzd1FT1CRZtwyIDZ62fT309/exec', {
        method: 'POST',
        body: JSON.stringify(produtos),
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors'
    })
    .then(() => {
        Toastify({ text: "Planilha sincronizada!", backgroundColor: "green", duration: 3000 }).showToast();
        window.open('https://docs.google.com/spreadsheets/d/16H9kSlusFPymXwCsC5qFSFV2TGb1Wqp5dBsWJG6Q4So/edit?gid=0#gid=0', '_blank');
    })
    .catch(error => {
        console.error('Erro na sincronização:', error);
        alert('Erro na sincronização: ' + error.message);
        Toastify({ text: "Erro ao sincronizar planilha!", backgroundColor: "red", duration: 3000 }).showToast();
    });
});

document.getElementById('btnFecharModal').addEventListener('click', () => {
    document.getElementById('modalProduto').classList.add('hidden');
});

document.getElementById('modalProduto').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('modalProduto').classList.add('hidden');
    }
});

document.getElementById('formProduto').addEventListener('submit', (e) => {
    e.preventDefault();
    let id = document.getElementById('idProduto').value;
    const nome = document.getElementById('nomeProduto').value;
    const categoria = document.getElementById('categoriaProduto').value;
    const local = document.getElementById('localProduto').value;
    const quantidade = parseFloat(document.getElementById('quantidadeProduto').value);
    const unidade = document.getElementById('unidadeProduto').value;
    const estoque_minimo = parseFloat(document.getElementById('estoqueMinProduto').value);
    const fornecedor = document.getElementById('fornecedorProduto').value;
    const preco_unitario = parseFloat(document.getElementById('precoProduto').value) || null;
    const descricao = document.getElementById('descProduto').value;

    if (!id) {
        id = getNextId();
    }

    const existing = produtos.find(p => p.id === id);
    if (existing) {
        Object.assign(existing, { nome, categoria, local, quantidade, unidade, estoque_minimo, fornecedor, preco_unitario, descricao });
    } else {
        produtos.push({ id, nome, categoria, local, quantidade, unidade, estoque_minimo, fornecedor, preco_unitario, descricao });
    }

    salvarDados();
    document.getElementById('modalProduto').classList.add('hidden');
    renderProdutos();
    atualizarSelectProdutos();
    atualizarDashboard();
    if (!document.getElementById('historico').classList.contains('hidden')) renderHistorico();
    Toastify({ text: "Produto salvo!", backgroundColor: "green", duration: 3000, close: true }).showToast();
});

// Busca
document.getElementById('buscaProduto').addEventListener('input', renderProdutos);

// Inicializar
// Event listener para mostrar quantidade disponível
document.getElementById('produtoMov').addEventListener('change', (e) => {
    const id = e.target.value;
    const produto = produtos.find(p => p.id === id);
    if (produto) {
        document.getElementById('quantidadeDisponivel').textContent = `Quantidade disponível: ${produto.quantidade}`;
    } else {
        document.getElementById('quantidadeDisponivel').textContent = 'Selecione um produto para ver a quantidade disponível.';
    }
});

function init() {
    atualizarSelectProdutos();

    // Event listeners nav desktop
    document.getElementById('btnDashboard').addEventListener('click', () => mostrarSecao('dashboard'));
    document.getElementById('btnProdutos').addEventListener('click', () => mostrarSecao('produtos'));
    document.getElementById('btnMovimentacoes').addEventListener('click', () => mostrarSecao('movimentacoes'));
    document.getElementById('btnHistorico').addEventListener('click', () => mostrarSecao('historico'));
    document.getElementById('btnRelatorios').addEventListener('click', () => mostrarSecao('relatorios'));
    document.getElementById('btnConfig').addEventListener('click', () => mostrarSecao('config'));

    // Event listeners nav mobile
    document.getElementById('btnDashboardM').addEventListener('click', () => { mostrarSecao('dashboard'); toggleMenu(); });
    document.getElementById('btnProdutosM').addEventListener('click', () => { mostrarSecao('produtos'); toggleMenu(); });
    document.getElementById('btnMovimentacoesM').addEventListener('click', () => { mostrarSecao('movimentacoes'); toggleMenu(); });
    document.getElementById('btnHistoricoM').addEventListener('click', () => { mostrarSecao('historico'); toggleMenu(); });
    document.getElementById('btnRelatoriosM').addEventListener('click', () => { mostrarSecao('relatorios'); toggleMenu(); });
    document.getElementById('btnConfigM').addEventListener('click', () => { mostrarSecao('config'); toggleMenu(); });

    // Menu hambúrguer
    document.getElementById('btnMenu').addEventListener('click', toggleMenu);
    document.getElementById('btnToggleTheme').addEventListener('click', () => {
    config.theme = config.theme === 'light' ? 'dark' : 'light';
    salvarDados();
    toggleTheme();
});
    document.getElementById('btnToggleThemeM').addEventListener('click', () => { config.theme = config.theme === 'light' ? 'dark' : 'light'; salvarDados(); toggleTheme(); toggleMenu(); });

    // Mostrar dashboard inicial
    mostrarSecao('dashboard');
}

function toggleMenu() {
    const menu = document.getElementById('menuDropdown');
    const iconHamburger = document.getElementById('iconHamburger');
    const iconX = document.getElementById('iconX');
    menu.classList.toggle('open');
    iconHamburger.classList.toggle('hidden');
    iconX.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('menuDropdown');
    const btnMenu = document.getElementById('btnMenu');
    if (!menu.contains(e.target) && !btnMenu.contains(e.target) && menu.classList.contains('open')) {
        toggleMenu();
    }
});

// Solicitar permissão para notificações
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Permissão para notificações concedida');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDados(init);
    requestNotificationPermission();
});
