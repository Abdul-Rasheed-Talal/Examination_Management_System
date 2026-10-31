/**
 * CIT Result Management System - Admin Marks Entry Module
 * Handles Administrator marks entry, absentees, instant sheet lock/unlock toggle, and saving.
 */

function renderAdminMarksEntry(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          ${icon('edit')}
          <span>Administrator &mdash; Comprehensive Marks Entry & Sheet Locks</span>
        </span>
      </div>
      <div class="card-body">
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
          As an Administrator, you have full access to enter or edit marks for any class and subject, lock or unlock any sheet at will, and download per-subject PDF award lists.
        </p>

        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Step 1: Select Class</label>
              <select id="adminMarksClassSelect" class="form-select" onchange="onAdminMarksClassChange()">
                <option value="cit1">CIT 1st Year</option>
                <option value="cit2">CIT 2nd Year</option>
                <option value="cit3">CIT 3rd Year</option>
              </select>
            </div>
          </div>

          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Step 2: Select Examination</label>
              <select id="adminMarksAssessmentSelect" class="form-select" onchange="onAdminMarksDatesheetChange()">
                <!-- Populated dynamically -->
              </select>
            </div>
          </div>

          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Step 3: Select Subject</label>
              <select id="adminMarksSubjectSelect" class="form-select" onchange="renderAdminMarksTable()">
                <!-- Populated dynamically -->
              </select>
            </div>
          </div>
        </div>

        <div id="adminMarksTableArea" style="margin-top:1rem;"></div>
      </div>
    </div>
  `;

  onAdminMarksClassChange();
}

function onAdminMarksClassChange() {
  const classId = document.getElementById('adminMarksClassSelect').value;
  const datesheets = (appData.datesheets || []).filter(d => d.classId === classId);
  const asmSelect = document.getElementById('adminMarksAssessmentSelect');

  if (datesheets.length === 0) {
    asmSelect.innerHTML = `<option value="">-- No Date Sheets Scheduled for this Class --</option>`;
    document.getElementById('adminMarksSubjectSelect').innerHTML = `<option value="">-- Select Date Sheet First --</option>`;
    document.getElementById('adminMarksTableArea').innerHTML = `
      <div style="background:#fef3c7; color:#92400e; padding:1.25rem; border-radius:6px; border:1px solid #fde68a; font-size:0.9rem;">
        No examination date sheets created for this class yet. Go to the "Date Sheets" tab to create one.
      </div>
    `;
    return;
  }

  asmSelect.innerHTML = datesheets.map(ds => `
    <option value="${ds.id}">${ds.title} (${ds.examTypeName || 'Exam'})</option>
  `).join('');

  onAdminMarksDatesheetChange();
}

function onAdminMarksDatesheetChange() {
  const dsId = document.getElementById('adminMarksAssessmentSelect').value;
  const ds = (appData.datesheets || []).find(d => d.id === dsId);
  const subSelect = document.getElementById('adminMarksSubjectSelect');

  if (!ds || !ds.items || ds.items.length === 0) {
    subSelect.innerHTML = `<option value="">-- No subjects in this assessment --</option>`;
    document.getElementById('adminMarksTableArea').innerHTML = '';
    return;
  }

  subSelect.innerHTML = ds.items.map(s => {
    const maxM = s.maxMarks || getSubjectMaxMarks(ds.classId, s.code, ds.examType);
    return `<option value="${s.code}">${s.code} &mdash; ${s.title} (${maxM} Marks)</option>`;
  }).join('');

  renderAdminMarksTable();
}

function renderAdminMarksTable() {
  const classId = document.getElementById('adminMarksClassSelect').value;
  const dsId = document.getElementById('adminMarksAssessmentSelect').value;
  const subCode = document.getElementById('adminMarksSubjectSelect').value;
  const container = document.getElementById('adminMarksTableArea');

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
        No students registered in this class roster yet. Please import or add students in the "Student Rosters" tab.
      </div>
    `;
    return;
  }

  const maxMarks = subObj.maxMarks || getSubjectMaxMarks(classId, subCode, ds.examType);
  const existingMarks = (appData.marks && appData.marks[dsId] && appData.marks[dsId][subCode]) || {};
  const isLocked = isSheetLocked(dsId, subCode);
  const lockInfo = getSheetLockInfo(dsId, subCode);

  const assignedTeachers = (appData.teachers || []).filter(t => isSubjectAssignedToTeacher(t, classId, subCode));
  const teacherNames = assignedTeachers.length > 0 ? assignedTeachers.map(t => `${t.name} (${t.username})`).join(', ') : 'No teacher specifically assigned';

  container.innerHTML = `
    <!-- Lock Status & Administrative Actions Banner -->
    <div class="marks-status-banner ${isLocked ? 'banner-locked' : 'banner-unlocked'}">
      <div style="display:flex; align-items:center; gap:0.65rem;">
        <div class="banner-icon">${icon(isLocked ? 'lock' : 'unlock')}</div>
        <div class="banner-content">
          <b>${isLocked ? 'Marks Sheet is Currently LOCKED' : 'Marks Sheet is Currently UNLOCKED'}</b>
          <div style="font-size:0.8rem; color:${isLocked ? '#991b1b' : '#166534'};">
            ${isLocked ? `Locked by ${lockInfo.lockedBy || 'Teacher'} on ${lockInfo.lockedAt || '-'}. Teachers cannot edit unless unlocked.` : 'Teachers with this subject assignment can freely enter or modify marks.'}
            &bull; Assigned Teacher: <b>${teacherNames}</b>
          </div>
        </div>
      </div>
      <div class="banner-actions">
        <button type="button" class="btn btn-sm ${isLocked ? 'btn-outline' : 'btn-danger'}" onclick="toggleSheetLockAdmin('${dsId}', '${subCode}')">
          ${icon(isLocked ? 'unlock' : 'lock')}
          <span>${isLocked ? 'Unlock Sheet for Teacher' : 'Lock Sheet Now'}</span>
        </button>
        <button type="button" class="btn btn-sm btn-outline" onclick="previewSubjectMarksSheet('${dsId}', '${subCode}')">
          ${icon('printer')}
          <span>Download Subject PDF</span>
        </button>
        <button type="button" class="btn btn-sm btn-primary" onclick="saveAdminMarks('${dsId}', '${subCode}', ${maxMarks})">
          ${icon('check')}
          <span>Save Marks</span>
        </button>
      </div>
    </div>

    <!-- Marks Entry Table -->
    <div class="table-responsive">
      <table class="table table-bordered table-sm" id="adminMarksInputTable">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="width:50px; text-align:center;">#</th>
            <th style="width:105px;">Roll No</th>
            <th>Student Full Name</th>
            <th style="width:160px; text-align:center;">Theory Marks (Max: ${maxMarks})</th>
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
                    inputmode="decimal"
                    class="marks-input ${isAbsent ? 'absent-mode' : ''}" 
                    data-roll="${st.roll}" 
                    id="admin_mark_${st.roll}" 
                    value="${(!isAbsent && currentVal !== undefined) ? currentVal : ''}"
                    ${isAbsent ? 'disabled placeholder="ABS"' : `placeholder="0-${maxMarks}"`}>
                </td>
                <td style="text-align:center;" id="admin_status_${st.roll}">
                  ${getLiveStatusBadge(currentVal, maxMarks)}
                </td>
                <td style="text-align:center;">
                  <label style="cursor:pointer; font-size:0.8rem; display:inline-flex; align-items:center; gap:0.25rem;">
                    <input type="checkbox" onchange="toggleStudentAbsentAdmin('${st.roll}', this.checked)" ${isAbsent ? 'checked' : ''}> Absent
                  </label>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div style="margin-top:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
      <button type="button" class="btn btn-outline" onclick="previewSubjectMarksSheet('${dsId}', '${subCode}')">
        ${icon('printer')} Print / Save Subject Marks Sheet (PDF)
      </button>
      <button type="button" class="btn btn-primary" onclick="saveAdminMarks('${dsId}', '${subCode}', ${maxMarks})">
        ${icon('check')} Save Marks Sheet
      </button>
    </div>
  `;
}

function toggleStudentAbsentAdmin(roll, isAbsent) {
  const input = document.getElementById(`admin_mark_${roll}`);
  const statusCell = document.getElementById(`admin_status_${roll}`);
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

async function toggleSheetLockAdmin(dsId, subCode) {
  appData.sheetLocks = appData.sheetLocks || {};
  const lockKey = `${dsId}_${subCode}`;
  const currentlyLocked = isSheetLocked(dsId, subCode);

  if (currentlyLocked) {
    appData.sheetLocks[lockKey] = {
      locked: false,
      unlockedAt: new Date().toLocaleString(),
      unlockedBy: 'Administrator',
      dsId: dsId,
      subCode: subCode
    };
    showToast(`Unlocked marks sheet for ${subCode}. Teachers can now edit marks.`);
  } else {
    appData.sheetLocks[lockKey] = {
      locked: true,
      lockedAt: new Date().toLocaleString(),
      lockedBy: 'Administrator',
      dsId: dsId,
      subCode: subCode
    };
    showToast(`Locked marks sheet for ${subCode}.`);
  }

  await persistData();
  renderAdminMarksTable();
}

async function saveAdminMarks(dsId, subCode, maxMarks) {
  if (!appData.marks || Array.isArray(appData.marks) || typeof appData.marks !== 'object') {
    appData.marks = {};
  }
  appData.marks[dsId] = appData.marks[dsId] || {};
  appData.marks[dsId][subCode] = appData.marks[dsId][subCode] || {};

  let hasError = false;
  let enteredCount = 0;

  document.querySelectorAll('#adminMarksInputTable tbody tr').forEach(row => {
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

  try {
    const saved = await persistData();
    if (saved) {
      showToast(`Marks saved successfully for ${subCode} (${enteredCount} students)`);
    } else {
      showToast("Marks cached locally, but server synchronization failed.", true);
    }
  } catch (err) {
    showToast("Error saving marks: " + err.message, true);
  } finally {
    renderAdminMarksTable();
  }
}

// Global exports
window.renderAdminMarksEntry = renderAdminMarksEntry;
window.onAdminMarksClassChange = onAdminMarksClassChange;
window.onAdminMarksDatesheetChange = onAdminMarksDatesheetChange;
window.renderAdminMarksTable = renderAdminMarksTable;
window.toggleStudentAbsentAdmin = toggleStudentAbsentAdmin;
window.toggleSheetLockAdmin = toggleSheetLockAdmin;
window.saveAdminMarks = saveAdminMarks;

