/**
 * cloudSync.js - Conector de Sincronização em Nuvem (Google Apps Script) & Práticas Acústicas
 * Painel de Estudos de Piano & Acordeon (Versão 6 Final)
 * 
 * - Bypass de CORS com cabeçalho text/plain
 * - Backup e Restauração em 1-Clique no Google Drive
 * - Registro Manual de Práticas Acústicas / Offline
 */

class CloudSyncClass {
  constructor() {
    this.storageUrlKey = "painel_zero_cloud_url";
  }

  getCloudUrl() {
    const state = window.StateManager.getState();
    return state.cloudSyncUrl || localStorage.getItem(this.storageUrlKey) || "";
  }

  saveCloudUrl(url) {
    if (!url) return;
    localStorage.setItem(this.storageUrlKey, url);
    window.StateManager.setState({ cloudSyncUrl: url }, "SAVE_CLOUD_URL");
    alert("URL do Web App salva com sucesso!");
  }

  /**
   * Envia os dados atuais para a Nuvem (Google Drive via Apps Script)
   */
  async pushToCloud() {
    const url = this.getCloudUrl();
    if (!url) {
      alert("Por favor, configure a URL do Web App do Google Apps Script primeiro.");
      return;
    }

    const payload = window.StateManager.exportSavegame();

    try {
      // Uso de text/plain para evitar requisição preflight OPTIONS no GAS (Bypass CORS)
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "backup",
          filename: "Painel_Piano_Cloud_Backup.json",
          data: payload,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();
      if (result.status === "success" || result.success) {
        alert("☁️ Backup enviado para o Google Drive com sucesso!");
      } else {
        alert("⚠️ O servidor respondeu, mas não confirmou o backup: " + (result.message || "Erro desconhecido"));
      }
    } catch (err) {
      console.error("[CloudSync] Erro no envio para a nuvem:", err);
      alert("❌ Falha na conexão com o Web App. Verifique a URL e suas permissões no Apps Script.");
    }
  }

  /**
   * Puxa os dados da Nuvem (Google Drive) e restaura no navegador
   */
  async pullFromCloud() {
    const url = this.getCloudUrl();
    if (!url) {
      alert("Por favor, configure a URL do Web App primeiro.");
      return;
    }

    if (!confirm("Deseja substituir os dados locais pelo backup salvo no Google Drive?")) {
      return;
    }

    try {
      const response = await fetch(`${url}?action=restore&filename=Painel_Piano_Cloud_Backup.json`);
      const result = await response.json();

      if (result && (result.data || result.repertoire)) {
        const rawData = result.data ? (typeof result.data === "string" ? result.data : JSON.stringify(result.data)) : JSON.stringify(result);
        const importRes = window.StateManager.importSavegame(rawData);

        if (importRes.success) {
          alert("📥 Dados restaurados da Nuvem com sucesso!");
        } else {
          alert("❌ Erro ao processar o arquivo de backup: " + importRes.error);
        }
      } else {
        alert("⚠️ Nenhum backup encontrado na nuvem.");
      }
    } catch (err) {
      console.error("[CloudSync] Erro na restauração da nuvem:", err);
      alert("❌ Falha ao buscar backup da nuvem. Verifique a conexão e a URL.");
    }
  }

  /**
   * Registra uma prática acústica / offline realizada longe do painel
   */
  saveManualOfflinePractice(pilar, itemId, minutes, bpm, notes) {
    const durMinutes = parseInt(minutes, 10) || 20;
    const durBpm = parseInt(bpm, 10) || null;
    const dateStr = new Date().toLocaleDateString("pt-BR");

    let pilarName = "Prática Livre";
    let itemName = "Piano Acústico";

    if (pilar === "repertoire" && window.RepertoireManager) {
      pilarName = "Repertório";
      const pieces = window.RepertoireManager.getActivePieces();
      const piece = pieces.find(p => p.id === itemId) || pieces[0];
      if (piece) {
        itemName = piece.title;
        // Credita minutos acumulados na peça
        window.RepertoireManager.updateTrecho(piece.id, (piece.trechos && piece.trechos[0]?.id) || "t1", {
          tempoSegundos: ((piece.trechos && piece.trechos[0]?.tempoSegundos) || 0) + (durMinutes * 60)
        });
      }
    } else if (pilar === "technical") {
      pilarName = "Técnica";
      itemName = "Fundamentos / Escalas";
    } else if (pilar === "reading") {
      pilarName = "Leitura";
      itemName = `Exercício Faber ${itemId || '001'}`;
    }

    // 1. Atualiza StateManager com crédito relacional de minutos e histórico
    window.StateManager.setState(prev => ({
      xp: (prev.xp || 0) + 15 + Math.floor(durMinutes / 2),
      dailyStats: {
        ...prev.dailyStats,
        focusMinutes: (prev.dailyStats.focusMinutes || 0) + durMinutes,
        repertoireMinutes: (prev.dailyStats.repertoireMinutes || 0) + (pilar === "repertoire" ? durMinutes : 0),
        technicalMinutes: (prev.dailyStats.technicalMinutes || 0) + (pilar === "technical" ? durMinutes : 0),
        readingMinutes: (prev.dailyStats.readingMinutes || 0) + (pilar === "reading" ? durMinutes : 0)
      },
      globalStats: {
        ...prev.globalStats,
        totalSessions: (prev.globalStats.totalSessions || 0) + 1,
        totalMinutes: (prev.globalStats.totalMinutes || 0) + durMinutes
      },
      history: [
        {
          date: `${dateStr} (Offline)`,
          type: `Acústico: ${pilarName}`,
          pieceId: itemName,
          trechoId: notes || "Treino no piano acústico",
          durationMinutes: durMinutes,
          accuracyPct: 100,
          manualOffline: true
        },
        ...(prev.history || [])
      ]
    }), "REGISTER_MANUAL_OFFLINE");

    alert(`💾 Prática Acústica registrada com sucesso!\n+${durMinutes} minutos creditados no pilar de ${pilarName}.`);
  }

  renderHistoryTable(state) {
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;

    const history = state.history || [];
    if (history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 12px;">Nenhum registro de estudo ainda.</td></tr>`;
      return;
    }

    tbody.innerHTML = history.slice(0, 10).map(entry => `
      <tr>
        <td>${entry.date || '-'}</td>
        <td><span class="badge ${entry.manualOffline ? 'warn' : 'info'}">${entry.type || 'Sessão'}</span></td>
        <td><strong>${entry.pieceId || entry.item || 'Piano'}</strong> <small style="color: var(--text-muted);">${entry.trechoId || ''}</small></td>
        <td>${entry.durationMinutes || 0} min</td>
        <td style="color: var(--accent2); font-weight: 700;">${entry.accuracyPct !== undefined ? entry.accuracyPct + '%' : '-'}</td>
      </tr>
    `).join('');
  }
}

window.CloudSync = new CloudSyncClass();

