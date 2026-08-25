/**
 * neuroEngine.js - Motor Neurocientífico de Aprendizagem Motora
 * Painel de Estudos de Piano & Acordeon (Versão 1)
 * 
 * - Repetição Espaçada (Leitner 5 Caixas: D+1, D+2, D+4, D+7, D+14)
 * - Índice de Fragilidade Motor (IFM)
 * - Algoritmo Anti-Backlog (Cap de segurança de 6 auditorias/dia)
 * - Avaliador de 1º Tiro Pós-Sono
 */

const LEITNER_INTERVALS_DAYS = {
  0: 0,
  1: 1,  // D+1 (Pós-sono)
  2: 2,  // D+2 (Desbloqueio Passo 2)
  3: 4,  // D+4 (Estabilidade Intermediária)
  4: 7,  // D+7 (Retenção Semanal)
  5: 14  // D+14 (Memória de Longo Prazo / Manutenção)
};

const MAX_DAILY_COLD_AUDITS = 6;

class NeuroEngineClass {
  /**
   * Calcula a próxima data de revisão baseada na Caixa Leitner
   */
  calculateNextReviewDate(box) {
    const daysToAdd = LEITNER_INTERVALS_DAYS[box] || 1;
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split("T")[0];
  }

  /**
   * Calcula o Índice de Fragilidade Motor (IFM)
   * IFM = (Tentativas / Acertos) * (1 + Slips)
   */
  calculateIFM(trecho) {
    const hits = trecho.lifetimeHits || 0;
    const attempts = trecho.lifetimeAttempts || 0;
    const slips = trecho.slips || 0;

    if (attempts === 0) return 1.0;
    const failureRatio = attempts / Math.max(1, hits);
    const ifm = failureRatio * (1 + slips * 0.5);
    return Number(ifm.toFixed(2));
  }

  /**
   * Retorna as auditorias a frio devidas para hoje, aplicando o Cap Anti-Backlog
   */
  getDueColdAudits() {
    const pieces = window.RepertoireManager ? window.RepertoireManager.getActivePieces() : [];
    const today = new Date().toISOString().split("T")[0];
    const dueList = [];

    pieces.forEach(piece => {
      if (piece.isPaused) return;

      (piece.trechos || []).forEach(trecho => {
        // Trechos em Caixa >= 1 com data de revisão menor ou igual a hoje
        if (trecho.box >= 1 && trecho.nextReviewDate && trecho.nextReviewDate <= today) {
          dueList.push({
            pieceId: piece.id,
            pieceTitle: piece.title,
            trecho: trecho,
            ifm: this.calculateIFM(trecho)
          });
        }
      });
    });

    // Ordena pelo maior IFM (prioridade pedagógica para trechos mais frágeis)
    dueList.sort((a, b) => b.ifm - a.ifm);

    // Aplica o teto máximo seguro (Anti-Backlog)
    return dueList.slice(0, MAX_DAILY_COLD_AUDITS);
  }

  /**
   * Processa o resultado de uma Auditoria a Frio (1º Tiro)
   * @param {String} pieceId 
   * @param {String} trechoId 
   * @param {'hit'|'slip'|'miss'} outcome 
   */
  processAuditResult(pieceId, trechoId, outcome) {
    const state = window.StateManager.getState();
    const activePieces = state.repertoire.active || [];
    const piece = activePieces.find(p => p.id === pieceId);
    if (!piece) return;

    const trecho = (piece.trechos || []).find(t => t.id === trechoId);
    if (!trecho) return;

    let newBox = trecho.box || 1;
    let consecutivePasses = trecho.consecutiveColdPasses || 0;
    let slips = trecho.slips || 0;
    let hits = trecho.lifetimeHits || 0;
    let attempts = (trecho.lifetimeAttempts || 0) + 1;
    let xpGain = 0;

    if (outcome === "hit") {
      // Sucesso no 1º tiro: avança para a próxima caixa (máximo Caixa 5)
      newBox = Math.min(5, newBox + 1);
      consecutivePasses++;
      hits++;
      xpGain = 15; // Bônus por acerto pós-sono
    } else if (outcome === "slip") {
      // Escorregão: mantém em Caixa 1 para reavaliação amanhã
      newBox = 1;
      consecutivePasses = 0;
      slips++;
      xpGain = 5;
    } else if (outcome === "miss") {
      // Erro/Travamento: regride para Caixa 1 e zera passes
      newBox = 1;
      consecutivePasses = 0;
      slips += 2;
      xpGain = 2;
    }

    const nextReview = this.calculateNextReviewDate(newBox);

    // 1. Atualiza o trecho
    window.RepertoireManager.updateTrecho(pieceId, trechoId, {
      box: newBox,
      consecutiveColdPasses: consecutivePasses,
      slips: slips,
      lifetimeHits: hits,
      lifetimeAttempts: attempts,
      nextReviewDate: nextReview,
      consolidated: newBox >= 2 // Caixa 2+ é considerado consolidado para liberar Passo 2
    });

    // 2. Credita auditoria e XP no Estado Global
    window.StateManager.setState(prev => ({
      xp: (prev.xp || 0) + xpGain,
      dailyStats: {
        ...prev.dailyStats,
        completedAudits: (prev.dailyStats.completedAudits || 0) + 1
      },
      globalStats: {
        ...prev.globalStats,
        approvedAudits: (prev.globalStats.approvedAudits || 0) + (outcome === "hit" ? 1 : 0)
      }
    }), `AUDIT_PROCESSED_${outcome.toUpperCase()}`);
  }
}

window.NeuroEngine = new NeuroEngineClass();

