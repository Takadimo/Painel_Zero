/**
 * Gerenciador de Estado Centralizado (Single Source of Truth)
 * Inclui rotina de Deep Merge para proteger dados antigos contra corrupção.
 */

const STORAGE_KEY = 'PIANO_PANEL_STATE_V1';

// Estado padrão inicial da aplicação
const defaultState = {
    version: 1,
    settings: {
        theme: 'dark'
    },
    activeRepertoire: [],
    history: {}
};

/**
 * Função de Deep Merge segura para mesclar o estado salvo com novas propriedades padrão
 */
function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

class StateManager {
    constructor() {
        this.state = this.loadState();
    }

    loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return defaultState;
            const parsed = JSON.parse(saved);
            // Garante que se houver novas chaves no defaultState, elas serão incorporadas sem perder o histórico
            return deepMerge(defaultState, parsed);
        } catch (e) {
            console.error('Erro ao carregar estado do localStorage, restaurando padrão:', e);
            return defaultState;
        }
    }

    saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error('Erro ao salvar estado:', e);
        }
    }

    getState() {
        return this.state;
    }

    updateState(updaterFn) {
        updaterFn(this.state);
        this.saveState();
    }
}

// Instância global do estado
const State = new StateManager();
