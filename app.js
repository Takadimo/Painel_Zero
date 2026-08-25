import { StateManager } from './state.js';

// Inicializa o estado ao carregar a aplicação
document.addEventListener("DOMContentLoaded", () => {
  const state = StateManager.init();
  console.log("[App] Estado inicializado:", state);

  // Inscreve a UI para re-renderizar em atualizações
  StateManager.subscribe((currentState, action) => {
    console.log(`[App] Mudança de estado detectada: ${action}`);
    renderApp(currentState);
  });

  // Primeira renderização da interface
  renderApp(state);
});

function renderApp(state) {
  // Chamada para os renderizadores modulares (Abas, Hoje, Peças, etc.)
}/**
 * Arquivo principal de controle da UI, Cronômetro, Gestão de Múltiplos Blocos e Histórico
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

// Renderiza dinamicamente a interface com suporte a múltiplos microblocos
function renderDynamicContent() {
    const repertoire = Repertoire.getRepertoire();
    const currentState = State.getState();
    
    // Aba Hoje
    const hojeContainer = document.getElementById('trechos-hoje-container');
    if (hojeContainer) {
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
            <h3 style="color: #f8fafc; margin-top: 20px;">Matriz de Microblocos Ativos</h3>
        `;

        if (repertoire.length === 0) {
            hojeContainer.innerHTML = timerHtml + '<p style="color: #94a3b8;">Nenhum repertório cadastrado.</p>';
        } else {
            let html = timerHtml;
            repertoire.forEach(piece => {
                if (piece.blocks && Array.isArray(piece.blocks)) {
                    piece.blocks.forEach(block => {
                        let statusColor = '#38bdf8';
                        if (block.status === 'Consolidado') statusColor = '#22c55e';
                        if (block.status === 'Em Estudo') statusColor = '#f59e0b';

                        html += `
                            <div style="background: #1e293b; border: 1px solid #334155; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                <div>
                                    <h4 style="margin: 0 0 4px 0; color: #38bdf8;">${piece.title} <span style="font-size: 0.8em; color: #94a3b8;">(${piece.composer})</span></h4>
                                    <p style="margin: 0; color: #cbd5e1;">Compassos: <strong>${block.compass}</strong> | Status: <span style="color: ${statusColor}; font-weight: bold;">${block.status}</span></p>
                                </div>
                                <div>
                                    <button class="btn-action" data-action="evaluate-block" data-piece-id="${piece.id}" data-block-id="${block.id}" data-result="acerto" style="background-color: #0284c7; padding: 6px 12px; border: none; border-radius: 4px; color: white; cursor: pointer;">Acertei / Avançar</button>
                                    <button class="btn-action" data-action="evaluate-block" data-piece-id="${piece.id}" data-block-id="${block.id}" data-result="erro" style="background-color: #ef4444; margin-left: 8px; padding: 6px 12px; border: none; border-radius: 4px; color: white; cursor: pointer;">Precisa Atenção</button>
                                </div>
                            </div>
                        `;
                    });
                }
            });
            hojeContainer.innerHTML = html;
        }
    }

    // Aba Peças (Gerenciamento completo e adição de novos microblocos)
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
                        <label style="display: block; color: #cbd5e1; font-size: 0.9em; margin-bottom: 4px;">Compassos do 1º Microbloco:</label>
                        <input type="text" id="piece-compass" required placeholder="Ex: 1-4" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white;" />
                    </div>
                    <button type="submit" class="btn-action" style="background-color: #22c55e; padding: 10px; border: none; border-radius: 6px; color: white; font-weight: bold; cursor: pointer; margin-top: 5px;">Salvar Peça na Matriz</button>
                </form>
            </div>
            <h3 style="color: #f8fafc; margin-bottom: 15px;">Repertório e Blocos Cadastrados</h3>
        `;

        let listHtml = formHtml;
        if (repertoire.length === 0) {
            listHtml += '<p style="color: #94a3b8;">Nenhuma peça cadastrada.</p>';
        } else {
            repertoire.forEach(piece => {
                listHtml += `
                    <div style="background: #1e293b; border: 1px solid #334155; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="margin: 0 0 5px 0; color: #38bdf8;">${piece.title} <span style="font-size: 0.8em; color: #94a3b8;">(${piece.composer})</span></h4>
                        <div style="margin-top: 10px; margin-bottom: 15px;">
                            <strong style="font-size: 0.9em; color: #cbd5e1;">Microblocos:</strong>
                            <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #94a3b8;">
                                ${piece.blocks && piece.blocks.map(b => `
                                    <li style="margin-bottom: 4px;">
                                        Compassos <strong>${b.compass}</strong> (${b.type}) - Status: <span style="color: #38bdf8;">${b.status}</span>
                                        <button class="btn-action" data-action="cycle-status" data-piece-id="${piece.id}" data-block-id="${b.id}" style="margin-left: 10px; background: #334155; border: none; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; cursor: pointer;" title="Alterar Status">Mudar Status</button>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="text" id="new-compass-${piece.id}" placeholder="Novo bloco (ex: 5-8)" style="padding: 6px; border-radius: 4px; border: 1px solid #334155; background: #0f172a; color: white; font-size: 0.9em; width: 140px;" />
                            <button class="btn-action" data-action="add-block" data-piece-id="${piece.id}" style="background-color: #0284c7; padding: 6px 12px; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 0.9em;">+ Adicionar Bloco</button>
                        </div>
                    </div>
                `;
            });
        }
        pecasContainer.innerHTML = listHtml;
    }
}

// Painel de Debug na Aba Config
function updateDebugView() {
    const debugPre = document.getElementById('state-debug');
    if (debugPre) {
        debugPre.textContent = JSON.stringify(State.getState(), null, 2);
    }
}

// Motor do Cronômetro
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

// Delegação Global de Eventos
document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');
    const pieceId = target.getAttribute('data-piece-id');
    const blockId = target.getAttribute('data-block-id');

    switch (action) {
        case 'switch-tab':
            const tabId = target.getAttribute('data-tab');
            if (tabId) {
                switchTab(tabId);
                if (tabId === 'tab-config') updateDebugView();
            }
            break;

        case 'evaluate-block':
            const result = target.getAttribute('data-result');
            State.updateState(state => {
                if (!state.history) state.history = {};
                const timestamp = new Date().toISOString();
                if (!state.history[timestamp]) state.history[timestamp] = [];
                state.history[timestamp].push({ pieceId, blockId, result });

                // Atualiza o status do bloco baseado na avaliação
                const piece = state.repertoire.find(p => p.id === pieceId);
                if (piece && piece.blocks) {
                    const block = piece.blocks.find(b => b.id === blockId);
                    if (block) {
                        block.status = result === 'acerto' ? 'Consolidado' : 'Em Estudo';
                    }
                }
            });
            renderDynamicContent();
            break;

        case 'add-block':
            const inputField = document.getElementById(`new-compass-${pieceId}`);
            if (inputField && inputField.value.trim()) {
                const compassVal = inputField.value.trim();
                const newBlockId = 'b_' + Date.now();
                Repertoire.addBlockToPiece(pieceId, {
                    id: newBlockId,
                    compass: compassVal,
                    type: "Microbloco",
                    status: "Novo"
                });
                renderDynamicContent();
            }
            break;

        case 'cycle-status':
            const repertoire = Repertoire.getRepertoire();
            const piece = repertoire.find(p => p.id === pieceId);
            if (piece && piece.blocks) {
                const block = piece.blocks.find(b => b.id === blockId);
                if (block) {
                    const statuses = ['Novo', 'Em Estudo', 'Consolidado'];
                    const currentIndex = statuses.indexOf(block.status);
                    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                    Repertoire.updateBlockStatus(pieceId, blockId, nextStatus);
                    renderDynamicContent();
                }
            }
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
    }
});

// Intercepta cadastro de nova peça
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
        alert(`Peça "${title}" adicionada com sucesso!`);
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('Fase 6 carregada: Matriz de múltiplos microblocos integrada.');
    renderDynamicContent();
    setupTimerEngine();
});
