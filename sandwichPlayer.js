/**
 * sandwichPlayer.js - Controlador do Modo de Prática em Bloco Sanduíche
 * Painel de Estudos de Piano & Acordeon (Versão 4)
 */

let swTimerInterval = null;
let replayTimerInterval = null;
let replaySeconds = 0;

class SandwichPlayerClass {
  startSession(pieceId = null, trechoId = null) {
    const state = window.StateManager.getState();
    const activePieces = window.RepertoireManager ? window.RepertoireManager.getActivePieces() : [];
    
    let piece = pieceId ? activePieces.find(p => p.id === pieceId) : activePieces.find(p => !p.isPaused);
    if (!piece && activePieces.length > 0) piece = activePieces[0];
    if (!piece) {
      alert("Nenhuma peça ativa encontrada para a Sessão Sanduíche.");
      return;
    }

    let trecho = trechoId ? (piece.trechos || []).find(t => t.id === trechoId) : (piece.trechos && piece.trechos[0]);
    if (!trecho) {
      alert("Nenhum trecho disponível nesta peça.");
      return;
    }

    const isHabit = trecho.isCorrectingHabit || false;
    const target = isHabit ? 5 : 3;

    window.StateManager.setState({
      activeTab: "sanduiche",
      sandwichState: {
        active: true,
        pieceId: piece.id,
        trechoId: trecho.id,
        currentRound: 1,
        targetHits: target,
        isCorrectingHabit: isHabit,
        isPromptDropped: false,
        consecutiveHits: 0,
        roundHits: 0,
        roundMisses: 0,
        sessionHits: 0,
        sessionMisses: 0,
        inInterval: false,
        intervalSecondsRemaining: 90,
        lastTechDrawn: null
      }
    }, "START_SANDWICH_SESSION");
  }

  registerHit() {
    const state = window.StateManager.getState();
    const sw = state.sandwichState;
    if (!sw.active || sw.inInterval) return;

    const newConsecutive = sw.consecutiveHits + 1;
    const newRoundHits = sw.roundHits + 1;
    const newSessionHits = sw.sessionHits + 1;
    let xpGain = sw.isPromptDropped ? 3 : 2;

    this.startMicroReplayTimer();

    if (newConsecutive >= sw.targetHits) {
      this.completeCurrentRound();
      return;
    }

    window.StateManager.setState(prev => ({
      xp: (prev.xp || 0) + xpGain,
      sandwichState: {
        ...prev.sandwichState,
        consecutiveHits: newConsecutive,
        roundHits: newRoundHits,
        sessionHits: newSessionHits
      }
    }), "SW_HIT");
  }

  registerMiss() {
    const state = window.StateManager.getState();
    const sw = state.sandwichState;
    if (!sw.active || sw.inInterval) return;

    this.stopMicroReplayTimer();

    window.StateManager.setState(prev => ({
      sandwichState: {
        ...prev.sandwichState,
        consecutiveHits: 0,
        roundMisses: prev.sandwichState.roundMisses + 1,
        sessionMisses: prev.sandwichState.sessionMisses + 1
      }
    }), "SW_MISS");
  }

  togglePromptVisibility() {
    window.StateManager.setState(prev => ({
      sandwichState: {
        ...prev.sandwichState,
        isPromptDropped: !prev.sandwichState.isPromptDropped
      }
    }), "TOGGLE_PROMPT");
  }

  startMicroReplayTimer() {
    this.stopMicroReplayTimer();
    replaySeconds = 0;
    const bar = document.getElementById("microReplayBar");
    const txt = document.getElementById("microReplayText");

    if (txt) txt.textContent = "🧠 Micro-Offline Replay (10s): Deixe o cérebro reativar o circuito...";

    replayTimerInterval = setInterval(() => {
      replaySeconds++;
      if (bar) bar.style.width = `${(replaySeconds / 10) * 100}%`;

      if (replaySeconds >= 10) {
        this.stopMicroReplayTimer();
        if (txt) txt.textContent = "✅ Pausa de 10s concluída. Pronto para a próxima repetição!";
      }
    }, 1000);
  }

  stopMicroReplayTimer() {
    if (replayTimerInterval) clearInterval(replayTimerInterval);
    const bar = document.getElementById("microReplayBar");
    if (bar) bar.style.width = "0%";
  }

  completeCurrentRound() {
    this.stopMicroReplayTimer();
    const state = window.StateManager.getState();
    const sw = state.sandwichState;

    if (sw.currentRound === 1 || sw.currentRound === 2) {
      this.startTechnicalInterval();
    } else {
      this.finishSession();
    }
  }

  startTechnicalInterval() {
    const techExercise = window.NeuroEngine 
      ? window.NeuroEngine.getRandomTechnicalExercise(window.StateManager.getState().sandwichState.lastTechDrawn?.category)
      : { title: "Escala Fá# Maior", desc: "Padrão Russo", bpm: 60, category: "scales" };

    window.StateManager.setState(prev => ({
      sandwichState: {
        ...prev.sandwichState,
        inInterval: true,
        intervalSecondsRemaining: 90,
        lastTechDrawn: techExercise,
        consecutiveHits: 0,
        isPromptDropped: prev.sandwichState.currentRound === 1
      }
    }), "START_TECH_INTERVAL");

    if (swTimerInterval) clearInterval(swTimerInterval);

    swTimerInterval = setInterval(() => {
      const curr = window.StateManager.getState().sandwichState;
      if (!curr.inInterval) {
        clearInterval(swTimerInterval);
        return;
      }

      if (curr.intervalSecondsRemaining <= 1) {
        clearInterval(swTimerInterval);
        this.endTechnicalInterval();
      } else {
        window.StateManager.setState(prev => ({
          sandwichState: {
            ...prev.sandwichState,
            intervalSecondsRemaining: prev.sandwichState.intervalSecondsRemaining - 1
          }
        }), "TICK_INTERVAL");
      }
    }, 1000);
  }

  skipTechnicalInterval() {
    if (swTimerInterval) clearInterval(swTimerInterval);
    this.endTechnicalInterval();
  }

  endTechnicalInterval() {
    if (swTimerInterval) clearInterval(swTimerInterval);
    const currentRound = window.StateManager.getState().sandwichState.currentRound;

    window.StateManager.setState(prev => ({
      sandwichState: {
        ...prev.sandwichState,
        inInterval: false,
        currentRound: currentRound + 1,
        consecutiveHits: 0,
        intervalSecondsRemaining: 90
      }
    }), "END_TECH_INTERVAL");
  }

  finishSession() {
    if (swTimerInterval) clearInterval(swTimerInterval);
    this.stopMicroReplayTimer();

    const state = window.StateManager.getState();
    const sw = state.sandwichState;
    const totalHits = sw.sessionHits;
    const totalMisses = sw.sessionMisses;
    const totalAttempts = totalHits + totalMisses;
    const accuracy = totalAttempts > 0 ? Math.round((totalHits / totalAttempts) * 100) : 100;

    if (sw.pieceId && sw.trechoId && window.RepertoireManager) {
      const { trecho } = window.RepertoireManager.getPieceAndTrecho(sw.pieceId, sw.trechoId);
      if (trecho) {
        window.RepertoireManager.updateTrecho(sw.pieceId, sw.trechoId, {
          lifetimeHits: (trecho.lifetimeHits || 0) + totalHits,
          lifetimeAttempts: (trecho.lifetimeAttempts || 0) + totalAttempts,
          box: Math.max(1, trecho.box || 1)
        });
      }
    }

    const practiceMinutes = 12;
    window.StateManager.setState(prev => ({
      xp: (prev.xp || 0) + 35,
      dailyStats: {
        ...prev.dailyStats,
        focusMinutes: (prev.dailyStats.focusMinutes || 0) + practiceMinutes,
        repertoireMinutes: (prev.dailyStats.repertoireMinutes || 0) + practiceMinutes
      },
      globalStats: {
        ...prev.globalStats,
        totalSessions: (prev.globalStats.totalSessions || 0) + 1,
        totalMinutes: (prev.globalStats.totalMinutes || 0) + practiceMinutes
      },
      history: [
        {
          date: new Date().toLocaleString("pt-BR"),
          type: "Sessão Sanduíche",
          pieceId: sw.pieceId,
          trechoId: sw.trechoId,
          hits: totalHits,
          misses: totalMisses,
          accuracyPct: accuracy,
          durationMinutes: practiceMinutes
        },
        ...(prev.history || [])
      ],
      sandwichState: {
        ...prev.sandwichState,
        active: false,
        inInterval: false
      }
    }), "FINISH_SANDWICH_SESSION");

    alert(`🎉 Sessão Sanduíche Finalizada!\nAssertividade: ${accuracy}% (${totalHits}/${totalAttempts})\n+35 XP creditados.`);
  }

  renderUI(state) {
    const container = document.getElementById("sandwichContainer");
    if (!container) return;

    const sw = state.sandwichState || {};

    if (!sw.active) {
      const pieces = (state.repertoire && state.repertoire.active) ? state.repertoire.active : [];
      container.innerHTML = `
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
          O <strong>Modo Sanduíche</strong> divide a prática em 3 rounds curtos intercalados por 2 resets cognitivos de 90s, otimizando a mielinização neural.
        </p>

        <h3 style="margin-bottom: 8px;">Selecione o Trecho para Praticar:</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px;">
          ${pieces.map(p => `
            <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 10px; padding: 10px;">
              <strong style="color: #fff; font-size: 0.9rem;">${p.title}</strong>
              <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
                ${(p.trechos || []).map(t => `
                  <button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.75rem;" data-action="start-sandwich-specific" data-piece="${p.id}" data-trecho="${t.id}">
                    ▶ ${t.label} (Cx ${t.box}) ${t.isCorrectingHabit ? '🛠️ Vício' : '🌱 Novo'}
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      return;
    }

    const { piece, trecho } = window.RepertoireManager 
      ? window.RepertoireManager.getPieceAndTrecho(sw.pieceId, sw.trechoId)
      : { piece: { title: "Peça" }, trecho: { label: "Trecho" } };

    if (sw.inInterval) {
      const tech = sw.lastTechDrawn || { title: "Escala Fá# Maior", desc: "Padrão Russo", bpm: 60 };
      container.innerHTML = `
        <div style="text-align: center; padding: 10px 0;">
          <span class="badge warn" style="font-size: 0.8rem; padding: 4px 10px;">☕ Intervalo Técnico Ativo (Reset Cognitivo)</span>
          
          <div style="font-size: 2.2rem; font-weight: 700; font-family: monospace; color: var(--warn); margin: 14px 0 6px;">
            00:${String(sw.intervalSecondsRemaining).padStart(2, '0')}
          </div>
          <p style="font-size: 0.82rem; color: var(--text-muted);">
            Afaste a mente do trecho da música. Pratique este fundamento técnico por 90s:
          </p>

          <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 12px; padding: 14px; margin: 14px 0; text-align: left;">
            <h4 style="color: #fff; font-size: 1rem; margin-bottom: 4px;">⚙️ ${tech.title}</h4>
            <p style="font-size: 0.82rem; color: var(--accent);">${tech.desc}</p>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Andamento sugerido: <strong>${tech.bpm} BPM</strong></p>
          </div>

          <button class="btn btn-reset" style="width: 100%; padding: 10px;" data-action="skip-tech-interval">
            Pular Intervalo Técnico ⏩
          </button>
        </div>
      `;
      return;
    }

    const roundTitles = {
      1: "Round 1: Primeira Aquisição",
      2: "Round 2: Reaquisição com Drop-the-Prompt",
      3: "Round 3: Fixação Final & Estabilidade"
    };

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.75rem; font-weight: 700; color: var(--purple); text-transform: uppercase;">
          ${roundTitles[sw.currentRound] || `Round ${sw.currentRound}`}
        </span>
        <span class="badge ${sw.isCorrectingHabit ? 'danger' : 'info'}">
          Meta: ${sw.targetHits} acertos seguidos
        </span>
      </div>

      <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 4px;">
        ${piece ? piece.title : 'Peça'} — <strong>${trecho ? trecho.label : 'Trecho'}</strong>
      </h3>
      <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px;">
        Compassos: ${trecho ? trecho.compassos : '1-4'} | Andamento alvo: ${piece ? piece.targetBpm : '60 BPM'}
      </p>

      <div class="sheet-container ${sw.isPromptDropped ? 'sheet-hidden' : ''}">
        ${sw.isPromptDropped ? `
          <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 4px;">🙈 Partitura Oculta (Drop-the-Prompt)</div>
          <p style="font-size: 0.75rem; color: #a5b4fc; margin-bottom: 8px;">Toque puxando exclusivamente pela memória cinestésica e auditiva (+2 XP bônus).</p>
          <button class="btn btn-reset" style="padding: 6px 12px; font-size: 0.75rem;" data-action="toggle-prompt">
            👁️ Espiar Partitura
          </button>
        ` : `
          <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-muted);">[Partitura em Alta Resolução Visível]</div>
          <button class="btn btn-reset" style="padding: 6px 12px; font-size: 0.75rem; margin-top: 6px;" data-action="toggle-prompt">
            🙈 Ocultar Partitura (Drop-the-Prompt)
          </button>
        `}
      </div>

      <div class="replay-bar-wrap">
        <div id="microReplayBar" class="replay-bar"></div>
      </div>
      <div id="microReplayText" style="font-size: 0.72rem; color: var(--text-muted); text-align: center; min-height: 16px;"></div>

      <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 12px; padding: 12px; text-align: center; margin: 12px 0;">
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Acertos Consecutivos no Round</div>
        <div style="font-size: 2rem; font-weight: 800; color: ${sw.consecutiveHits > 0 ? 'var(--accent2)' : '#fff'};">
          ${sw.consecutiveHits} / ${sw.targetHits}
        </div>
      </div>

      <div style="display: flex; gap: 8px;">
        <button class="btn-audit btn-audit-hit" style="padding: 14px;" data-action="sw-hit">
          ✅ Execução Limpa (+${sw.isPromptDropped ? '3' : '2'} XP)
        </button>
        <button class="btn-audit btn-audit-miss" style="padding: 14px;" data-action="sw-miss">
          ❌ Erro / Slip (Zera)
        </button>
      </div>

      <button class="btn btn-reset" style="width: 100%; margin-top: 14px; font-size: 0.75rem; background: transparent; color: var(--text-muted);" data-action="finish-sandwich-early">
        Encerrar Sessão Sanduíche
      </button>
    `;
  }
}

window.SandwichPlayer = new SandwichPlayerClass();

