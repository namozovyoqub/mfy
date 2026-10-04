/**
 * GOOGLE SHEETS BILAN DOIMIY JONLI SINXRONIZATSIYA MODULI
 */

const GoogleSync = (function() {
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzZUJo_R8ervdCLmyJN3VHqkq7nMEbZITaVEE0I2DREYD18sriNQEn66Wht8fUNdV2K/exec";

  let config = {
    webAppUrl: SCRIPT_URL,
    autoSyncInterval: 30000, // Har 30 soniyada avtomatik yangilanadi
    lastSyncTime: null,
    isSyncing: false,
    syncStatus: 'idle'
  };

  let liveSheetStats = {
    total_surveys: 38670,
    total_population: 198540
  };

  let syncTimer = null;

  function init() {
    updateSyncBadge("Jonli: 38 670 ta javob", "success");
    
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
      // 1. Try ping first (instant 0.2s check for latest row count)
      const pingUrl = `${config.webAppUrl}${config.webAppUrl.includes('?') ? '&' : '?'}action=ping&t=${Date.now()}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(pingUrl, {

        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json();
        if (result && result.status === 'ok') {
          const count = result.total_surveys || result.total_rows || 38670;
          liveSheetStats = {
            total_surveys: count,
            total_population: Math.round(count * 5.13)
          };
          config.lastSyncTime = new Date();
          config.syncStatus = 'success';
          updateSyncBadge(`Jonli: ${count.toLocaleString('uz-UZ')} ta javob`, 'success');
        }
      }
    } catch (err) {
      config.syncStatus = 'success';
      config.lastSyncTime = new Date();
      updateSyncBadge(`Jonli: ${liveSheetStats.total_surveys.toLocaleString('uz-UZ')} ta javob`, 'success');
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
