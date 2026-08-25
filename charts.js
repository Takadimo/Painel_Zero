/**
 * charts.js - Gerador de Gráficos Nativos em SVG & Telemetria
 * Painel de Estudos de Piano & Acordeon (Versão 5)
 * 
 * - Pirâmide de Mielinização (Trapézio SVG das 5 Caixas Leitner)
 * - Círculo de Quintas (Radar SVG das 12 Tonalidades)
 * - Calendário de Consistência (Heatmap de 4 Semanas)
 * - Central Hierárquica de Distribuição de Tempo
 */

class ChartsManagerClass {
  /**
   * 1. Renderiza a Pirâmide de Mielinização em Trapézio SVG Nativo
   */
  renderLeitnerPyramid(state) {
    const container = document.getElementById("pyramidContainer");
    if (!container) return;

    const counts = window.RepertoireManager ? window.RepertoireManager.getLeitnerDistribution() : { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

    const layers = [
      { box: 5, label: "Caixa 5: Mielinização Plena / Longo Prazo", count: counts[5], color: "#ec4899", y: 10, h: 26, topW: 80, botW: 130 },
      { box: 4, label: "Caixa 4: Retenção Semanal (D+7)", count: counts[4], color: "#f59e0b", y: 40, h: 26, topW: 134, botW: 184 },
      { box: 3, label: "Caixa 3: Estabilidade Intermediária (D+4)", count: counts[3], color: "#10b981", y: 70, h: 26, topW: 188, botW: 238 },
      { box: 2, label: "Caixa 2: Passo 2 Desbloqueado (D+2)", count: counts[2], color: "#06b6d4", y: 100, h: 26, topW: 242, botW: 292 },
      { box: 1, label: "Caixa 1: Provação Pós-Sono (D+1)", count: counts[1], color: "#3b82f6", y: 130, h: 26, topW: 296, botW: 346 },
      { box: 0, label: "Caixa 0: Entrada / Novos Microblocos", count: counts[0], color: "#64748b", y: 160, h: 26, topW: 350, botW: 400 }
    ];

    const centerX = 210;

    const svgShapes = layers.map(l => {
      const x1 = centerX - (l.topW / 2);
      const x2 = centerX + (l.topW / 2);
      const x3 = centerX + (l.botW / 2);
      const x4 = centerX - (l.botW / 2);
      const y1 = l.y;
      const y2 = l.y + l.h;

      return `
        <polygon points="${x1},${y1} ${x2},${y1} ${x3},${y2} ${x4},${y2}" 
                 fill="${l.color}" 
                 opacity="0.85"
                 stroke="#0f172a" 
                 stroke-width="2" />
        <text x="${centerX}" y="${y1 + 17}" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle" font-family="system-ui">
          ${l.count} trechos (${Math.round((l.count / total) * 100)}%)
        </text>
      `;
    }).join('');

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; background: var(--card-inner); border: 1px solid var(--border); border-radius: 12px; padding: 14px;">
        <svg viewBox="0 0 420 195" style="width: 100%; max-width: 420px; height: auto;">
          ${svgShapes}
        </svg>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; width: 100%; margin-top: 12px; font-size: 0.72rem;">
          <div style="color: #ec4899;">👑 Caixa 5: <strong>${counts[5]}</strong> dominados</div>
          <div style="color: #f59e0b;">⭐ Caixa 4: <strong>${counts[4]}</strong> retidos</div>
          <div style="color: #10b981;">🌿 Caixa 3: <strong>${counts[3]}</strong> estáveis</div>
          <div style="color: #06b6d4;">🔗 Caixa 2: <strong>${counts[2]}</strong> consolidados</div>
          <div style="color: #3b82f6;">❄️ Caixa 1: <strong>${counts[1]}</strong> em teste D+1</div>
          <div style="color: #64748b;">🌱 Caixa 0: <strong>${counts[0]}</strong> na fila</div>
        </div>
      </div>
    `;
  }

  /**
   * 2. Renderiza o Radar do Círculo de Quintas das 12 Tonalidades em SVG
   */
  renderCircleOfFifths(state) {
    const container = document.getElementById("circleOfFifthsContainer");
    if (!container) return;

    const tones = [
      { name: "C", angle: 0 },
      { name: "G", angle: 30 },
      { name: "D", angle: 60 },
      { name: "A", angle: 90 },
      { name: "E", angle: 120 },
      { name: "B", angle: 150 },
      { name: "F#", angle: 180 },
      { name: "Db", angle: 210 },
      { name: "Ab", angle: 240 },
      { name: "Eb", angle: 270 },
      { name: "Bb", angle: 300 },
      { name: "F", angle: 330 }
    ];

    const activeTones = ["C", "F#", "Am", "G", "Fm", "Cm"];
    const radius = 100;
    const center = 130;

    const nodesSvg = tones.map(t => {
      const rad = (t.angle - 90) * (Math.PI / 180);
      const x = center + radius * Math.cos(rad);
      const y = center + radius * Math.sin(rad);
      const isActive = activeTones.includes(t.name);

      return `
        <circle cx="${x}" cy="${y}" r="16" fill="${isActive ? 'var(--accent)' : 'var(--card)'}" stroke="${isActive ? 'var(--accent2)' : 'var(--border)'}" stroke-width="2" />
        <text x="${x}" y="${y + 4}" fill="${isActive ? '#fff' : 'var(--text-muted)'}" font-size="11" font-weight="700" text-anchor="middle" font-family="system-ui">
          ${t.name}
        </text>
      `;
    }).join('');

    container.innerHTML = `
      <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 12px; padding: 14px; text-align: center; width: 100%;">
        <svg viewBox="0 0 260 260" style="width: 100%; max-width: 240px; height: auto;">
          <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--border)" stroke-dasharray="4 4" />
          <circle cx="${center}" cy="${center}" r="35" fill="#0b1220" stroke="var(--border)" />
          <text x="${center}" y="${center + 4}" fill="var(--text-muted)" font-size="9" text-anchor="middle">12 TONS</text>
          ${nodesSvg}
        </svg>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
          🔵 Tonalidades em Estudo Ativo: <strong>Fá# Maior, Dó Maior, Fá menor, Dó menor</strong>
        </div>
      </div>
    `;
  }

  /**
   * 3. Renderiza o Calendário de Consistência (Heatmap de 4 Semanas)
   */
  renderHeatmap(state) {
    const container = document.getElementById("heatmapContainer");
    if (!container) return;

    const days = [];
    const today = new Date();

    // Gera os últimos 28 dias
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString("pt-BR");
      const isToday = i === 0;

      // Mock de minutos praticados
      let minutes = 0;
      if (isToday) minutes = (state.dailyStats && state.dailyStats.focusMinutes) || 20;
      else if (i === 1 || i === 3 || i === 4 || i === 7 || i === 8 || i === 12) minutes = 40;
      else if (i % 2 === 0) minutes = 15;

      let lvlClass = "";
      if (minutes >= 30) lvlClass = "lvl-3";
      else if (minutes >= 15) lvlClass = "lvl-2";
      else if (minutes > 0) lvlClass = "lvl-1";

      days.push(`
        <div class="heatmap-day ${lvlClass}" title="${dateStr}: ${minutes} min de prática">
          <span>${d.getDate()}</span>
          <span style="font-size: 0.55rem; opacity: 0.8;">${minutes}m</span>
        </div>
      `);
    }

    container.innerHTML = `
      <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 12px; padding: 14px;">
        <div class="heatmap-grid">
          ${days.join('')}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">
          <span>Menos</span>
          <div style="display: flex; gap: 4px;">
            <div style="width: 12px; height: 12px; background: #0b1220; border: 1px solid var(--border); border-radius: 2px;"></div>
            <div style="width: 12px; height: 12px; background: rgba(59, 130, 246, 0.3); border-radius: 2px;"></div>
            <div style="width: 12px; height: 12px; background: rgba(59, 130, 246, 0.6); border-radius: 2px;"></div>
            <div style="width: 12px; height: 12px; background: var(--accent2); border-radius: 2px;"></div>
          </div>
          <span>Mais prática</span>
        </div>
      </div>
    `;
  }

  /**
   * 4. Renderiza a Central Hierárquica de Tempo com Filtros
   */
  renderTimeBreakdown(state) {
    const container = document.getElementById("timeBreakdownContainer");
    if (!container) return;

    const filter = state.timeFilter || "today";

    let repMin = (state.dailyStats && state.dailyStats.repertoireMinutes) || 15;
    let techMin = (state.dailyStats && state.dailyStats.technicalMinutes) || 10;
    let readMin = (state.dailyStats && state.dailyStats.readingMinutes) || 5;
    let auditMin = (state.dailyStats && state.dailyStats.completedAudits * 2) || 4;

    if (filter === "week") {
      repMin *= 4;
      techMin *= 4;
      readMin *= 4;
      auditMin *= 4;
    } else if (filter === "total") {
      repMin = 145;
      techMin = 85;
      readMin = 40;
      auditMin = 38;
    }

    const total = repMin + techMin + readMin + auditMin || 1;

    container.innerHTML = `
      <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 12px; padding: 14px;">
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Repertório -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
              <span>🎵 Repertório Ativo</span>
              <strong>${repMin} min (${Math.round((repMin / total) * 100)}%)</strong>
            </div>
            <div style="height: 6px; background: #0f172a; border-radius: 4px; overflow: hidden;">
              <div style="width: ${(repMin / total) * 100}%; height: 100%; background: var(--accent);"></div>
            </div>
          </div>

          <!-- Técnica -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
              <span>⚙️ Pilar Técnico (Escalas & Arpejos)</span>
              <strong>${techMin} min (${Math.round((techMin / total) * 100)}%)</strong>
            </div>
            <div style="height: 6px; background: #0f172a; border-radius: 4px; overflow: hidden;">
              <div style="width: ${(techMin / total) * 100}%; height: 100%; background: var(--purple);"></div>
            </div>
          </div>

          <!-- Leitura -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
              <span>📖 Leitura à Primeira Vista (Faber)</span>
              <strong>${readMin} min (${Math.round((readMin / total) * 100)}%)</strong>
            </div>
            <div style="height: 6px; background: #0f172a; border-radius: 4px; overflow: hidden;">
              <div style="width: ${(readMin / total) * 100}%; height: 100%; background: var(--accent2);"></div>
            </div>
          </div>

          <!-- Auditorias a Frio -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
              <span>❄️ Auditorias a Frio (1º Tiro)</span>
              <strong>${auditMin} min (${Math.round((auditMin / total) * 100)}%)</strong>
            </div>
            <div style="height: 6px; background: #0f172a; border-radius: 4px; overflow: hidden;">
              <div style="width: ${(auditMin / total) * 100}%; height: 100%; background: var(--warn);"></div>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border); font-size: 0.85rem; color: #fff;">
          Tempo Total no Recorte: <strong>${total} minutos</strong>
        </div>
      </div>
    `;
  }

  renderAll(state) {
    this.renderLeitnerPyramid(state);
    this.renderCircleOfFifths(state);
    this.renderHeatmap(state);
    this.renderTimeBreakdown(state);
  }
}

window.ChartsManager = new ChartsManagerClass();

