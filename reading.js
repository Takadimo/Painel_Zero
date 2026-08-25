/**
 * reading.js - Módulo de Leitura à Primeira Vista (Método Faber Piano Adventures 001 a 128)
 * Painel de Estudos de Piano & Acordeon (Versão 5)
 */

const FABER_EXERCISES = [
  { id: "001", number: 1, title: "001 - Firefly (Day 1)", key: "Dó Maior", timeSig: "4/4", hand: "MJ" },
  { id: "002", number: 2, title: "002 - Russian Folk Song", key: "Lá menor", timeSig: "4/4", hand: "MJ" },
  { id: "003", number: 3, title: "003 - The Bell Tower", key: "Sol Maior", timeSig: "3/4", hand: "MJ" },
  { id: "004", number: 4, title: "004 - Classic Minuet", key: "Fá Maior", timeSig: "3/4", hand: "MJ" },
  { id: "005", number: 5, title: "005 - Morning Sun", key: "Dó Maior", timeSig: "4/4", hand: "MJ" }
];

let checklistTimerInterval = null;
let checklistSeconds = 60;
let isChecklistRunning = false;

class ReadingManagerClass {
  constructor() {
    this.selectedExerciseId = "001";
    this.checklistState = {
      keySignature: false,
      timeSignature: false,
      melodicContour: false,
      intervals: false,
      fingering: false
    };
  }

  selectExercise(exerciseId) {
    this.selectedExerciseId = exerciseId;
    this.resetChecklist();
    window.StateManager.setState({
      reading: {
        ...window.StateManager.getState().reading,
        currentExerciseId: exerciseId
      }
    }, `SELECT_FABER_${exerciseId}`);
  }

  toggleChecklist(itemKey) {
    this.checklistState[itemKey] = !this.checklistState[itemKey];
    this.renderUI(window.StateManager.getState());
  }

  startChecklistTimer() {
    if (isChecklistRunning) return;
    isChecklistRunning = true;
    checklistSeconds = 60;

    checklistTimerInterval = setInterval(() => {
      checklistSeconds--;
      const el = document.getElementById("checklistTimerDisplay");
      if (el) el.textContent = `00:${String(Math.max(0, checklistSeconds)).padStart(2, '0')}`;

      if (checklistSeconds <= 0) {
        clearInterval(checklistTimerInterval);
        isChecklistRunning = false;
        if (el) el.textContent = "00:00 (Tempo Concluído)";
      }
    }, 1000);
  }

  resetChecklist() {
    if (checklistTimerInterval) clearInterval(checklistTimerInterval);
    isChecklistRunning = false;
    checklistSeconds = 60;
    this.checklistState = {
      keySignature: false,
      timeSignature: false,
      melodicContour: false,
      intervals: false,
      fingering: false
    };
  }

  completeReading() {
    if (checklistTimerInterval) clearInterval(checklistTimerInterval);
    isChecklistRunning = false;

    const currentEx = FABER_EXERCISES.find(e => e.id === this.selectedExerciseId) || FABER_EXERCISES[0];

    window.StateManager.setState(prev => ({
      xp: (prev.xp || 0) + 10,
      dailyStats: {
        ...prev.dailyStats,
        focusMinutes: (prev.dailyStats.focusMinutes || 0) + 5,
        readingMinutes: (prev.dailyStats.readingMinutes || 0) + 5
      },
      globalStats: {
        ...prev.globalStats,
        totalMinutes: (prev.globalStats.totalMinutes || 0) + 5
      },
      reading: {
        ...prev.reading,
        completedExercises: [...new Set([...(prev.reading.completedExercises || []), currentEx.id])]
      }
    }), `COMPLETE_READING_${currentEx.id}`);

    alert(`📖 Leitura do exercício "${currentEx.title}" concluída com sucesso! +10 XP creditados.`);
    this.resetChecklist();
  }

  renderUI(state) {
    const container = document.getElementById("readingContainer");
    if (!container) return;

    const currentId = (state.reading && state.reading.currentExerciseId) || this.selectedExerciseId;
    const currentEx = FABER_EXERCISES.find(e => e.id === currentId) || FABER_EXERCISES[0];
    const completedList = (state.reading && state.reading.completedExercises) || [];
    const isDone = completedList.includes(currentEx.id);

    container.innerHTML = `
      <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
        <label style="font-size: 0.82rem; color: var(--text-muted);">Exercício:</label>
        <select id="faberSelect" style="flex: 1; background: var(--card-inner); border: 1px solid var(--border); color: #fff; padding: 8px 10px; border-radius: 8px; font-size: 0.82rem;" data-action="change-faber-exercise">
          ${FABER_EXERCISES.map(e => `
            <option value="${e.id}" ${e.id === currentId ? 'selected' : ''}>
              ${e.title} (${e.key}) ${completedList.includes(e.id) ? '✅' : ''}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="split-view-container">
        <div class="reading-sheet-viewer">
          <div style="font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 4px;">
            ${currentEx.title}
          </div>
          <div style="font-size: 0.78rem; color: var(--accent); margin-bottom: 12px;">
            Tonalidade: <strong>${currentEx.key}</strong> | Compasso: <strong>${currentEx.timeSig}</strong> | Mãos: <strong>${currentEx.hand}</strong>
          </div>
          <div style="color: var(--text-muted); font-size: 0.85rem; padding: 30px; border: 1px dashed var(--border); border-radius: 8px; width: 100%;">
            [Partitura do Método Faber Piano Adventures — Leitura em Alta Resolução]
          </div>
        </div>

        <div class="reading-controls-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 0.82rem; color: var(--warn); text-transform: uppercase;">
              🔍 Análise Prévia (60s)
            </strong>
            <span id="checklistTimerDisplay" style="font-size: 0.85rem; font-weight: 700; font-family: monospace; color: var(--warn);">
              00:${String(checklistSeconds).padStart(2, '0')}
            </span>
          </div>

          <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">
            Inspecione visualmente a partitura antes de tocar a primeira nota:
          </p>

          <label class="checklist-item">
            <input type="checkbox" ${this.checklistState.keySignature ? 'checked' : ''} data-action="toggle-check" data-item="keySignature">
            <span>1. Armadura de Clave & Tonalidade</span>
          </label>
          <label class="checklist-item">
            <input type="checkbox" ${this.checklistState.timeSignature ? 'checked' : ''} data-action="toggle-check" data-item="timeSignature">
            <span>2. Fórmula de Compasso & Pulsação</span>
          </label>
          <label class="checklist-item">
            <input type="checkbox" ${this.checklistState.melodicContour ? 'checked' : ''} data-action="toggle-check" data-item="melodicContour">
            <span>3. Contorno Melódico (Graus Conjuntos)</span>
          </label>
          <label class="checklist-item">
            <input type="checkbox" ${this.checklistState.intervals ? 'checked' : ''} data-action="toggle-check" data-item="intervals">
            <span>4. Saltos Intervalares & Mudanças de Posição</span>
          </label>
          <label class="checklist-item" style="border-bottom: none;">
            <input type="checkbox" ${this.checklistState.fingering ? 'checked' : ''} data-action="toggle-check" data-item="fingering">
            <span>5. Dedilhados Iniciais das Mãos</span>
          </label>

          <button class="btn btn-reset" style="width: 100%; margin-top: 10px; font-size: 0.78rem;" data-action="start-checklist-timer">
            ⏱️ Iniciar Timer de 60s
          </button>

          <button class="btn btn-start" style="width: 100%; margin-top: 8px; font-weight: 700; font-size: 0.85rem;" data-action="complete-reading">
            ${isDone ? '✅ Leitura Concluída (Repetir)' : '🏁 Validar Leitura (+10 XP)'}
          </button>
        </div>
      </div>
    `;
  }
}

window.ReadingManager = new ReadingManagerClass();

