/**
 * CIT Result Management System - Admin Student Rosters Module
 * Handles class rosters, search, session filters, student additions/edits/deletions,
 * alumni passouts archive, and annual session promotion / class rollover.
 */

let rosterSearchQuery = '';
let rosterSessionFilter = 'all';
let passoutsSearchQuery = '';
let passoutsSessionFilter = 'all';

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

  const distinctSessions = Array.from(new Set(students.map(s => s.session || appData.currentSession || '2026-2027'))).filter(Boolean);

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

  activeRosterClass = 'cit1';

  persistData();
  closeSessionPromotionModal();
  showToast(`Annual Promotion complete! Shifted to session ${newSession}. 1st Year is ready for new enrollment.`);
  renderAdminStudents(document.getElementById('adminTabContent'));
}

function restoreDepartmentRoster() {
  if (!confirm("This will restore the 138 official CIT students from the department Excel register into CIT 1st, 2nd, and 3rd Year. Any existing marks or datesheets will not be affected. Continue?")) return;
  const defRef = (typeof DEFAULT_CIT_DATA !== 'undefined' ? DEFAULT_CIT_DATA : null) || 
                 (typeof window !== 'undefined' ? window.DEFAULT_CIT_DATA : null);
  if (defRef && defRef.students) {
    appData.students = JSON.parse(JSON.stringify(defRef.students));
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

// Global exports
window.renderAdminStudents = renderAdminStudents;
window.switchRosterClass = switchRosterClass;
window.renderActiveRosterTabContent = renderActiveRosterTabContent;
window.onRosterSearchChange = onRosterSearchChange;
window.onRosterSessionFilterChange = onRosterSessionFilterChange;
window.renderStudentRosterTable = renderStudentRosterTable;
window.onPassoutsSearchChange = onPassoutsSearchChange;
window.onPassoutsSessionFilterChange = onPassoutsSessionFilterChange;
window.renderPassoutsArchive = renderPassoutsArchive;
window.addNewStudent = addNewStudent;
window.openEditStudentModal = openEditStudentModal;
window.closeEditStudentModal = closeEditStudentModal;
window.handleSaveEditedStudent = handleSaveEditedStudent;
window.removeStudent = removeStudent;
window.clearClassRoster = clearClassRoster;
window.exportClassRosterCSV = exportClassRosterCSV;
window.exportAllDepartmentStudentsCSV = exportAllDepartmentStudentsCSV;
window.exportPassoutsCSV = exportPassoutsCSV;
window.openSessionPromotionModal = openSessionPromotionModal;
window.closeSessionPromotionModal = closeSessionPromotionModal;
window.executeSessionPromotion = executeSessionPromotion;
window.restoreDepartmentRoster = restoreDepartmentRoster;
window.clearAllDatesheetsAndMarks = clearAllDatesheetsAndMarks;
window.purgeAllDummyData = purgeAllDummyData;
