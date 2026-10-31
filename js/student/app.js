/**
 * CIT Result Management System - Student Portal Dedicated Controller
 * Powers the dedicated /students route (cit.gctbhakkar.edu.pk/students).
 * Supports direct URL parameters (?roll=24-CIT-101&category=monthly&tab=results).
 */

// Global role for student portal
authRole = 'student';
var studentPortalMode = 'search'; // 'search' or 'noticeboard'

function renderStudentHeaderAuth() {
  const container = document.getElementById('headerAuthArea');
  if (!container) return;

  if (authStudent) {
    const roleLabel = `${authStudent.name} (${authStudent.roll})`;
    const roleShort = authStudent.roll;
    container.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.4rem;">
        <div class="user-badge-header" title="${escapeHtml(authStudent.name)} (${escapeHtml(authStudent.className || 'Student')})">
          ${icon('award')}
          <span class="user-role-full">${escapeHtml(roleLabel)}</span>
          <span class="user-role-short">${escapeHtml(roleShort)}</span>
        </div>
        <button class="btn btn-outline btn-sm logout-btn" style="color:#ffffff; border-color:rgba(255,255,255,0.3);" onclick="handleStudentLogout()" title="Exit Student Portal">
          ${icon('logout')}
          <span class="logout-btn-text">Exit</span>
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <a href="../index.html" class="btn btn-outline btn-sm" style="color:#ffffff; border-color:rgba(255,255,255,0.3); text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem;" title="Sign in as Teacher or Administrator">
        ${icon('user')}
        <span>Faculty Login</span>
      </a>
    `;
  }
}

function handleStudentLogout() {
  authRole = null;
  authStudent = null;
  sessionStorage.removeItem('cit_auth_role');
  sessionStorage.removeItem('cit_auth_student');
  studentPortalMode = 'search';
  // Clear any roll from URL search query without page reload
  if (window.history && window.history.replaceState) {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
  showToast("Logged out from Student Portal.");
  renderStudentPortalApp();
}

function setStudentPortalMode(mode) {
  studentPortalMode = mode;
  renderStudentPortalApp();
}

function setRollPrefix(prefix) {
  const input = document.getElementById('dedicatedRollInput');
  if (input) {
    input.value = prefix;
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }
}

function renderStudentPortalLanding(container) {
  container.innerHTML = `
    <!-- Top Portal Mode Selector Navigation -->
    <div class="student-portal-mode-nav no-print" style="max-width:520px; margin:0 auto 1.5rem; display:flex; background:#e2e8f0; padding:4px; border-radius:10px; gap:6px;">
      <button type="button" class="btn btn-sm ${studentPortalMode === 'search' ? 'btn-primary' : 'btn-outline'}" style="flex:1; padding:0.65rem 0.5rem; font-weight:700; font-size:0.88rem; display:flex; align-items:center; justify-content:center; gap:0.45rem;" onclick="setStudentPortalMode('search')">
        ${icon('search')}
        <span>Check Exam Results</span>
      </button>
      <button type="button" class="btn btn-sm ${studentPortalMode === 'noticeboard' ? 'btn-primary' : 'btn-outline'}" style="flex:1; padding:0.65rem 0.5rem; font-weight:700; font-size:0.88rem; display:flex; align-items:center; justify-content:center; gap:0.45rem;" onclick="setStudentPortalMode('noticeboard')">
        ${icon('calendar')}
        <span>Date Sheets & Notice Board</span>
      </button>
    </div>

    <!-- Student Search Card -->
    <div class="card" style="max-width:520px; margin:0 auto 2rem; box-shadow:0 6px 20px rgba(0,0,0,0.06); border-radius:12px; overflow:hidden;">
      <div class="card-header" style="background:#0f172a; padding:1.75rem 1.5rem; text-align:center; color:#ffffff; border-bottom:3px solid var(--primary);">
        <div style="display:flex; justify-content:center; margin-bottom:0.75rem;">
          <div class="brand-badge" style="width:52px; height:52px; font-size:1.45rem; box-shadow:0 3px 10px rgba(0,0,0,0.3);">CIT</div>
        </div>
        <h2 style="margin:0; font-size:1.3rem; font-weight:800; letter-spacing:-0.01em;">Student Result Portal</h2>
        <p style="margin:6px 0 0; font-size:0.82rem; color:#94a3b8;">
          Government College of Technology, Bhakkar &bull; Examination Cell
        </p>
      </div>

      <div class="login-body" style="padding:1.75rem 1.5rem;">
        <form onsubmit="handleDedicatedStudentSearch(event)">
          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label" for="dedicatedRollInput" style="font-weight:700; font-size:0.88rem;">
              ${icon('user')}
              <span>College Roll Number *</span>
            </label>
            <input type="text" id="dedicatedRollInput" class="form-control" style="font-size:1rem; padding:0.65rem 0.85rem; font-weight:600; font-family:'JetBrains Mono', monospace;" placeholder="e.g. 24-CIT-101 or 26-CIT-101" required autofocus autocomplete="off">
            
            <!-- Quick Roll Prefix Helper Chips -->
            <div style="margin-top:0.45rem;">
              <small style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">
                Must include year prefix (Year-CIT-Roll):
              </small>
              <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                <button type="button" class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:0.2rem 0.55rem; font-weight:600;" onclick="setRollPrefix('24-CIT-')">
                  3rd Year: 24-CIT-xxx
                </button>
                <button type="button" class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:0.2rem 0.55rem; font-weight:600;" onclick="setRollPrefix('25-CIT-')">
                  2nd Year: 25-CIT-xxx
                </button>
                <button type="button" class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:0.2rem 0.55rem; font-weight:600;" onclick="setRollPrefix('26-CIT-')">
                  1st Year: 26-CIT-xxx
                </button>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-md-6">
              <div class="form-group" style="margin-bottom:1.15rem;">
                <label class="form-label" for="dedicatedClassSelect" style="font-weight:600; font-size:0.82rem;">Class (Optional)</label>
                <select id="dedicatedClassSelect" class="form-select form-select-sm" style="padding:0.5rem 0.65rem;">
                  <option value="">Auto-Detect from Roll</option>
                  <option value="cit3">CIT 3rd Year (Session 2024-2025)</option>
                  <option value="cit2">CIT 2nd Year (Session 2025-2026)</option>
                  <option value="cit1">CIT 1st Year (Session 2026-2027)</option>
                </select>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group" style="margin-bottom:1.15rem;">
                <label class="form-label" for="dedicatedCategorySelect" style="font-weight:600; font-size:0.82rem;">Exam Assessment</label>
                <select id="dedicatedCategorySelect" class="form-select form-select-sm" style="padding:0.5rem 0.65rem;">
                  <option value="all">All Examinations</option>
                  <option value="monthly">Monthly Tests (20 Marks)</option>
                  <option value="midterm">Mid-Term Examinations</option>
                  <option value="sendup">Send-Up Examinations</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%; padding:0.8rem; font-size:0.98rem; font-weight:700; margin-top:0.5rem; display:flex; align-items:center; justify-content:center; gap:0.5rem; box-shadow:0 3px 10px rgba(27,94,32,0.25);">
            ${icon('search')}
            <span>View My Result & Dashboard</span>
          </button>
        </form>

        <div style="margin-top:1.5rem; padding-top:1.15rem; border-top:1px dashed #e2e8f0; text-align:center;">
          <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.6rem;">
            Want to see upcoming exam timetables first?
          </div>
          <button type="button" class="btn btn-outline btn-sm" style="font-size:0.85rem; font-weight:600; width:100%; padding:0.55rem;" onclick="setStudentPortalMode('noticeboard')">
            ${icon('calendar')} <span>Open Examination Date Sheets (Notice Board)</span>
          </button>
          
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:1rem;">
            Faculty or Administrator? <a href="../index.html" style="color:var(--primary); font-weight:700; text-decoration:none;">Teacher / Admin Sign In &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function handleDedicatedStudentSearch(event) {
  if (event) event.preventDefault();

  const rollInput = document.getElementById('dedicatedRollInput');
  const classSelect = document.getElementById('dedicatedClassSelect');
  const catSelect = document.getElementById('dedicatedCategorySelect');

  const rollVal = rollInput ? rollInput.value.trim() : '';
  const classVal = classSelect ? classSelect.value : '';
  const catVal = catSelect ? catSelect.value : 'all';

  if (!rollVal) {
    showToast("Please enter your College Roll Number.", true);
    if (rollInput) rollInput.focus();
    return;
  }

  const found = findStudentByRoll(rollVal, classVal);

  if (!found) {
    showToast(`Roll Number "${rollVal}" was not found in our student records. Please enter your full roll number (e.g. 24-CIT-101 for 3rd Year or 26-CIT-101 for 1st Year).`, true);
    if (rollInput) rollInput.focus();
    return;
  }

  if (found.ambiguous) {
    showToast(found.message, true);
    const clSelect = document.getElementById('dedicatedClassSelect');
    if (clSelect) clSelect.focus();
    return;
  }

  authRole = 'student';
  authStudent = found;
  sessionStorage.setItem('cit_auth_role', 'student');
  sessionStorage.setItem('cit_auth_student', JSON.stringify(found));

  if (catVal) selectedStudentCategory = catVal;
  studentActiveTab = 'results';

  // Update browser URL query without reload for easy bookmarking / sharing
  if (window.history && window.history.replaceState) {
    const cleanUrl = `${window.location.pathname}?roll=${encodeURIComponent(found.roll)}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  showToast(`Welcome, ${found.name}! Loading results...`);
  renderStudentPortalApp();
}

function viewNoticeboardDirectly() {
  setStudentPortalMode('noticeboard');
}

function renderPublicNoticeboard(container) {
  container.innerHTML = `
    <!-- Top Portal Mode Selector Navigation -->
    <div class="student-portal-mode-nav no-print" style="max-width:520px; margin:0 auto 1.5rem; display:flex; background:#e2e8f0; padding:4px; border-radius:10px; gap:6px;">
      <button type="button" class="btn btn-sm ${studentPortalMode === 'search' ? 'btn-primary' : 'btn-outline'}" style="flex:1; padding:0.65rem 0.5rem; font-weight:700; font-size:0.88rem; display:flex; align-items:center; justify-content:center; gap:0.45rem;" onclick="setStudentPortalMode('search')">
        ${icon('search')}
        <span>Check Exam Results</span>
      </button>
      <button type="button" class="btn btn-sm ${studentPortalMode === 'noticeboard' ? 'btn-primary' : 'btn-outline'}" style="flex:1; padding:0.65rem 0.5rem; font-weight:700; font-size:0.88rem; display:flex; align-items:center; justify-content:center; gap:0.45rem;" onclick="setStudentPortalMode('noticeboard')">
        ${icon('calendar')}
        <span>Date Sheets & Notice Board</span>
      </button>
    </div>

    <div id="noticeboardPublicArea"></div>
  `;

  const nbArea = document.getElementById('noticeboardPublicArea');
  if (nbArea && typeof renderStudentNoticeboard === 'function') {
    renderStudentNoticeboard(nbArea, true);
  }
}

function renderStudentPortalApp() {
  renderStudentHeaderAuth();
  const container = document.getElementById('mainContentArea');
  if (!container || !appData) return;

  if (authStudent) {
    renderStudentPortal(container);
  } else if (studentPortalMode === 'noticeboard') {
    renderPublicNoticeboard(container);
  } else {
    renderStudentPortalLanding(container);
  }
}

// Global bootstrap for student portal
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof loadInitialData === 'function') {
    await loadInitialData();
  }

  // Check URL search parameters (?roll=...)
  if (window.location && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const urlRoll = params.get('roll');
    const urlCat = params.get('category');
    const urlTab = params.get('tab');
    const urlMode = params.get('mode');

    if (urlMode === 'noticeboard') {
      studentPortalMode = 'noticeboard';
    }

    if (urlRoll) {
      const student = findStudentByRoll(urlRoll);
      if (student && !student.ambiguous) {
        authRole = 'student';
        authStudent = student;
        sessionStorage.setItem('cit_auth_role', 'student');
        sessionStorage.setItem('cit_auth_student', JSON.stringify(student));
        if (urlCat) selectedStudentCategory = urlCat;
        if (urlTab) studentActiveTab = urlTab;
      }
    }
  }

  renderStudentPortalApp();
});

// Exports
window.studentPortalMode = studentPortalMode;
window.setStudentPortalMode = setStudentPortalMode;
window.setRollPrefix = setRollPrefix;
window.renderStudentPortalApp = renderStudentPortalApp;
window.renderPublicNoticeboard = renderPublicNoticeboard;
window.renderStudentPortalLanding = renderStudentPortalLanding;
window.handleStudentLogout = handleStudentLogout;
window.handleDedicatedStudentSearch = handleDedicatedStudentSearch;
window.viewNoticeboardDirectly = viewNoticeboardDirectly;
