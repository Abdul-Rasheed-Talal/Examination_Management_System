/**
 * CIT Result Management System - Authentication & Login Module
 * Handles login screen rendering, credential validation for Admin & Teachers,
 * Roll Number lookup for Students, and session management.
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

  if (authRole === 'student' && authStudent) {
    const roleLabel = `${authStudent.name} (${authStudent.roll})`;
    const roleShort = authStudent.roll;
    container.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.4rem;">
        <div class="user-badge-header" title="${escapeHtml(authStudent.name)} (${escapeHtml(authStudent.className || 'Student')})">
          ${icon('award')}
          <span class="user-role-full">${escapeHtml(roleLabel)}</span>
          <span class="user-role-short">${escapeHtml(roleShort)}</span>
        </div>
        <button class="btn btn-outline btn-sm logout-btn" style="color:#ffffff; border-color:rgba(255,255,255,0.3);" onclick="handleLogout()" title="Exit Student Portal">
          ${icon('logout')}
          <span class="logout-btn-text">Exit</span>
        </button>
      </div>
    `;
    return;
  }

  const roleLabel = authRole === 'admin' 
    ? 'Administrator' 
    : (authTeacher ? `${authTeacher.name} (${authTeacher.username})` : 'Subject Teacher');
  const roleShort = authRole === 'admin' 
    ? 'Admin' 
    : (authTeacher ? authTeacher.username : 'Teacher');

  container.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.4rem;">
      <div class="user-badge-header" title="${authRole === 'admin' ? 'Administrator' : (authTeacher ? authTeacher.name : 'Teacher')}">
        ${icon('user')}
        <span class="user-role-full">${escapeHtml(roleLabel)}</span>
        <span class="user-role-short">${escapeHtml(roleShort)}</span>
      </div>
      <button class="btn btn-outline btn-sm logout-btn" style="color:#ffffff; border-color:rgba(255,255,255,0.3);" onclick="handleLogout()" title="Sign Out">
        ${icon('logout')}
        <span class="logout-btn-text">Sign Out</span>
      </button>
    </div>
  `;
}

function handleLogout() {
  authRole = null;
  authTeacher = null;
  authStudent = null;
  sessionStorage.removeItem('cit_auth_role');
  sessionStorage.removeItem('cit_auth_teacher');
  sessionStorage.removeItem('cit_auth_student');
  showToast("Signed out successfully.");
  if (typeof renderApp === 'function') {
    renderApp();
  }
}

function renderLoginView(container) {
  const isStudent = (loginSelectedRole === 'student');
  const isTeacher = (loginSelectedRole === 'teacher');
  const isAdmin = (loginSelectedRole === 'admin');

  container.innerHTML = `
    <!-- Dedicated Student Portal Discovery Banner -->
    <div style="max-width:480px; margin:0 auto 1.25rem; background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color:#ffffff; padding:0.9rem 1.25rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; border:1px solid rgba(255,255,255,0.1); box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <div style="background:var(--primary); width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.15rem; flex-shrink:0;">
          ${icon('award')}
        </div>
        <div>
          <div style="font-weight:700; font-size:0.92rem;">Looking for Student Results?</div>
          <div style="font-size:0.75rem; color:#cbd5e1;">Students access results & date sheets at <b>/students</b></div>
        </div>
      </div>
      <a href="students/index.html" class="btn btn-primary btn-sm" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem; font-weight:600; font-size:0.8rem; white-space:nowrap;">
        <span>Student Portal</span> &rarr;
      </a>
    </div>

    <div class="login-card" style="max-width:480px;">
      <div class="login-header">
        <div style="display:flex; justify-content:center; margin-bottom:0.75rem;">
          <div class="brand-badge" style="width:48px; height:48px; font-size:1.35rem;">CIT</div>
        </div>
        <h3 style="margin:0; font-size:1.15rem; font-weight:700;">Faculty Examination Portal</h3>
        <p style="margin:4px 0 0; font-size:0.8rem; color:#cbd5e1;">Sign in to enter subject marks, manage date sheets, or configure exams</p>
      </div>

      <div class="login-body">
        <form onsubmit="handleLoginSubmit(event)">
          <div class="role-toggle-group">
            <button type="button" class="role-toggle-btn ${isTeacher ? 'active' : ''}" onclick="setLoginRole('teacher')">
              ${icon('edit')}
              <span>Teacher</span>
            </button>
            <button type="button" class="role-toggle-btn ${isAdmin ? 'active' : ''}" onclick="setLoginRole('admin')">
              ${icon('settings')}
              <span>Admin</span>
            </button>
            <a href="students/index.html" class="role-toggle-btn" style="text-decoration:none; color:var(--primary); font-weight:700;">
              ${icon('award')}
              <span>Students &rarr;</span>
            </a>
          </div>

          ${isStudent ? `
            <!-- Student Portal Roll Number Lookup -->
            <div class="form-group">
              <label class="form-label" for="studentLoginRollInput">
                ${icon('user')}
                <span>Student Roll Number *</span>
              </label>
              <input type="text" id="studentLoginRollInput" class="form-control" placeholder="Enter Roll No (e.g. 26-CIT-101 or 101)" required autofocus autocomplete="off">
              <small style="font-size:0.75rem; color:var(--text-muted);">
                View your detailed marks certificate, class position, and weak subject analysis
              </small>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label class="form-label" for="studentLoginClassSelect">Class (Optional)</label>
                  <select id="studentLoginClassSelect" class="form-select form-select-sm">
                    <option value="">Auto-Detect from Roll</option>
                    <option value="cit1">CIT 1st Year</option>
                    <option value="cit2">CIT 2nd Year</option>
                    <option value="cit3">CIT 3rd Year</option>
                  </select>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label class="form-label" for="studentLoginCategorySelect">Exam Category</label>
                  <select id="studentLoginCategorySelect" class="form-select form-select-sm">
                    <option value="all">All Examinations</option>
                    <option value="monthly">Monthly Tests</option>
                    <option value="midterm">Mid-Term Exams</option>
                    <option value="sendup">Send-Up Exams</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; padding:0.75rem; font-size:0.95rem; margin-top:0.75rem;">
              ${icon('search')}
              <span>View Result & Student Dashboard</span>
            </button>

            <div style="margin-top:1.25rem; padding-top:1rem; border-top:1px dashed #e2e8f0; text-align:center;">
              <button type="button" class="btn btn-outline btn-sm" style="font-size:0.8rem; width:100%;" onclick="openPublicNoticeboardModal()">
                ${icon('calendar')} <span>View Examination Date Sheets (Notice Board)</span>
              </button>
            </div>
          ` : (isTeacher ? `
            <!-- Teacher Sign In -->
            <div class="form-group">
              <label class="form-label" for="loginUsernameInput">
                ${icon('user')}
                <span>Teacher Username</span>
              </label>
              <input type="text" id="loginUsernameInput" class="form-control" placeholder="Enter assigned username (e.g. tariq or teacher)" required autofocus autocomplete="username">
            </div>

            <div class="form-group">
              <label class="form-label" for="loginPasswordInput">
                ${icon('lock')}
                <span>Teacher Password</span>
              </label>
              <input type="password" id="loginPasswordInput" class="form-control" placeholder="Enter your teacher password" required autocomplete="current-password">
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; padding:0.7rem; font-size:0.95rem; margin-top:1.25rem;">
              <span>Sign In as Teacher</span>
            </button>
          ` : `
            <!-- Administrator Sign In -->
            <div class="form-group">
              <label class="form-label" for="loginPasswordInput">
                ${icon('lock')}
                <span>Administrator Password</span>
              </label>
              <input type="password" id="loginPasswordInput" class="form-control" placeholder="Enter administrator password" required autofocus autocomplete="current-password">
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; padding:0.7rem; font-size:0.95rem; margin-top:1.25rem;">
              <span>Sign In as Administrator</span>
            </button>
          `)}
        </form>
      </div>
    </div>
  `;
}

function setLoginRole(role) {
  if (role === 'student') {
    window.location.href = 'students/index.html';
    return;
  }
  loginSelectedRole = role;
  const container = document.getElementById('mainContentArea');
  if (container) renderLoginView(container);
}

function handleLoginSubmit(e) {
  e.preventDefault();

  if (loginSelectedRole === 'student') {
    const rollInput = document.getElementById('studentLoginRollInput');
    const classSelect = document.getElementById('studentLoginClassSelect');
    const catSelect = document.getElementById('studentLoginCategorySelect');

    const enteredRoll = rollInput ? rollInput.value.trim() : '';
    const selectedClass = classSelect ? classSelect.value : '';
    const selectedCategory = catSelect ? catSelect.value : 'all';

    if (!enteredRoll) {
      showToast("Please enter your Roll Number.", true);
      if (rollInput) rollInput.focus();
      return;
    }

    const matchedStudent = findStudentByRoll(enteredRoll, selectedClass || null);

    if (matchedStudent) {
      window.location.href = `students/index.html?roll=${encodeURIComponent(matchedStudent.roll)}&category=${encodeURIComponent(selectedCategory)}`;
      return;
    } else {
      showToast(`Roll Number "${enteredRoll}" was not found in the department register. Please verify your roll number.`, true);
      if (rollInput) rollInput.focus();
    }
  } else if (loginSelectedRole === 'admin') {
    const passInput = document.getElementById('loginPasswordInput');
    const enteredPass = passInput ? passInput.value.trim() : '';
    const expectedPass = (appData.passwords && appData.passwords.admin) || 'admin123';

    if (enteredPass === expectedPass) {
      authRole = 'admin';
      authTeacher = null;
      authStudent = null;
      sessionStorage.setItem('cit_auth_role', 'admin');
      sessionStorage.removeItem('cit_auth_teacher');
      sessionStorage.removeItem('cit_auth_student');
      showToast("Signed in as Administrator");
      if (typeof renderApp === 'function') renderApp();
    } else {
      showToast("Invalid administrator password! Please try again.", true);
      if (passInput) {
        passInput.value = '';
        passInput.focus();
      }
    }
  } else {
    // Teacher Login
    const userInput = document.getElementById('loginUsernameInput');
    const passInput = document.getElementById('loginPasswordInput');
    const enteredUser = userInput ? userInput.value.trim().toLowerCase() : '';
    const enteredPass = passInput ? passInput.value.trim() : '';

    if (!enteredUser || !enteredPass) {
      showToast("Please enter both username and password.", true);
      return;
    }

    const matchedTeacher = (appData.teachers || []).find(t => t.username && t.username.toLowerCase() === enteredUser);

    if (matchedTeacher) {
      if (matchedTeacher.password === enteredPass) {
        authRole = 'teacher';
        authTeacher = matchedTeacher;
        authStudent = null;
        sessionStorage.setItem('cit_auth_role', 'teacher');
        sessionStorage.setItem('cit_auth_teacher', JSON.stringify(matchedTeacher));
        sessionStorage.removeItem('cit_auth_student');
        showToast(`Signed in as ${matchedTeacher.name} (${matchedTeacher.username})`);
        if (typeof renderApp === 'function') renderApp();
      } else {
        showToast(`Incorrect password for teacher "${enteredUser}". Please try again.`, true);
        if (passInput) {
          passInput.value = '';
          passInput.focus();
        }
      }
    } else {
      showToast(`Teacher username "${enteredUser}" was not found. Please contact Administrator.`, true);
      if (userInput) userInput.focus();
    }
  }
}

function openPublicNoticeboardModal() {
  createPrintModal(`
    <div id="publicNoticeboardModalArea"></div>
  `, false);
  const area = document.getElementById('publicNoticeboardModalArea');
  if (area && typeof renderStudentNoticeboard === 'function') {
    renderStudentNoticeboard(area, true);
  }
}

// Global exports
window.renderHeaderAuth = renderHeaderAuth;
window.handleLogout = handleLogout;
window.renderLoginView = renderLoginView;
window.setLoginRole = setLoginRole;
window.handleLoginSubmit = handleLoginSubmit;
window.openPublicNoticeboardModal = openPublicNoticeboardModal;
