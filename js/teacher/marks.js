/**
 * CIT Result Management System - Teacher Marks Entry Module
 * Handles class & subject scoping for logged-in teacher, keyboard navigation,
 * absentee tracking, and automatic sheet locking upon submission.
 */

function renderTeacherMarksEntry(container) {
  const teacherClasses = (appData.classes || []).filter(c => {
    return !authTeacher || !authTeacher.assignedClasses || authTeacher.assignedClasses.length === 0 || authTeacher.assignedClasses.includes(c.id);
  });

  if (teacherClasses.length === 0) {
    container.innerHTML = `
      <div class="card">
        <div class="card-body" style="text-align:center; padding:3rem 1.5rem;">
          <div style="width:48px; height:48px; margin:0 auto 1rem; color:#d97706;">
            ${icon('alert')}
          </div>
          <h4 style="margin:0 0 0.5rem 0; font-weight:700;">No Classes or Subjects Assigned Yet</h4>
          <p style="color:var(--text-muted); max-width:480px; margin:0 auto; font-size:0.9rem;">
            Your teacher account (<b>${authTeacher ? authTeacher.username : 'teacher'}</b>) does not currently have any assigned classes or curriculum subjects. Please contact the Administrator to assign your subjects.
          </p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <span class="card-title">
          ${icon('edit')}
          <span>Subject Teacher &mdash; Marks Entry</span>
        </span>
        <span style="font-size:0.82rem; color:var(--text-muted);">
          Teacher: <b>${authTeacher ? escapeHtml(authTeacher.name) : 'Subject Teacher'}</b>
        </span>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Step 1: Select Your Class</label>
              <select id="teacherClassSelect" class="form-select" onchange="onTeacherClassChange()">
                ${teacherClasses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
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
              <label class="form-label">Step 3: Select Assigned Subject</label>
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
  const classSelect = document.getElementById('teacherClassSelect');
  if (!classSelect) return;
  const classId = classSelect.value;
  const datesheets = (appData.datesheets || []).filter(d => d.classId === classId);
  const asmSelect = document.getElementById('teacherAssessmentSelect');
  const subSelect = document.getElementById('teacherSubjectSelect');
  const sheetArea = document.getElementById('teacherMarksSheetArea');

  if (datesheets.length === 0) {
    if (asmSelect) asmSelect.innerHTML = `<option value="">-- No Date Sheets Scheduled for this Class --</option>`;
    if (subSelect) subSelect.innerHTML = `<option value="">-- Select Date Sheet First --</option>`;
    if (sheetArea) {
      sheetArea.innerHTML = `
        <div style="background:#fef3c7; color:#92400e; padding:1.25rem; border-radius:6px; border:1px solid #fde68a; font-size:0.9rem;">
          The administrator has not created any examination date sheets for this class yet.
          Once created, the assessment will appear here automatically for marks entry.
        </div>
      `;
    }
    return;
  }

  if (asmSelect) {
    asmSelect.innerHTML = datesheets.map(ds => `
      <option value="${ds.id}">${ds.title} (${ds.examTypeName || 'Exam'})</option>
    `).join('');
  }

  onTeacherAssessmentChange();
}

function onTeacherAssessmentChange() {
  const classSelect = document.getElementById('teacherClassSelect');
  const asmSelect = document.getElementById('teacherAssessmentSelect');
  const subSelect = document.getElementById('teacherSubjectSelect');
  const sheetArea = document.getElementById('teacherMarksSheetArea');
  if (!classSelect || !asmSelect || !subSelect) return;

  const classId = classSelect.value;
  const dsId = asmSelect.value;
  const ds = (appData.datesheets || []).find(d => d.id === dsId);

  if (!ds || !ds.items || ds.items.length === 0) {
    subSelect.innerHTML = `<option value="">-- No subjects in this assessment --</option>`;
    if (sheetArea) sheetArea.innerHTML = '';
    return;
  }

  // Filter to subjects assigned to this specific teacher
  const assignedSubs = ds.items.filter(s => isSubjectAssignedToTeacher(authTeacher, classId, s.code));

  if (assignedSubs.length === 0) {
    subSelect.innerHTML = `<option value="">-- No Subjects Assigned to You in this Exam --</option>`;
    if (sheetArea) {
      sheetArea.innerHTML = `
        <div style="background:#fef3c7; color:#92400e; padding:1.25rem; border-radius:6px; border:1px solid #fde68a; font-size:0.9rem;">
          You are not assigned to teach any of the subjects scheduled in this examination date sheet.
          If this is an error, please ask the Administrator to assign you to the appropriate curriculum subjects.
        </div>
      `;
    }
    return;
  }

  subSelect.innerHTML = assignedSubs.map(s => {
    const maxM = s.maxMarks || getSubjectMaxMarks(ds.classId, s.code, ds.examType);
    return `<option value="${s.code}">${s.code} &mdash; ${s.title} (${maxM} Marks)</option>`;
  }).join('');

  renderTeacherMarksEntryTable();
}

function renderTeacherMarksEntryTable() {
  const classSelect = document.getElementById('teacherClassSelect');
  const asmSelect = document.getElementById('teacherAssessmentSelect');
  const subSelect = document.getElementById('teacherSubjectSelect');
  const container = document.getElementById('teacherMarksSheetArea');
  if (!classSelect || !asmSelect || !subSelect || !container) return;

  const classId = classSelect.value;
  const dsId = asmSelect.value;
  const subCode = subSelect.value;

  const ds = (appData.datesheets || []).find(d => d.id === dsId);
  if (!ds || !subCode) {
    container.innerHTML = '';
    return;
  }

  if (!isSubjectAssignedToTeacher(authTeacher, classId, subCode)) {
    container.innerHTML = `
      <div style="background:#fee2e2; color:#991b1b; padding:1.25rem; border-radius:6px; border:1px solid #fecaca; font-size:0.9rem;">
        Access Restricted: You are not authorized to view or edit marks for ${subCode}.
      </div>
    `;
    return;
  }

  const subObj = ds.items.find(s => s.code === subCode) || {};
  const students = appData.students[classId] || [];

  if (students.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2.5rem; background:#f8fafc; border:1px solid var(--border-color); border-radius:6px; color:var(--text-muted);">
        No students enrolled in this class roster yet. Please ask the administrator to register students.
      </div>
    `;
    return;
  }

  const maxMarks = subObj.maxMarks || getSubjectMaxMarks(classId, subCode, ds.examType);
  const existingMarks = (appData.marks && appData.marks[dsId] && appData.marks[dsId][subCode]) || {};

  const isLocked = isSheetLocked(dsId, subCode);
  const lockInfo = getSheetLockInfo(dsId, subCode);
  const pendingReq = getPendingEditRequest(dsId, subCode);
  const approvedReq = getApprovedEditRequest(dsId, subCode);

  container.innerHTML = `
    <!-- Lock / Unlock / Permission Notification Banner -->
    ${isLocked ? `
      <div class="marks-status-banner banner-locked">
        <div style="display:flex; align-items:center; gap:0.65rem;">
          <div class="banner-icon">${icon('lock')}</div>
          <div class="banner-content">
            <b>Marks Sheet is Locked & Submitted</b>
            <div style="font-size:0.8rem; color:#991b1b;">
              Submitted on ${lockInfo ? (lockInfo.lockedAt || '-') : '-'}. To prevent accidental modification, editing is locked.
            </div>
          </div>
        </div>
        <div class="banner-actions">
          ${pendingReq ? `
            <span class="badge badge-pending" style="padding:0.45rem 0.75rem; font-size:0.82rem; font-weight:700;">
              ⏳ Edit Request Pending Admin Review
            </span>
          ` : `
            <button type="button" class="btn btn-sm btn-secondary" onclick="openEditRequestModal('${dsId}', '${subCode}', '${classId}')">
              ${icon('edit')} Request Edit Permission
            </button>
          `}
          <button type="button" class="btn btn-sm btn-primary" onclick="previewSubjectMarksSheet('${dsId}', '${subCode}')">
            ${icon('printer')} Download Subject PDF
          </button>
        </div>
      </div>

      ${pendingReq ? `
        <div style="background:#fffbeb; border:1px solid #fde68a; padding:0.65rem 0.85rem; border-radius:6px; font-size:0.83rem; margin-bottom:1rem; color:#92400e; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <b>Pending Edit Request:</b> "${escapeHtml(pendingReq.reason)}"
            <div style="font-size:0.75rem; color:#b45309; margin-top:2px;">Submitted on ${pendingReq.createdAt}. Waiting for Administrator approval.</div>
          </div>
        </div>
      ` : ''}
    ` : (approvedReq ? `
      <div class="marks-status-banner banner-unlocked">
        <div style="display:flex; align-items:center; gap:0.65rem;">
          <div class="banner-icon">${icon('unlock')}</div>
          <div class="banner-content">
            <b>Edit Permission Granted by Administrator</b>
            <div style="font-size:0.8rem; color:#166534;">
              Approved on ${approvedReq.reviewedAt || 'recently'}. You may now update student marks. Once complete, click "Save Marks Sheet" to submit and re-lock.
            </div>
          </div>
        </div>
        <div class="banner-actions">
          <button type="button" class="btn btn-sm btn-outline" onclick="previewSubjectMarksSheet('${dsId}', '${subCode}')">
            ${icon('printer')} Preview PDF
          </button>
          <button type="button" class="btn btn-sm btn-primary" onclick="saveTeacherMarks('${dsId}', '${subCode}', ${maxMarks})">
            ${icon('check')} Save & Re-Lock Marks Sheet
          </button>
        </div>
      </div>
    ` : `
      <div style="background:#f1f5f9; padding:0.75rem 1rem; border-radius:6px; border:1px solid var(--border-color); margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <h4 style="margin:0; font-weight:700; color:var(--primary);">${subCode} &mdash; ${subObj.title || subCode}</h4>
          <small style="color:var(--text-muted);">${ds.title} &bull; Maximum Theory Marks: <b style="color:var(--primary); font-size:1.05rem;">${maxMarks}</b></small>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="previewSubjectMarksSheet('${dsId}', '${subCode}')">
            ${icon('printer')} Preview PDF
          </button>
          <button type="button" class="btn btn-primary" onclick="saveTeacherMarks('${dsId}', '${subCode}', ${maxMarks})">
            ${icon('check')} Save Marks Sheet
          </button>
        </div>
      </div>
    `)}

    <!-- Marks Entry Table -->
    <div class="table-responsive">
      <table class="table table-bordered table-sm" id="marksInputTable">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="width:50px; text-align:center;">#</th>
            <th style="width:105px;">Roll No</th>
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
              <tr style="${isLocked ? 'background:#fafafa;' : ''}">
                <td style="text-align:center;">${i + 1}</td>
                <td><b>${st.roll}</b></td>
                <td>${st.name}</td>
                <td style="text-align:center;">
                  <input type="number" step="0.5" min="0" max="${maxMarks}" 
                    inputmode="decimal"
                    class="marks-input ${isAbsent ? 'absent-mode' : ''}" 
                    data-roll="${st.roll}" 
                    id="mark_${st.roll}" 
                    value="${(!isAbsent && currentVal !== undefined) ? currentVal : ''}"
                    ${isLocked || isAbsent ? 'disabled' : ''}
                    placeholder="${isAbsent ? 'ABS' : (isLocked ? '-' : `0-${maxMarks}`)}"
                    ${!isLocked ? `onkeydown="handleMarksKeyNav(event, ${i})"` : ''}>
                </td>
                <td style="text-align:center;" id="status_${st.roll}">
                  ${getLiveStatusBadge(currentVal, maxMarks)}
                </td>
                <td style="text-align:center;">
                  <label style="cursor:${isLocked ? 'default' : 'pointer'}; font-size:0.8rem; display:inline-flex; align-items:center; gap:0.25rem;">
                    <input type="checkbox" onchange="toggleStudentAbsent('${st.roll}', this.checked)" ${isAbsent ? 'checked' : ''} ${isLocked ? 'disabled' : ''}> Absent
                  </label>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Desktop Bottom Actions -->
    <div class="desktop-only" style="margin-top:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
      <button type="button" class="btn btn-outline" onclick="previewSubjectMarksSheet('${dsId}', '${subCode}')">
        ${icon('printer')} Print / Save Subject Marks Sheet (PDF)
      </button>
      ${!isLocked ? `
        <button type="button" class="btn btn-primary" onclick="saveTeacherMarks('${dsId}', '${subCode}', ${maxMarks})">
          ${icon('check')} Save & Lock Marks Sheet
        </button>
      ` : `
        <div style="font-size:0.85rem; color:var(--text-muted);">
          🔒 Sheet is locked. To modify marks, click "Request Edit Permission".
        </div>
      `}
    </div>

    <!-- Mobile Floating Action Bar -->
    <div class="mobile-sticky-action-bar">
      ${!isLocked ? `
        <button type="button" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.75rem;" onclick="saveTeacherMarks('${dsId}', '${subCode}', ${maxMarks})">
          ${icon('check')} Save & Lock Marks Sheet
        </button>
      ` : `
        <button type="button" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.75rem;" onclick="previewSubjectMarksSheet('${dsId}', '${subCode}')">
          ${icon('printer')} Download Subject PDF
        </button>
      `}
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
    if (statusCell) statusCell.innerHTML = `<span class="badge badge-danger">ABSENT</span>`;
  } else {
    input.disabled = false;
    input.placeholder = '0';
    input.classList.remove('absent-mode');
    if (statusCell) statusCell.innerHTML = `<span class="badge badge-secondary">Pending</span>`;
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

async function saveTeacherMarks(dsId, subCode, maxMarks) {
  if (!appData.marks || Array.isArray(appData.marks) || typeof appData.marks !== 'object') {
    appData.marks = {};
  }
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

  const saveButtons = document.querySelectorAll('#teacherMarksSheetArea button');
  saveButtons.forEach(btn => {
    btn.disabled = true;
    btn.innerHTML = `${icon('sync')} Saving & Locking Marks...`;
  });

  // LOCK THE MARKS SHEET AUTOMATICALLY UPON SUBMISSION
  appData.sheetLocks = appData.sheetLocks || {};
  const lockKey = `${dsId}_${subCode}`;
  appData.sheetLocks[lockKey] = {
    locked: true,
    lockedAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    lockedBy: authTeacher ? authTeacher.name : 'Teacher',
    lockedUsername: authTeacher ? authTeacher.username : 'teacher',
    dsId: dsId,
    subCode: subCode
  };

  if (appData.editRequests && Array.isArray(appData.editRequests)) {
    appData.editRequests.forEach(r => {
      if (r.dsId === dsId && r.subCode === subCode && (r.status === 'approved' || r.status === 'pending')) {
        r.status = 'completed';
      }
    });
  }

  try {
    const saved = await persistData();
    if (saved) {
      showToast(`Marks saved and LOCKED successfully for ${subCode} (${enteredCount} students)!`);
    } else {
      showToast(`Marks cached locally, but server synchronization failed.`, true);
    }
  } catch (err) {
    showToast(`Error saving marks: ${err.message}`, true);
  } finally {
    renderTeacherMarksEntryTable();
  }
}

// Global exports
window.renderTeacherMarksEntry = renderTeacherMarksEntry;
window.onTeacherClassChange = onTeacherClassChange;
window.onTeacherAssessmentChange = onTeacherAssessmentChange;
window.renderTeacherMarksEntryTable = renderTeacherMarksEntryTable;
window.getLiveStatusBadge = getLiveStatusBadge;
window.toggleStudentAbsent = toggleStudentAbsent;
window.handleMarksKeyNav = handleMarksKeyNav;
window.saveTeacherMarks = saveTeacherMarks;

