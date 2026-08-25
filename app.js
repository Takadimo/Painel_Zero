/**
 * Arquivo principal de controle da UI, Renderização, Cronômetro e Delegação Global de Eventos
 */

let practiceTimerInterval = null;

// Formata segundos para MM:SS
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

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

    if (targetTabId === 'tab-hoje' || targetTabId === 'tab-pecas') {
        renderDynamicContent();
    }
}

// Renderiza dinamicamente as peças, o cronômetro e os trechos na interface
function renderDynamicContent() {
    const repertoire = Repertoire.getRepertoire();
    const currentState = State.getState();
    
    // Injeta o bloco do Cronômetro na Aba Hoje se ainda não existir
    const hojeContainer = document.getElementById('trechos-hoje-container');
    if (hojeContainer) {
        let timerHtml = `
            <div style="background: #0f172a; border: 1px solid #334155; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #38bdf8;">⏱️ Cronômetro de Prática</h3>
                <div id="display-cronometro" style="font-size: 2.5em; font-weight: bold; font-family: monospace; color: #f8fafc; margin-bottom: 15px;">
                    ${formatTime(currentState.sessionTime || 0)}
                </div>
                <div>
                    <button class="btn-action" data-action="toggle-timer" style="background-color: ${currentState.isPracticing ? '#ef4444' : '#22c55e'}; padding: 10px 20px; font-size: 1em;">
                        ${currentState.isPracticing ? 'Pausar Sessão' : 'Iniciar Sessão'}
                    </button>
                    <button class="btn-action" data-action="reset-timer" style="background-color: #64748b; margin-left: 10px; padding: 10px 20px; font-size: 1em;">Zerar</button>
                </div>
            </div>
            <h3 style="color: #f8fafc; margin-top: 20px;">Trechos Ativos para Estudo</h3>
        `;

        if (repertoire.length === 0) {
            hojeContainer.innerHTML = timerHtml + '<p>Nenhum repertório cadastrado na matriz.</p>';
        } else {
            let html = timerHtml;
            repertoire.forEach(piece => {
                piece.blocks.forEach(block => {
                    html += `
                        <div style="background: #1e293b; border: 1px solid #334155; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                            <h4 style="margin: 0 0 5px 0; color: #38bdf8;">${piece.title} <span style="font-size: 0.8em; color: #94a3b8;">(${piece.composer})</span></h4>
                            <p style="margin: 5px 0; color: #cbd5e1;">Compassos: <strong>${block.compass}</strong> | Tipo: <em>${block.type}</em></p>
                            <button class="btn-action" data-action="evaluate-block" data-piece-id="${piece.id}" data-block-id="${block.id}" data-result="acerto" style="background-color: #0284c7; padding: 6px 12px; border: none; border-radius: 4px; color: white; cursor: pointer;">Acertei / Avançar</button>
                            <button class="btn-action" data-action="evaluate-block" data-piece-id="${piece.id}" data-block-id="${block.id}" data-result="erro" style="background-color: #ef4444; margin-left: 10px; padding: 6px 12px; border: none; border-radius: 4px; color: white; cursor: pointer;">Precisa Atenção</button>
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
                    <ul style="margin: 0; padding-left: 20px; color: #cbd5e1;">
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

// Gerenciamento do Cronômetro em Segundo Plano
function setupTimerEngine() {
    if (practiceTimerInterval) clearInterval(practiceTimerInterval);
    
    practiceTimerInterval = setInterval(() => {
        const state = State.getState();
        if (state.isPracticing) {
            State.updateState(s => {
                s.sessionTime = (s.sessionTime || 0) + 1;
            });
            const display = document.getElementById('display-cronometro');
            if (display) {
                display.textContent = formatTime(State.getState().sessionTime);
            }
        }
    }, 1000);
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
            
            alert(`Avaliação registrada com sucesso: ${result.toUpperCase()}! Salvo no navegador.`);
            updateDebugView();
            break;

        case 'toggle-timer':
            State.updateState(state => {
                state.isPracticing = !state.isPracticing;
            });
            renderDynamicContent();
            break;

        case 'reset-timer':
            if (confirm('Deseja zerar o tempo da sessão atual?')) {
                State.updateState(state => {
                    state.sessionTime = 0;
                    state.isPracticing = false;
                });
                renderDynamicContent();
            }
            break;

        default:
            console.warn(`Ação desconhecida: ${action}`);
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('Fase 3 carregada: Cronômetro e motor de sessão integrados.');
    renderDynamicContent();
    setupTimerEngine();
});
