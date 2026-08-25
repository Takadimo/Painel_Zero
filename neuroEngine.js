/**
 * neuroEngine.js - Motor Neurocientífico & Gerador Prescritivo (Versão 6 Final)
 */

const LEITNER_INTERVALS_DAYS = {
  0: 0,
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14
};

const MAX_DAILY_COLD_AUDITS = 6;

class NeuroEngineClass {
  calculateNextReviewDate(box) {
    const daysToAdd = LEITNER_INTERVALS_DAYS[box] || 1;
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split("T")[0];
  }

  calculateIFM(trecho) {
    const hits = trecho.lifetimeHits || 0;
    const attempts = trecho.lifetimeAttempts || 0;
    const slips = trecho.slips || 0;

    if (attempts === 0) return 1.0;
    const failureRatio = attempts / Math.max(1, hits);
    const ifm = failureRatio * (1 + slips * 0.5);
    return Number(ifm.toFixed(2));
  }

  getDueColdAudits() {
    const pieces = window.RepertoireManager ? window.RepertoireManager.getActivePieces() : [];
    const today = new Date().toISOString().split("T")[0];
    const dueList = [];

    pieces.forEach(piece => {
      if (piece.isPaused) return;

      (piece.trechos || []).forEach(trecho => {
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

    dueList.sort((a, b) => b.ifm - a.ifm);
    return dueList.slice(0, MAX_DAILY_COLD_AUDITS);
  }

  getRandomTechnicalExercise(lastCategory = null) {
    const state = window.StateManager.getState();
    const tech = state.technical || {};
    const categories = ["scales", "arpeggios", "cadences"].filter(c => c !== lastCategory);
    const chosenCategory = categories[Math.floor(Math.random() * categories.length)] || "scales";

    const list = tech[chosenCategory] || [];
    const item = list.length > 0 ? list[Math.floor(Math.random() * list.length)] : { title: "Escala Fá# Maior", desc: "Padrão Russo", bpm: 60 };

    return {
      category: chosenCategory,
      id: item.id,
      title: item.title,
      desc: item.desc,
      bpm: item.bpm || 60
    };
  }

  generateDailyPipeline() {
    const state = window.StateManager.getState();
    const pieces = window.RepertoireManager ? window.RepertoireManager.getActivePieces() : [];
    const dueAudits = this.getDueColdAudits();
    const cascadeRestriction = (state.sessionState && state.sessionState.cascadeRestrictionD);

    const blocks = [];

    if (dueAudits.length > 0) {
      blocks.push({
        id: "block-a",
        tag: "Bloco A",
        title: "❄️ Auditoria a Frio (1º Tiro)",
        targetMinutes: 5,
        pedagogicalRationale: "Testando retenção motora pós-sono dos trechos codificados em dias anteriores.",
        data: dueAudits
      });
    }

    let highestIfmTrecho = null;
    let highestIfmPiece = null;
    let maxIfm = 1.2;

    pieces.forEach(p => {
      if (p.isPaused) return;
      (p.trechos || []).forEach(t => {
        const ifm = this.calculateIFM(t);
        if (ifm > maxIfm) {
          maxIfm = ifm;
          highestIfmTrecho = t;
          highestIfmPiece = p;
        }
      });
    });

    if (highestIfmTrecho) {
      blocks.push({
        id: "block-b",
        tag: "Bloco B",
        title: `🛠️ Micro-Reparo: ${highestIfmPiece.title} (${highestIfmTrecho.label})`,
        targetMinutes: 8,
        pedagogicalRationale: `Foco no gargalo motor (IFM ${maxIfm}). Meta de 5 acertos para reescrever o circuito.`,
        pieceId: highestIfmPiece.id,
        trechoId: highestIfmTrecho.id
      });
    }

    let acqPiece = pieces.find(p => !p.isPaused);
    let acqTrecho = acqPiece ? (acqPiece.trechos || []).find(t => t.passo === 1 && t.box <= 1) : null;
    if (!acqTrecho && acqPiece && acqPiece.trechos) acqTrecho = acqPiece.trechos[0];

    if (acqPiece && acqTrecho) {
      blocks.push({
        id: "block-c",
        tag: "Bloco C",
        title: `🎯 Aquisição Sanduíche: ${acqPiece.title} (${acqTrecho.label})`,
        targetMinutes: 15,
        pedagogicalRationale: "Construção de memória motora em 3 rounds intercalados por resets técnicos de 90s.",
        pieceId: acqPiece.id,
        trechoId: acqTrecho.id
      });
    }

    let chainPiece = pieces.find(p => !p.isPaused);
    let chainTrecho = chainPiece ? (chainPiece.trechos || []).find(t => t.passo === 2) : null;

    if (chainPiece && chainTrecho) {
      const isUnlocked = !cascadeRestriction && window.RepertoireManager.isPasso2Unlocked(chainPiece.id, chainTrecho.id);
      blocks.push({
        id: "block-d",
        tag: "Bloco D",
        title: `🔗 Encadeamento: ${chainPiece.title} (${chainTrecho.label})`,
        targetMinutes: 12,
        isLocked: !isUnlocked,
        pedagogicalRationale: isUnlocked 
          ? "Passo 2 Desbloqueado: microblocos base aprovados. Foco na costura e transição entre os blocos."
          : "🔒 Passo 2 Travado: microblocos base necessitam de consolidação prévia.",
        pieceId: chainPiece.id,
        trechoId: chainTrecho.id
      });
    }

    blocks.push({
      id: "block-e",
      tag: "Bloco E",
      title: "⚙️ Bloco Técnico & Fechamento",
      targetMinutes: 8,
      pedagogicalRationale: "Prática técnica no Círculo de Quintas e teste de retenção imediata.",
      data: { focus: "Escalas & Arpejos em Fá# Maior / Fá menor" }
    });

    return blocks;
  }

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
    let cascadeFail = false;

    if (outcome === "hit") {
      newBox = Math.min(5, newBox + 1);
      consecutivePasses++;
      hits++;
      xpGain = 15;
    } else if (outcome === "slip") {
      newBox = 1;
      consecutivePasses = 0;
      slips++;
      xpGain = 5;
      cascadeFail = true;
    } else if (outcome === "miss") {
      newBox = 1;
      consecutivePasses = 0;
      slips += 2;
      xpGain = 2;
      cascadeFail = true;
    }

    const nextReview = this.calculateNextReviewDate(newBox);

    window.RepertoireManager.updateTrecho(pieceId, trechoId, {
      box: newBox,
      consecutiveColdPasses: consecutivePasses,
      slips: slips,
      lifetimeHits: hits,
      lifetimeAttempts: attempts,
      nextReviewDate: nextReview,
      consolidated: newBox >= 2
    });

    window.StateManager.setState(prev => ({
      xp: (prev.xp || 0) + xpGain,
      dailyStats: {
        ...prev.dailyStats,
        completedAudits: (prev.dailyStats.completedAudits || 0) + 1
      },
      globalStats: {
        ...prev.globalStats,
        approvedAudits: (prev.globalStats.approvedAudits || 0) + (outcome === "hit" ? 1 : 0)
      },
      sessionState: {
        ...prev.sessionState,
        cascadeRestrictionD: cascadeFail ? true : prev.sessionState.cascadeRestrictionD
      }
    }), `AUDIT_PROCESSED_${outcome.toUpperCase()}`);
  }
}

window.NeuroEngine = new NeuroEngineClass();

