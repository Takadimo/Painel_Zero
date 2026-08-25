/**
 * Gerenciador Central de Estado Global (Store)
 * Controla os dados persistidos no LocalStorage do navegador.
 */

const STORAGE_KEY = 'PIANO_PRACTICE_STATE_V1';

class StateManager {
    constructor() {
        this.state = this.loadState();
    }

    loadState() {
        try {
            const serializedState = localStorage.getItem(STORAGE_KEY);
            if (serializedState === null) {
                return {
                    repertoire: [],
                    history: {},
                    sessionTime: 0, // Tempo total de estudo na sessão em segundos
                    isPracticing: false
                };
            }
            return JSON.parse(serializedState);
        } catch (error) {
            console.error("Erro ao carregar estado do LocalStorage:", error);
            return { repertoire: [], history: {}, sessionTime: 0, isPracticing: false };
        }
    }

    saveState() {
        try {
            const serializedState = JSON.stringify(this.state);
            localStorage.setItem(STORAGE_KEY, serializedState);
        } catch (error) {
            console.error("Erro ao salvar estado no LocalStorage:", error);
        }
    }

    getState() {
        return this.state;
    }

    updateState(updaterFn) {
        updaterFn(this.state);
        this.saveState();
        // Dispara um evento customizado para notificar componentes da UI se necessário
        window.dispatchEvent(new CustomEvent('stateChanged', { detail: this.state }));
    }
}

const State = new StateManager();
