/**
 * CIT Examination & Result Management System
 * Cloud Persistence, MySQL Sync & Server Communication Service
 */

function updateSyncBadge(text, state = 'online', tooltip = '') {
  const badge = document.getElementById('syncStatusBadge');
  const dot = document.getElementById('syncStatusDot');
  const wrapper = document.getElementById('syncStatusWrapper');
  if (badge) badge.textContent = text;
  if (dot) {
    dot.className = `sync-dot ${state}`;
  }
  if (wrapper && tooltip) {
    wrapper.title = tooltip;
  }
}

async function loadInitialData() {
  updateSyncBadge("Connecting...", "syncing", "Attempting connection to Central Database & API...");

  let serverData = null;
  let detectedSource = 'json_fallback';

  // 1. Primary: Fetch live central database from api.php (cache-busted with timestamp)
  try {
    const res = await fetch(`api.php?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (res.ok) {
      const storageHeader = res.headers.get('X-Storage-Source') || '';
      detectedSource = storageHeader.toLowerCase().includes('mysql') || storageHeader.toLowerCase().includes('database') ? 'database' : 'json_fallback';
      const data = await res.json();
      if (data && typeof data === 'object' && !data.error && data.classes) {
        serverData = data;
      }
    }
  } catch (e) {
    // api.php not reachable
  }

  // 1b. Fallback: If api.php returned 404, try static data.json
  if (!serverData) {
    try {
      const res = await fetch(`data.json?_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && data.classes) {
          serverData = data;
          detectedSource = 'json_fallback';
        }
      }
    } catch (e) {}
  }

  // 2. If server data was retrieved successfully:
  if (serverData) {
    appData = serverData;
    activeStorageSource = detectedSource;
    ensureAppDataIntegrity();

    const curRef = (typeof CIT_CURRICULUM !== 'undefined' ? CIT_CURRICULUM : null) || 
                   (typeof window !== 'undefined' ? window.CIT_CURRICULUM : null);
    if (curRef) {
      if (!appData.curriculum) appData.curriculum = JSON.parse(JSON.stringify(curRef));
      if (!appData.subjects) {
        appData.subjects = {
          cit1: curRef.cit1 ? curRef.cit1.midterm : [],
          cit2: curRef.cit2 ? curRef.cit2.midterm : [],
          cit3: curRef.cit3 ? curRef.cit3.midterm : []
        };
      }
    }
    if (!appData.students || (!appData.students.cit1?.length && !appData.students.cit2?.length && !appData.students.cit3?.length)) {
      const defRef = (typeof DEFAULT_CIT_DATA !== 'undefined' ? DEFAULT_CIT_DATA : null) || 
                     (typeof window !== 'undefined' ? window.DEFAULT_CIT_DATA : null);
      if (defRef && defRef.students) {
        appData.students = JSON.parse(JSON.stringify(defRef.students));
      }
    }

    localStorage.setItem('cit_system_data', JSON.stringify(appData));
    localStorage.setItem('cit_app_version', CIT_APP_STORAGE_VERSION);
    
    const badgeLabel = detectedSource === 'database' ? "Cloud (DB)" : "Cloud (JSON)";
    const badgeTooltip = detectedSource === 'database'
      ? "Priority 1 Active: Live MySQL Database (data.json auto-backup ready)" 
      : "Priority 2 Active: JSON File Storage (Database offline or unconfigured)";
    updateSyncBadge(badgeLabel, "online", badgeTooltip);
    return;
  }

  // 3. If offline / local fallback: load from browser storage cache
  const local = localStorage.getItem('cit_system_data');
  if (local) {
    try {
      appData = JSON.parse(local);
      ensureAppDataIntegrity();
      activeStorageSource = 'local_fallback';
      updateSyncBadge("Offline Mode", "offline", "Running from browser offline cache");
      return;
    } catch (e) {
      console.warn("Corrupted local storage", e);
    }
  }

  // 4. Default fallback: Seed from bundled data.js
  appData = JSON.parse(JSON.stringify(DEFAULT_CIT_DATA));
  ensureAppDataIntegrity();
  localStorage.setItem('cit_system_data', JSON.stringify(appData));
  localStorage.setItem('cit_app_version', CIT_APP_STORAGE_VERSION);
  activeStorageSource = 'local_fallback';
  updateSyncBadge("Local Defaults", "offline", "Loaded default CIT register");
}

async function persistData() {
  if (!appData) return false;

  ensureAppDataIntegrity();

  // Immediate local cache
  localStorage.setItem('cit_system_data', JSON.stringify(appData));

  // Sync with Server via api.php
  try {
    updateSyncBadge("Syncing...", "syncing", "Saving data to cloud server...");
    const res = await fetch('api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(appData)
    });

    if (res.ok) {
      const resp = await res.json();
      if (resp && resp.status === 'success') {
        if (resp.storage === 'database') {
          activeStorageSource = 'database';
          updateSyncBadge("Cloud (DB)", "online", "Synced to live MySQL database and hot-standby JSON files");
        } else {
          activeStorageSource = 'json_fallback';
          updateSyncBadge("Cloud (JSON)", "online", "Synced to cloud JSON file storage (Database offline fallback)");
        }
        return true;
      }
    }
    updateSyncBadge("Sync Issue", "offline", "Server responded with error status");
  } catch (err) {
    console.warn("Cloud synchronization error:", err);
    updateSyncBadge("Offline Cached", "offline", "Saved to device storage. Will sync when server connects.");
  }

  return false;
}

async function syncWithServer(interactive = false) {
  if (interactive) {
    showToast("Checking live connection & refreshing cloud data...");
  }
  await loadInitialData();
  renderApp();
  if (interactive) {
    const storageName = (activeStorageSource === 'database') ? 'Live MySQL Database' : 
                        (activeStorageSource === 'json_fallback' ? 'Cloud JSON File' : 'Offline Cache');
    showToast(`Refreshed! Active Storage: ${storageName}`);
  }
}

async function checkDatabaseHealthAdmin() {
  const box = document.getElementById('adminDbDiagnostics');
  const badge = document.getElementById('adminDbStatusBadge');
  if (!box) return;

  box.innerHTML = `<span style="color:var(--text-muted);">${icon('refresh')} Querying api.php health diagnostics...</span>`;

  try {
    const res = await fetch(`api.php?action=health&_t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();

    const dbConnected = (data.database && data.database.connected);
    if (badge) {
      if (dbConnected) {
        badge.className = 'badge badge-success';
        badge.textContent = 'Database Connected';
      } else {
        badge.className = 'badge badge-danger';
        badge.textContent = 'Database Offline (Using JSON)';
      }
    }

    box.innerHTML = `
      <div style="margin-bottom:0.4rem;">
        <b>Active Storage:</b> <span style="color:${dbConnected ? 'var(--primary)' : '#d97706'}; font-weight:700;">${escapeHtml(data.active_storage || 'Unknown')}</span>
      </div>
      <div><b>MySQL Host:</b> ${escapeHtml(data.database.host || '-')}</div>
      <div><b>Database Name:</b> ${escapeHtml(data.database.database_name || '-')}</div>
      <div><b>Active User:</b> ${escapeHtml(data.database.user || '-')}</div>
      <div><b>DB Connected:</b> <span style="color:${dbConnected ? 'green' : 'red'}; font-weight:bold;">${dbConnected ? 'YES' : 'NO'}</span></div>
      ${data.database.error ? `<div style="color:#dc2626; margin-top:0.25rem;"><b>DB Error:</b> ${escapeHtml(data.database.error)}</div>` : ''}
      ${data.database.stats && data.database.stats.counts ? `
        <div style="margin-top:0.4rem; padding-top:0.4rem; border-top:1px dashed #cbd5e1;">
          <b>MySQL Live Records:</b> 
          Students: <b>${data.database.stats.counts.students}</b> &bull; 
          DateSheets: <b>${data.database.stats.counts.datesheets}</b> &bull; 
          Marks: <b>${data.database.stats.counts.marks_records}</b> &bull; 
          Teachers: <b>${data.database.stats.counts.teachers || 0}</b>
        </div>
      ` : ''}
      <div style="margin-top:0.4rem; padding-top:0.4rem; border-top:1px dashed #cbd5e1; font-size:0.75rem; color:#64748b;">
        <b>Standby JSON File:</b> ${data.json_storage.exists ? 'Exists' : 'Missing'} &bull; 
        Writable: ${data.json_storage.writable ? 'YES' : 'NO'} &bull; 
        Size: ${(data.json_storage.size_bytes / 1024).toFixed(1)} KB
      </div>
    `;
  } catch (err) {
    if (badge) {
      badge.className = 'badge badge-danger';
      badge.textContent = 'Connection Error';
    }
    box.innerHTML = `<span style="color:#dc2626;">Failed to query server health: ${escapeHtml(err.message)}</span>`;
  }
}

async function migrateDataJsonToDbAdmin() {
  if (!confirm("Are you sure you want to migrate all data into the MySQL database?\nThis will synchronize student rosters, date sheets, marks, and teachers into MySQL.")) {
    return;
  }

  showToast("Migrating data to MySQL database...");

  try {
    const res = await fetch(`api.php?action=migrate_to_db&_t=${Date.now()}`);
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      showToast("Successfully migrated data into MySQL database!");
      checkDatabaseHealthAdmin();
      syncWithServer(false);
    } else {
      showToast(`Migration error: ${data.message || 'Unknown error'}`, true);
    }
  } catch (err) {
    showToast(`Failed to connect to migration endpoint: ${err.message}`, true);
  }
}

if (typeof window !== 'undefined') {
  window.updateSyncBadge = updateSyncBadge;
  window.loadInitialData = loadInitialData;
  window.persistData = persistData;
  window.syncWithServer = syncWithServer;
  window.checkDatabaseHealthAdmin = checkDatabaseHealthAdmin;
  window.migrateDataJsonToDbAdmin = migrateDataJsonToDbAdmin;
}

