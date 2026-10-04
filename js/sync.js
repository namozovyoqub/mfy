/**
 * GOOGLE APPS SCRIPT VA GOOGLE SHEETS BILAN DOIMIY SINXRONIZATSIYA MODULI
 * Apps Script ID: 1IyoVMJ98zSeHEYeCVmLEN7slOoroZ7tKpuZccVKUvKQ
 */

const GoogleSync = (function() {
  const DEFAULT_SCRIPT_ID = "1IyoVMJ98zSeHEYeCVmLEN7slOoroZ7tKpuZccVKUvKQ";
  const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbyH-7CgzjhB8wG1B_HvaEIvbZM_ch61Y3ym40plXVlw_kTXKSLWXyix132J22-BsMXf/exec";

  let config = {
    scriptId: DEFAULT_SCRIPT_ID,
    webAppUrl: localStorage.getItem('surxondaryo_sync_url') || DEFAULT_URL,
    autoSyncInterval: 45000, // 45 seconds

    lastSyncTime: null,
    isSyncing: false,
    syncStatus: 'idle' // 'idle', 'syncing', 'success', 'offline'
  };

  let remoteSurveys = [];
  let syncTimer = null;

  function init() {
    updateSyncBadge('Tayyorlanmoqda...', 'idle');
    loadCachedRemoteData();
    
    // Initial fetch
    syncNow();

    // Setup periodic polling
    syncTimer = setInterval(() => {
      syncNow(true); // silent
    }, config.autoSyncInterval);
  }

  function loadCachedRemoteData() {
    try {
      const cached = localStorage.getItem('surxondaryo_remote_surveys_cache');
      if (cached) {
        remoteSurveys = JSON.parse(cached);
      }
    } catch (e) {
      remoteSurveys = [];
    }
  }

  function saveCachedRemoteData() {
    try {
      localStorage.setItem('surxondaryo_remote_surveys_cache', JSON.stringify(remoteSurveys));
    } catch (e) {
      console.warn("Storage quota limit reached for remote cache");
    }
  }

  async function syncNow(isSilent = false) {
    if (config.isSyncing) return;
    config.isSyncing = true;
    config.syncStatus = 'syncing';

    if (!isSilent) {
      updateSyncBadge('Sinxronlanmoqda...', 'syncing');
    }

    try {
      const fetchUrl = `${config.webAppUrl}${config.webAppUrl.includes('?') ? '&' : '?'}action=getSurveys&t=${Date.now()}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 sec timeout

      const res = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json();
        if (result && result.status === 'success' && Array.isArray(result.data)) {
          remoteSurveys = result.data;
          saveCachedRemoteData();
          config.lastSyncTime = new Date();
          config.syncStatus = 'success';
          updateSyncBadge(`Bog'langan (${remoteSurveys.length} ta remote)`, 'success');
        } else {
          // If custom format or empty
          config.lastSyncTime = new Date();
          config.syncStatus = 'success';
          updateSyncBadge('Google Sheets ulangan', 'success');
        }
      } else {
        throw new Error(`HTTP status: ${res.status}`);
      }
    } catch (err) {
      // Graceful offline fallback: if script is not yet publicly deployed or offline
      config.syncStatus = 'offline';
      config.lastSyncTime = new Date();
      updateSyncBadge('Mahalliy baza faol (Doimiy)', 'idle');
    } finally {
      config.isSyncing = false;
      notifyStatsUpdate();
    }
  }

  async function submitSurvey(surveyRecord) {
    // 1. Send to Apps Script Web App
    try {
      const postUrl = config.webAppUrl;
      await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(surveyRecord),
        mode: 'no-cors' // allows cross-origin sending to Apps Script
      });
      console.log("Survey successfully posted to Google Sheets via Apps Script.");
    } catch (err) {
      console.warn("Could not post directly to Apps Script (offline mode):", err);
    }
  }

  function getAllMergedSurveys() {
    // Combine locally submitted surveys and remote surveys from Google Sheets
    const local = (typeof submittedSurveys !== 'undefined' && Array.isArray(submittedSurveys)) 
      ? submittedSurveys 
      : [];
    
    // Deduplicate by sorovnoma_id
    const seen = new Set();
    const merged = [];

    local.forEach(s => {
      const id = s.sorovnoma_id || (s.boshliq_fio + '_' + s.uy_raqami);
      if (!seen.has(id)) {
        seen.add(id);
        merged.push(s);
      }
    });

    remoteSurveys.forEach(s => {
      const id = s.sorovnoma_id || (s.boshliq_fio + '_' + s.uy_raqami);
      if (!seen.has(id)) {
        seen.add(id);
        merged.push(s);
      }
    });

    return merged;
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

  function openSettingsModal() {
    const modal = document.getElementById('sync-settings-modal');
    if (!modal) return;

    document.getElementById('sync-modal-script-id').value = config.scriptId;
    document.getElementById('sync-modal-url').value = config.webAppUrl;
    modal.classList.add('open');
  }

  function closeSettingsModal() {
    const modal = document.getElementById('sync-settings-modal');
    if (modal) modal.classList.remove('open');
  }

  function saveSettings(e) {
    if (e) e.preventDefault();
    const newUrl = document.getElementById('sync-modal-url').value.trim();
    if (newUrl) {
      config.webAppUrl = newUrl;
      localStorage.setItem('surxondaryo_sync_url', newUrl);
    }
    closeSettingsModal();
    syncNow();
  }

  return {
    init,
    syncNow,
    submitSurvey,
    getAllMergedSurveys,
    openSettingsModal,
    closeSettingsModal,
    saveSettings,
    getConfig: () => config
  };
})();
