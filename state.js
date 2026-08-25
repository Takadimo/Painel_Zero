/**
 * state.js - Gerenciador Central de Estado Global (SSOT & Pub/Sub)
 * Painel de Estudos de Piano & Acordeon
 */

// Schema canônico padrão da aplicação
const DEFAULT_STATE = {
  version: "v24.0",
  lastSaved: null,
  activeTab: "hoje",
  xp: 0,
  globalStats: {
    totalSessions: 0,
    totalMinutes: 0,
    approvedAudits: 0
  },
  dailyStats: {
    date: new Date().toISOString().split("T")[0],
    focusMinutes: 0,
    repertoireMinutes: 0,
    technicalMinutes: 0,
    readingMinutes: 0,
    completedAudits: 0
  },
  weeklyGoals: {
    targetMinutes: 250,
    repertoireFocus: "Consolidar trechos ativos e transições",
    technicalFocus: "Escalas e Arpejos fundamentais",
    readingTargetPieces: 5
  },
  repertoire: {
    active: [],
    paused: [],
    queue: [],
    completed: []
  },
  technical: {
    scales: [],
    arpeggios: [],
    cadences: [],
    currentBpmHistory: {}
  },
  reading: {
    currentExerciseId: "001",
    completedExercises: [],
    history: []
  },
  history: [],
  sessionState: {
    inProgress: false,
    activePieceId: null,
    activeTrechoId: null,
    mode: null, // 'guided', 'sandwich', 'manual'
    startTime: null,
    elapsedSeconds: 0
  }
};

const STORAGE_KEY = "painel_zero_state";

/**
 * Mesclagem recursiva defensiva para prevenir perda de propriedades
 */
function deepMerge(target, source) {
  if (!source || typeof source !== "object") return target;
  const output = Object.assign({}, target);
  
  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!(key in target)) {
        output[key] = source[key];
      } else {
        output[key] = deepMerge(target[key], source[key]);
      }
    } else {
      output[key] = source[key];
    }
  });
  return output;
}

class StateManagerClass {
  constructor() {
    this._state = Object.assign({}, DEFAULT_STATE);
    this._listeners = new Set();
    this._initialized = false;
  }

  /**
   * Inicializa o estado carregando do localStorage ou usando defaults
   */
  init() {
    if (this._initialized) return this._state;

    try {
      const rawData = localStorage.getItem(STORAGE_KEY);
      if (rawData) {
        const parsed = JSON.parse(rawData);
        this._state = deepMerge(DEFAULT_STATE, parsed);
        this._checkDailyReset();
      } else {
        // Tenta migrar de versões legadas se existirem
        this._migrateLegacyStorage();
      }
    } catch (e) {
      console.error("[StateManager] Falha ao carregar estado local. Usando padrão:", e);
      this._state = Object.assign({}, DEFAULT_STATE);
    }

    this._initialized = true;
    return this._state;
  }

  /**
   * Verifica se o dia mudou para reiniciar os acumuladores diários
   */
  _checkDailyReset() {
    const today = new Date().toISOString().split("T")[0];
    if (this._state.dailyStats && this._state.dailyStats.date !== today) {
      this._state.dailyStats = {
        date: today,
        focusMinutes: 0,
        repertoireMinutes: 0,
        technicalMinutes: 0,
        readingMinutes: 0,
        completedAudits: 0
      };
      this.persist();
    }
  }

  /**
   * Migração retrocompatível de chaves das versões V22/V23 caso existam
   */
  _migrateLegacyStorage() {
    const legacyV23 = localStorage.getItem("painelPiano_V23");
    const legacyV22 = localStorage.getItem("painelPianoV22");
    const legacyKey = legacyV23 || legacyV22;

    if (legacyKey) {
      try {
        const parsedLegacy = JSON.parse(legacyKey);
        this._state = deepMerge(DEFAULT_STATE, parsedLegacy);
        this.persist();
        console.info("[StateManager] Dados migrados com sucesso de versão anterior.");
      } catch (e) {
        console.warn("[StateManager] Não foi possível migrar dados legados:", e);
      }
    }
  }

  /**
   * Retorna uma cópia imutável ou referência do estado atual
   */
  getState() {
    if (!this._initialized) {
      this.init();
    }
    return this._state;
  }

  /**
   * Atualiza o estado de forma atômica e notifica os ouvintes
   * @param {Object|Function} updater Objeto parcial ou função (state) => newState
   * @param {String} [actionLabel] Nome opcional da ação para debug/telemetria
   */
  setState(updater, actionLabel = "UPDATE_STATE") {
    const currentState = this.getState();
    let updates = {};

    if (typeof updater === "function") {
      updates = updater(currentState);
    } else if (typeof updater === "object") {
      updates = updater;
    }

    this._state = deepMerge(currentState, updates);
    this._state.lastSaved = new Date().toISOString();

    this.persist();
    this._notify(actionLabel);
  }

  /**
   * Persiste o estado atual no localStorage
   */
  persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
    } catch (e) {
      console.error("[StateManager] Erro ao persistir no localStorage:", e);
    }
  }

  /**
   * Inscreve um ouvinte para receber notificações de mudanças de estado
   * @param {Function} callback Função que recebe (state, actionLabel)
   * @returns {Function} Função para cancelar a inscrição
   */
  subscribe(callback) {
    if (typeof callback === "function") {
      this._listeners.add(callback);
    }
    return () => this._listeners.delete(callback);
  }

  /**
   * Notifica todos os ouvintes inscritos
   */
  _notify(actionLabel) {
    const currentState = this.getState();
    this._listeners.forEach(listener => {
      try {
        listener(currentState, actionLabel);
      } catch (err) {
        console.error(`[StateManager] Erro no listener para ação "${actionLabel}":`, err);
      }
    });
  }

  /**
   * Exporta o Savegame completo em formato JSON string
   */
  exportSavegame() {
    return JSON.stringify(this.getState(), null, 2);
  }

  /**
   * Restaura o estado a partir de um JSON Savegame
   */
  importSavegame(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("JSON inválido");
      }
      this._state = deepMerge(DEFAULT_STATE, parsed);
      this._state.lastSaved = new Date().toISOString();
      this.persist();
      this._notify("RESTORE_SAVEGAME");
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Reseta o estado para os valores padrão
   */
  resetToDefaults() {
    this._state = Object.assign({}, DEFAULT_STATE);
    this.persist();
    this._notify("RESET_DEFAULTS");
  }
}

// Instância única para toda a aplicação (Singleton)
export const StateManager = new StateManagerClass();
