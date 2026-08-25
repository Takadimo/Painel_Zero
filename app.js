/**
 * Arquivo principal de controle da UI, Cronômetro, Cadastro, Histórico e Delegação de Eventos
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
    } else if (targetTabId === 'tab-config') {
        updateDebugView();
    }
}

// Renderiza dinamicamente as peças, o formulário, o cronômetro e o histórico recente na interface
function renderDynamicContent() {
    const repertoire = Repertoire.getRepertoire();
    const currentState = State.getState();
    
    // Injeta o bloco do Cronômetro, Resumo da Sessão e Trechos na Aba Hoje
    const hojeContainer = document.getElementById('trechos-hoje-container');
    if (hojeContainer) {
        // Conta quantas avaliações foram feitas nesta sessão (baseado no histórico)
        let totalAvaliacoesSessao = 0;
        if (currentState.history) {
            Object.values(currentState.history).forEach(arrayAvaliacoes => {
                totalAvaliacoesSessao += arrayAvaliacoes.length;
            });
        }

        let timerHtml = `
            <div style="background: #0f172a; border: 1px solid #334155; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #38bdf8;">⏱️ Cronômetro de Prática</h3>
                <div id="display-cronometro" style="font-size: 2.5em; font-weight: bold; font-family: monospace; color: #f8fafc; margin-bottom: 15px;">
                    ${formatTime(currentState.sessionTime || 0)}
                </div>
                <div style="font-size: 0.9em; color: #94a3b8; margin-bottom: 15px;">
                    Blocos avaliados nesta sessão: <strong style="color: #38bdf8;">${totalAvaliacoesSessao}</strong>
                </div>
                <div>
                    <button class="btn-action" data-action="toggle-timer" style="background-color: ${currentState.isPracticing ? '#ef4444' : '#22c55e'}; padding: 10px 20px; font-size: 1em; border: none; border-radius: 6px; color: white; cursor: pointer;">
                        ${currentState.isPracticing ? 'Pausar Sessão' : 'Iniciar Sessão'}
                    </button>
                    <button class="btn-action" data-action="reset-timer" style="background-color: #64748b; margin-left: 10px; padding: 10px 20px; font-size: 1em; border: none; border-radius: 6px; color: white; cursor: pointer;">Zerar</button>
                </div>
            </div>
            <h3 style="color: #f8fafc; margin-top: 20px;">Trechos Ativos para Estudo</h3>
        `;

        if (repertoire.length === 0) {
            hojeContainer.innerHTML = timerHtml + '<p style="color: #94a3b8;">Nenhum repertório cadastrado na matriz.</p>';
        } else {
            let html = timerHtml;
            repertoire.forEach(piece => {
                if (piece.blocks && Array.isArray(piece.blocks)) {
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
                }
            });
            hojeContainer.innerHTML = html;
        }
    }

    // Renderiza na Aba Peças
    const pecasContainer = document.getElementById('lista-pecas-container');
    if (pecasContainer) {
        let formHtml = `
            <div style="background: #0f172a; border: 1px solid #334155; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #38bdf8;">➕ Adicionar Nova Peça / Exercício</h3>
                <form id="form-add-piece" style="display: flex; flex-direction: column; gap: 12px;">
                    <div>
                        <label style="display: block; color: #cbd5e1; font-size: 0.9em; margin-bottom: 4px;">Título da Peça:</label>
                        <input type="text" id="piece-title" required placeholder="Ex: Prelúdio em Dó Maior" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white;" />
                    </div>
                    <div>
                        <label style="display: block; color: #cbd5e1; font-size: 0.9em; margin-bottom: 4px;">Compositor:</label>
                        <input type="text" id="piece-composer" required placeholder="Ex: J. S. Bach" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white;" />
                    </div>
                    <div>
                        <label style="display: block; color: #cbd5e1; font-size: 0.9em; margin-bottom: 4px;">Compassos do Microbloco:</label>
                        <input type="text" id="piece-compass" required placeholder="Ex: 1-8" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white;" />
                    </div>
                    <button type="submit" class="btn-action" data-action="submit-new-piece" style="background-color: #22c55e; padding: 10px; border: none; border-radius: 6px; color: white; font-weight: bold; cursor: pointer; margin-top: 5px;">Salvar na Matriz</button>
                </form>
            </div>
            <h3 style="color: #f8fafc; margin-bottom: 15px;">Repertório Cadastrado</h3>
        `;

        let listHtml = formHtml;
        if (repertoire.length === 0) {
            listHtml += '<p style="color: #94a3b8;">Nenhuma peça cadastrada.</p>';
        } else {
            repertoire.forEach(piece => {
                listHtml += `
                    <div style="background: #1e293b; border: 1px solid #334155; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="margin: 0 0 5px 0; color: #38bdf8;">${piece.title}</h4>
                        <p style="margin: 0 0 10px 0; color: #94a3b8;">Compositor: ${piece.composer}</p>
                        <ul style="margin: 0; padding-left: 20px; color: #cbd5e1;">
                            ${piece.blocks && piece.blocks.map(b => `<li>Compassos ${b.compass} (${b.type}) - Status: <strong>${b.status}</strong></li>`).join('')}
                        </ul>
                    </div>
                `;
            });
        }
        pecasContainer.innerHTML = listHtml;
    }
}

// Atualiza o painel de debug e histórico na aba de configurações
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
            
            // Atualiza a visualização caso esteja na aba ativa
            renderDynamicContent();
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

// Intercepta o envio do formulário de nova peça
document.addEventListener('submit', (event) => {
    if (event.target && event.target.id === 'form-add-piece') {
        event.preventDefault();
        
        const title = document.getElementById('piece-title').value.trim();
        const composer = document.getElementById('piece-composer').value.trim();
        const compass = document.getElementById('piece-compass').value.trim();
        
        if (!title || !composer || !compass) return;

        const newPieceId = title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
        const newBlockId = 'b_' + Date.now();

        const newPieceData = {
            id: newPieceId,
            title: title,
            composer: composer,
            blocks: [
                { id: newBlockId, compass: compass, type: "Microbloco", status: "Novo" }
            ]
        };

        Repertoire.addPiece(newPieceData);
        renderDynamicContent();
        alert(`Peça "${title}" adicionada com sucesso à matriz!`);
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('Fase 5 carregada: Histórico e contador de avaliações integrados.');
    renderDynamicContent();
    setupTimerEngine();
});
