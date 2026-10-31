/**
 * CIT Result Management System - UI & Modals Module
 * Handles toasts, printing modals, and modal dialogs (Print preview, Edit request dialog)
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

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

function previewSubjectMarksSheet(dsId, subCode) {
  if (!dsId || !subCode) {
    showToast("Please select a valid examination and subject first.", true);
    return;
  }

  const ds = (appData.datesheets || []).find(d => d.id === dsId);
  if (!ds) {
    showToast("Date sheet not found.", true);
    return;
  }

  const classId = ds.classId;
  const className = (appData.classes.find(c => c.id === classId) || {}).name || classId;
  const subObj = ds.items.find(s => s.code === subCode) || {};
  const maxMarks = subObj.maxMarks || getSubjectMaxMarks(classId, subCode, ds.examType);
  const passMarks = Math.round(maxMarks * 0.4);
  const students = appData.students[classId] || [];
  const marksMap = (appData.marks && appData.marks[dsId] && appData.marks[dsId][subCode]) || {};

  let teacherName = 'Subject Teacher Incharge';
  if (authRole === 'teacher' && authTeacher) {
    teacherName = authTeacher.name;
  } else {
    const assignedT = (appData.teachers || []).find(t => isSubjectAssignedToTeacher(t, classId, subCode));
    if (assignedT) teacherName = assignedT.name;
  }

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
      if (num >= passMarks) {
        passed++;
      } else {
        failed++;
      }
    }
  });

  const passPct = appeared > 0 ? parseFloat(((passed / appeared) * 100).toFixed(1)) : 0;
  const isLocked = isSheetLocked(dsId, subCode);

  createPrintModal(`
    <div class="printable-subject-container">
      <!-- Institutional Header -->
      <div class="print-only-header" style="text-align:center; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:10px;">
        <h2 style="font-size:14pt; font-weight:bold; margin:0 0 2px 0; text-transform:uppercase;">${appData.institution.name}</h2>
        <h3 style="font-size:11pt; font-weight:bold; margin:0 0 2px 0; color:#1e293b;">${appData.institution.department}</h3>
        <p style="font-size:8pt; color:#475569; margin:0;">${appData.institution.subtitle} &bull; ${appData.institution.city}</p>
      </div>

      <!-- Document Title & Exam Metadata -->
      <div style="text-align:center; margin-bottom:10px;">
        <h3 style="font-size:12pt; font-weight:bold; text-transform:uppercase; margin:0 0 4px 0; color:#0f172a; letter-spacing:0.5px;">
          OFFICIAL SUBJECT MARKS SHEET / AWARD LIST
        </h3>
        <h4 style="font-size:10.5pt; margin:0 0 4px 0; color:var(--primary); font-weight:bold;">
          ${subCode} &mdash; ${subObj.title || subCode}
        </h4>
        <div style="display:flex; justify-content:center; gap:1.25rem; flex-wrap:wrap; font-size:8.2pt; color:#334155; margin-top:4px;">
          <span>Examination: <b>${ds.title}</b></span>
          <span>Class: <b>${className}</b></span>
          <span>Session: <b>${ds.session}</b></span>
          <span>Max Theory Marks: <b>${maxMarks}</b></span>
          <span>Passing Marks (40%): <b>${passMarks}</b></span>
          <span>Subject Teacher: <b>${teacherName}</b></span>
          ${subObj.date ? `<span>Exam Date: <b>${formatDate(subObj.date)}</b></span>` : ''}
        </div>
      </div>

      <!-- Quick Statistical Award Summary Box -->
      <div class="award-stats-box" style="border:1px solid #000; background:#f8fafc; padding:6px 12px; font-size:8pt; display:flex; justify-content:space-between; margin-bottom:10px; border-radius:3px;">
        <div>Total Candidates: <b>${students.length}</b></div>
        <div>Appeared: <b style="color:#0369a1;">${appeared}</b></div>
        <div>Absent: <b style="color:#b91c1c;">${absent}</b></div>
        <div>Passed: <b style="color:#16a34a;">${passed}</b></div>
        <div>Failed: <b style="color:#dc2626;">${failed}</b></div>
        <div>Pass Rate: <b>${passPct}%</b></div>
        <div>Sheet Status: <b>${isLocked ? 'LOCKED / SUBMITTED' : 'UNLOCKED'}</b></div>
      </div>

      <!-- Tabular Award List -->
      <table class="subject-award-table" style="width:100%; border-collapse:collapse; border:1px solid #000; font-size:7.8pt;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="border:1px solid #000; padding:4px 6px; width:45px; text-align:center;">#</th>
            <th style="border:1px solid #000; padding:4px 6px; width:120px;">Roll Number</th>
            <th style="border:1px solid #000; padding:4px 6px; text-align:left;">Student Full Name</th>
            <th style="border:1px solid #000; padding:4px 6px; width:100px; text-align:center;">Max Marks</th>
            <th style="border:1px solid #000; padding:4px 6px; width:120px; text-align:center;">Obtained Marks</th>
            <th style="border:1px solid #000; padding:4px 6px; width:100px; text-align:center;">Result Status</th>
          </tr>
        </thead>
        <tbody>
          ${students.map((st, i) => {
            const val = marksMap[st.roll];
            const isAbs = (val === 'A' || val === 'a' || val === 'ABS');
            let displayVal = '-';
            let statusText = 'Pending';
            let statusColor = '#64748b';

            if (isAbs) {
              displayVal = '<b style="color:#dc2626;">ABS</b>';
              statusText = 'ABSENT';
              statusColor = '#dc2626';
            } else if (val !== undefined && val !== null && val !== '') {
              const num = parseFloat(val);
              displayVal = `<b>${num}</b>`;
              if (num >= passMarks) {
                statusText = 'PASS';
                statusColor = '#16a34a';
              } else {
                statusText = 'FAIL';
                statusColor = '#dc2626';
              }
            }

            return `
              <tr>
                <td style="border:1px solid #000; padding:3px 6px; text-align:center;">${i + 1}</td>
                <td style="border:1px solid #000; padding:3px 6px;"><b>${st.roll}</b></td>
                <td style="border:1px solid #000; padding:3px 6px;">${st.name}</td>
                <td style="border:1px solid #000; padding:3px 6px; text-align:center;">${maxMarks}</td>
                <td style="border:1px solid #000; padding:3px 6px; text-align:center;">${displayVal}</td>
                <td style="border:1px solid #000; padding:3px 6px; text-align:center; font-weight:bold; color:${statusColor};">
                  ${statusText}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- Examination Certification Notice -->
      <div style="border:1px solid #cbd5e1; padding:4px 8px; font-size:7.2pt; margin-top:8px; margin-bottom:14px; background:#f8fafc; border-radius:3px;">
        <b>Award List Certification:</b> 
        This is an official departmental theory marks award list. Minimum passing marks are 40% (${passMarks}/${maxMarks}). 
        ABS indicates that the candidate was absent from the examination.
      </div>

      <!-- Signature Section -->
      <div class="signature-section" style="display:flex; justify-content:space-between; margin-top:35px; text-align:center;">
        <div class="sig-box" style="width:180px; border-top:1px dashed #000; padding-top:4px; font-size:7.5pt; font-weight:bold;">
          ${teacherName}<br>
          <small style="font-weight:normal;">Subject Teacher Incharge</small>
        </div>
        <div class="sig-box" style="width:180px; border-top:1px dashed #000; padding-top:4px; font-size:7.5pt; font-weight:bold;">
          Incharge Tabulation Cell<br>
          <small style="font-weight:normal;">Examination Cell, CIT Dept.</small>
        </div>
        <div class="sig-box" style="width:180px; border-top:1px dashed #000; padding-top:4px; font-size:7.5pt; font-weight:bold;">
          Head of CIT Department<br>
          <small style="font-weight:normal;">Technical College, CIT Directorate</small>
        </div>
      </div>
    </div>
  `, false);
}

function openEditRequestModal(dsId, subCode, classId) {
  closeEditRequestModal();

  const ds = (appData.datesheets || []).find(d => d.id === dsId);
  const examTitle = ds ? ds.title : 'Examination';
  const subObj = ds ? (ds.items.find(s => s.code === subCode) || {}) : {};
  const className = (appData.classes.find(c => c.id === classId) || {}).name || classId;

  const modal = document.createElement('div');
  modal.id = 'editRequestModalOverlay';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h4 class="modal-title">
          ${icon('shield')}
          <span>Request Edit Permission from Administrator</span>
        </h4>
        <button type="button" class="btn btn-outline btn-sm" onclick="closeEditRequestModal()" style="padding:0.2rem 0.5rem;">✕</button>
      </div>
      <div class="modal-body">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:0.75rem 1rem; margin-bottom:1rem; font-size:0.85rem;">
          <div>Subject: <b style="color:var(--primary);">${subCode} &mdash; ${subObj.title || subCode}</b></div>
          <div>Examination: <b>${examTitle}</b> &bull; Class: <b>${className}</b></div>
        </div>

        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.75rem;">
          This marks sheet is locked. Please describe why you need to edit the student marks (e.g. incorrect marks entered for Roll 26-CIT-104) so the Administrator can approve your request.
        </p>

        <div class="form-group">
          <label class="form-label" for="editRequestReasonInput">
            Reason for Edit Request *
          </label>
          <textarea id="editRequestReasonInput" class="form-control" rows="3" placeholder="Explain the required modification, e.g. Roll 26-CIT-105 was given 12 marks by mistake instead of 18..." required autofocus></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeEditRequestModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="submitEditRequest('${dsId}', '${subCode}', '${classId}')">
          ${icon('check')} Submit Request
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const textarea = document.getElementById('editRequestReasonInput');
  if (textarea) textarea.focus();
}

function closeEditRequestModal() {
  const existing = document.getElementById('editRequestModalOverlay');
  if (existing) existing.remove();
}

async function submitEditRequest(dsId, subCode, classId) {
  const textarea = document.getElementById('editRequestReasonInput');
  const reason = textarea ? textarea.value.trim() : '';

  if (!reason) {
    showToast("Please enter a brief explanation for your edit request.", true);
    if (textarea) textarea.focus();
    return;
  }

  const ds = (appData.datesheets || []).find(d => d.id === dsId);
  const subObj = ds ? (ds.items.find(s => s.code === subCode) || {}) : {};
  const className = (appData.classes.find(c => c.id === classId) || {}).name || classId;

  appData.editRequests = appData.editRequests || [];

  const newReq = {
    id: 'req_' + Date.now(),
    dsId: dsId,
    subCode: subCode,
    subTitle: subObj.title || subCode,
    classId: classId,
    className: className,
    examTitle: ds ? ds.title : 'Exam',
    teacherId: authTeacher ? authTeacher.id : '',
    teacherName: authTeacher ? authTeacher.name : 'Teacher',
    teacherUsername: authTeacher ? authTeacher.username : 'teacher',
    reason: reason,
    status: 'pending',
    createdAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  };

  appData.editRequests.unshift(newReq);
  closeEditRequestModal();

  try {
    await persistData();
    showToast("Edit permission request submitted to Administrator!");
  } catch (e) {
    showToast("Request recorded locally, but sync error: " + e.message, true);
  }

  if (typeof renderTeacherMarksEntryTable === 'function') {
    renderTeacherMarksEntryTable();
  }
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

// Global exports
window.escapeHtml = escapeHtml;
window.formatDate = formatDate;
window.showToast = showToast;
window.closePrintModal = closePrintModal;
window.createPrintModal = createPrintModal;
window.previewDatesheet = previewDatesheet;
window.previewResultSheet = previewResultSheet;
window.previewSubjectMarksSheet = previewSubjectMarksSheet;
window.openEditRequestModal = openEditRequestModal;
window.closeEditRequestModal = closeEditRequestModal;
window.submitEditRequest = submitEditRequest;
window.printTeacherResult = printTeacherResult;

