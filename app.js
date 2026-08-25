/**
 * Arquivo principal de controle da UI e Delegação Global de Eventos
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
}

// Atualiza o painel de debug na aba de configurações
function updateDebugView() {
    const debugPre = document.getElementById('state-debug');
    if (debugPre) {
        debugPre.textContent = JSON.stringify(State.getState(), null, 2);
    }
}

// DELEGAÇÃO GLOBAL DE EVENTOS (Regra arquitetural)
document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');

    switch (action) {
        case 'switch-tab':
            const tabId = target.getAttribute('data-tab');
            if (tabId) {
                switchTab(tabId);
                // Se for a aba de config, atualiza o JSON de visualização
                if (tabId === 'tab-config') updateDebugView();
            }
            break;

        case 'test-action':
            State.updateState(state => {
                state.lastAction = 'Teste realizado em ' + new Date().toLocaleTimeString();
            });
            alert('Estado atualizado e salvo com sucesso no localStorage!');
            break;

        default:
            console.warn(`Ação desconhecida: ${action}`);
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('Fase 1 carregada com sucesso. Arquitetura base ativa.');
});
