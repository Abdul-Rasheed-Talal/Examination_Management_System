/**
 * CIT Result Management System - Admin Results & Analytics Module
 * Handles class result compilation, merit list calculations, letter grades, position ranking, and CSV export.
 */

function renderAdminResults(container) {
  const datesheets = appData.datesheets || [];

  container.innerHTML = `
    <div class="card no-print">
      <div class="card-header">
        <span class="card-title">
          ${icon('award')}
          <span>Class Result Compiler, Rankings & PDF</span>
        </span>
      </div>
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-md-5">
            <label class="form-label">Select Scheduled Assessment</label>
            <select id="adminResultDsSelect" class="form-select" onchange="loadCompiledClassResult()">
              ${datesheets.length === 0 ? '<option value="">-- No Date Sheets Available --</option>' : ''}
              ${datesheets.map(ds => {
                const className = (appData.classes.find(c => c.id === ds.classId) || {}).name;
                return `<option value="${ds.id}">${ds.title} (${className})</option>`;
              }).join('')}
            </select>
          </div>
          <div class="col-md-7" style="display:flex; gap:0.5rem; align-items:flex-end; padding-top:1.5rem;">
            <button class="btn btn-primary" onclick="printCompiledResult()">
              ${icon('printer')}
              <span>Print Official PDF</span>
            </button>
            <button class="btn btn-secondary" onclick="exportResultCSV()">
              ${icon('download')}
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div id="compiledResultContainer"></div>
  `;

  loadCompiledClassResult();
}

function evaluateDatesheetResults(dsId) {
  const ds = (appData.datesheets || []).find(d => d.id === dsId);
  if (!ds) return null;

  const classId = ds.classId;
  const className = (appData.classes.find(c => c.id === ds.classId) || {}).name || classId;
  const students = appData.students[classId] || [];
  const subjects = ds.items || [];
  const dsMarks = (appData.marks && appData.marks[dsId]) || {};

  // Build rows with marks, status, percentages
  let evaluatedRows = students.map(st => {
    let totalObt = 0;
    let totalMax = 0;
    let hasFail = false;
    let hasAnyMarks = false;
    let subjectEntries = [];

    subjects.forEach(sub => {
      const maxM = sub.maxMarks || getSubjectMaxMarks(classId, sub.code, ds.examType);
      const subMarks = dsMarks[sub.code] || {};
      const val = subMarks[st.roll];

      if (val === 'A' || val === 'a' || val === 'ABS') {
        subjectEntries.push({ val: 'ABS', obt: 0, max: maxM, isFail: true });
        totalMax += maxM;
        hasFail = true;
        hasAnyMarks = true;
      } else if (val !== undefined && val !== null && val !== '') {
        const num = parseFloat(val);
        const isF = num < (maxM * 0.4);
        if (isF) hasFail = true;
        subjectEntries.push({ val: num, obt: num, max: maxM, isFail: isF });
        totalObt += num;
        totalMax += maxM;
        hasAnyMarks = true;
      } else {
        subjectEntries.push({ val: '-', obt: 0, max: maxM, isFail: false });
      }
    });

    const pct = totalMax > 0 ? parseFloat(((totalObt / totalMax) * 100).toFixed(1)) : 0;
    const isPass = hasAnyMarks && totalMax > 0 && !hasFail && pct >= 40;
    const grade = getLetterGrade(pct, hasFail || !hasAnyMarks);

    return {
      roll: st.roll,
      name: st.name,
      session: st.session || appData.currentSession || '',
      entries: subjectEntries,
      totalObt: totalObt,
      totalMax: totalMax,
      percentage: pct,
      status: (!hasAnyMarks) ? 'PENDING' : (isPass ? 'PASS' : 'FAIL'),
      grade: (!hasAnyMarks) ? '-' : grade,
      hasAnyMarks: hasAnyMarks
    };
  });

  // Calculate Ranks: PASS students ranked by total obtained marks
  evaluatedRows.sort((a, b) => {
    if (a.status === 'PASS' && b.status !== 'PASS') return -1;
    if (a.status !== 'PASS' && b.status === 'PASS') return 1;
    return b.totalObt - a.totalObt;
  });

  let currentRank = 1;
  evaluatedRows.forEach((row) => {
    if (row.status === 'PASS') {
      row.rank = currentRank++;
    } else {
      row.rank = '-';
    }
  });

  const totalExamMax = subjects.reduce((sum, s) => sum + (s.maxMarks || getSubjectMaxMarks(classId, s.code, ds.examType)), 0);
  const appeared = evaluatedRows.filter(r => r.hasAnyMarks);
  const passedCount = evaluatedRows.filter(r => r.status === 'PASS').length;
  const failedCount = evaluatedRows.filter(r => r.status === 'FAIL').length;
  const passRate = appeared.length > 0 ? Math.round((passedCount / appeared.length) * 100) : 0;

  return {
    ds,
    classId,
    className,
    students,
    subjects,
    evaluatedRows,
    totalExamMax,
    appeared,
    passedCount,
    failedCount,
    passRate
  };
}

function buildResultTableHtml(evalData, isPrintDoc = false) {
  const { ds, classId, subjects, evaluatedRows } = evalData;

  return `
    <table class="table table-bordered table-sm result-sheet-table" style="margin:0;">
      <thead>
        <tr style="background:#f8fafc;">
          <th class="col-rank">Rank</th>
          <th class="col-roll">Roll</th>
          <th class="col-name">Student Name</th>
          ${subjects.map(s => {
            const maxM = s.maxMarks || getSubjectMaxMarks(classId, s.code, ds.examType);
            return `
              <th class="col-subject">
                ${s.code}<br>
                <small style="font-weight:600; color:var(--text-muted);">(${maxM}M)</small>
              </th>
            `;
          }).join('')}
          <th class="col-total">Total</th>
          <th class="col-pct">%</th>
          <th class="col-grade">Grade</th>
          <th class="col-status">Status</th>
        </tr>
      </thead>
      <tbody>
        ${evaluatedRows.map(sr => {
          let rowClass = '';
          let rankBadgeHtml = `<span class="rank-badge rank-badge-general">${sr.rank}</span>`;

          if (sr.status === 'FAIL') {
            rowClass = 'row-fail';
            rankBadgeHtml = `<span class="rank-badge badge-danger">FAIL</span>`;
          } else if (sr.rank === 1) {
            rowClass = 'rank-1-row';
            rankBadgeHtml = isPrintDoc ? `<span class="rank-badge rank-badge-1">1st</span>` : `<span class="rank-badge rank-badge-1">1st Position</span>`;
          } else if (sr.rank === 2) {
            rowClass = 'rank-2-row';
            rankBadgeHtml = isPrintDoc ? `<span class="rank-badge rank-badge-2">2nd</span>` : `<span class="rank-badge rank-badge-2">2nd Position</span>`;
          } else if (sr.rank === 3) {
            rowClass = 'rank-3-row';
            rankBadgeHtml = isPrintDoc ? `<span class="rank-badge rank-badge-3">3rd</span>` : `<span class="rank-badge rank-badge-3">3rd Position</span>`;
          }

          return `
            <tr class="${rowClass}">
              <td class="col-rank">${rankBadgeHtml}</td>
              <td class="col-roll" style="font-weight:bold;">${sr.roll}</td>
              <td class="col-name"><b>${sr.name}</b></td>
              ${sr.entries.map(e => `
                <td class="col-subject" style="${e.isFail ? 'color:var(--danger); font-weight:700;' : ''}">
                  ${e.val}
                </td>
              `).join('')}
              <td class="col-total" style="font-weight:bold;">${sr.hasAnyMarks ? `${sr.totalObt}/${sr.totalMax}` : '-'}</td>
              <td class="col-pct" style="font-weight:bold;">${sr.hasAnyMarks ? `${sr.percentage}%` : '-'}</td>
              <td class="col-grade">
                <span class="grade-badge grade-${sr.grade.replace('+', '-plus')}">${sr.grade}</span>
              </td>
              <td class="col-status">
                <span class="badge ${sr.status === 'PASS' ? 'badge-success' : (sr.status === 'FAIL' ? 'badge-danger' : 'badge-secondary')}">
                  ${sr.status}
                </span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function loadCompiledClassResult() {
  const dsSelect = document.getElementById('adminResultDsSelect');
  const container = document.getElementById('compiledResultContainer');
  if (!dsSelect || !container) return;

  const dsId = dsSelect.value;
  const evalData = evaluateDatesheetResults(dsId);

  if (!evalData) {
    container.innerHTML = `
      <div class="card">
        <div class="card-body" style="text-align:center; padding:3rem; color:var(--text-muted);">
          <p>No assessment selected or no date sheets created yet.</p>
        </div>
      </div>
    `;
    return;
  }

  const { ds, className, students, totalExamMax, passRate, passedCount, failedCount } = evalData;

  if (students.length === 0) {
    container.innerHTML = `
      <div class="card">
        <div class="card-body" style="text-align:center; padding:3rem; color:var(--text-muted);">
          <p>No students enrolled in <b>${className}</b> yet.</p>
          <button class="btn btn-outline btn-sm" onclick="setAdminTab('students')">
            ${icon('users')} Go to Student Rosters
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card printable-result-card" id="printableResultSheet">
      <div class="print-only-header">
        <h2>${appData.institution.name}</h2>
        <h3>${appData.institution.department}</h3>
        <p>${appData.institution.subtitle} &bull; ${appData.institution.city}</p>
      </div>

      <div class="card-header">
        <div>
          <h3 style="margin:0; font-size:1.15rem; font-weight:bold; color:var(--primary);">${ds.title} &mdash; Official Result Sheet</h3>
          <p style="margin:0; font-size:0.85rem; color:var(--text-muted);">
            Class: <b>${className}</b> &bull; Academic Session: <b>${ds.session}</b> &bull; Total Theory Marks: <b>${totalExamMax}</b>
          </p>
        </div>
        <div class="no-print" style="display:flex; gap:0.5rem; align-items:center;">
          <span class="badge badge-success">Pass Rate: ${passRate}%</span>
          <span class="badge" style="background:#e0f2fe; color:#0369a1;">Passed: ${passedCount}</span>
          <span class="badge badge-danger">Failed: ${failedCount}</span>
          <button class="btn btn-primary btn-sm" onclick="previewResultSheet('${ds.id}')">
            ${icon('printer')} <span>Print / PDF Preview</span>
          </button>
        </div>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive">
          ${buildResultTableHtml(evalData, false)}
        </div>
      </div>

      <div class="signature-section" style="display:none;">
        <div class="sig-box">Prepared & Verified By<br><small>CIT Examination Cell</small></div>
        <div class="sig-box">Head of CIT Department<br><small>Technical College</small></div>
        <div class="sig-box">Controller of Examinations<br><small>Academic Authority</small></div>
      </div>
    </div>
  `;
}

function printCompiledResult() {
  const dsSelect = document.getElementById('adminResultDsSelect');
  const dsId = dsSelect ? dsSelect.value : null;
  if (dsId) {
    previewResultSheet(dsId);
  } else {
    window.print();
  }
}

function exportResultCSV() {
  const dsSelect = document.getElementById('adminResultDsSelect');
  if (!dsSelect) return;
  const dsId = dsSelect.value;
  const evalData = evaluateDatesheetResults(dsId);
  if (!evalData) return;

  const { ds, classId, subjects, evaluatedRows } = evalData;

  let csv = `Rank,Roll No,Student Name,Session,` + 
    subjects.map(s => `"${s.code} (${s.maxMarks || getSubjectMaxMarks(classId, s.code, ds.examType)})"`).join(',') + 
    `,Total Obtained,Max Marks,Percentage,Grade,Status\n`;

  evaluatedRows.forEach(r => {
    const marksCols = r.entries.map(e => `"${e.val}"`).join(',');
    csv += `"${r.rank}","${r.roll}","${r.name}","${r.session}",${marksCols},${r.totalObt},${r.totalMax},"${r.percentage}%","${r.grade}","${r.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `Result_${ds.classId}_${ds.title.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Global exports
window.renderAdminResults = renderAdminResults;
window.evaluateDatesheetResults = evaluateDatesheetResults;
window.buildResultTableHtml = buildResultTableHtml;
window.loadCompiledClassResult = loadCompiledClassResult;
window.printCompiledResult = printCompiledResult;
window.exportResultCSV = exportResultCSV;

