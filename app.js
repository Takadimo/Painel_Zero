/**
 * app.js - Camada de Controle de UI e Despachante de Eventos
 * Painel de Estudos de Piano & Acordeon (Versão 0)
 */

let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializa o Estado Global
    const state = window.StateManager.init();
    
    // 2. Inicializa o Repertório se necessário
    if (window.RepertoireManager) {
        window.RepertoireManager.initRepertoire();
    }

    // 3. Inscreve a UI para re-renderizar em atualizações
    window.StateManager.subscribe((currentState, actionLabel) => {
        console.log(`[App] Estado atualizado (${actionLabel})`);
        renderApp(currentState);
    });

    // 4. Configura ouvintes de eventos globais
    setupGlobalEventListeners();

    // 5. Primeira renderização da aplicação
    renderApp(state);
    console.log("[App] Painel de Estudos inicializado com sucesso.");
});

/**
 * Função principal de renderização que orquestra as views
 */
function renderApp(state) {
    renderTabs(state.activeTab);
    renderDailySummary(state);
    renderRepertoireView(state);
}

/**
 * Alterna a exibição das abas
 */
function renderTabs(activeTab) {
    // Atualiza botões
    document.querySelectorAll(".tab-btn").forEach(btn => {
        const tab = btn.dataset.tab;
        if (tab === activeTab) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Atualiza seções
    document.querySelectorAll(".section").forEach(sec => {
        if (sec.id === `section-${activeTab}`) {
            sec.classList.add("active");
        } else {
            sec.classList.remove("active");
        }
    });
}

/**
 * Renderiza o resumo de estatísticas de hoje
 */
function renderDailySummary(state) {
    const totalMinEl = document.getElementById("statTotalMinutes");
    const sessionsEl = document.getElementById("statSessions");
    const auditsEl = document.getElementById("statAudits");

    if (totalMinEl) totalMinEl.textContent = (state.dailyStats && state.dailyStats.focusMinutes) || 0;
    if (sessionsEl) sessionsEl.textContent = (state.globalStats && state.globalStats.totalSessions) || 0;
    if (auditsEl) auditsEl.textContent = (state.dailyStats && state.dailyStats.completedAudits) || 0;
}

/**
 * Renderiza a lista de peças ativas e seus microblocos na Aba Peças
 */
function renderRepertoireView(state) {
    const listEl = document.getElementById("repertoireList");
    if (!listEl) return;

    const pieces = (state.repertoire && state.repertoire.active) ? state.repertoire.active : [];
    
    if (pieces.length === 0) {
        listEl.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Nenhuma peça cadastrada.</p>`;
        return;
    }

    listEl.innerHTML = pieces.map(piece => `
        <div class="piece-item">
            <div class="piece-header">
                <span class="piece-title">${piece.title} — <small style="color: var(--text-muted);">${piece.composer}</small></span>
                <span class="badge ${piece.isPaused ? 'warn' : 'info'}">${piece.phase || 'Ativa'}</span>
            </div>
            <div style="margin-top: 8px;">
                ${(piece.trechos || []).map(t => `
                    <span class="microblock-tag" title="Caixa ${t.box} Leitner">
                        ${t.label} (Cx ${t.box})
                    </span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

/**
 * Configuração da Delegação Global de Eventos (sem onclick inline)
 */
function setupGlobalEventListeners() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;

        const action = btn.dataset.action;

        switch (action) {
            case "switch-tab":
                const targetTab = btn.dataset.tab;
                if (targetTab) {
                    window.StateManager.setState({ activeTab: targetTab }, "SWITCH_TAB");
                }
                break;

            case "start-timer":
                startFocusTimer();
                break;

            case "stop-timer":
                stopFocusTimer();
                break;

            case "reset-timer":
                resetFocusTimer();
                break;

            case "export-savegame":
                exportSavegameToClipboard();
                break;

            case "reset-defaults":
                if (confirm("Deseja realmente resetar todos os dados para o padrão inicial?")) {
                    window.StateManager.resetToDefaults();
                    alert("Dados resetados para o padrão de fábrica.");
                }
                break;
        }
    });
}

/**
 * Controle do Cronômetro de Foco
 */
function startFocusTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;

    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerDisplay();

        // A cada 60 segundos completos, credita 1 minuto no dailyStats
        if (timerSeconds % 60 === 0) {
            window.StateManager.setState(prev => ({
                dailyStats: {
                    ...prev.dailyStats,
                    focusMinutes: (prev.dailyStats.focusMinutes || 0) + 1
                },
                globalStats: {
                    ...prev.globalStats,
                    totalMinutes: (prev.globalStats.totalMinutes || 0) + 1
                }
            }), "ACCUMULATE_FOCUS_MINUTE");
        }
    }, 1000);
}

function stopFocusTimer() {
    if (!isTimerRunning) return;
    isTimerRunning = false;
    clearInterval(timerInterval);
}

function resetFocusTimer() {
    stopFocusTimer();
    timerSeconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const display = document.getElementById("timerDisplay");
    if (!display) return;

    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Exporta o Savegame JSON para a área de transferência
 */
function exportSavegameToClipboard() {
    const jsonStr = window.StateManager.exportSavegame();
    navigator.clipboard.writeText(jsonStr).then(() => {
        alert("Savegame JSON copiado para a área de transferência com sucesso!");
    }).catch(err => {
        console.error("Erro ao copiar Savegame:", err);
        prompt("Copie seu Savegame manualmente abaixo:", jsonStr);
    });
}

