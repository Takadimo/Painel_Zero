/**
 * app.js - Camada de Controle de UI e Despachante de Eventos
 * Painel de Estudos de Piano & Acordeon (Versão 6 Final)
 */

let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializa o Estado Global
    const state = window.StateManager.init();
    
    // 2. Inicializa o Repertório
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
    populateOfflineSelects(state);
    console.log("[App] Painel de Estudos V6 Final inicializado com sucesso.");
});

/**
 * Função principal de renderização que orquestra todas as views
 */
function renderApp(state) {
    renderTabs(state.activeTab);
    
    // 1. Sessão Guiada
    if (window.SessionPlayer) {
        window.SessionPlayer.renderUI(state);
    }

    // 2. Sessão Sanduíche
    if (window.SandwichPlayer) {
        window.SandwichPlayer.renderUI(state);
    }

    // 3. Aba Técnica
    if (window.TechnicalManager) {
        window.TechnicalManager.renderUI(state);
    }

    // 4. Aba Leitura
    if (window.ReadingManager) {
        window.ReadingManager.renderUI(state);
    }

    // 5. Aba Progresso (Gráficos SVG & Telemetria)
    if (window.ChartsManager) {
        window.ChartsManager.renderAll(state);
    }

    // 6. Aba Log & Nuvem (Histórico & URL)
    if (window.CloudSync) {
        window.CloudSync.renderHistoryTable(state);
        const urlInput = document.getElementById("cloudUrlInput");
        if (urlInput && state.cloudSyncUrl) urlInput.value = state.cloudSyncUrl;
    }

    renderColdAudits(state);
    renderDailySummary(state);
    renderRepertoireView(state);
}

/**
 * Alterna a exibição das abas
 */
function renderTabs(activeTab) {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === activeTab);
    });

    document.querySelectorAll(".section").forEach(sec => {
        sec.classList.toggle("active", sec.id === `section-${activeTab}`);
    });
}

/**
 * Popula os selects do formulário de prática offline
 */
function populateOfflineSelects(state) {
    const pilarSelect = document.getElementById("offlinePilarSelect");
    const itemSelect = document.getElementById("offlineItemSelect");
    if (!pilarSelect || !itemSelect) return;

    const pilar = pilarSelect.value;
    itemSelect.innerHTML = "";

    if (pilar === "repertoire") {
        const pieces = (state.repertoire && state.repertoire.active) ? state.repertoire.active : [];
        itemSelect.innerHTML = pieces.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
    } else if (pilar === "technical") {
        itemSelect.innerHTML = `
            <option value="scales">Escalas (Padrão Russo / Contrário)</option>
            <option value="arpeggios">Arpejos (Fundamental / Inversões)</option>
            <option value="cadences">Cadências nos 12 Tons</option>
        `;
    } else if (pilar === "reading") {
        itemSelect.innerHTML = `
            <option value="001">Faber 001 - Firefly</option>
            <option value="002">Faber 002 - Russian Folk Song</option>
            <option value="003">Faber 003 - The Bell Tower</option>
            <option value="004">Faber 004 - Classic Minuet</option>
        `;
    } else {
        itemSelect.innerHTML = `<option value="free">Prática Livre / Improvisação</option>`;
    }
}

/**
 * Renderiza o Card de Auditoria a Frio Avulsa na Aba Hoje
 */
function renderColdAudits(state) {
    const container = document.getElementById("auditListContainer");
    const badgeCount = document.getElementById("auditBadgeCount");
    const cardEl = document.getElementById("coldAuditCard");
    if (!container) return;

    if (state.sessionState && state.sessionState.guidedActive) {
        if (cardEl) cardEl.style.display = "none";
        return;
    } else {
        if (cardEl) cardEl.style.display = "block";
    }

    const dueAudits = window.NeuroEngine ? window.NeuroEngine.getDueColdAudits() : [];
    
    if (badgeCount) {
        badgeCount.textContent = `${dueAudits.length} pendentes`;
        badgeCount.className = `badge ${dueAudits.length > 0 ? 'warn' : 'info'}`;
    }

    if (dueAudits.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 12px; color: var(--text-muted); font-size: 0.82rem;">
                ✨ Todas as auditorias a frio de hoje estão concluídas!
            </div>
        `;
        return;
    }

    container.innerHTML = dueAudits.map(item => `
        <div class="audit-item">
            <div class="audit-header">
                <div>
                    <span class="audit-title">${item.pieceTitle}</span>
                    <span class="box-badge box-${item.trecho.box}">Caixa ${item.trecho.box}</span>
                </div>
                <span class="audit-meta">IFM: <strong>${item.ifm}</strong> | Comp. ${item.trecho.compassos}</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 8px;">
                Trecho: <strong>${item.trecho.label}</strong> (1º tiro sem aquecimento)
            </div>
            <div style="display: flex; gap: 6px;">
                <button class="btn-audit btn-audit-hit" 
                        data-action="audit-hit" 
                        data-piece="${item.pieceId}" 
                        data-trecho="${item.trecho.id}">
                    🟢 Limpo (+15 XP)
                </button>
                <button class="btn-audit btn-audit-slip" 
                        data-action="audit-slip" 
                        data-piece="${item.pieceId}" 
                        data-trecho="${item.trecho.id}">
                    🟡 Escorregão
                </button>
                <button class="btn-audit btn-audit-miss" 
                        data-action="audit-miss" 
                        data-piece="${item.pieceId}" 
                        data-trecho="${item.trecho.id}">
                    🔴 Travou
                </button>
            </div>
        </div>
    `).join('');
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
 * Renderiza a lista de peças e microblocos na Aba Peças
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
                    <div class="trecho-row">
                        <div>
                            <strong>${t.label}</strong> (Comp. ${t.compassos})
                            <span class="box-badge box-${t.box}" style="margin-left: 4px;">Caixa ${t.box}</span>
                            ${t.isCorrectingHabit ? '<span class="badge danger" style="margin-left:4px;">🛠️ Vício</span>' : ''}
                        </div>
                        <div style="display:flex; align-items:center; gap: 8px;">
                            <span style="color: var(--text-muted); font-size: 0.72rem;">
                                ${t.lifetimeHits || 0}/${t.lifetimeAttempts || 0} (${t.slips || 0} slips)
                            </span>
                            <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.7rem;" data-action="start-sandwich-specific" data-piece="${piece.id}" data-trecho="${t.id}">
                                🥪 Sanduíche
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

/**
 * Delegação Global de Eventos
 */
function setupGlobalEventListeners() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;

        const action = btn.dataset.action;
        const pieceId = btn.dataset.piece;
        const trechoId = btn.dataset.trecho;
        const category = btn.dataset.category;
        const itemId = btn.dataset.id;
        const checkItem = btn.dataset.item;
        const filterVal = btn.dataset.filter;

        switch (action) {
            case "switch-tab":
                const targetTab = btn.dataset.tab;
                if (targetTab) {
                    window.StateManager.setState({ activeTab: targetTab }, "SWITCH_TAB");
                }
                break;

            // Nuvem (Google Apps Script)
            case "save-cloud-url":
                const urlVal = document.getElementById("cloudUrlInput")?.value;
                if (window.CloudSync && urlVal) {
                    window.CloudSync.saveCloudUrl(urlVal.trim());
                }
                break;

            case "cloud-push":
                if (window.CloudSync) window.CloudSync.pushToCloud();
                break;

            case "cloud-pull":
                if (window.CloudSync) window.CloudSync.pullFromCloud();
                break;

            // Registro Manual Offline
            case "save-offline-practice":
                const pilar = document.getElementById("offlinePilarSelect")?.value;
                const item = document.getElementById("offlineItemSelect")?.value;
                const minutes = document.getElementById("offlineMinutesInput")?.value;
                const bpm = document.getElementById("offlineBpmInput")?.value;
                const notes = document.getElementById("offlineNotesInput")?.value;

                if (window.CloudSync) {
                    window.CloudSync.saveManualOfflinePractice(pilar, item, minutes, bpm, notes);
                }
                break;

            // Filtros de Tempo (Progresso)
            case "filter-time":
                if (filterVal) {
                    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    window.StateManager.setState({ timeFilter: filterVal }, "CHANGE_TIME_FILTER");
                }
                break;

            // Sessão Guiada
            case "start-guided-session":
                if (window.SessionPlayer) window.SessionPlayer.startSession();
                break;
            case "next-guided-block":
                if (window.SessionPlayer) window.SessionPlayer.nextBlock();
                break;
            case "prev-guided-block":
                if (window.SessionPlayer) window.SessionPlayer.prevBlock();
                break;
            case "exit-guided-session":
                if (window.SessionPlayer) window.SessionPlayer.exitSession();
                break;
            case "open-sandwich-from-block":
                if (window.SandwichPlayer) window.SandwichPlayer.startSession(pieceId, trechoId);
                break;

            // Modo Sanduíche
            case "start-sandwich-specific":
                if (window.SandwichPlayer) window.SandwichPlayer.startSession(pieceId, trechoId);
                break;
            case "sw-hit":
                if (window.SandwichPlayer) window.SandwichPlayer.registerHit();
                break;
            case "sw-miss":
                if (window.SandwichPlayer) window.SandwichPlayer.registerMiss();
                break;
            case "toggle-prompt":
                if (window.SandwichPlayer) window.SandwichPlayer.togglePromptVisibility();
                break;
            case "skip-tech-interval":
                if (window.SandwichPlayer) window.SandwichPlayer.skipTechnicalInterval();
                break;
            case "finish-sandwich-early":
                if (confirm("Deseja encerrar o treino Sanduíche? O progresso até aqui será consolidado.")) {
                    if (window.SandwichPlayer) window.SandwichPlayer.finishSession();
                }
                break;

            // Módulo Técnico
            case "start-tech-exercise":
                if (window.TechnicalManager) window.TechnicalManager.startExercisePractice(category, itemId);
                break;
            case "eval-tech-fluent":
                if (window.TechnicalManager) window.TechnicalManager.evaluatePractice("fluent");
                break;
            case "eval-tech-limit":
                if (window.TechnicalManager) window.TechnicalManager.evaluatePractice("limit");
                break;
            case "eval-tech-fast":
                if (window.TechnicalManager) window.TechnicalManager.evaluatePractice("fast");
                break;

            // Módulo de Leitura
            case "toggle-check":
                if (window.ReadingManager && checkItem) window.ReadingManager.toggleChecklist(checkItem);
                break;
            case "start-checklist-timer":
                if (window.ReadingManager) window.ReadingManager.startChecklistTimer();
                break;
            case "complete-reading":
                if (window.ReadingManager) window.ReadingManager.completeReading();
                break;

            // Auditoria a Frio
            case "audit-hit":
                if (window.NeuroEngine) window.NeuroEngine.processAuditResult(pieceId, trechoId, "hit");
                break;
            case "audit-slip":
                if (window.NeuroEngine) window.NeuroEngine.processAuditResult(pieceId, trechoId, "slip");
                break;
            case "audit-miss":
                if (window.NeuroEngine) window.NeuroEngine.processAuditResult(pieceId, trechoId, "miss");
                break;

            // Cronômetro Livre
            case "start-timer":
                startFocusTimer();
                break;
            case "stop-timer":
                stopFocusTimer();
                break;
            case "reset-timer":
                resetFocusTimer();
                break;

            // Backup JSON
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

    document.addEventListener("change", (e) => {
        if (e.target.id === "faberSelect") {
            const exId = e.target.value;
            if (window.ReadingManager) {
                window.ReadingManager.selectExercise(exId);
            }
        } else if (e.target.id === "offlinePilarSelect") {
            populateOfflineSelects(window.StateManager.getState());
        }
    });
}

function startFocusTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;

    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerDisplay();

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

function exportSavegameToClipboard() {
    const jsonStr = window.StateManager.exportSavegame();
    navigator.clipboard.writeText(jsonStr).then(() => {
        alert("Savegame JSON copiado para a área de transferência!");
    }).catch(err => {
        prompt("Copie seu Savegame manualmente abaixo:", jsonStr);
    });
}

