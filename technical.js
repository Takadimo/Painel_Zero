/**
 * technical.js - Gerenciador do Pilar Técnico & Desafios de Velocidade
 * Painel de Estudos de Piano & Acordeon (Versão 4)
 * 
 * Taxonomia Hierárquica em 3 Níveis:
 * - Nível 1: Bloco Técnico Geral (minutos consolidados para metas)
 * - Nível 2: Categorias Fundamentais (1.1 Escalas, 1.2 Arpejos, 1.3 Cadências)
 * - Nível 3: Submodalidades (Movimento Paralelo, Contrário, Russo, Inversões)
 */

let techTimerInterval = null;
let techTimerSeconds = 0;
let isTechTimerRunning = false;
let currentTechItem = null;

class TechnicalManagerClass {
  startExercisePractice(category, itemId) {
    const state = window.StateManager.getState();
    const list = state.technical[category] || [];
    const item = list.find(i => i.id === itemId);
    if (!item) return;

    currentTechItem = { ...item, category };
    techTimerSeconds = 0;
    this.startTimer();

    window.StateManager.setState({
      activeTab: "tecnica"
    }, "OPEN_TECHNICAL_PRACTICE");
  }

  startTimer() {
    if (isTechTimerRunning) return;
    isTechTimerRunning = true;

    techTimerInterval = setInterval(() => {
      techTimerSeconds++;
      this.updateTimerDisplay();

      if (techTimerSeconds % 60 === 0) {
        window.StateManager.setState(prev => ({
          dailyStats: {
            ...prev.dailyStats,
            focusMinutes: (prev.dailyStats.focusMinutes || 0) + 1,
            technicalMinutes: (prev.dailyStats.technicalMinutes || 0) + 1
          },
          globalStats: {
            ...prev.globalStats,
            totalMinutes: (prev.globalStats.totalMinutes || 0) + 1
          }
        }), "ACCUMULATE_TECH_MINUTE");
      }
    }, 1000);
  }

  stopTimer() {
    if (!isTechTimerRunning) return;
    isTechTimerRunning = false;
    clearInterval(techTimerInterval);
  }

  updateTimerDisplay() {
    const el = document.getElementById("techTimerDisplay");
    if (!el) return;
    const mins = Math.floor(techTimerSeconds / 60);
    const secs = techTimerSeconds % 60;
    el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Autoavaliação de fluidez e ajuste adaptativo de BPM
   * @param {'fluent'|'limit'|'fast'} evaluation 
   */
  evaluatePractice(evaluation) {
    this.stopTimer();
    if (!currentTechItem) return;

    let bpmAdjustment = 0;
    let feedbackMsg = "";

    if (evaluation === "fluent") {
      bpmAdjustment = +2;
      feedbackMsg = "🟢 Fluente e limpo! Recorde de andamento aumentado em +2 BPM.";
    } else if (evaluation === "limit") {
      bpmAdjustment = 0;
      feedbackMsg = "🟡 No limite! Andamento mantido para estabilização motora.";
    } else if (evaluation === "fast") {
      bpmAdjustment = -4;
      feedbackMsg = "🔴 Muito rápido / Tensão detectada. Recuando 4 BPM para preservar a técnica.";
    }

    const newBpm = Math.max(40, currentTechItem.bpm + bpmAdjustment);
    const category = currentTechItem.category;
    const itemId = currentTechItem.id;

    // Atualiza o exercício técnico no StateManager
    window.StateManager.setState(prev => {
      const catList = [...(prev.technical[category] || [])];
      const idx = catList.findIndex(i => i.id === itemId);
      if (idx !== -1) {
        catList[idx] = {
          ...catList[idx],
          bpm: newBpm,
          totalMinutes: (catList[idx].totalMinutes || 0) + Math.ceil(techTimerSeconds / 60)
        };
      }

      return {
        xp: (prev.xp || 0) + 10,
        technical: {
          ...prev.technical,
          [category]: catList
        }
      };
    }, `EVALUATE_TECH_${evaluation.toUpperCase()}`);

    alert(feedbackMsg);
    currentTechItem = null;
    techTimerSeconds = 0;
  }

  renderUI(state) {
    const container = document.getElementById("technicalContainer");
    if (!container) return;

    const tech = state.technical || {};

    // Se estiver praticando um exercício ativo
    if (currentTechItem) {
      container.innerHTML = `
        <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 12px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="badge info">${currentTechItem.category.toUpperCase()}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Alvo: ${currentTechItem.targetBpm} BPM</span>
          </div>

          <h3 style="color: #fff; font-size: 1.15rem; margin-bottom: 4px;">${currentTechItem.title}</h3>
          <p style="font-size: 0.82rem; color: var(--accent); margin-bottom: 12px;">${currentTechItem.desc}</p>

          <div class="timer-box" style="margin: 12px 0;">
            <span id="techTimerDisplay" class="timer-display">00:00</span>
            <span style="font-size: 1.1rem; font-weight: 700; color: var(--accent2);">@ ${currentTechItem.bpm} BPM</span>
          </div>

          <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 8px; text-align: center;">
            Ao concluir o aquecimento/treino, avalie sua fluidez:
          </p>

          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <button class="btn-audit btn-audit-hit" data-action="eval-tech-fluent">
              🟢 Fluente (+2 BPM)
            </button>
            <button class="btn-audit btn-audit-slip" data-action="eval-tech-limit">
              🟡 No Limite
            </button>
            <button class="btn-audit btn-audit-miss" data-action="eval-tech-fast">
              🔴 Recuar (-4 BPM)
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Visualização dos 3 Níveis
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- 1. ESCALAS -->
        <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 12px; padding: 14px;">
          <h3 style="color: #fff; margin-bottom: 8px;">1.1 Escalas (Padrão Russo & Mov. Contrário)</h3>
          ${(tech.scales || []).map(item => `
            <div class="trecho-row">
              <div>
                <strong>${item.title}</strong>
                <div style="color: var(--text-muted); font-size: 0.72rem;">${item.desc} | Atual: <strong>${item.bpm} BPM</strong></div>
              </div>
              <button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.75rem;" data-action="start-tech-exercise" data-category="scales" data-id="${item.id}">
                ▶ Treinar
              </button>
            </div>
          `).join('')}
        </div>

        <!-- 2. ARPEJOS -->
        <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 12px; padding: 14px;">
          <h3 style="color: #fff; margin-bottom: 8px;">1.2 Arpejos (Posição Fundamental & Inversões)</h3>
          ${(tech.arpeggios || []).map(item => `
            <div class="trecho-row">
              <div>
                <strong>${item.title}</strong>
                <div style="color: var(--text-muted); font-size: 0.72rem;">${item.desc} | Atual: <strong>${item.bpm} BPM</strong></div>
              </div>
              <button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.75rem;" data-action="start-tech-exercise" data-category="arpeggios" data-id="${item.id}">
                ▶ Treinar
              </button>
            </div>
          `).join('')}
        </div>

        <!-- 3. CADÊNCIAS -->
        <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 12px; padding: 14px;">
          <h3 style="color: #fff; margin-bottom: 8px;">1.3 Cadências nos 12 Tons</h3>
          ${(tech.cadences || []).map(item => `
            <div class="trecho-row">
              <div>
                <strong>${item.title}</strong>
                <div style="color: var(--text-muted); font-size: 0.72rem;">${item.desc} | Atual: <strong>${item.bpm} BPM</strong></div>
              </div>
              <button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.75rem;" data-action="start-tech-exercise" data-category="cadences" data-id="${item.id}">
                ▶ Treinar
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

window.TechnicalManager = new TechnicalManagerClass();

