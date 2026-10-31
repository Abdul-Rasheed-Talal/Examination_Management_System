/**
 * CIT Result Management System - Admin Datesheets Module
 * Handles Date Sheet creation, auto-fill day calculation, template reuse, viewing, and deletion.
 */

function renderAdminDatesheets(container) {
  const datesheets = appData.datesheets || [];

  container.innerHTML = `
    <div class="row">
      <!-- Create Date Sheet Form -->
      <div class="col-md-5 no-print">
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              ${icon('plus')}
              <span>Create New Date Sheet</span>
            </span>
          </div>
          <div class="card-body">
            <form id="createDatesheetForm" onsubmit="handleCreateDatesheet(event)">
              <div class="form-group">
                <label class="form-label">Step 1: Select Class</label>
                <select id="dsClassSelect" class="form-select" onchange="onDatesheetClassChange()" required>
                  <option value="cit1">CIT 1st Year</option>
                  <option value="cit2">CIT 2nd Year</option>
                  <option value="cit3">CIT 3rd Year</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Step 2: Select Examination Type</label>
                <select id="dsExamTypeSelect" class="form-select" onchange="onDatesheetTypeChange()" required>
                  <option value="monthly">Monthly Test (20 Marks per subject, Date only)</option>
                  <option value="midterm">Mid-Term Examination (50/75/100 Marks, Math Paper A & B)</option>
                  <option value="sendup">Send-Up Examination - Sandup (50/75/100 Marks, Math Paper A & B)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Step 3: Assessment Title</label>
                <input type="text" id="dsTitleInput" class="form-control" placeholder="e.g. Monthly Test" required value="Monthly Test ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}">
              </div>

              <div class="form-group">
                <label class="form-label">Step 4: Academic Session</label>
                <input type="text" id="dsSessionInput" class="form-control" value="${appData.currentSession || '2026-2027'}" required>
              </div>

              <div class="form-group">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.35rem;">
                  <div>
                    <label class="form-label" style="margin-bottom:0;">Step 5: Set Exam Schedule</label>
                    <small style="color:var(--text-muted); font-size:0.75rem; display:block;">Selecting date for 1st subject auto-fills all subjects.</small>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" onclick="reusePreviousDatesheetTemplate()">
                    ${icon('refresh')}
                    <span>Reuse Template</span>
                  </button>
                </div>
                <div id="datesheetSubjectsList" style="max-height: 290px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; background:#fff;"></div>
              </div>

              <button type="submit" class="btn btn-primary" style="width: 100%;">
                ${icon('check')}
                <span>Generate & Save Date Sheet</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Existing Date Sheets List -->
      <div class="col-md-7">
        <div class="card">
          <div class="card-header no-print">
            <span class="card-title">
              ${icon('calendar')}
              <span>Saved Examination Date Sheets (${datesheets.length})</span>
            </span>
          </div>
          <div class="card-body" id="savedDatesheetsList">
            ${datesheets.length === 0 ? '<p style="color:var(--text-muted); text-align:center; padding:2.5rem;">No date sheets created yet. Fill the form to create your examination date sheet.</p>' : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  onDatesheetClassOrTypeChange();
  renderSavedDatesheetsList();
}

function onDatesheetClassChange() {
  onDatesheetClassOrTypeChange();
}

function onDatesheetTypeChange() {
  const type = document.getElementById('dsExamTypeSelect').value;
  const titleInput = document.getElementById('dsTitleInput');
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();

  if (type === 'monthly') {
    titleInput.value = `Monthly Test ${monthName} ${year}`;
  } else if (type === 'midterm') {
    titleInput.value = `Mid-Term Examination ${year}`;
  } else {
    titleInput.value = `Send-Up Examination ${year}`;
  }

  onDatesheetClassOrTypeChange();
}

function onDatesheetClassOrTypeChange() {
  const classSelect = document.getElementById('dsClassSelect');
  const examTypeSelect = document.getElementById('dsExamTypeSelect');
  const container = document.getElementById('datesheetSubjectsList');
  if (!classSelect || !examTypeSelect || !container) return;

  const classId = classSelect.value;
  const examType = examTypeSelect.value;
  const subjects = getCurriculumSubjects(classId, examType);
  const isMonthly = (examType === 'monthly');

  container.innerHTML = subjects.map((sub, idx) => {
    let badgeColor = '#0369a1';
    let badgeBg = '#e0f2fe';
    if (sub.maxMarks === 100) {
      badgeColor = '#065f46';
      badgeBg = '#d1fae5';
    } else if (sub.maxMarks === 75) {
      badgeColor = '#854d0e';
      badgeBg = '#fef9c3';
    }

    const isFirst = (idx === 0);

    return `
      <div class="datesheet-subject-row" style="display:flex; align-items:center; justify-content:space-between; padding: 0.4rem 0.25rem; border-bottom: 1px solid #f1f5f9; gap: 0.5rem; font-size:0.85rem; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <label style="display:flex; align-items:center; gap: 0.4rem; cursor:pointer; margin:0;">
            <input type="checkbox" class="sub-checkbox" value="${sub.code}" data-title="${sub.title}" data-max="${sub.maxMarks}" checked>
            <span><b>${sub.code}</b> &mdash; ${sub.title}</span>
            ${isFirst ? '<span class="badge" style="background:#dcfce7; color:#15803d; font-size:0.7rem; margin-left:4px;">Master Date</span>' : ''}
          </label>
        </div>
        <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
          <span class="badge" style="background:${badgeBg}; color:${badgeColor}; font-weight:700; font-size:0.75rem; white-space:nowrap;">
            ${sub.maxMarks}M
          </span>
          <input type="date" class="form-control form-control-sm sub-date-input" 
            data-code="${sub.code}" data-idx="${idx}" 
            onchange="onSubjectDateChange(this, ${isFirst})" 
            oninput="onSubjectDateChange(this, ${isFirst})" 
            style="width:130px; font-size:0.8rem;" required>
          <span id="day_badge_${sub.code}" class="day-name-badge" title="Automatically selected Day">-</span>
          ${!isMonthly ? `
            <input type="text" class="form-control form-control-sm sub-time-input" data-code="${sub.code}" data-idx="${idx}" ${isFirst ? 'onchange="onFirstSubjectTimeChange(this.value)" oninput="onFirstSubjectTimeChange(this.value)"' : ''} value="09:00 AM" placeholder="09:00 AM" style="width:85px; font-size:0.8rem;">
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function getDayNameFromDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split(/[-/]/);
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-US', { weekday: 'long' });
    }
  }
  const dt = new Date(dateStr);
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('en-US', { weekday: 'long' });
}

function updateDayBadge(code, dayName) {
  const badge = document.getElementById(`day_badge_${code}`);
  if (!badge) return;
  if (dayName) {
    badge.textContent = dayName;
    badge.classList.add('active');
  } else {
    badge.textContent = '-';
    badge.classList.remove('active');
  }
}

function onSubjectDateChange(inputEl, isFirst) {
  const val = inputEl.value;
  const dayName = getDayNameFromDate(val);
  const code = inputEl.dataset.code;

  updateDayBadge(code, dayName);

  if (isFirst && val) {
    const dateInputs = document.querySelectorAll('#datesheetSubjectsList .sub-date-input');
    let count = 0;
    dateInputs.forEach((inp, idx) => {
      if (idx > 0) {
        inp.value = val;
        updateDayBadge(inp.dataset.code, dayName);
        count++;
      }
    });
    if (count > 0) {
      showToast(`Date & Day (${dayName}) applied to all ${count + 1} subjects.`);
    }
  }
}

function onFirstSubjectTimeChange(val) {
  if (!val) return;
  const timeInputs = document.querySelectorAll('#datesheetSubjectsList .sub-time-input');
  timeInputs.forEach((inp, idx) => {
    if (idx > 0) {
      inp.value = val;
    }
  });
}

function reusePreviousDatesheetTemplate() {
  const classId = document.getElementById('dsClassSelect').value;
  const examType = document.getElementById('dsExamTypeSelect').value;

  let existing = (appData.datesheets || []).filter(d => d.classId === classId && d.examType === examType).slice(-1)[0];
  if (!existing) {
    existing = (appData.datesheets || []).filter(d => d.classId === classId).slice(-1)[0];
  }

  if (!existing) {
    showToast("No previous date sheet found to copy from.", true);
    return;
  }

  existing.items.forEach(item => {
    const dateInput = document.querySelector(`.sub-date-input[data-code="${item.code}"]`);
    const timeInput = document.querySelector(`.sub-time-input[data-code="${item.code}"]`);
    if (dateInput) {
      dateInput.value = item.date;
      updateDayBadge(item.code, getDayNameFromDate(item.date));
    }
    if (timeInput && item.time) timeInput.value = item.time;
  });
  showToast(`Loaded schedule template from '${existing.title}'`);
}

function handleCreateDatesheet(e) {
  e.preventDefault();
  const classId = document.getElementById('dsClassSelect').value;
  const examType = document.getElementById('dsExamTypeSelect').value;
  const examTypeName = document.getElementById('dsExamTypeSelect').selectedOptions[0].text.split('(')[0].trim();
  const title = document.getElementById('dsTitleInput').value.trim();
  const session = document.getElementById('dsSessionInput').value.trim();
  const isMonthly = (examType === 'monthly');

  const selectedItems = [];
  document.querySelectorAll('#datesheetSubjectsList .sub-checkbox:checked').forEach(cb => {
    const code = cb.value;
    const titleText = cb.dataset.title;
    const maxMarks = parseInt(cb.dataset.max, 10) || (isMonthly ? 20 : 50);
    const dateInput = document.querySelector(`.sub-date-input[data-code="${code}"]`);
    const timeInput = document.querySelector(`.sub-time-input[data-code="${code}"]`);

    if (dateInput && dateInput.value) {
      selectedItems.push({
        code: code,
        title: titleText,
        maxMarks: maxMarks,
        date: dateInput.value,
        day: getDayNameFromDate(dateInput.value),
        time: isMonthly ? "" : (timeInput ? timeInput.value.trim() : "09:00 AM")
      });
    }
  });

  if (selectedItems.length === 0) {
    showToast("Please select at least one subject with an examination date.", true);
    return;
  }

  selectedItems.sort((a, b) => new Date(a.date) - new Date(b.date));

  const dsId = `ds_${classId}_${Date.now()}`;
  const newDatesheet = {
    id: dsId,
    classId: classId,
    examType: examType,
    examTypeName: examTypeName,
    title: title,
    session: session,
    createdAt: new Date().toISOString().split('T')[0],
    items: selectedItems
  };

  appData.datesheets = appData.datesheets || [];
  appData.datesheets.unshift(newDatesheet);
  persistData();

  showToast(`Date Sheet '${title}' created successfully.`);
  renderAdminDatesheets(document.getElementById('adminTabContent'));
}

function renderSavedDatesheetsList() {
  const container = document.getElementById('savedDatesheetsList');
  if (!container) return;

  const datesheets = appData.datesheets || [];
  if (datesheets.length === 0) {
    container.innerHTML = `
      <div style="border: 2px dashed var(--border-color); border-radius: 8px; padding: 2.5rem 1.5rem; text-align: center; color: var(--text-muted); background: #ffffff;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem; color: #94a3b8;">${icon('calendar')}</div>
        <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem;">No Date Sheets Created Yet</h4>
        <p style="font-size: 0.85rem; margin-bottom: 0.5rem; max-width: 420px; margin-left: auto; margin-right: auto;">
          Use the form on the left to select a class (CIT 1st, 2nd, or 3rd Year) and examination type to generate your first official date sheet.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = datesheets.map(ds => {
    const className = (appData.classes.find(c => c.id === ds.classId) || {}).name || ds.classId;
    const isMonthly = (ds.examType === 'monthly');

    return `
      <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem; margin-bottom: 1rem; background: #fff;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom: 0.75rem;">
          <div>
            <h4 style="margin:0; font-weight:700; color:var(--primary);">${ds.title}</h4>
            <div style="font-size:0.85rem; color:var(--text-muted);">
              <b>${className}</b> &bull; ${ds.session} &bull; ${ds.items.length} Theory Subjects
            </div>
          </div>
          <div class="no-print" style="display:flex; gap:0.4rem;">
            <button class="btn btn-primary btn-sm" onclick="previewDatesheet('${ds.id}')">
              ${icon('printer')}
              <span>Print / PDF</span>
            </button>
            <button class="btn btn-outline btn-sm text-danger" onclick="deleteDatesheet('${ds.id}')">
              ${icon('trash')}
              <span>Delete</span>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th style="width:35px;">#</th>
                <th style="width:105px;">Code</th>
                <th>Subject Title</th>
                <th style="width:75px; text-align:center;">Marks</th>
                <th style="width:115px;">Exam Date</th>
                <th style="width:100px; text-align:center;">Day</th>
                ${!isMonthly ? '<th style="width:85px;">Time</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${ds.items.map((it, i) => {
                const maxM = it.maxMarks || getSubjectMaxMarks(ds.classId, it.code, ds.examType);
                const dayStr = it.day || getDayNameFromDate(it.date);
                return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><b>${it.code}</b></td>
                    <td>${it.title}</td>
                    <td style="text-align:center;">
                      <span class="badge" style="background:#f1f5f9; color:#0f172a; font-weight:700;">${maxM}</span>
                    </td>
                    <td>${formatDate(it.date)}</td>
                    <td style="text-align:center;">
                      <span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:600;">${dayStr}</span>
                    </td>
                    ${!isMonthly ? `<td>${it.time || '-'}</td>` : ''}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

function deleteDatesheet(dsId) {
  if (!confirm("Are you sure you want to delete this date sheet?")) return;
  appData.datesheets = (appData.datesheets || []).filter(d => d.id !== dsId);
  persistData();
  showToast("Date sheet deleted.");
  renderAdminDatesheets(document.getElementById('adminTabContent'));
}

// Global exports
window.renderAdminDatesheets = renderAdminDatesheets;
window.onDatesheetClassChange = onDatesheetClassChange;
window.onDatesheetTypeChange = onDatesheetTypeChange;
window.onDatesheetClassOrTypeChange = onDatesheetClassOrTypeChange;
window.getDayNameFromDate = getDayNameFromDate;
window.updateDayBadge = updateDayBadge;
window.onSubjectDateChange = onSubjectDateChange;
window.onFirstSubjectTimeChange = onFirstSubjectTimeChange;
window.reusePreviousDatesheetTemplate = reusePreviousDatesheetTemplate;
window.handleCreateDatesheet = handleCreateDatesheet;
window.renderSavedDatesheetsList = renderSavedDatesheetsList;
window.deleteDatesheet = deleteDatesheet;

