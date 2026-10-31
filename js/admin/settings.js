/**
 * CIT Result Management System - Admin Settings & Diagnostics Module
 * Handles master passwords, institution headers, database health diagnostics, migration, and JSON backup/restore.
 */

function renderAdminSettings(container) {
  container.innerHTML = `
    <div class="row">
      <!-- Portal Passwords -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              ${icon('lock')}
              <span>Change Portal Passwords</span>
            </span>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Administrator Password</label>
              <input type="text" id="settingAdminPass" class="form-control" value="${appData.passwords ? appData.passwords.admin : 'admin123'}">
            </div>
            <div class="form-group">
              <label class="form-label">Default Teacher Password</label>
              <input type="text" id="settingTeacherPass" class="form-control" value="${appData.passwords ? appData.passwords.teacher : 'teacher123'}">
              <small style="font-size:0.75rem; color:var(--text-muted);">
                Fallback password for default teacher account. To create dedicated teacher accounts with custom usernames & subject assignments, use the <b>Teachers & Assignments</b> tab.
              </small>
            </div>
            <button class="btn btn-primary btn-sm" onclick="savePortalPasswords()">
              ${icon('check')} Save Passwords
            </button>
          </div>
        </div>

        <!-- Institution Details -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              ${icon('settings')}
              <span>College & Department Header</span>
            </span>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">College / Institute Name</label>
              <input type="text" id="settingInstName" class="form-control" value="${appData.institution.name}">
            </div>
            <div class="form-group">
              <label class="form-label">Department Title</label>
              <input type="text" id="settingDeptName" class="form-control" value="${appData.institution.department}">
            </div>
            <div class="form-group">
              <label class="form-label">Campus / City</label>
              <input type="text" id="settingCity" class="form-control" value="${appData.institution.city}">
            </div>
            <button class="btn btn-primary btn-sm" onclick="saveInstitutionSettings()">
              ${icon('check')} Save Header
            </button>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <!-- Database & Cloud Persistence Status -->
        <div class="card" style="margin-bottom: 1.25rem;">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <span class="card-title">
              ${icon('check')}
              <span>Database & Cloud Persistence</span>
            </span>
            <span class="badge" id="adminDbStatusBadge" style="background:#e2e8f0; color:#334155; padding:0.25rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:700;">Checking...</span>
          </div>
          <div class="card-body">
            <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.75rem; line-height:1.45;">
              <p><b>Dual-Tier Resilient Storage:</b></p>
              <ul style="margin: 0.25rem 0 0.5rem 1.25rem; font-size:0.8rem;">
                <li><b>Priority 1 (Primary):</b> MySQL Database (MariaDB / cPanel)</li>
                <li><b>Priority 2 (Fail-Safe Fallback):</b> <code>data.json</code> file with rolling backups</li>
              </ul>
              Every save automatically synchronizes to MySQL and keeps <code>data.json</code> updated as a ready hot standby.
            </div>

            <div id="adminDbDiagnostics" style="background:#f8fafc; border:1px solid #e2e8f0; padding:0.75rem; border-radius:6px; font-size:0.8rem; margin-bottom:0.85rem; font-family:monospace; line-height:1.5;">
              Loading live database connection info...
            </div>

            <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
              <button class="btn btn-outline btn-sm" onclick="checkDatabaseHealthAdmin()">
                ${icon('sync')} Check Live Connection
              </button>
              <button class="btn btn-primary btn-sm" onclick="migrateDataJsonToDbAdmin()">
                ${icon('upload')} Migrate data.json to MySQL
              </button>
            </div>
          </div>
        </div>

        <!-- Backup & Restore -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              ${icon('download')}
              <span>Backup & Data Storage</span>
            </span>
          </div>
          <div class="card-body">
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
              Download all date sheets, marks, and student rosters as a text backup file (<code>cit_data.json</code>) or restore from an existing backup.
            </p>
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              <button class="btn btn-primary" onclick="downloadBackupJSON()">
                ${icon('download')} Download Backup File (cit_data.json)
              </button>
              
              <label class="btn btn-outline" style="margin:0; text-align:center; cursor:pointer;">
                ${icon('upload')} Load Data from Backup File
                <input type="file" accept=".json,.txt" onchange="uploadBackupJSON(event)" style="display:none;">
              </label>

              <button class="btn btn-danger btn-sm" onclick="resetToFactoryDefault()" style="margin-top:1.5rem;">
                ${icon('alert')} Reset All Data to Clean Default
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(checkDatabaseHealthAdmin, 50);
}

async function checkDatabaseHealthAdmin() {
  const diag = document.getElementById('adminDbDiagnostics');
  const badge = document.getElementById('adminDbStatusBadge');
  if (!diag) return;

  diag.innerHTML = `Checking server API and database status...`;
  try {
    const res = await fetch(`api.php?action=health&_t=${Date.now()}`);
    if (!res.ok) {
      if (badge) {
        badge.textContent = "Offline / Error";
        badge.style.background = "#fee2e2";
        badge.style.color = "#b91c1c";
      }
      diag.innerHTML = `<span style="color:#dc2626;">Server returned HTTP ${res.status}. Check PHP error logs.</span>`;
      return;
    }

    const data = await res.json();
    const db = data.database || {};
    const jsonStorage = data.json_storage || {};

    if (db.connected) {
      if (badge) {
        badge.textContent = "MySQL Connected (Priority 1)";
        badge.style.background = "#dcfce7";
        badge.style.color = "#15803d";
      }
      diag.innerHTML = `
        <div style="color:#15803d; font-weight:700; margin-bottom:0.4rem;">Status: Connected to MySQL Database (Priority 1 Active)</div>
        <div><b>Host:</b> ${escapeHtml(db.host || 'localhost')}</div>
        <div><b>Database:</b> ${escapeHtml(db.database_name || '')}</div>
        <div><b>User:</b> ${escapeHtml(db.user || '')}</div>
        <div><b>Students:</b> ${db.stats?.counts?.students ?? 'N/A'} registered</div>
        <div><b>Date Sheets:</b> ${db.stats?.counts?.datesheets ?? 'N/A'} created</div>
        <div><b>Marks Entries:</b> ${db.stats?.counts?.marks_records ?? 'N/A'} recorded</div>
        <div style="margin-top:0.35rem; color:#64748b; font-size:0.75rem;">data.json Backup: ${jsonStorage.exists ? 'Synchronized (' + Math.round((jsonStorage.size_bytes || 0)/1024) + ' KB)' : 'Missing'}</div>
      `;
    } else {
      if (badge) {
        badge.textContent = "JSON Fallback (Priority 2)";
        badge.style.background = "#fef3c7";
        badge.style.color = "#b45309";
      }
      diag.innerHTML = `
        <div style="color:#b45309; font-weight:700; margin-bottom:0.4rem;">Status: Database Offline &mdash; Running on data.json Fallback</div>
        <div><b>Configured:</b> ${db.configured ? 'Yes' : 'No (Credentials needed in db_config.php)'}</div>
        <div><b>Database Name:</b> ${escapeHtml(db.database_name || 'Not set')}</div>
        ${db.error ? `<div style="color:#dc2626; margin-top:0.25rem;"><b>Reason:</b> ${escapeHtml(db.error)}</div>` : ''}
        <div style="margin-top:0.35rem; color:#15803d;"><b>data.json Status:</b> Writable & Ready (${Math.round((jsonStorage.size_bytes || 0)/1024)} KB)</div>
      `;
    }
  } catch (e) {
    if (badge) {
      badge.textContent = "Unreachable";
      badge.style.background = "#fee2e2";
      badge.style.color = "#b91c1c";
    }
    diag.innerHTML = `<span style="color:#dc2626;">Cannot reach API. Check network connection or server PHP setup.</span>`;
  }
}

async function migrateDataJsonToDbAdmin() {
  if (!confirm("Are you sure you want to migrate all data from data.json into your MySQL Database now? This will synchronize all students, datesheets, and marks into MySQL.")) {
    return;
  }

  showToast("Migrating data.json into MySQL database...");
  try {
    const res = await fetch(`api.php?action=migrate_to_db&_t=${Date.now()}`);
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      showToast(data.message || "Migration completed successfully!");
      checkDatabaseHealthAdmin();
      syncWithServer(true);
    } else {
      showToast(data.message || "Migration failed. Check database credentials in db_config.php.", true);
      checkDatabaseHealthAdmin();
    }
  } catch (e) {
    showToast("Migration request failed: " + e.message, true);
  }
}

function savePortalPasswords() {
  const adminP = document.getElementById('settingAdminPass').value.trim();
  const teacherP = document.getElementById('settingTeacherPass').value.trim();

  if (!adminP || !teacherP) {
    showToast("Passwords cannot be empty.", true);
    return;
  }

  appData.passwords = { admin: adminP, teacher: teacherP };
  persistData();
  showToast("Portal passwords updated successfully.");
}

function saveInstitutionSettings() {
  appData.institution.name = document.getElementById('settingInstName').value.trim();
  appData.institution.department = document.getElementById('settingDeptName').value.trim();
  appData.institution.city = document.getElementById('settingCity').value.trim();
  persistData();
  showToast("Institution header updated.");
}

function downloadBackupJSON() {
  const jsonStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `cit_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Backup file downloaded.");
}

function uploadBackupJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.classes && parsed.subjects) {
        appData = parsed;
        persistData();
        showToast("Backup data loaded successfully.");
        if (typeof renderApp === 'function') renderApp();
      } else {
        showToast("Invalid backup file format.", true);
      }
    } catch (err) {
      showToast("Error reading backup file.", true);
    }
  };
  reader.readAsText(file);
}

function resetToFactoryDefault() {
  if (!confirm("Are you sure you want to reset all data to clean default?")) return;
  localStorage.removeItem('cit_system_data');
  const def = (typeof DEFAULT_CIT_DATA !== 'undefined' ? DEFAULT_CIT_DATA : null) || (typeof window !== 'undefined' ? window.DEFAULT_CIT_DATA : null);
  if (def) {
    appData = JSON.parse(JSON.stringify(def));
    persistData();
    showToast("System reset to clean default.");
    if (typeof renderApp === 'function') renderApp();
  }
}

// Global exports
window.renderAdminSettings = renderAdminSettings;
window.checkDatabaseHealthAdmin = checkDatabaseHealthAdmin;
window.migrateDataJsonToDbAdmin = migrateDataJsonToDbAdmin;
window.savePortalPasswords = savePortalPasswords;
window.saveInstitutionSettings = saveInstitutionSettings;
window.downloadBackupJSON = downloadBackupJSON;
window.uploadBackupJSON = uploadBackupJSON;
window.resetToFactoryDefault = resetToFactoryDefault;

