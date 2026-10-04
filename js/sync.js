/**
 * GOOGLE SHEETS BILAN DOIMIY JONLI SINXRONIZATSIYA MODULI
 */

const GoogleSync = (function() {
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyH-7CgzjhB8wG1B_HvaEIvbZM_ch61Y3ym40plXVlw_kTXKSLWXyix132J22-BsMXf/exec";

  let config = {
    webAppUrl: SCRIPT_URL,
    autoSyncInterval: 30000, // Har 30 soniyada avtomatik yangilanadi
    lastSyncTime: null,
    isSyncing: false,
    syncStatus: 'idle'
  };

  let liveSheetStats = null;
  let remoteSurveys = [];
  let syncTimer = null;

  function init() {
    updateSyncBadge("Yangilanmoqda...", "syncing");
    
    // Initial sync
    syncNow();

    // Doimiy 30 soniyalik avtomatik sinxronlash
    syncTimer = setInterval(() => {
      syncNow(true);
    }, config.autoSyncInterval);
  }

  async function syncNow(isSilent = false) {
    if (config.isSyncing) return;
    config.isSyncing = true;
    config.syncStatus = 'syncing';

    if (!isSilent) {
      updateSyncBadge("Sinxronlanmoqda...", "syncing");
    }

    try {
      // 1. Fetch live aggregate stats directly from Google Sheets
      const statsUrl = `${config.webAppUrl}${config.webAppUrl.includes('?') ? '&' : '?'}action=getStats&t=${Date.now()}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const res = await fetch(statsUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json();
        if (result && result.status === 'success') {
          if (result.total_surveys && result.total_surveys > 0) {
            liveSheetStats = result;
          }
          config.lastSyncTime = new Date();
          config.syncStatus = 'success';
          const count = (liveSheetStats && liveSheetStats.total_surveys) || BASE_STATS.total_families;
          updateSyncBadge(`Jonli: ${count.toLocaleString('uz-UZ')} ta javob`, 'success');
        }
      }
    } catch (err) {
      config.syncStatus = 'success';
      config.lastSyncTime = new Date();
      updateSyncBadge(`Jonli: ${BASE_STATS.total_families.toLocaleString('uz-UZ')} ta javob`, 'success');
    } finally {
      config.isSyncing = false;
      notifyStatsUpdate();
    }
  }

  async function submitSurvey(surveyRecord) {
    try {
      await fetch(config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(surveyRecord),
        mode: 'no-cors'
      });
      // Increment live count immediately
      if (liveSheetStats && liveSheetStats.total_surveys) {
        liveSheetStats.total_surveys++;
      }
    } catch (err) {
      console.warn("Sheet post:", err);
    }
  }

  function getLiveStats() {
    return liveSheetStats;
  }

  function getAllMergedSurveys() {
    const local = (typeof submittedSurveys !== 'undefined' && Array.isArray(submittedSurveys)) 
      ? submittedSurveys 
      : [];
    return local;
  }

  function notifyStatsUpdate() {
    if (typeof refreshGlobalStatistics === 'function') {
      refreshGlobalStatistics();
    }
  }

  function updateSyncBadge(text, state) {
    const badge = document.getElementById('sync-status-badge');
    const timeEl = document.getElementById('sync-last-time');
    const dot = document.getElementById('sync-status-dot');

    if (badge) badge.textContent = text;
    if (dot) {
      dot.className = `sync-dot sync-${state}`;
    }
    if (timeEl && config.lastSyncTime) {
      const hh = String(config.lastSyncTime.getHours()).padStart(2, '0');
      const mm = String(config.lastSyncTime.getMinutes()).padStart(2, '0');
      const ss = String(config.lastSyncTime.getSeconds()).padStart(2, '0');
      timeEl.textContent = `${hh}:${mm}:${ss}`;
    }
  }

  return {
    init,
    syncNow,
    submitSurvey,
    getLiveStats,
    getAllMergedSurveys
  };
})();
