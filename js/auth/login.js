/**
 * CIT Result Management System - Authentication & Login Module
 * Handles login screen rendering, credential validation for Admin & Teachers, and session management.
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
        <span class="user-role-full">${roleLabel}</span>
        <span class="user-role-short">${roleShort}</span>
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
  sessionStorage.removeItem('cit_auth_role');
  sessionStorage.removeItem('cit_auth_teacher');
  showToast("Signed out successfully.");
  if (typeof renderApp === 'function') {
    renderApp();
  }
}

function renderLoginView(container) {
  const isTeacher = (loginSelectedRole === 'teacher');

  container.innerHTML = `
    <div class="login-card">
      <div class="login-header">
        <div style="display:flex; justify-content:center; margin-bottom:0.75rem;">
          <div class="brand-badge" style="width:48px; height:48px; font-size:1.35rem;">CIT</div>
        </div>
        <h3 style="margin:0; font-size:1.15rem; font-weight:700;">Examination Portal Sign In</h3>
        <p style="margin:4px 0 0; font-size:0.8rem; color:#cbd5e1;">Select your role to access the examination system</p>
      </div>

      <div class="login-body">
        <form onsubmit="handleLoginSubmit(event)">
          <div class="role-toggle-group">
            <button type="button" class="role-toggle-btn ${isTeacher ? 'active' : ''}" onclick="setLoginRole('teacher')">
              ${icon('edit')}
              <span>Subject Teacher</span>
            </button>
            <button type="button" class="role-toggle-btn ${!isTeacher ? 'active' : ''}" onclick="setLoginRole('admin')">
              ${icon('settings')}
              <span>Administrator</span>
            </button>
          </div>

          ${isTeacher ? `
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
          ` : `
            <div class="form-group">
              <label class="form-label" for="loginPasswordInput">
                ${icon('lock')}
                <span>Administrator Password</span>
              </label>
              <input type="password" id="loginPasswordInput" class="form-control" placeholder="Enter administrator password" required autofocus autocomplete="current-password">
            </div>
          `}

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

  if (loginSelectedRole === 'admin') {
    const passInput = document.getElementById('loginPasswordInput');
    const enteredPass = passInput ? passInput.value.trim() : '';
    const expectedPass = (appData.passwords && appData.passwords.admin) || 'admin123';

    if (enteredPass === expectedPass) {
      authRole = 'admin';
      authTeacher = null;
      sessionStorage.setItem('cit_auth_role', 'admin');
      sessionStorage.removeItem('cit_auth_teacher');
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
        sessionStorage.setItem('cit_auth_role', 'teacher');
        sessionStorage.setItem('cit_auth_teacher', JSON.stringify(matchedTeacher));
        showToast(`Signed in as ${matchedTeacher.name} (${matchedTeacher.username})`);
        if (typeof renderApp === 'function') renderApp();
      } else {
        showToast(`Incorrect password for teacher "${enteredUser}". Please try again.`, true);
        if (passInput) {
          passInput.value = '';
          passInput.focus();
        }
      }
    } else if (enteredUser === 'teacher' && enteredPass === ((appData.passwords && appData.passwords.teacher) || 'teacher123')) {
      // Default account fallback
      const defT = (appData.teachers && appData.teachers[0]) || {
        id: 'tch_default',
        name: 'CIT Subject Teacher',
        username: 'teacher',
        password: enteredPass,
        assignedClasses: ['cit1', 'cit2', 'cit3']
      };
      authRole = 'teacher';
      authTeacher = defT;
      sessionStorage.setItem('cit_auth_role', 'teacher');
      sessionStorage.setItem('cit_auth_teacher', JSON.stringify(defT));
      showToast("Signed in as CIT Teacher (Default Account)");
      if (typeof renderApp === 'function') renderApp();
    } else {
      showToast(`Teacher username "${enteredUser}" was not found. Please contact Administrator.`, true);
      if (userInput) userInput.focus();
    }
  }
}

// Global exports
window.renderHeaderAuth = renderHeaderAuth;
window.handleLogout = handleLogout;
window.renderLoginView = renderLoginView;
window.setLoginRole = setLoginRole;
window.handleLoginSubmit = handleLoginSubmit;

