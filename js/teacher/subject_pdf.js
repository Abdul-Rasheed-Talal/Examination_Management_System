/**
 * CIT Result Management System - Teacher Subject PDF Module
 * Handles individual per-subject marks sheet preview and separate PDF downloading for teachers.
 */

function renderTeacherSubjectPdfDownload(container) {
  const teacherClasses = (appData.classes || []).filter(c => {
    return !authTeacher || !authTeacher.assignedClasses || authTeacher.assignedClasses.length === 0 || authTeacher.assignedClasses.includes(c.id);
  });

  if (teacherClasses.length === 0) {
    container.innerHTML = `
      <div class="card">
        <div class="card-body" style="text-align:center; padding:3rem 1.5rem; color:var(--text-muted);">
          No classes assigned to your teacher account yet.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card no-print">
      <div class="card-header">
        <span class="card-title">
          ${icon('fileText')}
          <span>Download Individual Subject Marks Sheet (PDF)</span>
        </span>
      </div>
      <div class="card-body">
        <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1rem;">
          Select your class, examination, and assigned subject below to preview and print or save the individual Subject Marks Sheet / Award List PDF separately.
        </p>

        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Class</label>
              <select id="teacherPdfClassSelect" class="form-select" onchange="onTeacherPdfClassChange()">
                ${teacherClasses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Examination</label>
              <select id="teacherPdfDsSelect" class="form-select" onchange="onTeacherPdfDsChange()">
                <!-- Populated dynamically -->
              </select>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Your Assigned Subject</label>
              <select id="teacherPdfSubSelect" class="form-select" onchange="loadTeacherSubjectPdfPreview()">
                <!-- Populated dynamically -->
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="teacherSubjectPdfPreviewArea"></div>
  `;

  onTeacherPdfClassChange();
}

function onTeacherPdfClassChange() {
  const classSelect = document.getElementById('teacherPdfClassSelect');
  if (!classSelect) return;
  const classId = classSelect.value;
  const datesheets = (appData.datesheets || []).filter(d => d.classId === classId);
  const dsSelect = document.getElementById('teacherPdfDsSelect');
  const subSelect = document.getElementById('teacherPdfSubSelect');
  const previewArea = document.getElementById('teacherSubjectPdfPreviewArea');

  if (datesheets.length === 0) {
    if (dsSelect) dsSelect.innerHTML = `<option value="">-- No Date Sheets Available --</option>`;
    if (subSelect) subSelect.innerHTML = `<option value="">-- No Subjects --</option>`;
    if (previewArea) previewArea.innerHTML = '';
    return;
  }

  if (dsSelect) {
    dsSelect.innerHTML = datesheets.map(ds => `
      <option value="${ds.id}">${ds.title} (${ds.examTypeName || 'Exam'})</option>
    `).join('');
  }

  onTeacherPdfDsChange();
}

function onTeacherPdfDsChange() {
  const classSelect = document.getElementById('teacherPdfClassSelect');
  const dsSelect = document.getElementById('teacherPdfDsSelect');
  const subSelect = document.getElementById('teacherPdfSubSelect');
  const previewArea = document.getElementById('teacherSubjectPdfPreviewArea');
  if (!classSelect || !dsSelect || !subSelect) return;

  const classId = classSelect.value;
  const dsId = dsSelect.value;
  const ds = (appData.datesheets || []).find(d => d.id === dsId);

  if (!ds || !ds.items || ds.items.length === 0) {
    subSelect.innerHTML = `<option value="">-- No subjects in this assessment --</option>`;
    if (previewArea) previewArea.innerHTML = '';
    return;
  }

  const assignedSubs = ds.items.filter(s => isSubjectAssignedToTeacher(authTeacher, classId, s.code));

  if (assignedSubs.length === 0) {
    subSelect.innerHTML = `<option value="">-- No Subjects Assigned to You --</option>`;
    if (previewArea) {
      previewArea.innerHTML = `
        <div style="background:#fef3c7; color:#92400e; padding:1.25rem; border-radius:6px; border:1px solid #fde68a; font-size:0.9rem;">
          You are not assigned to any subjects in this examination date sheet.
        </div>
      `;
    }
    return;
  }

  subSelect.innerHTML = assignedSubs.map(s => {
    const maxM = s.maxMarks || getSubjectMaxMarks(ds.classId, s.code, ds.examType);
    return `<option value="${s.code}">${s.code} &mdash; ${s.title} (${maxM} Marks)</option>`;
  }).join('');

  loadTeacherSubjectPdfPreview();
}

function loadTeacherSubjectPdfPreview() {
  const dsSelect = document.getElementById('teacherPdfDsSelect');
  const subSelect = document.getElementById('teacherPdfSubSelect');
  const container = document.getElementById('teacherSubjectPdfPreviewArea');
  if (!dsSelect || !subSelect || !container) return;

  const dsId = dsSelect.value;
  const subCode = subSelect.value;
  if (!dsId || !subCode) {
    container.innerHTML = '';
    return;
  }

  const ds = (appData.datesheets || []).find(d => d.id === dsId);
  if (!ds) {
    container.innerHTML = '';
    return;
  }

  const classId = ds.classId;
  const className = (appData.classes.find(c => c.id === classId) || {}).name || classId;
  const subObj = ds.items.find(s => s.code === subCode) || {};
  const maxMarks = subObj.maxMarks || getSubjectMaxMarks(classId, subCode, ds.examType);
  const students = appData.students[classId] || [];
  const marksMap = (appData.marks && appData.marks[dsId] && appData.marks[dsId][subCode]) || {};

  let appeared = 0;
  let absent = 0;
  let passed = 0;
  let failed = 0;

  students.forEach(st => {
    const val = marksMap[st.roll];
    if (val === 'A' || val === 'a' || val === 'ABS') {
      absent++;
      failed++;
    } else if (val !== undefined && val !== null && val !== '') {
      appeared++;
      const num = parseFloat(val);
      if (num >= maxMarks * 0.4) {
        passed++;
      } else {
        failed++;
      }
    }
  });

  const passPct = appeared > 0 ? parseFloat(((passed / appeared) * 100).toFixed(1)) : 0;
  const isLocked = isSheetLocked(dsId, subCode);

  container.innerHTML = `
    <div class="card printable-result-card" style="margin-top:1rem;">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <h3 style="margin:0; font-size:1.15rem; font-weight:bold; color:var(--primary);">
            ${subCode} &mdash; ${subObj.title || subCode}
          </h3>
          <p style="margin:2px 0 0; font-size:0.85rem; color:var(--text-muted);">
            ${ds.title} &bull; ${className} &bull; Session: ${ds.session} &bull; Maximum Marks: <b>${maxMarks}</b>
          </p>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          ${isLocked ? '<span class="badge" style="background:#fee2e2; color:#991b1b; font-weight:700;">🔒 LOCKED</span>' : '<span class="badge" style="background:#dcfce7; color:#166534; font-weight:700;">🔓 UNLOCKED</span>'}
          <button class="btn btn-primary btn-sm" onclick="previewSubjectMarksSheet('${dsId}', '${subCode}')">
            ${icon('printer')} <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      <div class="card-body">
        <!-- Quick Stats -->
        <div class="award-stats-summary">
          <div class="award-stat-card">
            <div class="award-stat-val">${students.length}</div>
            <div class="award-stat-lbl">Total Enrolled</div>
          </div>
          <div class="award-stat-card">
            <div class="award-stat-val" style="color:#0284c7;">${appeared}</div>
            <div class="award-stat-lbl">Appeared</div>
          </div>
          <div class="award-stat-card">
            <div class="award-stat-val" style="color:#d97706;">${absent}</div>
            <div class="award-stat-lbl">Absent</div>
          </div>
          <div class="award-stat-card">
            <div class="award-stat-val" style="color:#16a34a;">${passed}</div>
            <div class="award-stat-lbl">Passed</div>
          </div>
          <div class="award-stat-card">
            <div class="award-stat-val" style="color:#dc2626;">${failed}</div>
            <div class="award-stat-lbl">Failed</div>
          </div>
          <div class="award-stat-card">
            <div class="award-stat-val" style="color:#7c3aed;">${passPct}%</div>
            <div class="award-stat-lbl">Pass Percentage</div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-bordered table-sm">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="width:40px; text-align:center;">#</th>
                <th style="width:110px;">Roll No</th>
                <th>Student Full Name</th>
                <th style="width:120px; text-align:center;">Max Marks</th>
                <th style="width:140px; text-align:center;">Obtained Marks</th>
                <th style="width:110px; text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${students.map((st, i) => {
                const val = marksMap[st.roll];
                const isAbs = (val === 'A' || val === 'a' || val === 'ABS');
                let displayVal = '-';
                let statusBadge = '<span class="badge badge-secondary">Pending</span>';

                if (isAbs) {
                  displayVal = '<b style="color:#dc2626;">ABS</b>';
                  statusBadge = '<span class="badge badge-danger">ABSENT</span>';
                } else if (val !== undefined && val !== null && val !== '') {
                  const num = parseFloat(val);
                  displayVal = `<b>${num}</b>`;
                  if (num >= maxMarks * 0.4) {
                    statusBadge = '<span class="badge badge-success">PASS</span>';
                  } else {
                    statusBadge = '<span class="badge badge-danger">FAIL</span>';
                  }
                }

                return `
                  <tr>
                    <td style="text-align:center;">${i + 1}</td>
                    <td><b>${st.roll}</b></td>
                    <td>${st.name}</td>
                    <td style="text-align:center;">${maxMarks}</td>
                    <td style="text-align:center;">${displayVal}</td>
                    <td style="text-align:center;">${statusBadge}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// Global exports
window.renderTeacherSubjectPdfDownload = renderTeacherSubjectPdfDownload;
window.onTeacherPdfClassChange = onTeacherPdfClassChange;
window.onTeacherPdfDsChange = onTeacherPdfDsChange;
window.loadTeacherSubjectPdfPreview = loadTeacherSubjectPdfPreview;

