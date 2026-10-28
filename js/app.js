/**
 * CIT Department Result & Datesheet Management System
 * Pure Vanilla JavaScript Application Logic
 * Professional UI / UX (SVG Icons, No Emojis)
 * 
 * Authentication:
 * - Admin (default password: "admin123") -> Full access (Datesheets, Results, Rosters, Settings)
 * - Teacher (default password: "teacher123") -> Marks Entry + Download Result & Datesheet PDFs
 * 
 * Academic Features:
 * - 3 Classes: CIT 1st Year, CIT 2nd Year, CIT 3rd Year (Theory Only, No Sections)
 * - 3 Exam Types:
 *   1. Monthly Test: 20 marks for all subjects (Date only, no time slot needed)
 *   2. Mid-Term Examination: Full marks (50 / 75 / 100, Math Paper A & B, with time slot)
 *   3. Send-Up Examination (Sandup): Full marks (50 / 75 / 100, Math Paper A & B, with time slot)
 * - Student Rosters:
 *   - Session-wise management (e.g. 2026-2027, 2027-2028)
 *   - Annual Session Promotion & Class Shifting (3rd Year -> Passout, 2nd Year -> 3rd Year, 1st Year -> 2nd Year)
 *   - Passout / Alumni register archive
 *   - Direct Excel sheet import (.xlsx, .xls, .csv) & direct Excel copy-paste
 *   - Zero dummy data & cache auto-clean
 * - Results:
 *   - Categorize students by result rank
 *   - Highlight top 3 performing students in GREEN (1st, 2nd, 3rd Position badges)
 *   - Mark failed students in RED
 *   - Show percentage and letter grades
 */

// Application State
let appData = null;
let authRole = sessionStorage.getItem('cit_auth_role') || null; // 'admin', 'teacher', or null
let loginSelectedRole = 'teacher'; // 'admin' or 'teacher' on login screen
let adminActiveTab = 'datesheets'; // 'datesheets', 'results', 'students', 'settings'
let teacherActiveTab = 'marks'; // 'marks', 'result_pdf', 'datesheet_pdf'
let activeRosterClass = 'cit1'; // 'cit1', 'cit2', 'cit3', or 'passouts'

// Inline Professional SVG Icons (No Emojis)
const SVG_ICONS = {
  calendar: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  award: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`,
  users: `<svg class="icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  settings: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  edit: `<svg class="icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  printer: `<svg class="icon" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
  download: `<svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  upload: `<svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
  lock: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  user: `<svg class="icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  logout: `<svg class="icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  trash: `<svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  plus: `<svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  refresh: `<svg class="icon" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  share: `<svg class="icon" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
  fileText: `<svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  check: `<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  alert: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  arrowRight: `<svg class="icon" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`
};

function icon(name) {
  return SVG_ICONS[name] || '';
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', async () => {
  await loadInitialData();
  renderApp();
});

/**
 * 1. Data Storage & Multi-User Internet Synchronization
 */
const CIT_APP_STORAGE_VERSION = 'v5_cit_excel_2026';

function updateSyncBadge(text, state = 'online') {
  const badge = document.getElementById('syncStatusBadge');
  const dot = document.getElementById('syncStatusDot');
  if (badge) badge.textContent = text;
  if (dot) {
    dot.className = `sync-dot ${state}`;
  }
}

async function loadInitialData() {
  updateSyncBadge("Connecting...", "syncing");

  let serverData = null;

  // 1. Primary: Fetch live central database from api.php (cache-busted with timestamp)
  try {
    const res = await fetch(`api.php?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object' && !data.error && data.classes) {
        serverData = data;
      }
    }
  } catch (e) {
    // api.php not available (e.g. running offline or raw data.json)
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
        }
      }
    } catch (e) {}
  }

  // 2. If server data was retrieved successfully:
  if (serverData) {
    appData = serverData;
    if (!appData.currentSession) appData.currentSession = "2026-2027";
    if (!appData.passouts) appData.passouts = [];
    if (!appData.passwords) appData.passwords = { admin: "admin123", teacher: "teacher123" };
    if (!appData.curriculum && window.CIT_CURRICULUM) appData.curriculum = CIT_CURRICULUM;
    if (!appData.students || (!appData.students.cit1?.length && !appData.students.cit2?.length && !appData.students.cit3?.length)) {
      if (window.DEFAULT_CIT_DATA && DEFAULT_CIT_DATA.students) {
        appData.students = JSON.parse(JSON.stringify(DEFAULT_CIT_DATA.students));
      }
    }

    localStorage.setItem('cit_system_data', JSON.stringify(appData));
    localStorage.setItem('cit_app_version', CIT_APP_STORAGE_VERSION);
    updateSyncBadge("Cloud Connected", "online");
    return;
  }

  // 3. If offline / no internet / local file: load from local storage cache
  const local = localStorage.getItem('cit_system_data');
  if (local) {
    try {
      appData = JSON.parse(local);
      updateSyncBadge("Offline Mode", "offline");
      return;
    } catch (e) {
      console.warn("Corrupted local storage", e);
    }
  }

  // 4. Default fallback: Seed from bundled data.js
  appData = JSON.parse(JSON.stringify(DEFAULT_CIT_DATA));
  localStorage.setItem('cit_system_data', JSON.stringify(appData));
  localStorage.setItem('cit_app_version', CIT_APP_STORAGE_VERSION);
  updateSyncBadge("Local Defaults", "offline");
}

async function persistData() {
  if (!appData) return;

  // Immediate local cache
  localStorage.setItem('cit_system_data', JSON.stringify(appData));

  // Sync with Server via api.php
  try {
    updateSyncBadge("Syncing...", "syncing");
    const res = await fetch('api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(appData)
    });

    if (res.ok) {
      const resp = await res.json().catch(() => ({}));
      if (resp.status === 'success') {
        updateSyncBadge("Cloud Synced", "online");
        return;
      }
    }

    const err = await res.json().catch(() => ({}));
    const errMsg = err.message || "Failed to save to cloud server.";
    showToast(errMsg, true);
    updateSyncBadge("Server Error", "error");
  } catch (e) {
    updateSyncBadge("Saved Locally", "offline");
  }
}

// Manual or background sync to pull latest updates created by other colleagues
async function syncWithServer(isManual = false) {
  if (isManual) {
    updateSyncBadge("Checking Server...", "syncing");
  }

  try {
    const res = await fetch(`api.php?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (res.ok) {
      const serverData = await res.json();
      if (serverData && serverData.classes) {
        const currentJson = JSON.stringify(appData);
        const serverJson = JSON.stringify(serverData);

        if (currentJson !== serverJson) {
          appData = serverData;
          localStorage.setItem('cit_system_data', serverJson);

          // Refresh the current active view dynamically
          if (currentUser === 'admin') {
            const adminContent = document.getElementById('adminTabContent');
            if (adminActiveTab === 'datesheets') renderAdminDatesheets(adminContent);
            else if (adminActiveTab === 'results') loadCompiledClassResult();
            else if (adminActiveTab === 'students') renderAdminStudents(adminContent);
          } else if (currentUser === 'teacher') {
            const teacherContent = document.getElementById('teacherTabContent');
            if (teacherActiveTab === 'marks') renderTeacherMarksEntryTable();
            else if (teacherActiveTab === 'result_pdf') loadTeacherResultPreview();
            else if (teacherActiveTab === 'datesheet_pdf') renderTeacherDatesheetPdfDownload(teacherContent);
          }

          if (isManual) {
            showToast("Updated with latest data from cloud server.");
          }
        } else if (isManual) {
          showToast("Data is already up to date.");
        }

        updateSyncBadge("Cloud Synced", "online");
        return;
      }
    }

    if (isManual) {
      showToast("Cloud server not reachable. Using local data.", true);
    }
    updateSyncBadge("Offline Mode", "offline");
  } catch (e) {
    if (isManual) {
      showToast("Cannot reach cloud server. Check internet connection.", true);
    }
    updateSyncBadge("Offline Mode", "offline");
  }
}

// Periodic auto-sync every 45 seconds (when tab is active and teacher is not typing)
setInterval(() => {
  if (document.visibilityState === 'visible' && !document.querySelector('input:focus')) {
    syncWithServer(false);
  }
}, 45000);

function showToast(message, isError = false) {
  const existing = document.getElementById('toastNotice');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toastNotice';
  toast.className = 'toast-notice';
  if (isError) toast.style.backgroundColor = '#b91c1c';
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/**
 * 2. Curriculum & Marks Helper Functions
 */
function getCurriculumSubjects(classId, examType) {
  const source = (window.CIT_CURRICULUM && window.CIT_CURRICULUM[classId]) || 
                 (appData && appData.curriculum && appData.curriculum[classId]);

  if (source) {
    const list = source[examType] || source.midterm || [];
    return JSON.parse(JSON.stringify(list));
  }
  return (appData && appData.subjects && appData.subjects[classId]) || [];
}

function getSubjectMaxMarks(classId, subCode, examType) {
  if (examType === 'monthly') return 20;

  const subjects = getCurriculumSubjects(classId, examType);
  const found = subjects.find(s => s.code === subCode);
  if (found && found.maxMarks) return found.maxMarks;

  if (subCode.includes('Math-123') && (subCode.includes('A') || subCode.includes('B'))) return 75;
  if (subCode.includes('Math-223') && (subCode.includes('A') || subCode.includes('B'))) return 75;
  if (['Eng-112', 'CIT-124', 'CIT-114', 'CIT-203', 'CIT-273', 'CIT-283', 'CIT-204', 'CIT-314', 'CIT-343'].includes(subCode)) {
    return 100;
  }
  return 50;
}

function getLetterGrade(percentage, hasFail) {
  if (hasFail || percentage < 40) return 'F';
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  return 'D';
}

function calculateNextSession(sessionStr) {
  if (!sessionStr) return "2027-2028";
  const parts = sessionStr.split(/[-/]/);
  if (parts.length >= 2) {
    const y1 = parseInt(parts[0], 10);
    const y2 = parseInt(parts[1], 10);
    if (!isNaN(y1) && !isNaN(y2)) {
      return `${y1 + 1}-${y2 + 1}`;
    }
  }
  return "2027-2028";
}

function detectClassFromString(str) {
  if (!str) return null;
  const s = String(str).toLowerCase();
  if (s.includes('1st') || s.includes('first') || s.includes('cit-1') || s.includes('cit 1') || s.includes('part 1') || s.includes('year 1')) return 'cit1';
  if (s.includes('2nd') || s.includes('second') || s.includes('cit-2') || s.includes('cit 2') || s.includes('part 2') || s.includes('year 2')) return 'cit2';
  if (s.includes('3rd') || s.includes('third') || s.includes('cit-3') || s.includes('cit 3') || s.includes('part 3') || s.includes('year 3')) return 'cit3';
  return null;
}

/**
 * 3. Authentication & Header Render
 */
function renderHeaderAuth() {
  const container = document.getElementById('headerAuthArea');
  if (!container) return;

  if (!authRole) {
    container.innerHTML = `
      <div class="user-badge-header">
        ${icon('lock')}
        <span>Sign In Required</span>
      </div>
    `;
    return;
  }

  const roleLabel = authRole === 'admin' ? 'Administrator' : 'Subject Teacher';
  container.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.6rem;">
      <div class="user-badge-header">
        ${icon('user')}
        <span>${roleLabel}</span>
      </div>
      <button class="btn btn-outline btn-sm" style="color:#ffffff; border-color:rgba(255,255,255,0.3);" onclick="handleLogout()">
        ${icon('logout')}
        <span>Sign Out</span>
      </button>
    </div>
  `;
}

function handleLogout() {
  authRole = null;
  sessionStorage.removeItem('cit_auth_role');
  showToast("Signed out successfully.");
  renderApp();
}

/**
 * 4. Main App Router
 */
function renderApp() {
  renderHeaderAuth();
  const container = document.getElementById('mainContentArea');
  if (!container || !appData) return;

  if (!authRole) {
    renderLoginView(container);
  } else if (authRole === 'admin') {
    renderAdminPortal(container);
  } else {
    renderTeacherPortal(container);
  }
}

/**
 * 5. LOGIN VIEW
 */
function renderLoginView(container) {
  container.innerHTML = `
    <div class="login-card">
      <div class="login-header">
        <div style="display:flex; justify-content:center; margin-bottom:0.75rem;">
          <div class="brand-badge" style="width:48px; height:48px; font-size:1.35rem;">CIT</div>
        </div>
        <h3 style="margin:0; font-size:1.15rem; font-weight:700;">Examination Portal Sign In</h3>
        <p style="margin:4px 0 0; font-size:0.8rem; color:#cbd5e1;">Select your role and enter your password</p>
      </div>

      <div class="login-body">
        <form onsubmit="handleLoginSubmit(event)">
          <div class="role-toggle-group">
            <button type="button" class="role-toggle-btn ${loginSelectedRole === 'teacher' ? 'active' : ''}" onclick="setLoginRole('teacher')">
              ${icon('edit')}
              <span>Subject Teacher</span>
            </button>
            <button type="button" class="role-toggle-btn ${loginSelectedRole === 'admin' ? 'active' : ''}" onclick="setLoginRole('admin')">
              ${icon('settings')}
              <span>Administrator</span>
            </button>
          </div>

          <div class="form-group">
            <label class="form-label" for="loginPasswordInput">
              ${icon('lock')}
              <span>Enter ${loginSelectedRole === 'admin' ? 'Administrator' : 'Teacher'} Password</span>
            </label>
            <div style="position:relative;">
              <input type="password" id="loginPasswordInput" class="form-control" placeholder="Enter password" required autofocus autocomplete="current-password">
            </div>
            <small style="display:block; margin-top:0.35rem; color:var(--text-muted); font-size:0.75rem;">
              Default: <b>${loginSelectedRole === 'admin' ? 'admin123' : 'teacher123'}</b>
            </small>
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%; padding:0.7rem; font-size:0.95rem; margin-top:1.25rem;">
            <span>Sign In to Portal</span>
          </button>
        </form>
      </div>
    </div>
  `;
}

function setLoginRole(role) {
  loginSelectedRole = role;
  const container = document.getElementById('mainContentArea');
  if (container) renderLoginView(container);
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('loginPasswordInput');
  const enteredPass = input ? input.value.trim() : '';

  const expectedPass = (appData.passwords && appData.passwords[loginSelectedRole]) || 
                       (loginSelectedRole === 'admin' ? 'admin123' : 'teacher123');

  if (enteredPass === expectedPass) {
    authRole = loginSelectedRole;
    sessionStorage.setItem('cit_auth_role', authRole);
    showToast(`Signed in as ${authRole === 'admin' ? 'Administrator' : 'Subject Teacher'}`);
    renderApp();
  } else {
    showToast("Invalid password! Please try again.", true);
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

/**
 * 6. ADMINISTRATOR PORTAL
 */
function setAdminTab(tab) {
  adminActiveTab = tab;
  renderApp();
}

function renderAdminPortal(container) {
  container.innerHTML = `
    <div class="sub-nav no-print">
      <button class="sub-nav-btn ${adminActiveTab === 'datesheets' ? 'active' : ''}" onclick="setAdminTab('datesheets')">
        ${icon('calendar')}
        <span>Date Sheets</span>
      </button>
      <button class="sub-nav-btn ${adminActiveTab === 'results' ? 'active' : ''}" onclick="setAdminTab('results')">
        ${icon('award')}
        <span>Class Results & Rankings</span>
      </button>
      <button class="sub-nav-btn ${adminActiveTab === 'students' ? 'active' : ''}" onclick="setAdminTab('students')">
        ${icon('users')}
        <span>Student Rosters & Sessions</span>
      </button>
      <button class="sub-nav-btn ${adminActiveTab === 'settings' ? 'active' : ''}" onclick="setAdminTab('settings')">
        ${icon('settings')}
        <span>Settings & Passwords</span>
      </button>
    </div>

    <div id="adminTabContent"></div>
  `;

  const tabContent = document.getElementById('adminTabContent');
  if (adminActiveTab === 'datesheets') {
    renderAdminDatesheets(tabContent);
  } else if (adminActiveTab === 'results') {
    renderAdminResults(tabContent);
  } else if (adminActiveTab === 'students') {
    renderAdminStudents(tabContent);
  } else {
    renderAdminSettings(tabContent);
  }
}

// Admin: Date Sheets
function renderAdminDatesheets(container) {
  const datesheets = appData.datesheets || [];

  container.innerHTML = `
    <div class="row">
      <!-- Create Date Sheet Form -->
      <div class="col-md-5 no-print">
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              ${icon('plus')}
              <span>Create New Date Sheet</span>
            </span>
          </div>
          <div class="card-body">
            <form id="createDatesheetForm" onsubmit="handleCreateDatesheet(event)">
              <div class="form-group">
                <label class="form-label">Step 1: Select Class</label>
                <select id="dsClassSelect" class="form-select" onchange="onDatesheetClassChange()" required>
                  <option value="cit1">CIT 1st Year</option>
                  <option value="cit2">CIT 2nd Year</option>
                  <option value="cit3">CIT 3rd Year</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Step 2: Select Examination Type</label>
                <select id="dsExamTypeSelect" class="form-select" onchange="onDatesheetTypeChange()" required>
                  <option value="monthly">Monthly Test (20 Marks per subject, Date only)</option>
                  <option value="midterm">Mid-Term Examination (50/75/100 Marks, Math Paper A & B)</option>
                  <option value="sendup">Send-Up Examination - Sandup (50/75/100 Marks, Math Paper A & B)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Step 3: Assessment Title</label>
                <input type="text" id="dsTitleInput" class="form-control" placeholder="e.g. Monthly Test" required value="Monthly Test ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}">
              </div>

              <div class="form-group">
                <label class="form-label">Step 4: Academic Session</label>
                <input type="text" id="dsSessionInput" class="form-control" value="${appData.currentSession || '2026-2027'}" required>
              </div>

              <div class="form-group">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.35rem;">
                  <div>
                    <label class="form-label" style="margin-bottom:0;">Step 5: Set Exam Schedule</label>
                    <small style="color:var(--text-muted); font-size:0.75rem; display:block;">Selecting date for 1st subject auto-fills all subjects.</small>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" onclick="reusePreviousDatesheetTemplate()">
                    ${icon('refresh')}
                    <span>Reuse Template</span>
                  </button>
                </div>
                <div id="datesheetSubjectsList" style="max-height: 290px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; background:#fff;"></div>
              </div>

              <button type="submit" class="btn btn-primary" style="width: 100%;">
                ${icon('check')}
                <span>Generate & Save Date Sheet</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Existing Date Sheets List -->
      <div class="col-md-7">
        <div class="card">
          <div class="card-header no-print">
            <span class="card-title">
              ${icon('calendar')}
              <span>Saved Examination Date Sheets (${datesheets.length})</span>
            </span>
          </div>
          <div class="card-body" id="savedDatesheetsList">
            ${datesheets.length === 0 ? '<p style="color:var(--text-muted); text-align:center; padding:2.5rem;">No date sheets created yet. Fill the form to create your examination date sheet.</p>' : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  onDatesheetClassOrTypeChange();
  renderSavedDatesheetsList();
}

function onDatesheetClassChange() {
  onDatesheetClassOrTypeChange();
}

function onDatesheetTypeChange() {
  const type = document.getElementById('dsExamTypeSelect').value;
  const titleInput = document.getElementById('dsTitleInput');
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();

  if (type === 'monthly') {
    titleInput.value = `Monthly Test ${monthName} ${year}`;
  } else if (type === 'midterm') {
    titleInput.value = `Mid-Term Examination ${year}`;
  } else {
    titleInput.value = `Send-Up Examination ${year}`;
  }

  onDatesheetClassOrTypeChange();
}

function onDatesheetClassOrTypeChange() {
  const classSelect = document.getElementById('dsClassSelect');
  const examTypeSelect = document.getElementById('dsExamTypeSelect');
  const container = document.getElementById('datesheetSubjectsList');
  if (!classSelect || !examTypeSelect || !container) return;

  const classId = classSelect.value;
  const examType = examTypeSelect.value;
  const subjects = getCurriculumSubjects(classId, examType);
  const isMonthly = (examType === 'monthly');

  container.innerHTML = subjects.map((sub, idx) => {
    let badgeColor = '#0369a1';
    let badgeBg = '#e0f2fe';
    if (sub.maxMarks === 100) {
      badgeColor = '#065f46';
      badgeBg = '#d1fae5';
    } else if (sub.maxMarks === 75) {
      badgeColor = '#854d0e';
      badgeBg = '#fef9c3';
    }

    const isFirst = (idx === 0);

    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding: 0.4rem 0.25rem; border-bottom: 1px solid #f1f5f9; gap: 0.5rem; font-size:0.85rem; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <label style="display:flex; align-items:center; gap: 0.4rem; cursor:pointer; margin:0;">
            <input type="checkbox" class="sub-checkbox" value="${sub.code}" data-title="${sub.title}" data-max="${sub.maxMarks}" checked>
            <span><b>${sub.code}</b> &mdash; ${sub.title}</span>
            ${isFirst ? '<span class="badge" style="background:#dcfce7; color:#15803d; font-size:0.7rem; margin-left:4px;">Master Date</span>' : ''}
          </label>
        </div>
        <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
          <span class="badge" style="background:${badgeBg}; color:${badgeColor}; font-weight:700; font-size:0.75rem; white-space:nowrap;">
            ${sub.maxMarks}M
          </span>
          <input type="date" class="form-control form-control-sm sub-date-input" 
            data-code="${sub.code}" data-idx="${idx}" 
            onchange="onSubjectDateChange(this, ${isFirst})" 
            oninput="onSubjectDateChange(this, ${isFirst})" 
            style="width:130px; font-size:0.8rem;" required>
          <span id="day_badge_${sub.code}" class="day-name-badge" title="Automatically selected Day">-</span>
          ${!isMonthly ? `
            <input type="text" class="form-control form-control-sm sub-time-input" data-code="${sub.code}" data-idx="${idx}" ${isFirst ? 'onchange="onFirstSubjectTimeChange(this.value)" oninput="onFirstSubjectTimeChange(this.value)"' : ''} value="09:00 AM" placeholder="09:00 AM" style="width:85px; font-size:0.8rem;">
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function getDayNameFromDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split(/[-/]/);
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-US', { weekday: 'long' });
    }
  }
  const dt = new Date(dateStr);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('en-US', { weekday: 'long' });
}

function updateDayBadge(code, dayName) {
  const badge = document.getElementById(`day_badge_${code}`);
  if (!badge) return;
  if (dayName) {
    badge.textContent = dayName;
    badge.classList.add('active');
  } else {
    badge.textContent = '-';
    badge.classList.remove('active');
  }
}

function onSubjectDateChange(inputEl, isFirst) {
  const val = inputEl.value;
  const dayName = getDayNameFromDate(val);
  const code = inputEl.dataset.code;

  updateDayBadge(code, dayName);

  if (isFirst && val) {
    const dateInputs = document.querySelectorAll('#datesheetSubjectsList .sub-date-input');
    let count = 0;
    dateInputs.forEach((inp, idx) => {
      if (idx > 0) {
        inp.value = val;
        updateDayBadge(inp.dataset.code, dayName);
        count++;
      }
    });
    if (count > 0) {
      showToast(`Date & Day (${dayName}) applied to all ${count + 1} subjects.`);
    }
  }
}

function onFirstSubjectTimeChange(val) {
  if (!val) return;
  const timeInputs = document.querySelectorAll('#datesheetSubjectsList .sub-time-input');
  timeInputs.forEach((inp, idx) => {
    if (idx > 0) {
      inp.value = val;
    }
  });
}

function reusePreviousDatesheetTemplate() {
  const classId = document.getElementById('dsClassSelect').value;
  const examType = document.getElementById('dsExamTypeSelect').value;

  let existing = (appData.datesheets || []).filter(d => d.classId === classId && d.examType === examType).slice(-1)[0];
  if (!existing) {
    existing = (appData.datesheets || []).filter(d => d.classId === classId).slice(-1)[0];
  }

  if (!existing) {
    showToast("No previous date sheet found to copy from.", true);
    return;
  }

  existing.items.forEach(item => {
    const dateInput = document.querySelector(`.sub-date-input[data-code="${item.code}"]`);
    const timeInput = document.querySelector(`.sub-time-input[data-code="${item.code}"]`);
    if (dateInput) {
      dateInput.value = item.date;
      updateDayBadge(item.code, getDayNameFromDate(item.date));
    }
    if (timeInput && item.time) timeInput.value = item.time;
  });
  showToast(`Loaded schedule template from '${existing.title}'`);
}

function handleCreateDatesheet(e) {
  e.preventDefault();
  const classId = document.getElementById('dsClassSelect').value;
  const examType = document.getElementById('dsExamTypeSelect').value;
  const examTypeName = document.getElementById('dsExamTypeSelect').selectedOptions[0].text.split('(')[0].trim();
  const title = document.getElementById('dsTitleInput').value.trim();
  const session = document.getElementById('dsSessionInput').value.trim();
  const isMonthly = (examType === 'monthly');

  const selectedItems = [];
  document.querySelectorAll('#datesheetSubjectsList .sub-checkbox:checked').forEach(cb => {
    const code = cb.value;
    const titleText = cb.dataset.title;
    const maxMarks = parseInt(cb.dataset.max, 10) || (isMonthly ? 20 : 50);
    const dateInput = document.querySelector(`.sub-date-input[data-code="${code}"]`);
    const timeInput = document.querySelector(`.sub-time-input[data-code="${code}"]`);

    if (dateInput && dateInput.value) {
      selectedItems.push({
        code: code,
        title: titleText,
        maxMarks: maxMarks,
        date: dateInput.value,
        day: getDayNameFromDate(dateInput.value),
        time: isMonthly ? "" : (timeInput ? timeInput.value.trim() : "09:00 AM")
      });
    }
  });

  if (selectedItems.length === 0) {
    showToast("Please select at least one subject with an examination date.", true);
    return;
  }

  selectedItems.sort((a, b) => new Date(a.date) - new Date(b.date));

  const dsId = `ds_${classId}_${Date.now()}`;
  const newDatesheet = {
    id: dsId,
    classId: classId,
    examType: examType,
    examTypeName: examTypeName,
    title: title,
    session: session,
    createdAt: new Date().toISOString().split('T')[0],
    items: selectedItems
  };

  appData.datesheets = appData.datesheets || [];
  appData.datesheets.unshift(newDatesheet);
  persistData();

  showToast(`Date Sheet '${title}' created successfully.`);
  renderAdminDatesheets(document.getElementById('adminTabContent'));
}

function renderSavedDatesheetsList() {
  const container = document.getElementById('savedDatesheetsList');
  if (!container) return;

  const datesheets = appData.datesheets || [];
  if (datesheets.length === 0) {
    container.innerHTML = `
      <div style="border: 2px dashed var(--border-color); border-radius: 8px; padding: 2.5rem 1.5rem; text-align: center; color: var(--text-muted); background: #ffffff;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem; color: #94a3b8;">${icon('calendar')}</div>
        <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem;">No Date Sheets Created Yet</h4>
        <p style="font-size: 0.85rem; margin-bottom: 0.5rem; max-width: 420px; margin-left: auto; margin-right: auto;">
          Use the form on the left to select a class (CIT 1st, 2nd, or 3rd Year) and examination type to generate your first official date sheet.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = datesheets.map(ds => {
    const className = (appData.classes.find(c => c.id === ds.classId) || {}).name || ds.classId;
    const isMonthly = (ds.examType === 'monthly');

    return `
      <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem; margin-bottom: 1rem; background: #fff;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom: 0.75rem;">
          <div>
            <h4 style="margin:0; font-weight:700; color:var(--primary);">${ds.title}</h4>
            <div style="font-size:0.85rem; color:var(--text-muted);">
              <b>${className}</b> &bull; ${ds.session} &bull; ${ds.items.length} Theory Subjects
            </div>
          </div>
          <div class="no-print" style="display:flex; gap:0.4rem;">
            <button class="btn btn-primary btn-sm" onclick="previewDatesheet('${ds.id}')">
              ${icon('printer')}
              <span>Print / PDF</span>
            </button>
            <button class="btn btn-outline btn-sm text-danger" onclick="deleteDatesheet('${ds.id}')">
              ${icon('trash')}
              <span>Delete</span>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th style="width:35px;">#</th>
                <th style="width:105px;">Code</th>
                <th>Subject Title</th>
                <th style="width:75px; text-align:center;">Marks</th>
                <th style="width:115px;">Exam Date</th>
                <th style="width:100px; text-align:center;">Day</th>
                ${!isMonthly ? '<th style="width:85px;">Time</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${ds.items.map((it, i) => {
                const maxM = it.maxMarks || getSubjectMaxMarks(ds.classId, it.code, ds.examType);
                const dayStr = it.day || getDayNameFromDate(it.date);
                return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><b>${it.code}</b></td>
                    <td>${it.title}</td>
                    <td style="text-align:center;">
                      <span class="badge" style="background:#f1f5f9; color:#0f172a; font-weight:700;">${maxM}</span>
                    </td>
                    <td>${formatDate(it.date)}</td>
                    <td style="text-align:center;">
                      <span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:600;">${dayStr}</span>
                    </td>
                    ${!isMonthly ? `<td>${it.time || '-'}</td>` : ''}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

function deleteDatesheet(dsId) {
  if (!confirm("Are you sure you want to delete this date sheet?")) return;
  appData.datesheets = (appData.datesheets || []).filter(d => d.id !== dsId);
  persistData();
  showToast("Date sheet deleted.");
  renderAdminDatesheets(document.getElementById('adminTabContent'));
}

function previewDatesheet(dsId) {
  const ds = (appData.datesheets || []).find(d => d.id === dsId);
  if (!ds) return;

  const className = (appData.classes.find(c => c.id === ds.classId) || {}).name || ds.classId;
  const isMonthly = (ds.examType === 'monthly');

  createPrintModal(`
    <div class="print-only-header">
      <h2>${appData.institution.name}</h2>
      <h3>${appData.institution.department}</h3>
      <p>${appData.institution.subtitle} &bull; ${appData.institution.city}</p>
    </div>

    <div style="text-align:center; margin-bottom: 1.25rem;">
      <h3 style="font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">
        OFFICIAL EXAMINATION DATE SHEET
      </h3>
      <h4 style="font-size:12pt; margin-bottom:4px; color:var(--primary);">${ds.title}</h4>
      <p style="font-size:10pt; color:#475569;">
        Class: <b>${className}</b> &bull; Academic Session: <b>${ds.session}</b> &bull; Type: <b>${ds.examTypeName || ds.examType}</b>
      </p>
    </div>

    <table class="table table-bordered" style="width:100%; border-collapse:collapse; margin-bottom: 2rem;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="border:1px solid #000; padding:6px; width:40px; text-align:center;">Sr.</th>
          <th style="border:1px solid #000; padding:6px; width:110px;">Subject Code</th>
          <th style="border:1px solid #000; padding:6px; text-align:left;">Curriculum Subject Title</th>
          <th style="border:1px solid #000; padding:6px; width:85px; text-align:center;">Max Marks</th>
          <th style="border:1px solid #000; padding:6px; width:120px; text-align:center;">Exam Date</th>
          <th style="border:1px solid #000; padding:6px; width:95px; text-align:center;">Day</th>
          ${!isMonthly ? '<th style="border:1px solid #000; padding:6px; width:95px; text-align:center;">Time</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${ds.items.map((it, i) => {
          const dayName = it.day || getDayNameFromDate(it.date);
          const maxM = it.maxMarks || getSubjectMaxMarks(ds.classId, it.code, ds.examType);
          return `
            <tr>
              <td style="border:1px solid #000; padding:6px; text-align:center;">${i + 1}</td>
              <td style="border:1px solid #000; padding:6px;"><b>${it.code}</b></td>
              <td style="border:1px solid #000; padding:6px;">${it.title}</td>
              <td style="border:1px solid #000; padding:6px; text-align:center; font-weight:bold;">${maxM}</td>
              <td style="border:1px solid #000; padding:6px; text-align:center;">${formatDate(it.date)}</td>
              <td style="border:1px solid #000; padding:6px; text-align:center;">${dayName}</td>
              ${!isMonthly ? `<td style="border:1px solid #000; padding:6px; text-align:center;">${it.time || '-'}</td>` : ''}
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div style="border:1px solid #000; padding:8px 12px; font-size:8.5pt; margin-bottom: 2rem; background:#fff;">
      <b>Candidate Instructions:</b><br>
      1. Students must bring their official College ID & Roll Number Slip to every examination.<br>
      2. Entry into the examination room is closed 15 minutes after scheduled start time.<br>
      3. Mobile phones, smartwatches, and programmable devices are strictly prohibited.
    </div>

    <div class="signature-section" style="display:flex; justify-content:space-between; margin-top:50px; text-align:center;">
      <div class="sig-box">Incharge Date Sheet Cell<br><small>CIT Department</small></div>
      <div class="sig-box">Head of CIT Department<br><small>Technical College</small></div>
      <div class="sig-box">Controller of Examinations<br><small>Academic Authority</small></div>
    </div>
  `);
}

// Admin: Class Results & Rankings
function renderAdminResults(container) {
  const datesheets = appData.datesheets || [];

  container.innerHTML = `
    <div class="card no-print">
      <div class="card-header">
        <span class="card-title">
          ${icon('award')}
          <span>Class Result Compiler, Rankings & PDF</span>
        </span>
      </div>
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-md-5">
            <label class="form-label">Select Scheduled Assessment</label>
            <select id="adminResultDsSelect" class="form-select" onchange="loadCompiledClassResult()">
              ${datesheets.length === 0 ? '<option value="">-- No Date Sheets Available --</option>' : ''}
              ${datesheets.map(ds => {
                const className = (appData.classes.find(c => c.id === ds.classId) || {}).name;
                return `<option value="${ds.id}">${ds.title} (${className})</option>`;
              }).join('')}
            </select>
          </div>
          <div class="col-md-7" style="display:flex; gap:0.5rem; align-items:flex-end; padding-top:1.5rem;">
            <button class="btn btn-primary" onclick="printCompiledResult()">
              ${icon('printer')}
              <span>Print Official PDF</span>
            </button>
            <button class="btn btn-secondary" onclick="exportResultCSV()">
              ${icon('download')}
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div id="compiledResultContainer"></div>
  `;

  loadCompiledClassResult();
}

function evaluateDatesheetResults(dsId) {
  const ds = (appData.datesheets || []).find(d => d.id === dsId);
  if (!ds) return null;

  const classId = ds.classId;
  const className = (appData.classes.find(c => c.id === ds.classId) || {}).name || classId;
  const students = appData.students[classId] || [];
  const subjects = ds.items || [];
  const dsMarks = (appData.marks && appData.marks[dsId]) || {};

  // Build rows with marks, status, percentages
  let evaluatedRows = students.map(st => {
    let totalObt = 0;
    let totalMax = 0;
    let hasFail = false;
    let hasAnyMarks = false;
    let subjectEntries = [];

    subjects.forEach(sub => {
      const maxM = sub.maxMarks || getSubjectMaxMarks(classId, sub.code, ds.examType);
      const subMarks = dsMarks[sub.code] || {};
      const val = subMarks[st.roll];

      if (val === 'A' || val === 'a' || val === 'ABS') {
        subjectEntries.push({ val: 'ABS', obt: 0, max: maxM, isFail: true });
        totalMax += maxM;
        hasFail = true;
        hasAnyMarks = true;
      } else if (val !== undefined && val !== null && val !== '') {
        const num = parseFloat(val);
        const isF = num < (maxM * 0.4);
        if (isF) hasFail = true;
        subjectEntries.push({ val: num, obt: num, max: maxM, isFail: isF });
        totalObt += num;
        totalMax += maxM;
        hasAnyMarks = true;
      } else {
        subjectEntries.push({ val: '-', obt: 0, max: maxM, isFail: false });
      }
    });

    const pct = totalMax > 0 ? parseFloat(((totalObt / totalMax) * 100).toFixed(1)) : 0;
    const isPass = hasAnyMarks && totalMax > 0 && !hasFail && pct >= 40;
    const grade = getLetterGrade(pct, hasFail || !hasAnyMarks);

    return {
      roll: st.roll,
      name: st.name,
      session: st.session || appData.currentSession || '',
      entries: subjectEntries,
      totalObt: totalObt,
      totalMax: totalMax,
      percentage: pct,
      status: (!hasAnyMarks) ? 'PENDING' : (isPass ? 'PASS' : 'FAIL'),
      grade: (!hasAnyMarks) ? '-' : grade,
      hasAnyMarks: hasAnyMarks
    };
  });

  // Calculate Ranks: PASS students ranked by total obtained marks
  evaluatedRows.sort((a, b) => {
    if (a.status === 'PASS' && b.status !== 'PASS') return -1;
    if (a.status !== 'PASS' && b.status === 'PASS') return 1;
    return b.totalObt - a.totalObt;
  });

  let currentRank = 1;
  evaluatedRows.forEach((row) => {
    if (row.status === 'PASS') {
      row.rank = currentRank++;
    } else {
      row.rank = '-';
    }
  });

  const totalExamMax = subjects.reduce((sum, s) => sum + (s.maxMarks || getSubjectMaxMarks(classId, s.code, ds.examType)), 0);
  const appeared = evaluatedRows.filter(r => r.hasAnyMarks);
  const passedCount = evaluatedRows.filter(r => r.status === 'PASS').length;
  const failedCount = evaluatedRows.filter(r => r.status === 'FAIL').length;
  const passRate = appeared.length > 0 ? Math.round((passedCount / appeared.length) * 100) : 0;

  return {
    ds,
    classId,
    className,
    students,
    subjects,
    evaluatedRows,
    totalExamMax,
    appeared,
    passedCount,
    failedCount,
    passRate
  };
}

function buildResultTableHtml(evalData, isPrintDoc = false) {
  const { ds, classId, subjects, evaluatedRows } = evalData;

  return `
    <table class="table table-bordered table-sm result-sheet-table" style="margin:0;">
      <thead>
        <tr style="background:#f8fafc;">
          <th class="col-rank">Rank</th>
          <th class="col-roll">Roll</th>
          <th class="col-name">Student Name</th>
          ${subjects.map(s => {
            const maxM = s.maxMarks || getSubjectMaxMarks(classId, s.code, ds.examType);
            return `
              <th class="col-subject">
                ${s.code}<br>
                <small style="font-weight:600; color:var(--text-muted);">(${maxM}M)</small>
              </th>
            `;
          }).join('')}
          <th class="col-total">Total</th>
          <th class="col-pct">%</th>
          <th class="col-grade">Grade</th>
          <th class="col-status">Status</th>
        </tr>
      </thead>
      <tbody>
        ${evaluatedRows.map(sr => {
          let rowClass = '';
          let rankBadgeHtml = `<span class="rank-badge rank-badge-general">${sr.rank}</span>`;

          if (sr.status === 'FAIL') {
            rowClass = 'row-fail';
            rankBadgeHtml = `<span class="rank-badge badge-danger">FAIL</span>`;
          } else if (sr.rank === 1) {
            rowClass = 'rank-1-row';
            rankBadgeHtml = isPrintDoc ? `<span class="rank-badge rank-badge-1">1st</span>` : `<span class="rank-badge rank-badge-1">1st Position</span>`;
          } else if (sr.rank === 2) {
            rowClass = 'rank-2-row';
            rankBadgeHtml = isPrintDoc ? `<span class="rank-badge rank-badge-2">2nd</span>` : `<span class="rank-badge rank-badge-2">2nd Position</span>`;
          } else if (sr.rank === 3) {
            rowClass = 'rank-3-row';
            rankBadgeHtml = isPrintDoc ? `<span class="rank-badge rank-badge-3">3rd</span>` : `<span class="rank-badge rank-badge-3">3rd Position</span>`;
          }

          return `
            <tr class="${rowClass}">
              <td class="col-rank">${rankBadgeHtml}</td>
              <td class="col-roll" style="font-weight:bold;">${sr.roll}</td>
              <td class="col-name"><b>${sr.name}</b></td>
              ${sr.entries.map(e => `
                <td class="col-subject" style="${e.isFail ? 'color:var(--danger); font-weight:700;' : ''}">
                  ${e.val}
                </td>
              `).join('')}
              <td class="col-total" style="font-weight:bold;">${sr.hasAnyMarks ? `${sr.totalObt}/${sr.totalMax}` : '-'}</td>
              <td class="col-pct" style="font-weight:bold;">${sr.hasAnyMarks ? `${sr.percentage}%` : '-'}</td>
              <td class="col-grade">
                <span class="grade-badge grade-${sr.grade.replace('+', '-plus')}">${sr.grade}</span>
              </td>
              <td class="col-status">
                <span class="badge ${sr.status === 'PASS' ? 'badge-success' : (sr.status === 'FAIL' ? 'badge-danger' : 'badge-secondary')}">
                  ${sr.status}
                </span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function loadCompiledClassResult() {
  const dsSelect = document.getElementById('adminResultDsSelect');
  const container = document.getElementById('compiledResultContainer');
  if (!dsSelect || !container) return;

  const dsId = dsSelect.value;
  const evalData = evaluateDatesheetResults(dsId);

  if (!evalData) {
    container.innerHTML = `
      <div class="card">
        <div class="card-body" style="text-align:center; padding:3rem; color:var(--text-muted);">
          <p>No assessment selected or no date sheets created yet.</p>
        </div>
      </div>
    `;
    return;
  }

  const { ds, className, students, totalExamMax, passRate, passedCount, failedCount } = evalData;

  if (students.length === 0) {
    container.innerHTML = `
      <div class="card">
        <div class="card-body" style="text-align:center; padding:3rem; color:var(--text-muted);">
          <p>No students enrolled in <b>${className}</b> yet.</p>
          <button class="btn btn-outline btn-sm" onclick="setAdminTab('students')">
            ${icon('users')} Go to Student Rosters
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card printable-result-card" id="printableResultSheet">
      <div class="print-only-header">
        <h2>${appData.institution.name}</h2>
        <h3>${appData.institution.department}</h3>
        <p>${appData.institution.subtitle} &bull; ${appData.institution.city}</p>
      </div>

      <div class="card-header">
        <div>
          <h3 style="margin:0; font-size:1.15rem; font-weight:bold; color:var(--primary);">${ds.title} &mdash; Official Result Sheet</h3>
          <p style="margin:0; font-size:0.85rem; color:var(--text-muted);">
            Class: <b>${className}</b> &bull; Academic Session: <b>${ds.session}</b> &bull; Total Theory Marks: <b>${totalExamMax}</b>
          </p>
        </div>
        <div class="no-print" style="display:flex; gap:0.5rem; align-items:center;">
          <span class="badge badge-success">Pass Rate: ${passRate}%</span>
          <span class="badge" style="background:#e0f2fe; color:#0369a1;">Passed: ${passedCount}</span>
          <span class="badge badge-danger">Failed: ${failedCount}</span>
          <button class="btn btn-primary btn-sm" onclick="previewResultSheet('${ds.id}')">
            ${icon('printer')} <span>Print / PDF Preview</span>
          </button>
        </div>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive">
          ${buildResultTableHtml(evalData, false)}
        </div>
      </div>

      <div class="signature-section" style="display:none;">
        <div class="sig-box">Prepared & Verified By<br><small>CIT Examination Cell</small></div>
        <div class="sig-box">Head of CIT Department<br><small>Technical College</small></div>
        <div class="sig-box">Controller of Examinations<br><small>Academic Authority</small></div>
      </div>
    </div>
  `;
}

function previewResultSheet(dsId) {
  if (!dsId) {
    const sel = document.getElementById('adminResultDsSelect') || document.getElementById('teacherResultSelect');
    if (sel) dsId = sel.value;
  }
  const evalData = evaluateDatesheetResults(dsId);
  if (!evalData) {
    showToast("Please select a valid assessment first.", true);
    return;
  }

  const { ds, className, students, totalExamMax, passRate, passedCount, failedCount } = evalData;

  createPrintModal(`
    <div class="printable-result-container">
      <div class="print-only-header" style="display:block; text-align:center; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:10px;">
        <h2 style="font-size:14pt; font-weight:bold; margin:0 0 2px 0;">${appData.institution.name}</h2>
        <h3 style="font-size:11.5pt; font-weight:bold; margin:0 0 2px 0; color:#1e293b;">${appData.institution.department}</h3>
        <p style="font-size:8.5pt; color:#475569; margin:0;">${appData.institution.subtitle} &bull; ${appData.institution.city}</p>
      </div>

      <div style="text-align:center; margin-bottom: 10px;">
        <h3 style="font-size:12.5pt; font-weight:bold; text-transform:uppercase; margin:0 0 3px 0; color:#0f172a;">
          OFFICIAL EXAMINATION RESULT SHEET & MERIT LIST
        </h3>
        <h4 style="font-size:11pt; margin:0 0 3px 0; color:var(--primary); font-weight:bold;">${ds.title}</h4>
        <p style="font-size:8.5pt; color:#475569; margin:0;">
          Class: <b>${className}</b> &bull; Academic Session: <b>${ds.session}</b> &bull; Total Theory Marks: <b>${totalExamMax}</b> &bull; Candidates: <b>${students.length}</b> &bull; Passed: <b>${passedCount}</b> &bull; Failed: <b>${failedCount}</b> &bull; Pass Rate: <b>${passRate}%</b>
        </p>
      </div>

      <div class="table-responsive" style="margin-bottom:10px;">
        ${buildResultTableHtml(evalData, true)}
      </div>

      <div style="border:1px solid #cbd5e1; padding:5px 8px; font-size:7.2pt; margin-top:8px; margin-bottom:14px; background:#f8fafc; border-radius:4px;">
        <b>Examination Regulations & Standard:</b> 
        1. Minimum passing marks: 40% in each individual theory subject. 
        2. Letter Grades: A+ (&ge;80%), A (&ge;70%), B (&ge;60%), C (&ge;50%), D (&ge;40%), FAIL (&lt;40% or failed subject). 
        3. Top 3 ranks are awarded to passing candidates based on aggregate marks. ABS indicates candidate remained absent.
      </div>

      <div class="signature-section" style="display:flex; justify-content:space-between; margin-top:30px; text-align:center;">
        <div class="sig-box">Incharge Tabulation Cell<br><small style="font-weight:normal;">CIT Department</small></div>
        <div class="sig-box">Head of CIT Department<br><small style="font-weight:normal;">Technical College</small></div>
        <div class="sig-box">Controller of Examinations<br><small style="font-weight:normal;">Academic Authority</small></div>
      </div>
    </div>
  `, true);
}

function printCompiledResult() {
  const dsSelect = document.getElementById('adminResultDsSelect');
  const dsId = dsSelect ? dsSelect.value : null;
  if (dsId) {
    previewResultSheet(dsId);
  } else {
    window.print();
  }
}

function exportResultCSV() {
  const dsSelect = document.getElementById('adminResultDsSelect');
  if (!dsSelect) return;
  const dsId = dsSelect.value;
  const evalData = evaluateDatesheetResults(dsId);
  if (!evalData) return;

  const { ds, classId, subjects, evaluatedRows } = evalData;

  let csv = `Rank,Roll No,Student Name,Session,` + 
    subjects.map(s => `"${s.code} (${s.maxMarks || getSubjectMaxMarks(classId, s.code, ds.examType)})"`).join(',') + 
    `,Total Obtained,Max Marks,Percentage,Grade,Status\n`;

  evaluatedRows.forEach(r => {
    const marksCols = r.entries.map(e => `"${e.val}"`).join(',');
    csv += `"${r.rank}","${r.roll}","${r.name}","${r.session}",${marksCols},${r.totalObt},${r.totalMax},"${r.percentage}%","${r.grade}","${r.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `Result_${ds.classId}_${ds.title.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Roster Filter & Search State
let rosterSearchQuery = '';
let rosterSessionFilter = 'all';
let passoutsSearchQuery = '';
let passoutsSessionFilter = 'all';

// Admin: Student Rosters (Session-Wise, Annual Promotion, and Excel Import)
function renderAdminStudents(container) {
  const currentSession = appData.currentSession || "2026-2027";
  const cit1Count = (appData.students && appData.students.cit1) ? appData.students.cit1.length : 0;
  const cit2Count = (appData.students && appData.students.cit2) ? appData.students.cit2.length : 0;
  const cit3Count = (appData.students && appData.students.cit3) ? appData.students.cit3.length : 0;
  const passoutCount = appData.passouts ? appData.passouts.length : 0;

  container.innerHTML = `
    <!-- Academic Session Banner -->
    <div class="session-banner">
      <div class="session-info">
        <span style="font-size:1.25rem;">${icon('award')}</span>
        <div>
          <div style="font-size:0.8rem; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8;">Active Academic Session</div>
          <div style="display:flex; align-items:center; gap:0.5rem; margin-top:2px;">
            <span class="session-tag">${currentSession}</span>
            <span style="font-size:0.85rem; color:#cbd5e1;">(Enrolled in Department: <b>${cit1Count + cit2Count + cit3Count}</b>)</span>
          </div>
        </div>
      </div>
      <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="openSessionPromotionModal()">
          ${icon('refresh')}
          <span>Annual Session Promotion & Class Shifting</span>
        </button>
        <button class="btn btn-outline btn-sm" style="color:#ffffff; border-color:rgba(255,255,255,0.3);" onclick="exportAllDepartmentStudentsCSV()">
          ${icon('download')}
          <span>Export All Students CSV</span>
        </button>
        <button class="btn btn-outline btn-sm" style="color:#ffffff; border-color:rgba(255,255,255,0.3);" onclick="restoreDepartmentRoster()" title="Restore the 138 students from department register">
          ${icon('refresh')}
          <span>Restore Dept Register (138)</span>
        </button>
        <button class="btn btn-outline btn-sm text-danger" style="color:#ffffff; border-color:rgba(255,255,255,0.25);" onclick="clearAllDatesheetsAndMarks()">
          ${icon('trash')}
          <span>Purge Datesheets & Marks</span>
        </button>
      </div>
    </div>

    <!-- Class Selection Navigation Pills -->
    <div class="nav-pills">
      <button class="nav-pill-btn ${activeRosterClass === 'cit1' ? 'active' : ''}" onclick="switchRosterClass('cit1')">
        ${icon('users')}
        <span>CIT 1st Year (${cit1Count})</span>
      </button>
      <button class="nav-pill-btn ${activeRosterClass === 'cit2' ? 'active' : ''}" onclick="switchRosterClass('cit2')">
        ${icon('users')}
        <span>CIT 2nd Year (${cit2Count})</span>
      </button>
      <button class="nav-pill-btn ${activeRosterClass === 'cit3' ? 'active' : ''}" onclick="switchRosterClass('cit3')">
        ${icon('users')}
        <span>CIT 3rd Year (${cit3Count})</span>
      </button>
      <button class="nav-pill-btn ${activeRosterClass === 'passouts' ? 'active' : ''}" onclick="switchRosterClass('passouts')">
        ${icon('award')}
        <span>Passout / Graduated Archive (${passoutCount})</span>
      </button>
    </div>

    <div id="rosterTabContentArea"></div>
  `;

  renderActiveRosterTabContent();
}

function switchRosterClass(classKey) {
  activeRosterClass = classKey;
  rosterSearchQuery = '';
  rosterSessionFilter = 'all';
  renderAdminStudents(document.getElementById('adminTabContent'));
}

function renderActiveRosterTabContent() {
  const container = document.getElementById('rosterTabContentArea');
  if (!container) return;

  if (activeRosterClass === 'passouts') {
    renderPassoutsArchive(container);
    return;
  }

  const className = (appData.classes.find(c => c.id === activeRosterClass) || {}).name || activeRosterClass;
  const currentSession = appData.currentSession || "2026-2027";
  const students = (appData.students && appData.students[activeRosterClass]) || [];

  container.innerHTML = `
    ${activeRosterClass === 'cit1' && students.length === 0 ? `
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; padding:0.85rem 1rem; border-radius:6px; margin-bottom:1rem; font-size:0.88rem; display:flex; align-items:center; gap:0.5rem;">
        ${icon('check')}
        <span><b>Session ${currentSession} Active:</b> CIT 1st Year is empty and ready for incoming students. Import your Excel file (.xlsx) or add students using the form on the left.</span>
      </div>
    ` : ''}

    <div class="row">
      <!-- Import & Add Student Options (Left Column) -->
      <div class="col-md-5">
        <!-- Excel / File Import Card -->
        <div class="card" style="margin-bottom:1rem;">
          <div class="card-header">
            <span class="card-title">
              ${icon('upload')}
              <span>Import from Excel / CSV Sheet</span>
            </span>
          </div>
          <div class="card-body">
            <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.75rem;">
              Upload your department Excel sheet (<code>.xlsx</code>, <code>.xls</code>, <code>.csv</code>) or paste copied columns directly. Multi-column attendance registers are auto-detected.
            </p>

            <div class="form-group">
              <label class="form-label">Target Class</label>
              <select id="excelTargetClass" class="form-select form-select-sm">
                <option value="${activeRosterClass}">${className} (Current Tab)</option>
                <option value="auto">Auto-detect from Sheet Names (CIT-1st, CIT-2nd, CIT-3rd)</option>
                <option value="cit1">CIT 1st Year</option>
                <option value="cit2">CIT 2nd Year</option>
                <option value="cit3">CIT 3rd Year</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Academic Session Tag</label>
              <input type="text" id="excelStudentSession" class="form-control form-control-sm" value="${currentSession}" placeholder="e.g. 2026-2027 or 2027-28">
            </div>

            <div class="import-box" style="text-align:center;">
              <label style="cursor:pointer; display:block;">
                ${icon('upload')}
                <span style="display:block; font-weight:600; font-size:0.85rem; margin-top:0.25rem;">Upload Excel File (.xlsx, .xls, .csv)</span>
                <span style="display:block; font-size:0.75rem; color:var(--text-muted);">Click to select your department Excel file</span>
                <input type="file" id="excelFilePicker" accept=".xlsx, .xls, .csv, .txt" onchange="handleExcelFileUpload(event)" style="display:none;">
              </label>
            </div>

            <div class="form-group" style="margin-top:0.75rem;">
              <label class="form-label" style="display:flex; justify-content:space-between;">
                <span>Or Paste Directly from Excel</span>
                <small style="color:var(--text-muted);">Ctrl+C in Excel &rarr; Ctrl+V here</small>
              </label>
              <textarea id="pastedExcelText" class="form-control form-control-sm" rows="3" placeholder="Paste Roll No and Student Name from Excel here..."></textarea>
              <button type="button" class="btn btn-secondary btn-sm" style="width:100%; margin-top:0.5rem;" onclick="handlePastedExcelImport()">
                ${icon('upload')} Import Pasted Students
              </button>
            </div>
          </div>
        </div>

        <!-- Add Single Student Card -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              ${icon('plus')}
              <span>Add Individual Student</span>
            </span>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Roll Number</label>
              <input type="text" id="newStudentRoll" class="form-control form-control-sm" placeholder="e.g. 26-CIT-101">
            </div>
            <div class="form-group">
              <label class="form-label">Student Full Name</label>
              <input type="text" id="newStudentName" class="form-control form-control-sm" placeholder="e.g. Muhammad Ahmad">
            </div>
            <div class="form-group">
              <label class="form-label">Session</label>
              <input type="text" id="newStudentSession" class="form-control form-control-sm" value="${currentSession}" placeholder="e.g. 2026-2027 or 2027-28">
            </div>
            <button type="button" class="btn btn-primary btn-sm" style="width:100%;" onclick="addNewStudent()">
              ${icon('plus')} Add to ${className}
            </button>
          </div>
        </div>
      </div>

      <!-- Current Class Roster Table (Right Column) -->
      <div class="col-md-7">
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              ${icon('users')}
              <span>${className} Roster</span>
            </span>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-outline btn-sm" onclick="exportClassRosterCSV('${activeRosterClass}')">
                ${icon('download')} Export CSV
              </button>
              <button class="btn btn-outline btn-sm text-danger" onclick="clearClassRoster('${activeRosterClass}')">
                ${icon('trash')} Clear
              </button>
            </div>
          </div>
          <div class="card-body p-0" id="studentRosterTableContainer"></div>
        </div>
      </div>
    </div>
  `;

  renderStudentRosterTable();
}

function onRosterSearchChange(val) {
  rosterSearchQuery = val;
  renderStudentRosterTable();
}

function onRosterSessionFilterChange(val) {
  rosterSessionFilter = val;
  renderStudentRosterTable();
}

function renderStudentRosterTable() {
  const container = document.getElementById('studentRosterTableContainer');
  if (!container) return;

  const students = (appData.students && appData.students[activeRosterClass]) || [];

  if (students.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem 1.5rem; color:var(--text-muted);">
        <p style="font-size:1rem; font-weight:600; margin-bottom:0.25rem;">No students enrolled in this class roster yet.</p>
        <p style="font-size:0.85rem;">Upload your Excel sheet (.xlsx) or paste student columns on the left to populate this class.</p>
      </div>
    `;
    return;
  }

  // Get distinct sessions in this class
  const distinctSessions = Array.from(new Set(students.map(s => s.session || appData.currentSession || '2026-2027'))).filter(Boolean);

  // Apply filters
  let filtered = students.filter(st => {
    const sSession = st.session || appData.currentSession || '2026-2027';
    if (rosterSessionFilter !== 'all' && sSession !== rosterSessionFilter) return false;
    if (rosterSearchQuery.trim()) {
      const q = rosterSearchQuery.toLowerCase().trim();
      const matchRoll = st.roll && st.roll.toLowerCase().includes(q);
      const matchName = st.name && st.name.toLowerCase().includes(q);
      if (!matchRoll && !matchName) return false;
    }
    return true;
  });

  container.innerHTML = `
    <!-- Search and Session Filter Controls -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; padding:0.6rem 0.85rem; border-bottom:1px solid var(--border-color); background:#f8fafc;">
      <div style="flex:1; min-width:200px;">
        <input type="text" class="form-control form-control-sm" placeholder="Search by Roll No or Name..." value="${rosterSearchQuery}" oninput="onRosterSearchChange(this.value)">
      </div>
      <div style="display:flex; align-items:center; gap:0.4rem;">
        <label style="font-size:0.78rem; font-weight:600; color:var(--text-muted); margin:0;">Session:</label>
        <select class="form-select form-select-sm" style="width:auto; font-size:0.8rem;" onchange="onRosterSessionFilterChange(this.value)">
          <option value="all" ${rosterSessionFilter === 'all' ? 'selected' : ''}>All Sessions (${students.length})</option>
          ${distinctSessions.map(sess => `
            <option value="${sess}" ${rosterSessionFilter === sess ? 'selected' : ''}>${sess}</option>
          `).join('')}
        </select>
      </div>
    </div>

    ${filtered.length === 0 ? `
      <div style="text-align:center; padding:2rem; color:var(--text-muted);">
        <p style="font-size:0.9rem;">No students match the current search or session filter.</p>
      </div>
    ` : `
      <div class="table-responsive">
        <table class="table table-bordered table-sm" style="margin:0;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="width:45px; text-align:center;">#</th>
              <th style="width:115px;">Roll No</th>
              <th>Student Full Name</th>
              <th style="width:115px; text-align:center;">Session</th>
              <th style="width:85px; text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((st, idx) => `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td><b>${st.roll}</b></td>
                <td>${st.name}</td>
                <td style="text-align:center;">
                  <span class="badge" style="background:#f1f5f9; color:#0f172a; font-weight:600; font-size:0.75rem;">
                    ${st.session || appData.currentSession || '-'}
                  </span>
                </td>
                <td style="text-align:center; white-space:nowrap;">
                  <button class="btn btn-outline btn-sm" style="padding:0.15rem 0.4rem; margin-right:3px;" onclick="openEditStudentModal('${activeRosterClass}', '${st.roll}')" title="Edit Student">
                    ${icon('edit')}
                  </button>
                  <button class="btn btn-outline btn-sm text-danger" style="padding:0.15rem 0.4rem;" onclick="removeStudent('${activeRosterClass}', '${st.roll}')" title="Remove Student">
                    ${icon('trash')}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="padding:0.4rem 0.85rem; font-size:0.75rem; color:var(--text-muted); background:#f8fafc; border-top:1px solid var(--border-color); display:flex; justify-content:space-between;">
        <span>Showing <b>${filtered.length}</b> of <b>${students.length}</b> students</span>
        <span>Active Class: <b>${(appData.classes.find(c => c.id === activeRosterClass) || {}).name}</b></span>
      </div>
    `}
  `;
}

// Passout Students Archive Tab
function onPassoutsSearchChange(val) {
  passoutsSearchQuery = val;
  const container = document.getElementById('rosterTabContentArea');
  if (container) renderPassoutsArchive(container);
}

function onPassoutsSessionFilterChange(val) {
  passoutsSessionFilter = val;
  const container = document.getElementById('rosterTabContentArea');
  if (container) renderPassoutsArchive(container);
}

function renderPassoutsArchive(container) {
  const passouts = appData.passouts || [];
  const distinctSessions = Array.from(new Set(passouts.map(s => s.passoutSession))).filter(Boolean);

  let filtered = passouts.filter(st => {
    if (passoutsSessionFilter !== 'all' && st.passoutSession !== passoutsSessionFilter) return false;
    if (passoutsSearchQuery.trim()) {
      const q = passoutsSearchQuery.toLowerCase().trim();
      const matchRoll = st.roll && st.roll.toLowerCase().includes(q);
      const matchName = st.name && st.name.toLowerCase().includes(q);
      if (!matchRoll && !matchName) return false;
    }
    return true;
  });

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <span class="card-title">
            ${icon('award')}
            <span>Passout / Graduated Students Archive (${passouts.length})</span>
          </span>
          <small style="color:var(--text-muted); display:block; margin-top:2px;">
            Students who completed 3rd Year and graduated from the CIT Department
          </small>
        </div>
        ${passouts.length > 0 ? `
          <button class="btn btn-outline btn-sm" onclick="exportPassoutsCSV()">
            ${icon('download')} Export Alumni CSV
          </button>
        ` : ''}
      </div>
      <div class="card-body p-0">
        ${passouts.length === 0 ? `
          <div style="text-align:center; padding:3rem; color:var(--text-muted);">
            <p style="font-weight:600; margin-bottom:0.25rem;">No passout alumni records yet.</p>
            <p style="font-size:0.85rem;">When you execute an Annual Session Promotion, graduating 3rd Year students are archived here automatically.</p>
          </div>
        ` : `
          <!-- Search & Filter Controls -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; padding:0.6rem 0.85rem; border-bottom:1px solid var(--border-color); background:#f8fafc;">
            <div style="flex:1; min-width:200px;">
              <input type="text" class="form-control form-control-sm" placeholder="Search alumni by Roll No or Name..." value="${passoutsSearchQuery}" oninput="onPassoutsSearchChange(this.value)">
            </div>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <label style="font-size:0.78rem; font-weight:600; color:var(--text-muted); margin:0;">Graduation Session:</label>
              <select class="form-select form-select-sm" style="width:auto; font-size:0.8rem;" onchange="onPassoutsSessionFilterChange(this.value)">
                <option value="all" ${passoutsSessionFilter === 'all' ? 'selected' : ''}>All Graduation Sessions (${passouts.length})</option>
                ${distinctSessions.map(sess => `
                  <option value="${sess}" ${passoutsSessionFilter === sess ? 'selected' : ''}>${sess}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-bordered table-sm" style="margin:0;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="width:50px; text-align:center;">#</th>
                  <th style="width:115px;">Roll No</th>
                  <th>Student Full Name</th>
                  <th style="width:130px; text-align:center;">Intake Session</th>
                  <th style="width:140px; text-align:center;">Passout Session</th>
                  <th style="width:120px; text-align:center;">Graduation Date</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map((st, i) => `
                  <tr>
                    <td style="text-align:center;">${i + 1}</td>
                    <td><b>${st.roll}</b></td>
                    <td>${st.name}</td>
                    <td style="text-align:center;">${st.originalSession || '-'}</td>
                    <td style="text-align:center;"><span class="badge badge-success">${st.passoutSession}</span></td>
                    <td style="text-align:center; font-size:0.8rem;">${formatDate(st.passoutDate)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="padding:0.4rem 0.85rem; font-size:0.75rem; color:var(--text-muted); background:#f8fafc; border-top:1px solid var(--border-color);">
            Showing <b>${filtered.length}</b> of <b>${passouts.length}</b> alumni graduates
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * 7. EXCEL / CSV PARSING & STUDENT IMPORT LOGIC (Multi-Column & Multi-Sheet)
 */
function extractStudentsFromParts(parts, targetClassId, defaultSession) {
  const results = [];
  if (!parts || parts.length === 0) return results;

  const cleaned = parts.map(p => String(p === null || p === undefined ? '' : p).trim()).filter(Boolean);
  if (cleaned.length === 0) return results;

  // 1. Check if Sr. prefixed format: [ "1", "26-CIT-101", "Muhammad Tayab Hanif" ]
  if (cleaned.length >= 3 && /^\d+$/.test(cleaned[0]) && parseInt(cleaned[0], 10) < 300) {
    if (/\d/.test(cleaned[1]) && !/^\d+$/.test(cleaned[2])) {
      results.push({
        roll: cleaned[1],
        name: cleaned[2],
        classId: targetClassId,
        session: defaultSession
      });
      return results;
    }
  }

  // 2. Scan pairs across row: (0,1), (2,3), (4,5), (6,7), (8,9)
  let i = 0;
  while (i < cleaned.length - 1) {
    const p1 = cleaned[i];
    const p2 = cleaned[i + 1];
    const p1Lower = p1.toLowerCase();

    // Skip header words
    if (['roll', 'sr', 's#', 's.no', 'name', 'reg', 'class'].some(h => p1Lower.startsWith(h))) {
      i += 2;
      continue;
    }

    // p1 looks like Roll (contains digits or 'CIT') and p2 looks like Name (not pure digits)
    if (/\d/.test(p1) && !/^\d+$/.test(p2) && p2.length >= 2) {
      results.push({
        roll: p1,
        name: p2,
        classId: targetClassId,
        session: defaultSession
      });
      i += 2;
    } else if (/\d/.test(p2) && !/^\d+$/.test(p1) && p1.length >= 2 && cleaned.length === 2) {
      // Reversed layout (Name in Col 0, Roll in Col 1)
      results.push({
        roll: p2,
        name: p1,
        classId: targetClassId,
        session: defaultSession
      });
      i += 2;
    } else {
      i += 1;
    }
  }

  return results;
}

function parsePastedStudentText(text, targetClassId, sessionTag) {
  if (!text) return 0;
  const lines = text.split('\n');
  let addedCount = 0;

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    let parts = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(',')) {
      parts = line.split(',');
    } else {
      parts = line.split(/\s{2,}|\t/);
      if (parts.length < 2) {
        const tokens = line.split(/\s+/);
        if (tokens.length >= 2) parts = [tokens[0], tokens.slice(1).join(' ')];
      }
    }

    const extracted = extractStudentsFromParts(parts, targetClassId, sessionTag);
    extracted.forEach(st => {
      const cid = (targetClassId === 'auto') ? (detectClassFromString(st.classId) || 'cit1') : targetClassId;
      appData.students[cid] = appData.students[cid] || [];
      if (!appData.students[cid].some(s => s.roll === st.roll)) {
        appData.students[cid].push({
          roll: st.roll,
          name: st.name,
          session: sessionTag || appData.currentSession || "2026-2027"
        });
        addedCount++;
      }
    });
  });

  return addedCount;
}

function handlePastedExcelImport() {
  const textarea = document.getElementById('pastedExcelText');
  const targetClass = document.getElementById('excelTargetClass').value;
  const sessionTag = (document.getElementById('excelStudentSession') || {}).value || appData.currentSession || "2026-2027";

  if (!textarea || !textarea.value.trim()) {
    showToast("Please paste students from Excel first.", true);
    return;
  }

  const added = parsePastedStudentText(textarea.value, targetClass, sessionTag);
  persistData();
  textarea.value = '';

  if (added > 0) {
    showToast(`Successfully imported ${added} students into class roster.`);
  } else {
    showToast("No new students found or duplicates were skipped.", true);
  }

  renderAdminStudents(document.getElementById('adminTabContent'));
}

function handleExcelFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const targetClass = document.getElementById('excelTargetClass').value;
  const sessionTag = (document.getElementById('excelStudentSession') || {}).value || appData.currentSession || "2026-2027";
  const fileName = file.name.toLowerCase();

  // CSV or Text File
  if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const added = parsePastedStudentText(e.target.result, targetClass, sessionTag);
      persistData();
      showToast(`Imported ${added} students from ${file.name}`);
      renderAdminStudents(document.getElementById('adminTabContent'));
    };
    reader.readAsText(file);
    return;
  }

  // Excel (.xlsx or .xls)
  if (window.XLSX) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let summary = { cit1: 0, cit2: 0, cit3: 0 };
        let totalAdded = 0;

        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          if (!rows || rows.length === 0) return;

          let sheetClass = targetClass;
          if (targetClass === 'auto') {
            sheetClass = detectClassFromString(sheetName) || 'cit1';
          }

          rows.forEach(row => {
            if (!row || row.length === 0) return;
            const extracted = extractStudentsFromParts(row, sheetClass, sessionTag);
            extracted.forEach(st => {
              const cid = (targetClass === 'auto') ? (detectClassFromString(st.classId) || sheetClass) : targetClass;
              appData.students[cid] = appData.students[cid] || [];
              if (!appData.students[cid].some(s => s.roll === st.roll)) {
                appData.students[cid].push({
                  roll: st.roll,
                  name: st.name,
                  session: st.session || sessionTag
                });
                summary[cid] = (summary[cid] || 0) + 1;
                totalAdded++;
              }
            });
          });
        });

        persistData();
        const details = [];
        if (summary.cit1 > 0) details.push(`${summary.cit1} to CIT 1st`);
        if (summary.cit2 > 0) details.push(`${summary.cit2} to CIT 2nd`);
        if (summary.cit3 > 0) details.push(`${summary.cit3} to CIT 3rd`);

        const msg = details.length > 0 
          ? `Imported ${totalAdded} students (${details.join(', ')}) from ${file.name}`
          : `No new students added from ${file.name} (all duplicates skipped).`;
        showToast(msg, totalAdded === 0);
        renderAdminStudents(document.getElementById('adminTabContent'));
      } catch (err) {
        console.error(err);
        showToast("Error reading Excel file. Try copying and pasting columns instead.", true);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    showToast("Excel library not loaded. Please copy and paste columns from Excel.", true);
  }
}

function addNewStudent() {
  const roll = document.getElementById('newStudentRoll').value.trim();
  const name = document.getElementById('newStudentName').value.trim();
  const sessionTag = (document.getElementById('newStudentSession') || {}).value || appData.currentSession || "2026-2027";

  if (!roll || !name) {
    showToast("Please enter both Roll Number and Full Name.", true);
    return;
  }

  appData.students[activeRosterClass] = appData.students[activeRosterClass] || [];
  if (appData.students[activeRosterClass].some(s => s.roll === roll)) {
    showToast(`Roll Number '${roll}' already exists in this class!`, true);
    return;
  }

  appData.students[activeRosterClass].push({
    roll: roll,
    name: name,
    session: sessionTag
  });

  persistData();
  document.getElementById('newStudentRoll').value = '';
  document.getElementById('newStudentName').value = '';
  showToast(`Added student '${name}' (${roll})`);
  renderStudentRosterTable();
}

function openEditStudentModal(classId, roll) {
  const student = (appData.students[classId] || []).find(s => s.roll === roll);
  if (!student) return;

  const existing = document.getElementById('editStudentModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'editStudentModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-dialog" style="max-width:440px;">
      <div class="modal-header">
        <h3 style="margin:0; font-size:1.1rem; font-weight:700;">Edit Student Details</h3>
        <button class="btn btn-outline btn-sm" onclick="closeEditStudentModal()">✕</button>
      </div>
      <div class="modal-body">
        <form onsubmit="handleSaveEditedStudent(event, '${classId}', '${roll}')">
          <div class="form-group">
            <label class="form-label">Roll Number</label>
            <input type="text" id="editRollInput" class="form-control" value="${student.roll}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Student Full Name</label>
            <input type="text" id="editNameInput" class="form-control" value="${student.name}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Academic Session</label>
            <input type="text" id="editSessionInput" class="form-control" value="${student.session || appData.currentSession || '2026-2027'}" required>
          </div>
          <div class="modal-footer" style="padding-top:1rem; margin-top:1rem; border-top:1px solid var(--border-color); display:flex; justify-content:flex-end; gap:0.5rem;">
            <button type="button" class="btn btn-outline btn-sm" onclick="closeEditStudentModal()">Cancel</button>
            <button type="submit" class="btn btn-primary btn-sm">${icon('check')} Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeEditStudentModal() {
  const modal = document.getElementById('editStudentModal');
  if (modal) modal.remove();
}

function handleSaveEditedStudent(e, classId, oldRoll) {
  e.preventDefault();
  const newRoll = document.getElementById('editRollInput').value.trim();
  const newName = document.getElementById('editNameInput').value.trim();
  const newSession = document.getElementById('editSessionInput').value.trim();

  if (!newRoll || !newName) {
    showToast("Roll number and name cannot be empty.", true);
    return;
  }

  const list = appData.students[classId] || [];
  const idx = list.findIndex(s => s.roll === oldRoll);
  if (idx !== -1) {
    if (newRoll !== oldRoll && list.some(s => s.roll === newRoll)) {
      showToast(`Roll number '${newRoll}' already exists in this class!`, true);
      return;
    }
    list[idx].roll = newRoll;
    list[idx].name = newName;
    list[idx].session = newSession;
    persistData();
    closeEditStudentModal();
    showToast(`Updated student '${newName}' (${newRoll}).`);
    renderStudentRosterTable();
  }
}

function removeStudent(classId, roll) {
  if (!confirm(`Remove student with Roll No ${roll}?`)) return;
  appData.students[classId] = appData.students[classId].filter(s => s.roll !== roll);
  persistData();
  showToast("Student removed.");
  renderStudentRosterTable();
}

function clearClassRoster(classId) {
  const className = (appData.classes.find(c => c.id === classId) || {}).name || classId;
  if (!confirm(`Are you sure you want to remove ALL students in ${className}?`)) return;
  appData.students[classId] = [];
  persistData();
  showToast(`${className} roster cleared.`);
  renderStudentRosterTable();
}

function exportClassRosterCSV(classId) {
  const className = (appData.classes.find(c => c.id === classId) || {}).name || classId;
  const students = appData.students[classId] || [];
  if (students.length === 0) {
    showToast("No students to export.", true);
    return;
  }

  let csv = "Sr,Roll No,Student Full Name,Academic Session\n";
  students.forEach((st, i) => {
    csv += `${i + 1},"${st.roll}","${st.name}","${st.session || appData.currentSession || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `Roster_${classId}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportAllDepartmentStudentsCSV() {
  const classes = [
    { id: 'cit1', name: 'CIT 1st Year' },
    { id: 'cit2', name: 'CIT 2nd Year' },
    { id: 'cit3', name: 'CIT 3rd Year' }
  ];

  let csv = "Sr,Class,Roll No,Student Full Name,Academic Session\n";
  let count = 0;

  classes.forEach(c => {
    const list = appData.students[c.id] || [];
    list.forEach(st => {
      count++;
      csv += `${count},"${c.name}","${st.roll}","${st.name}","${st.session || appData.currentSession || ''}"\n`;
    });
  });

  if (count === 0) {
    showToast("No students enrolled across any class.", true);
    return;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `CIT_All_Department_Students_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportPassoutsCSV() {
  const passouts = appData.passouts || [];
  if (passouts.length === 0) return;

  let csv = "Sr,Roll No,Student Full Name,Intake Session,Passout Session,Graduation Date\n";
  passouts.forEach((st, i) => {
    csv += `${i + 1},"${st.roll}","${st.name}","${st.originalSession || ''}","${st.passoutSession}","${st.passoutDate || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `CIT_Alumni_Passouts_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 8. ANNUAL SESSION PROMOTION & CLASS SHIFTING WORKFLOW
 */
function openSessionPromotionModal() {
  const existing = document.getElementById('sessionPromotionModal');
  if (existing) existing.remove();

  const currentSession = appData.currentSession || "2026-2027";
  const nextSessionDefault = calculateNextSession(currentSession);
  const cit1Count = (appData.students && appData.students.cit1) ? appData.students.cit1.length : 0;
  const cit2Count = (appData.students && appData.students.cit2) ? appData.students.cit2.length : 0;
  const cit3Count = (appData.students && appData.students.cit3) ? appData.students.cit3.length : 0;

  const modal = document.createElement('div');
  modal.id = 'sessionPromotionModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-dialog" style="max-width:560px;">
      <div class="modal-header">
        <h3 style="margin:0; font-size:1.15rem; font-weight:700; color:var(--secondary); display:flex; align-items:center; gap:0.5rem;">
          ${icon('refresh')}
          <span>Annual Session Promotion & Class Shifting</span>
        </h3>
        <button class="btn btn-outline btn-sm" onclick="closeSessionPromotionModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; padding:0.85rem; border-radius:6px; margin-bottom:1rem; font-size:0.85rem;">
          <b>Annual Promotion & Class Rollover Rule:</b><br>
          When a new academic year begins (e.g. <b>2027-28</b>), classes shift automatically:
        </div>

        <div style="display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.25rem; font-size:0.88rem;">
          <div style="background:#f8fafc; border:1px solid var(--border-color); padding:0.65rem 0.85rem; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <div><b>CIT 3rd Year</b> (${cit3Count} students)</div>
            <div style="color:var(--text-muted);">${icon('arrowRight')}</div>
            <div><span class="badge badge-success">Archived as Passout / Graduated Alumni</span></div>
          </div>

          <div style="background:#f8fafc; border:1px solid var(--border-color); padding:0.65rem 0.85rem; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <div><b>CIT 2nd Year</b> (${cit2Count} students)</div>
            <div style="color:var(--text-muted);">${icon('arrowRight')}</div>
            <div><span class="badge" style="background:#e0f2fe; color:#0369a1;">Promoted to CIT 3rd Year</span></div>
          </div>

          <div style="background:#f8fafc; border:1px solid var(--border-color); padding:0.65rem 0.85rem; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <div><b>CIT 1st Year</b> (${cit1Count} students)</div>
            <div style="color:var(--text-muted);">${icon('arrowRight')}</div>
            <div><span class="badge" style="background:#fef3c7; color:#92400e;">Promoted to CIT 2nd Year</span></div>
          </div>

          <div style="background:#f8fafc; border:1px solid var(--border-color); padding:0.65rem 0.85rem; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <div><b>New Admissions</b> (New Intake)</div>
            <div style="color:var(--text-muted);">${icon('arrowRight')}</div>
            <div><span class="badge badge-secondary">Enrolled into CIT 1st Year</span></div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label"><b>Enter New Academic Session Name</b></label>
          <input type="text" id="newSessionInput" class="form-control" value="${nextSessionDefault}" placeholder="e.g. 2027-28 or 2027-2028">
          <small style="color:var(--text-muted); font-size:0.75rem; display:block; margin-top:0.25rem;">
            Current active session: <b>${currentSession}</b>
          </small>
        </div>

        <div class="form-group" style="margin-top:1rem; padding:0.75rem; background:#fef2f2; border:1px solid #fecaca; border-radius:6px;">
          <label style="display:flex; align-items:flex-start; gap:0.5rem; font-size:0.82rem; color:#991b1b; cursor:pointer; margin:0;">
            <input type="checkbox" id="confirmPromotionCheck" style="margin-top:2px;">
            <span>I confirm that 3rd Year students will graduate to Passouts, 2nd & 1st Year will shift upward, and 1st Year will be ready for new intake.</span>
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline btn-sm" onclick="closeSessionPromotionModal()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="executeSessionPromotion()">
          ${icon('check')} Confirm & Shift Classes
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeSessionPromotionModal() {
  const modal = document.getElementById('sessionPromotionModal');
  if (modal) modal.remove();
}

function executeSessionPromotion() {
  const input = document.getElementById('newSessionInput');
  const confirmCheck = document.getElementById('confirmPromotionCheck');
  const newSession = input ? input.value.trim() : '';

  if (!newSession) {
    showToast("Please enter the new session name.", true);
    return;
  }
  if (confirmCheck && !confirmCheck.checked) {
    showToast("Please check the confirmation box before proceeding.", true);
    return;
  }

  appData.passouts = appData.passouts || [];
  const current3rdYears = appData.students.cit3 || [];
  const oldSession = appData.currentSession || "2026-2027";

  // 1. Move 3rd Year to Passouts
  current3rdYears.forEach(st => {
    appData.passouts.push({
      roll: st.roll,
      name: st.name,
      originalSession: st.session || oldSession,
      passoutSession: oldSession,
      passoutDate: new Date().toISOString().split('T')[0]
    });
  });

  // 2. Shift 2nd Year to 3rd Year
  appData.students.cit3 = (appData.students.cit2 || []).map(st => ({
    ...st,
    promotedTo: 'cit3'
  }));

  // 3. Shift 1st Year to 2nd Year
  appData.students.cit2 = (appData.students.cit1 || []).map(st => ({
    ...st,
    promotedTo: 'cit2'
  }));

  // 4. CIT 1st Year is emptied for new session intake
  appData.students.cit1 = [];

  // 5. Update session
  appData.currentSession = newSession;

  // Set active class tab to CIT 1st Year so admin can immediately add new intake
  activeRosterClass = 'cit1';

  persistData();
  closeSessionPromotionModal();
  showToast(`Annual Promotion complete! Shifted to session ${newSession}. 1st Year is ready for new enrollment.`);
  renderAdminStudents(document.getElementById('adminTabContent'));
}

function restoreDepartmentRoster() {
  if (!confirm("This will restore the 138 official CIT students from the department Excel register into CIT 1st, 2nd, and 3rd Year. Any existing marks or datesheets will not be affected. Continue?")) return;
  if (window.DEFAULT_CIT_DATA && DEFAULT_CIT_DATA.students) {
    appData.students = JSON.parse(JSON.stringify(DEFAULT_CIT_DATA.students));
    persistData();
    showToast("Restored 138 department students from the register successfully.");
    renderAdminStudents(document.getElementById('adminTabContent'));
  }
}

function clearAllDatesheetsAndMarks() {
  if (!confirm("Are you sure you want to delete all examination date sheets and entered marks? Student rosters will remain safe.")) return;
  appData.datesheets = [];
  appData.marks = {};
  persistData();
  showToast("All date sheets and marks cleared successfully.");
  if (adminActiveTab === 'datesheets') {
    renderAdminDatesheets(document.getElementById('adminTabContent'));
  } else {
    renderAdminResults(document.getElementById('adminTabContent'));
  }
}

function purgeAllDummyData() {
  if (!confirm("Are you sure you want to wipe all date sheets, marks, and student rosters to start completely clean?")) return;
  appData.datesheets = [];
  appData.marks = {};
  appData.students = { cit1: [], cit2: [], cit3: [] };
  appData.passouts = [];
  persistData();
  showToast("All lists have been emptied. Ready for your Excel sheet!");
  renderAdminStudents(document.getElementById('adminTabContent'));
}

// Admin: Settings & Passwords
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
              <label class="form-label">Teacher Password</label>
              <input type="text" id="settingTeacherPass" class="form-control" value="${appData.passwords ? appData.passwords.teacher : 'teacher123'}">
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

      <!-- Backup & Restore -->
      <div class="col-md-6">
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
        renderApp();
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
  appData = JSON.parse(JSON.stringify(DEFAULT_CIT_DATA));
  persistData();
  showToast("System reset to clean default.");
  renderApp();
}

/**
 * 9. SUBJECT TEACHER PORTAL
 */
function setTeacherTab(tab) {
  teacherActiveTab = tab;
  renderApp();
}

function renderTeacherPortal(container) {
  container.innerHTML = `
    <div class="sub-nav no-print">
      <button class="sub-nav-btn ${teacherActiveTab === 'marks' ? 'active' : ''}" onclick="setTeacherTab('marks')">
        ${icon('edit')}
        <span>Enter Subject Marks</span>
      </button>
      <button class="sub-nav-btn ${teacherActiveTab === 'result_pdf' ? 'active' : ''}" onclick="setTeacherTab('result_pdf')">
        ${icon('award')}
        <span>Download Result PDF (for WhatsApp)</span>
      </button>
      <button class="sub-nav-btn ${teacherActiveTab === 'datesheet_pdf' ? 'active' : ''}" onclick="setTeacherTab('datesheet_pdf')">
        ${icon('calendar')}
        <span>Download Date Sheet PDF</span>
      </button>
    </div>

    <div id="teacherTabContent"></div>
  `;

  const tabContent = document.getElementById('teacherTabContent');
  if (teacherActiveTab === 'marks') {
    renderTeacherMarksEntry(tabContent);
  } else if (teacherActiveTab === 'result_pdf') {
    renderTeacherResultPdfDownload(tabContent);
  } else {
    renderTeacherDatesheetPdfDownload(tabContent);
  }
}

// Teacher Tab 1: Marks Entry
function renderTeacherMarksEntry(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          ${icon('edit')}
          <span>Subject Teacher &mdash; Marks Entry</span>
        </span>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Step 1: Select Class</label>
              <select id="teacherClassSelect" class="form-select" onchange="onTeacherClassChange()">
                <option value="cit1">CIT 1st Year</option>
                <option value="cit2">CIT 2nd Year</option>
                <option value="cit3">CIT 3rd Year</option>
              </select>
            </div>
          </div>

          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Step 2: Select Examination</label>
              <select id="teacherAssessmentSelect" class="form-select" onchange="onTeacherAssessmentChange()">
                <!-- Populated automatically -->
              </select>
            </div>
          </div>

          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Step 3: Select Your Subject</label>
              <select id="teacherSubjectSelect" class="form-select" onchange="renderTeacherMarksEntryTable()">
                <!-- Populated automatically -->
              </select>
            </div>
          </div>
        </div>

        <div id="teacherMarksSheetArea" style="margin-top:1rem;"></div>
      </div>
    </div>
  `;

  onTeacherClassChange();
}

function onTeacherClassChange() {
  const classId = document.getElementById('teacherClassSelect').value;
  const datesheets = (appData.datesheets || []).filter(d => d.classId === classId);
  const asmSelect = document.getElementById('teacherAssessmentSelect');

  if (datesheets.length === 0) {
    asmSelect.innerHTML = `<option value="">-- No Date Sheets Scheduled for this Class --</option>`;
    document.getElementById('teacherSubjectSelect').innerHTML = `<option value="">-- Select Date Sheet First --</option>`;
    document.getElementById('teacherMarksSheetArea').innerHTML = `
      <div style="background:#fef3c7; color:#92400e; padding:1.25rem; border-radius:6px; border:1px solid #fde68a; font-size:0.9rem;">
        The administrator has not created any examination date sheets for this class yet.
        Once created, the assessment will appear here automatically for marks entry.
      </div>
    `;
    return;
  }

  asmSelect.innerHTML = datesheets.map(ds => `
    <option value="${ds.id}">${ds.title} (${ds.examTypeName || 'Test'})</option>
  `).join('');

  onTeacherAssessmentChange();
}

function onTeacherAssessmentChange() {
  const dsId = document.getElementById('teacherAssessmentSelect').value;
  const ds = (appData.datesheets || []).find(d => d.id === dsId);
  const subSelect = document.getElementById('teacherSubjectSelect');

  if (!ds || !ds.items || ds.items.length === 0) {
    subSelect.innerHTML = `<option value="">-- No subjects in this assessment --</option>`;
    document.getElementById('teacherMarksSheetArea').innerHTML = '';
    return;
  }

  subSelect.innerHTML = ds.items.map(s => {
    const maxM = s.maxMarks || getSubjectMaxMarks(ds.classId, s.code, ds.examType);
    return `<option value="${s.code}">${s.code} &mdash; ${s.title} (${maxM} Marks)</option>`;
  }).join('');

  renderTeacherMarksEntryTable();
}

function renderTeacherMarksEntryTable() {
  const classId = document.getElementById('teacherClassSelect').value;
  const dsId = document.getElementById('teacherAssessmentSelect').value;
  const subCode = document.getElementById('teacherSubjectSelect').value;
  const container = document.getElementById('teacherMarksSheetArea');

  const ds = (appData.datesheets || []).find(d => d.id === dsId);
  if (!ds || !subCode) {
    container.innerHTML = '';
    return;
  }

  const subObj = ds.items.find(s => s.code === subCode) || {};
  const students = appData.students[classId] || [];

  if (students.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2.5rem; background:#f8fafc; border:1px solid var(--border-color); border-radius:6px; color:var(--text-muted);">
        No students enrolled in this class roster yet. Please ask the administrator to add students.
      </div>
    `;
    return;
  }

  const maxMarks = subObj.maxMarks || getSubjectMaxMarks(classId, subCode, ds.examType);
  const existingMarks = (appData.marks && appData.marks[dsId] && appData.marks[dsId][subCode]) || {};

  container.innerHTML = `
    <div style="background:#f1f5f9; padding:0.75rem 1rem; border-radius:6px; border:1px solid var(--border-color); margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
      <div>
        <h4 style="margin:0; font-weight:700; color:var(--primary);">${subCode} &mdash; ${subObj.title || subCode}</h4>
        <small style="color:var(--text-muted);">${ds.title} &bull; Maximum Theory Marks: <b style="color:var(--primary); font-size:1.05rem;">${maxMarks}</b></small>
      </div>
      <div>
        <button type="button" class="btn btn-primary" onclick="saveTeacherMarks('${dsId}', '${subCode}', ${maxMarks})">
          ${icon('check')} Save Marks Sheet
        </button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered table-sm" id="marksInputTable">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="width:50px; text-align:center;">#</th>
            <th style="width:100px;">Roll No</th>
            <th>Student Full Name</th>
            <th style="width:160px; text-align:center;">Obtained Marks (Max: ${maxMarks})</th>
            <th style="width:95px; text-align:center;">Status</th>
            <th style="width:95px; text-align:center;">Absent</th>
          </tr>
        </thead>
        <tbody>
          ${students.map((st, i) => {
            const currentVal = existingMarks[st.roll];
            const isAbsent = currentVal === 'A' || currentVal === 'a' || currentVal === 'ABS';
            return `
              <tr>
                <td style="text-align:center;">${i + 1}</td>
                <td><b>${st.roll}</b></td>
                <td>${st.name}</td>
                <td style="text-align:center;">
                  <input type="number" step="0.5" min="0" max="${maxMarks}" 
                    class="marks-input ${isAbsent ? 'absent-mode' : ''}" 
                    data-roll="${st.roll}" 
                    id="mark_${st.roll}" 
                    value="${(!isAbsent && currentVal !== undefined) ? currentVal : ''}"
                    ${isAbsent ? 'disabled placeholder="ABS"' : `placeholder="0-${maxMarks}"`}
                    onkeydown="handleMarksKeyNav(event, ${i})">
                </td>
                <td style="text-align:center;" id="status_${st.roll}">
                  ${getLiveStatusBadge(currentVal, maxMarks)}
                </td>
                <td style="text-align:center;">
                  <label style="cursor:pointer; font-size:0.8rem;">
                    <input type="checkbox" onchange="toggleStudentAbsent('${st.roll}', this.checked)" ${isAbsent ? 'checked' : ''}> Absent
                  </label>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div style="margin-top:1rem; display:flex; justify-content:flex-end;">
      <button type="button" class="btn btn-primary" onclick="saveTeacherMarks('${dsId}', '${subCode}', ${maxMarks})">
        ${icon('check')} Save Marks Sheet
      </button>
    </div>
  `;
}

function getLiveStatusBadge(val, maxMarks) {
  if (val === 'A' || val === 'a' || val === 'ABS') {
    return `<span class="badge badge-danger">ABSENT</span>`;
  }
  if (val === undefined || val === null || val === '') {
    return `<span class="badge badge-secondary">Pending</span>`;
  }
  const num = parseFloat(val);
  if (num >= maxMarks * 0.4) {
    return `<span class="badge badge-success">PASS</span>`;
  } else {
    return `<span class="badge badge-danger">FAIL</span>`;
  }
}

function toggleStudentAbsent(roll, isAbsent) {
  const input = document.getElementById(`mark_${roll}`);
  const statusCell = document.getElementById(`status_${roll}`);
  if (!input) return;

  if (isAbsent) {
    input.value = '';
    input.disabled = true;
    input.placeholder = 'ABS';
    input.classList.add('absent-mode');
    statusCell.innerHTML = `<span class="badge badge-danger">ABSENT</span>`;
  } else {
    input.disabled = false;
    input.placeholder = '0';
    input.classList.remove('absent-mode');
    statusCell.innerHTML = `<span class="badge badge-secondary">Pending</span>`;
    input.focus();
  }
}

function handleMarksKeyNav(e, index) {
  const inputs = Array.from(document.querySelectorAll('#marksInputTable .marks-input:not(:disabled)'));
  const currentIndex = inputs.indexOf(e.target);

  if (e.key === 'Enter' || e.key === 'ArrowDown') {
    e.preventDefault();
    if (currentIndex + 1 < inputs.length) {
      inputs[currentIndex + 1].focus();
      inputs[currentIndex + 1].select();
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (currentIndex - 1 >= 0) {
      inputs[currentIndex - 1].focus();
      inputs[currentIndex - 1].select();
    }
  }
}

function saveTeacherMarks(dsId, subCode, maxMarks) {
  appData.marks = appData.marks || {};
  appData.marks[dsId] = appData.marks[dsId] || {};
  appData.marks[dsId][subCode] = appData.marks[dsId][subCode] || {};

  let hasError = false;
  let enteredCount = 0;

  document.querySelectorAll('#marksInputTable tbody tr').forEach(row => {
    const input = row.querySelector('.marks-input');
    const absentCheckbox = row.querySelector('input[type="checkbox"]');
    if (!input) return;

    const roll = input.dataset.roll;

    if (absentCheckbox && absentCheckbox.checked) {
      appData.marks[dsId][subCode][roll] = 'ABS';
      enteredCount++;
    } else {
      const val = input.value.trim();
      if (val !== '') {
        const num = parseFloat(val);
        if (num < 0 || num > maxMarks) {
          showToast(`Roll ${roll}: Marks cannot exceed maximum marks (${maxMarks})!`, true);
          hasError = true;
          input.focus();
          return;
        }
        appData.marks[dsId][subCode][roll] = num;
        enteredCount++;
      } else {
        delete appData.marks[dsId][subCode][roll];
      }
    }
  });

  if (hasError) return;

  persistData();
  showToast(`Marks saved for ${subCode} (${enteredCount} students)`);
  renderTeacherMarksEntryTable();
}

// Teacher Tab 2: Download / Print Result PDF (to share on WhatsApp)
function renderTeacherResultPdfDownload(container) {
  const datesheets = appData.datesheets || [];

  container.innerHTML = `
    <div class="card no-print">
      <div class="card-header">
        <span class="card-title">
          ${icon('share')}
          <span>Download Result PDF to Share with Students</span>
        </span>
      </div>
      <div class="card-body">
        <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1rem;">
          Select an assessment to preview and print or save the complete official Result Sheet as a PDF file, which you can easily share with your students via WhatsApp or other channels.
        </p>

        <div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">
          <select id="teacherResultSelect" class="form-select" style="max-width:380px;" onchange="loadTeacherResultPreview()">
            ${datesheets.length === 0 ? '<option value="">-- No Date Sheets Available --</option>' : ''}
            ${datesheets.map(ds => {
              const className = (appData.classes.find(c => c.id === ds.classId) || {}).name;
              return `<option value="${ds.id}">${ds.title} (${className})</option>`;
            }).join('')}
          </select>
          <button class="btn btn-primary" onclick="printTeacherResult()">
            ${icon('printer')}
            <span>Print / Save as PDF (Landscape)</span>
          </button>
        </div>
      </div>
    </div>

    <div id="teacherResultPreviewArea"></div>
  `;

  loadTeacherResultPreview();
}

function loadTeacherResultPreview() {
  const select = document.getElementById('teacherResultSelect');
  const container = document.getElementById('teacherResultPreviewArea');
  if (!select || !container) return;

  const dsId = select.value;
  const evalData = evaluateDatesheetResults(dsId);

  if (!evalData) {
    container.innerHTML = '';
    return;
  }

  const { ds, className, students, totalExamMax, passRate, passedCount, failedCount } = evalData;

  container.innerHTML = `
    <div class="card printable-result-card" id="printableResultSheet">
      <div class="print-only-header">
        <h2>${appData.institution.name}</h2>
        <h3>${appData.institution.department}</h3>
        <p>${appData.institution.subtitle} &bull; ${appData.institution.city}</p>
      </div>

      <div class="card-header">
        <div>
          <h3 style="margin:0; font-size:1.15rem; font-weight:bold; color:var(--primary);">${ds.title} &mdash; Official Result Sheet</h3>
          <p style="margin:0; font-size:0.85rem; color:var(--text-muted);">
            Class: <b>${className}</b> &bull; Academic Session: <b>${ds.session}</b> &bull; Total Marks: <b>${totalExamMax}</b>
          </p>
        </div>
        <div class="no-print" style="display:flex; gap:0.5rem; align-items:center;">
          <span class="badge badge-success">Pass Rate: ${passRate}%</span>
          <span class="badge" style="background:#e0f2fe; color:#0369a1;">Passed: ${passedCount}</span>
          <span class="badge badge-danger">Failed: ${failedCount}</span>
          <button class="btn btn-primary btn-sm" onclick="previewResultSheet('${ds.id}')">
            ${icon('printer')} <span>Print / PDF Preview</span>
          </button>
        </div>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive">
          ${buildResultTableHtml(evalData, false)}
        </div>
      </div>

      <div class="signature-section" style="display:none;">
        <div class="sig-box">Subject Teacher<br><small>CIT Department</small></div>
        <div class="sig-box">Head of CIT Department<br><small>Technical College</small></div>
      </div>
    </div>
  `;
}

function printTeacherResult() {
  const sel = document.getElementById('teacherResultSelect');
  const dsId = sel ? sel.value : null;
  if (dsId) {
    previewResultSheet(dsId);
  } else {
    window.print();
  }
}

// Teacher Tab 3: Download / Print Date Sheet PDF
function renderTeacherDatesheetPdfDownload(container) {
  const datesheets = appData.datesheets || [];

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          ${icon('calendar')}
          <span>Download & Print Date Sheets (for WhatsApp)</span>
        </span>
      </div>
      <div class="card-body">
        <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.5rem;">
          Click "Print / Save PDF" on any date sheet below to save it as a PDF or print it to share with students on WhatsApp or noticeboards.
        </p>

        ${datesheets.length === 0 ? '<p style="text-align:center; color:var(--text-muted); padding:2rem;">No date sheets published yet.</p>' : ''}
        ${datesheets.map(ds => {
          const className = (appData.classes.find(c => c.id === ds.classId) || {}).name || ds.classId;
          const isMonthly = (ds.examType === 'monthly');

          return `
            <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem; margin-bottom: 1.25rem; background: #fff;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom: 0.75rem;">
                <div>
                  <h4 style="margin:0; font-weight:700; color:var(--primary);">${ds.title}</h4>
                  <small style="color:var(--text-muted);">${className} &bull; ${ds.session} &bull; ${ds.items.length} Theory Subjects</small>
                </div>
                <button class="btn btn-primary btn-sm no-print" onclick="previewDatesheet('${ds.id}')">
                  ${icon('printer')} Print / Save PDF
                </button>
              </div>

              <table class="table table-sm table-bordered">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="width:40px;">#</th>
                    <th style="width:110px;">Code</th>
                    <th>Subject</th>
                    <th style="width:85px; text-align:center;">Marks</th>
                    <th style="width:120px;">Exam Date</th>
                    <th style="width:105px; text-align:center;">Day</th>
                    ${!isMonthly ? '<th style="width:90px;">Time</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${ds.items.map((it, idx) => {
                    const maxM = it.maxMarks || getSubjectMaxMarks(ds.classId, it.code, ds.examType);
                    const dayStr = it.day || getDayNameFromDate(it.date);
                    return `
                      <tr>
                        <td>${idx + 1}</td>
                        <td><b>${it.code}</b></td>
                        <td>${it.title}</td>
                        <td style="text-align:center;"><b>${maxM}</b></td>
                        <td>${formatDate(it.date)}</td>
                        <td style="text-align:center;">
                          <span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:600;">${dayStr}</span>
                        </td>
                        ${!isMonthly ? `<td>${it.time || '-'}</td>` : ''}
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * 10. Print Modal & Utility Functions
 */
function closePrintModal() {
  const existing = document.getElementById('printModalWrapper');
  if (existing) existing.remove();
  document.body.classList.remove('print-modal-open');
}

function createPrintModal(innerContent, isWide = false) {
  closePrintModal();
  document.body.classList.add('print-modal-open');

  const wrapper = document.createElement('div');
  wrapper.id = 'printModalWrapper';
  wrapper.style.position = 'fixed';
  wrapper.style.inset = '0';
  wrapper.style.backgroundColor = 'rgba(0,0,0,0.65)';
  wrapper.style.zIndex = '1000';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.style.padding = '0.75rem';

  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) closePrintModal();
  });

  const maxWidthStyle = isWide ? 'max-width: 96vw; width: 96vw;' : 'max-width: 880px; width: 100%;';
  const printButtonLabel = isWide ? 'Print / Save as PDF (Landscape)' : 'Print / Save as PDF';

  wrapper.innerHTML = `
    <div style="background:#ffffff; border-radius:8px; ${maxWidthStyle} max-height:94vh; overflow-y:auto; padding:${isWide ? '1.25rem' : '2rem'}; box-shadow:0 10px 25px rgba(0,0,0,0.3); position:relative;">
      <div class="no-print" style="display:flex; justify-content:space-between; margin-bottom:1.25rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; align-items:center;">
        <button class="btn btn-primary" onclick="window.print()">
          ${icon('printer')} <span>${printButtonLabel}</span>
        </button>
        <button class="btn btn-secondary" onclick="closePrintModal()">
          Close
        </button>
      </div>

      <div id="printDocContent">
        ${innerContent}
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
