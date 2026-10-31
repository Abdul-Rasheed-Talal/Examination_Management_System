/**
 * CIT Result Management System - Application Entry & Controller
 * Coordinates authentication state, tab navigation, sub-module rendering, and background synchronization.
 */

// Tab state
let adminActiveTab = 'datesheets';
let teacherActiveTab = 'marks';

/**
 * Set active Administrator tab and re-render
 * @param {string} tab - Tab key: 'datesheets' | 'results' | 'students' | 'teachers' | 'marks' | 'requests' | 'settings'
 */
function setAdminTab(tab) {
  adminActiveTab = tab;
  renderApp();
}

/**
 * Render Administrator Portal & Sub-navigation
 * @param {HTMLElement} container
 */
function renderAdminPortal(container) {
  const pendingRequestsCount = (appData.editRequests || []).filter(r => r.status === 'pending').length;

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
      <button class="sub-nav-btn ${adminActiveTab === 'teachers' ? 'active' : ''}" onclick="setAdminTab('teachers')">
        ${icon('user')}
        <span>Teachers & Assignments</span>
      </button>
      <button class="sub-nav-btn ${adminActiveTab === 'marks' ? 'active' : ''}" onclick="setAdminTab('marks')">
        ${icon('edit')}
        <span>Enter Marks (All Access)</span>
      </button>
      <button class="sub-nav-btn ${adminActiveTab === 'requests' ? 'active' : ''}" onclick="setAdminTab('requests')">
        ${icon('shield')}
        <span>Edit Requests</span>
        ${pendingRequestsCount > 0 ? `<span class="badge" style="background:#ef4444; color:#fff; border-radius:10px; padding:2px 7px; font-size:0.75rem; font-weight:700;">${pendingRequestsCount}</span>` : ''}
      </button>
      <button class="sub-nav-btn ${adminActiveTab === 'settings' ? 'active' : ''}" onclick="setAdminTab('settings')">
        ${icon('settings')}
        <span>Settings & Passwords</span>
      </button>
    </div>

    <div id="adminTabContent"></div>
  `;

  const tabContent = document.getElementById('adminTabContent');
  if (!tabContent) return;

  if (adminActiveTab === 'datesheets') {
    renderAdminDatesheets(tabContent);
  } else if (adminActiveTab === 'results') {
    renderAdminResults(tabContent);
  } else if (adminActiveTab === 'students') {
    renderAdminStudents(tabContent);
  } else if (adminActiveTab === 'teachers') {
    renderAdminTeachers(tabContent);
  } else if (adminActiveTab === 'marks') {
    renderAdminMarksEntry(tabContent);
  } else if (adminActiveTab === 'requests') {
    renderAdminEditRequests(tabContent);
  } else {
    renderAdminSettings(tabContent);
  }
}

/**
 * Set active Teacher tab and re-render
 * @param {string} tab - Tab key: 'marks' | 'subject_pdf' | 'datesheet_pdf'
 */
function setTeacherTab(tab) {
  teacherActiveTab = tab;
  renderApp();
}

/**
 * Render Teacher Portal & Sub-navigation
 * @param {HTMLElement} container
 */
function renderTeacherPortal(container) {
  container.innerHTML = `
    <div class="sub-nav no-print">
      <button class="sub-nav-btn ${teacherActiveTab === 'marks' ? 'active' : ''}" onclick="setTeacherTab('marks')">
        ${icon('edit')}
        <span>Enter Subject Marks</span>
      </button>
      <button class="sub-nav-btn ${teacherActiveTab === 'subject_pdf' ? 'active' : ''}" onclick="setTeacherTab('subject_pdf')">
        ${icon('fileText')}
        <span>Subject Marks Sheets (PDF)</span>
      </button>
      <button class="sub-nav-btn ${teacherActiveTab === 'datesheet_pdf' ? 'active' : ''}" onclick="setTeacherTab('datesheet_pdf')">
        ${icon('calendar')}
        <span>Download Date Sheet PDF</span>
      </button>
    </div>

    <div id="teacherTabContent"></div>
  `;

  const tabContent = document.getElementById('teacherTabContent');
  if (!tabContent) return;

  if (teacherActiveTab === 'marks') {
    renderTeacherMarksEntry(tabContent);
  } else if (teacherActiveTab === 'subject_pdf') {
    renderTeacherSubjectPdfDownload(tabContent);
  } else {
    renderTeacherDatesheetPdfDownload(tabContent);
  }
}

/**
 * Main Application Viewport Dispatcher
 */
function renderApp() {
  if (typeof renderHeaderAuth === 'function') {
    renderHeaderAuth();
  }

  const container = document.getElementById('mainContentArea');
  if (!container || !appData) return;

  if (!authRole) {
    if (typeof renderLoginView === 'function') {
      renderLoginView(container);
    }
  } else if (authRole === 'admin') {
    renderAdminPortal(container);
  } else {
    renderTeacherPortal(container);
  }
}

// Background Synchronization Loop (Every 45 seconds when idle)
setInterval(() => {
  if (document.visibilityState === 'visible' && !document.querySelector('input:focus')) {
    if (typeof syncWithServer === 'function') {
      syncWithServer(false);
    }
  }
}, 45000);

// Global Exports
window.adminActiveTab = adminActiveTab;
window.teacherActiveTab = teacherActiveTab;
window.setAdminTab = setAdminTab;
window.renderAdminPortal = renderAdminPortal;
window.setTeacherTab = setTeacherTab;
window.renderTeacherPortal = renderTeacherPortal;
window.renderApp = renderApp;

// App Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof loadInitialData === 'function') {
    await loadInitialData();
  }
  renderApp();
});
