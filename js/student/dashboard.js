/**
 * CIT Result Management System - Student Portal Dashboard
 * Coordinates the student self-service experience: results lookup, performance diagnosis,
 * and exam date sheet notice board.
 */

function setStudentTab(tab) {
  studentActiveTab = tab;
  const contentArea = document.getElementById('studentTabContent');
  if (contentArea) {
    // Update active class on tab buttons
    document.querySelectorAll('.student-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    if (tab === 'results') {
      if (typeof renderStudentResultsTab === 'function') renderStudentResultsTab(contentArea);
    } else if (tab === 'diagnostics') {
      if (typeof renderStudentDiagnosticsTab === 'function') renderStudentDiagnosticsTab(contentArea);
    } else if (tab === 'noticeboard') {
      if (typeof renderStudentNoticeboard === 'function') renderStudentNoticeboard(contentArea);
    }
  } else {
    if (typeof renderStudentPortalApp === 'function') {
      renderStudentPortalApp();
    } else if (typeof renderApp === 'function') {
      renderApp();
    }
  }
}

function renderStudentPortal(container) {
  if (!authStudent) {
    if (typeof renderStudentPortalLanding === 'function') {
      renderStudentPortalLanding(container);
    }
    return;
  }

  const student = authStudent;
  const isPassout = Boolean(student.isPassout);

  container.innerHTML = `
    <!-- Student Profile Header Banner -->
    <div class="student-profile-banner">
      <div class="student-profile-info">
        <div class="student-avatar-badge">
          ${icon('award')}
        </div>
        <div>
          <div style="font-size:0.78rem; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8;">Student Profile</div>
          <h3 style="margin:2px 0 0; font-size:1.25rem; font-weight:700; color:#ffffff;">
            ${escapeHtml(student.name)}
          </h3>
          <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap; margin-top:4px; font-size:0.85rem; color:#cbd5e1;">
            <span>Roll No: <b style="color:#ffffff;">${escapeHtml(student.roll)}</b></span>
            &bull;
            <span>Class: <b style="color:#ffffff;">${escapeHtml(student.className)}</b></span>
            &bull;
            <span>Session: <b style="color:#ffffff;">${escapeHtml(student.session)}</b></span>
            ${isPassout ? '<span class="badge badge-success" style="font-size:0.72rem;">ALUMNI / PASSOUT</span>' : ''}
          </div>
        </div>
      </div>
      <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" style="color:#ffffff; border-color:rgba(255,255,255,0.3);" onclick="promptSwitchStudentRoll()">
          ${icon('refresh')} Check Another Roll No
        </button>
      </div>
    </div>

    <!-- Student Portal Navigation Pills -->
    <div class="sub-nav no-print" style="margin-bottom:1.25rem;">
      <button class="sub-nav-btn student-nav-btn ${studentActiveTab === 'results' ? 'active' : ''}" data-tab="results" onclick="setStudentTab('results')">
        ${icon('fileText')}
        <span>My Exam Results & Result Card</span>
      </button>
      <button class="sub-nav-btn student-nav-btn ${studentActiveTab === 'diagnostics' ? 'active' : ''}" data-tab="diagnostics" onclick="setStudentTab('diagnostics')">
        ${icon('trendingUp')}
        <span>Progress & Weak Subject Analysis</span>
      </button>
      <button class="sub-nav-btn student-nav-btn ${studentActiveTab === 'noticeboard' ? 'active' : ''}" data-tab="noticeboard" onclick="setStudentTab('noticeboard')">
        ${icon('calendar')}
        <span>Date Sheets & Notice Board</span>
      </button>
    </div>

    <div id="studentTabContent"></div>
  `;

  const contentArea = document.getElementById('studentTabContent');
  if (contentArea) {
    if (studentActiveTab === 'results') {
      if (typeof renderStudentResultsTab === 'function') renderStudentResultsTab(contentArea);
    } else if (studentActiveTab === 'diagnostics') {
      if (typeof renderStudentDiagnosticsTab === 'function') renderStudentDiagnosticsTab(contentArea);
    } else if (studentActiveTab === 'noticeboard') {
      if (typeof renderStudentNoticeboard === 'function') renderStudentNoticeboard(contentArea);
    }
  }
}

function promptSwitchStudentRoll() {
  const newRoll = prompt("Enter full Roll Number (e.g. 24-CIT-101 for 3rd Year or 26-CIT-101 for 1st Year):");
  if (!newRoll) return;

  const found = findStudentByRoll(newRoll);
  if (!found) {
    showToast(`Roll Number "${newRoll}" not found in current department registers.`, true);
    return;
  }
  if (found.ambiguous) {
    showToast(found.message, true);
    return;
  }

  authRole = 'student';
  authStudent = found;
  sessionStorage.setItem('cit_auth_role', 'student');
  sessionStorage.setItem('cit_auth_student', JSON.stringify(found));
  if (window.history && window.history.replaceState) {
    const cleanUrl = `${window.location.pathname}?roll=${encodeURIComponent(found.roll)}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }
  showToast(`Loaded dashboard for ${found.name} (${found.roll})`);
  if (typeof renderStudentPortalApp === 'function') {
    renderStudentPortalApp();
  } else if (typeof renderApp === 'function') {
    renderApp();
  }
}

// Global exports
window.renderStudentPortal = renderStudentPortal;
window.setStudentTab = setStudentTab;
window.promptSwitchStudentRoll = promptSwitchStudentRoll;
