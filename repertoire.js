/**
 * repertoire.js - Matriz Dinâmica de Repertório e Microblocos
 * Painel de Estudos de Piano & Acordeon (Versão 0)
 * 
 * Taxonomia de Microblocos: XX.Y.ZZ-WW
 * - XX: Número da Peça (ex: 12, 13)
 * - Y: Passo do Fatiamento (1 = 4 comp, 2 = 8 comp, 3 = 12 comp, etc.)
 * - ZZ-WW: Intervalo de Compassos (ex: 1-4, 5-8, 1-8)
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
      sheetUrl: "",
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
          lifetimeAttempts: 10,
          sheetThumbnail: ""
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
          lifetimeAttempts: 9,
          sheetThumbnail: ""
        },
        {
          id: "12.2.1-8",
          label: "12.2.1-8 (Encadeamento)",
          passo: 2,
          compassos: "1-8",
          box: 1,
          consolidated: false,
          nextReviewDate: new Date().toISOString().split("T")[0],
          slips: 1,
          consecutiveColdPasses: 0,
          lifetimeHits: 5,
          lifetimeAttempts: 8,
          sheetThumbnail: ""
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
      sheetUrl: "",
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
          lifetimeAttempts: 7,
          sheetThumbnail: ""
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
          lifetimeAttempts: 5,
          sheetThumbnail: ""
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
  /**
   * Garante que o repertório esteja carregado no StateManager
   */
  initRepertoire() {
    const state = window.StateManager.getState();
    if (!state.repertoire || !state.repertoire.active || state.repertoire.active.length === 0) {
      window.StateManager.setState({ repertoire: DEFAULT_REPERTOIRE }, "INIT_DEFAULT_REPERTOIRE");
    }
  }

  /**
   * Retorna as peças ativas
   */
  getActivePieces() {
    const state = window.StateManager.getState();
    return (state.repertoire && state.repertoire.active) ? state.repertoire.active : [];
  }

  /**
   * Retorna todos os trechos devidos para auditoria (Leitner D+N)
   */
  getDueAudits() {
    const activePieces = this.getActivePieces();
    const today = new Date().toISOString().split("T")[0];
    const dueList = [];

    activePieces.forEach(piece => {
      if (piece.isPaused) return;
      (piece.trechos || []).forEach(trecho => {
        if (trecho.box >= 1 && trecho.nextReviewDate <= today) {
          dueList.push({
            pieceId: piece.id,
            pieceTitle: piece.title,
            trecho: trecho
          });
        }
      });
    });

    return dueList;
  }
}

// Instância global
window.RepertoireManager = new RepertoireManagerClass();

