/**
 * repertoire.js - Matriz de Repertório & Microblocos (Versão 1)
 * Taxonomia: XX.Y.ZZ-WW (Peça.Passo.Compassos)
 */

const DEFAULT_REPERTOIRE = {
  active: [
    {
      id: "p12",
      number: 12,
      title: "12. Bourrée",
      composer: "Ya. Sen-Lyuk",
      targetBpm: "60 → 100",
      currentBpm: 60,
      phase: "Fatiamento Progressivo",
      isPaused: false,
      totalPracticeSeconds: 1920,
      trechos: [
        {
          id: "12.1.1-4",
          label: "12.1.1-4",
          passo: 1,
          compassos: "1-4",
          box: 2,
          consolidated: true,
          nextReviewDate: new Date().toISOString().split("T")[0],
          slips: 0,
          consecutiveColdPasses: 1,
          lifetimeHits: 9,
          lifetimeAttempts: 10
        },
        {
          id: "12.1.5-8",
          label: "12.1.5-8",
          passo: 1,
          compassos: "5-8",
          box: 2,
          consolidated: true,
          nextReviewDate: new Date().toISOString().split("T")[0],
          slips: 0,
          consecutiveColdPasses: 1,
          lifetimeHits: 8,
          lifetimeAttempts: 9
        },
        {
          id: "12.2.1-8",
          label: "12.2.1-8",
          passo: 2,
          compassos: "1-8",
          box: 1,
          consolidated: false,
          nextReviewDate: new Date().toISOString().split("T")[0],
          slips: 1,
          consecutiveColdPasses: 0,
          lifetimeHits: 5,
          lifetimeAttempts: 8
        }
      ]
    },
    {
      id: "p13",
      number: 13,
      title: "13. Minuet",
      composer: "Johann Krieger",
      targetBpm: "50 → 80",
      currentBpm: 50,
      phase: "Primeira Aquisição",
      isPaused: false,
      totalPracticeSeconds: 1200,
      trechos: [
        {
          id: "13.1.1-4",
          label: "13.1.1-4",
          passo: 1,
          compassos: "1-4",
          box: 1,
          consolidated: false,
          nextReviewDate: new Date().toISOString().split("T")[0],
          slips: 0,
          consecutiveColdPasses: 0,
          lifetimeHits: 6,
          lifetimeAttempts: 7
        },
        {
          id: "13.1.5-8",
          label: "13.1.5-8",
          passo: 1,
          compassos: "5-8",
          box: 1,
          consolidated: false,
          nextReviewDate: new Date().toISOString().split("T")[0],
          slips: 0,
          consecutiveColdPasses: 0,
          lifetimeHits: 4,
          lifetimeAttempts: 5
        }
      ]
    }
  ],
  paused: [],
  queue: [
    {
      id: "p14",
      number: 14,
      title: "14. Arabesque",
      composer: "Friedrich Burgmüller",
      targetBpm: "70 → 110",
      phase: "Fila de Estudo",
      trechos: []
    }
  ],
  completed: []
};

class RepertoireManagerClass {
  initRepertoire() {
    const state = window.StateManager.getState();
    if (!state.repertoire || !state.repertoire.active || state.repertoire.active.length === 0) {
      window.StateManager.setState({ repertoire: DEFAULT_REPERTOIRE }, "INIT_DEFAULT_REPERTOIRE");
    }
  }

  getActivePieces() {
    const state = window.StateManager.getState();
    return (state.repertoire && state.repertoire.active) ? state.repertoire.active : [];
  }

  /**
   * Atualiza um trecho específico de uma peça
   */
  updateTrecho(pieceId, trechoId, trechoUpdates) {
    window.StateManager.setState(prev => {
      const active = (prev.repertoire && prev.repertoire.active) ? [...prev.repertoire.active] : [];
      const pieceIndex = active.findIndex(p => p.id === pieceId);
      if (pieceIndex === -1) return prev;

      const piece = { ...active[pieceIndex] };
      const trechos = [...(piece.trechos || [])];
      const tIndex = trechos.findIndex(t => t.id === trechoId);
      if (tIndex === -1) return prev;

      trechos[tIndex] = { ...trechos[tIndex], ...trechoUpdates };
      piece.trechos = trechos;
      active[pieceIndex] = piece;

      return {
        repertoire: {
          ...prev.repertoire,
          active
        }
      };
    }, `UPDATE_TRECHO_${trechoId}`);
  }
}

window.RepertoireManager = new RepertoireManagerClass();

