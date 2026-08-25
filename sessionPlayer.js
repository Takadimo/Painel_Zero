/**
 * sessionPlayer.js - Controlador do Player da Sessão Guiada (1-Clique)
 * Painel de Estudos de Piano & Acordeon (Versão 2)
 */

let blockTimerInterval = null;
let blockSeconds = 0;
let isBlockTimerRunning = false;

class SessionPlayerClass {
  /**
   * Inicia a Sessão Guiada carregando os 5 blocos calculados pelo neuroEngine
   */
  startSession() {
    if (!window.NeuroEngine) return;
    const blocks = window.NeuroEngine.generateDailyPipeline();

    if (blocks.length === 0) {
      alert("Nenhum bloco de estudo necessário no momento. Todos os trechos estão em dia!");
      return;
    }

    window.StateManager.setState({
      sessionState: {
        inProgress: true,
        guidedActive: true,
        currentBlockIndex: 0,
        guidedBlocks: blocks,
        startTime: new Date().toISOString(),
        blockSeconds: 0
      }
    }, "START_GUIDED_SESSION");

    this.startBlockTimer();
  }

  /**
   * Avança para o próximo bloco da sessão
   */
  nextBlock() {
    const state = window.StateManager.getState();
    const session = state.sessionState;
    if (!session.guidedActive) return;

    this.stopBlockTimer();
    this.recordBlockTime(session.guidedBlocks[session.currentBlockIndex]);

    const nextIndex = session.currentBlockIndex + 1;

    if (nextIndex >= session.guidedBlocks.length) {
      this.finishSession();
      return;
    }

    blockSeconds = 0;
    window.StateManager.setState(prev => ({
      sessionState: {
        ...prev.sessionState,
        currentBlockIndex: nextIndex,
        blockSeconds: 0
      }
    }), `ADVANCE_TO_BLOCK_${nextIndex}`);

    this.startBlockTimer();
  }

  /**
   * Volta para o bloco anterior
   */
  prevBlock() {
    const state = window.StateManager.getState();
    const session = state.sessionState;
    if (!session.guidedActive || session.currentBlockIndex <= 0) return;

    this.stopBlockTimer();
    const prevIndex = session.currentBlockIndex - 1;
    blockSeconds = 0;

    window.StateManager.setState(prev => ({
      sessionState: {
        ...prev.sessionState,
        currentBlockIndex: prevIndex,
        blockSeconds: 0
      }
    }), `RETURN_TO_BLOCK_${prevIndex}`);

    this.startBlockTimer();
  }

  /**
   * Conclui a sessão guiada
   */
  finishSession() {
    this.stopBlockTimer();
    const state = window.StateManager.getState();
    const session = state.sessionState;

    if (session.guidedBlocks && session.guidedBlocks[session.currentBlockIndex]) {
      this.recordBlockTime(session.guidedBlocks[session.currentBlockIndex]);
    }

    blockSeconds = 0;

    window.StateManager.setState(prev => ({
      xp: (prev.xp || 0) + 50, // Bônus de conclusão de sessão guiada
      globalStats: {
        ...prev.globalStats,
        totalSessions: (prev.globalStats.totalSessions || 0) + 1
      },
      sessionState: {
        inProgress: false,
        guidedActive: false,
        currentBlockIndex: 0,
        guidedBlocks: [],
        startTime: null,
        blockSeconds: 0
      }
    }), "FINISH_GUIDED_SESSION");

    alert("🎉 Sessão Guiada concluída com sucesso! +50 XP creditados.");
  }

  /**
   * Cancela ou encerra a sessão antecipadamente
   */
  exitSession() {
    if (confirm("Deseja realmente encerrar a Sessão Guiada? O tempo praticado até aqui será salvo.")) {
      this.stopBlockTimer();
      const state = window.StateManager.getState();
      const session = state.sessionState;

      if (session.guidedBlocks && session.guidedBlocks[session.currentBlockIndex]) {
        this.recordBlockTime(session.guidedBlocks[session.currentBlockIndex]);
      }

      blockSeconds = 0;

      window.StateManager.setState(prev => ({
        sessionState: {
          inProgress: false,
          guidedActive: false,
          currentBlockIndex: 0,
          guidedBlocks: [],
          startTime: null,
          blockSeconds: 0
        }
      }), "EXIT_GUIDED_SESSION");
    }
  }

  /**
   * Cronômetro interno do bloco
   */
  startBlockTimer() {
    if (isBlockTimerRunning) return;
    isBlockTimerRunning = true;

    blockTimerInterval = setInterval(() => {
      blockSeconds++;
      this.updateBlockTimerDisplay();

      if (blockSeconds % 60 === 0) {
        window.StateManager.setState(prev => ({
          dailyStats: {
            ...prev.dailyStats,
            focusMinutes: (prev.dailyStats.focusMinutes || 0) + 1
          },
          globalStats: {
            ...prev.globalStats,
            totalMinutes: (prev.globalStats.totalMinutes || 0) + 1
          }
        }), "ACCUMULATE_GUIDED_MINUTE");
      }
    }, 1000);
  }

  stopBlockTimer() {
    if (!isBlockTimerRunning) return;
    isBlockTimerRunning = false;
    clearInterval(blockTimerInterval);
  }

  recordBlockTime(block) {
    if (!block) return;
    const minutes = Math.ceil(blockSeconds / 60);
    if (minutes <= 0) return;

    // Se for bloco de repertório, credita na peça
    if (block.pieceId && window.RepertoireManager) {
      const piece = window.RepertoireManager.getActivePieces().find(p => p.id === block.pieceId);
      if (piece) {
        window.RepertoireManager.updateTrecho(block.pieceId, block.trechoId, {
          tempoSegundos: ((block.trecho && block.trecho.tempoSegundos) || 0) + blockSeconds
        });
      }
    }
  }

  updateBlockTimerDisplay() {
    const el = document.getElementById("guidedTimerDisplay");
    if (!el) return;
    const mins = Math.floor(blockSeconds / 60);
    const secs = blockSeconds % 60;
    el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Renderiza a interface do card da Sessão Guiada na Aba Hoje
   */
  renderUI(state) {
    const container = document.getElementById("guidedSessionContent");
    if (!container) return;

    const session = state.sessionState || {};

    // 1. Estado Parado (Botão Iniciar)
    if (!session.guidedActive) {
      const blocks = window.NeuroEngine ? window.NeuroEngine.generateDailyPipeline() : [];
      const totalEstimatedMinutes = blocks.reduce((acc, b) => acc + (b.targetMinutes || 0), 0);

      container.innerHTML = `
        <div style="margin-bottom: 12px;">
          <p style="font-size: 0.88rem; color: var(--text);">
            Roteiro inteligente montado para hoje com base na retenção pós-sono e metas ativas.
          </p>
          <div style="display: flex; gap: 8px; margin-top: 8px; font-size: 0.78rem; color: var(--text-muted);">
            <span>⏱️ Tempo estimado: <strong>~${totalEstimatedMinutes} min</strong></span>
            <span>🧩 <strong>${blocks.length} blocos</strong> estruturados</span>
          </div>
        </div>
        <button class="btn btn-guided-main" data-action="start-guided-session">
          ▶ INICIAR SESSÃO GUIADA DO DIA (1-CLIQUE)
        </button>
      `;
      return;
    }

    // 2. Estado Em Andamento (Player dos 5 Blocos)
    const blocks = session.guidedBlocks || [];
    const currentIndex = session.currentBlockIndex || 0;
    const currentBlock = blocks[currentIndex] || {};
    const isLastBlock = currentIndex === blocks.length - 1;

    container.innerHTML = `
      <!-- Barra de Progresso dos Blocos -->
      <div class="blocks-progress">
        ${blocks.map((b, idx) => {
          let statusClass = "";
          if (idx === currentIndex) statusClass = "active";
          else if (idx < currentIndex) statusClass = "done";
          return `<div class="block-step ${statusClass}">${b.tag}</div>`;
        }).join('')}
      </div>

      <!-- Banner com Justificativa Neurobiológica -->
      <div class="pedagogical-banner">
        💡 ${currentBlock.pedagogicalRationale || "Execute com total foco e andamento lento."}
      </div>

      <!-- Player do Bloco Ativo -->
      <div class="player-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent); text-transform: uppercase;">
            ${currentBlock.tag} (${currentIndex + 1} de ${blocks.length})
          </span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Meta: ~${currentBlock.targetMinutes} min</span>
        </div>

        <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 12px;">
          ${currentBlock.title}
        </h3>

        <!-- Cronômetro do Bloco -->
        <div class="timer-box" style="margin: 10px 0;">
          <span id="guidedTimerDisplay" class="timer-display">00:00</span>
          <span class="badge info">Bloco Ativo</span>
        </div>

        <!-- Botões de Navegação do Player -->
        <div style="display: flex; gap: 8px; margin-top: 14px;">
          ${currentIndex > 0 ? `
            <button class="btn btn-reset" style="flex: 1;" data-action="prev-guided-block">
              ◀ Bloco Anterior
            </button>
          ` : ''}

          <button class="btn ${isLastBlock ? 'btn-start' : 'btn-primary'}" style="flex: 2; padding: 12px; font-weight: 700;" data-action="next-guided-block">
            ${isLastBlock ? '🏁 Concluir Sessão (+50 XP)' : 'Próximo Bloco ▶'}
          </button>
        </div>

        <button class="btn btn-reset" style="width: 100%; margin-top: 10px; font-size: 0.75rem; background: transparent; color: var(--text-muted);" data-action="exit-guided-session">
          Encerrar Sessão Antecipadamente
        </button>
      </div>
    `;
  }
}

window.SessionPlayer = new SessionPlayerClass();

