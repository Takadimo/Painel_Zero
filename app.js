/**
 * Arquivo principal de controle da UI, Renderização Dinâmica e Delegação Global de Eventos
 */

// Alternância de Abas
function switchTab(targetTabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('#nav-tabs button').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeTab = document.getElementById(targetTabId);
    if (activeTab) activeTab.classList.add('active');

    // Se mudar para a aba de peças ou hoje, atualiza a renderização
    if (targetTabId === 'tab-hoje' || targetTabId === 'tab-pecas') {
        renderDynamicContent();
    }
}

// Renderiza dinamicamente as peças e trechos na interface
function renderDynamicContent() {
    const repertoire = Repertoire.getRepertoire();
    
    // Renderiza na Aba Hoje
    const hojeContainer = document.getElementById('trechos-hoje-container');
    if (hojeContainer) {
        if (repertoire.length === 0) {
            hojeContainer.innerHTML = '<p>Nenhum repertório cadastrado na matriz.</p>';
        } else {
            let html = '';
            repertoire.forEach(piece => {
                piece.blocks.forEach(block => {
                    html += `
                        <div style="background: #1e293b; border: 1px solid #334155; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                            <h3 style="margin: 0 0 5px 0; color: #38bdf8;">${piece.title} <span style="font-size: 0.8em; color: #94a3b8;">(${piece.composer})</span></h3>
                            <p style="margin: 5px 0;">Compassos: <strong>${block.compass}</strong> | Tipo: <em>${block.type}</em></p>
                            <button class="btn-action" data-action="evaluate-block" data-piece-id="${piece.id}" data-block-id="${block.id}" data-result="acerto">Acertei / Avançar</button>
                            <button class="btn-action" style="background-color: #ef4444; margin-left: 10px;" data-action="evaluate-block" data-piece-id="${piece.id}" data-block-id="${block.id}" data-result="erro">Precisa Atenção</button>
                        </div>
                    `;
                });
            });
            hojeContainer.innerHTML = html;
        }
    }

    // Renderiza na Aba Peças
    const pecasContainer = document.getElementById('lista-pecas-container');
    if (pecasContainer) {
        let html = '';
        repertoire.forEach(piece => {
            html += `
                <div style="background: #1e293b; border: 1px solid #334155; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h3 style="margin: 0 0 5px 0; color: #38bdf8;">${piece.title}</h3>
                    <p style="margin: 0 0 10px 0; color: #94a3b8;">Compositor: ${piece.composer}</p>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${piece.blocks.map(b => `<li>Compassos ${b.compass} (${b.type}) - Status: <strong>${b.status}</strong></li>`).join('')}
                    </ul>
                </div>
            `;
        });
        pecasContainer.innerHTML = html;
    }
}

// Atualiza o painel de debug na aba de configurações
function updateDebugView() {
    const debugPre = document.getElementById('state-debug');
    if (debugPre) {
        debugPre.textContent = JSON.stringify(State.getState(), null, 2);
    }
}

// DELEGAÇÃO GLOBAL DE EVENTOS
document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');

    switch (action) {
        case 'switch-tab':
            const tabId = target.getAttribute('data-tab');
            if (tabId) {
                switchTab(tabId);
                if (tabId === 'tab-config') updateDebugView();
            }
            break;

        case 'evaluate-block':
            const pieceId = target.getAttribute('data-piece-id');
            const blockId = target.getAttribute('data-block-id');
            const result = target.getAttribute('data-result');
            
            State.updateState(state => {
                if (!state.history) state.history = {};
                const timestamp = new Date().toISOString();
                if (!state.history[timestamp]) state.history[timestamp] = [];
                state.history[timestamp].push({ pieceId, blockId, result });
            });
            
            alert(`Avaliação registrada com sucesso: ${result.toUpperCase()}! Salvo no localStorage.`);
            updateDebugView();
            break;

        default:
            console.warn(`Ação desconhecida: ${action}`);
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('Fase 2 carregada: Matriz dinâmica de repertório integrada.');
    renderDynamicContent();
});
