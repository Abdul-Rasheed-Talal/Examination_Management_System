/**
 * CIT Result Management System - Student Result Card & Diagnostics Module
 * Handles student exam lookup by category (Monthly / Midterm / Sendup),
 * individual result card generation, and weak/strong subject academic analysis.
 */

var selectedStudentCategory = 'all';
var selectedStudentDsId = null;

function renderStudentResultsTab(container) {
  if (!authStudent) return;

  const student = authStudent;
  const allResults = getAllStudentResults(student.roll);

  // Available datesheets for this student's class
  const classDatesheets = (appData.datesheets || []).filter(ds => ds.classId === student.classId);

  // Filter datesheets by category
  let filteredDatesheets = classDatesheets;
  if (selectedStudentCategory !== 'all') {
    filteredDatesheets = classDatesheets.filter(ds => ds.examType === selectedStudentCategory);
  }

  // Set default selected datesheet if not set or invalid
  if (!selectedStudentDsId || !filteredDatesheets.some(d => d.id === selectedStudentDsId)) {
    selectedStudentDsId = filteredDatesheets.length > 0 ? filteredDatesheets[0].id : null;
  }

  // Active result data for the selected datesheet
  const currentResult = selectedStudentDsId ? allResults.find(r => r.dsId === selectedStudentDsId) : null;
  const selectedDsObj = (appData.datesheets || []).find(d => d.id === selectedStudentDsId);

  container.innerHTML = `
    <!-- Category & Exam Selection Card -->
    <div class="card no-print" style="margin-bottom:1.25rem;">
      <div class="card-header">
        <span class="card-title">
          ${icon('search')}
          <span>Select Examination Assessment</span>
        </span>
      </div>
      <div class="card-body">
        <div class="row align-items-center">
          <!-- Category Filter Pills -->
          <div class="col-md-6">
            <label class="form-label">Step 1: Examination Category</label>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              <button type="button" class="btn btn-sm ${selectedStudentCategory === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="setStudentCategoryFilter('all')">
                All Exams (${classDatesheets.length})
              </button>
              <button type="button" class="btn btn-sm ${selectedStudentCategory === 'monthly' ? 'btn-primary' : 'btn-outline'}" onclick="setStudentCategoryFilter('monthly')">
                Monthly Tests
              </button>
              <button type="button" class="btn btn-sm ${selectedStudentCategory === 'midterm' ? 'btn-primary' : 'btn-outline'}" onclick="setStudentCategoryFilter('midterm')">
                Mid-Term Exams
              </button>
              <button type="button" class="btn btn-sm ${selectedStudentCategory === 'sendup' ? 'btn-primary' : 'btn-outline'}" onclick="setStudentCategoryFilter('sendup')">
                Send-Up Exams
              </button>
            </div>
          </div>

          <!-- Specific Assessment Dropdown -->
          <div class="col-md-6">
            <div class="form-group" style="margin-bottom:0; margin-top:0.5rem;">
              <label class="form-label" for="studentExamSelect">Step 2: Select Specific Exam</label>
              <select id="studentExamSelect" class="form-select" onchange="onStudentExamSelectChange(this.value)">
                ${filteredDatesheets.length === 0 ? `<option value="">-- No Exams Scheduled in this Category --</option>` : ''}
                ${filteredDatesheets.map(ds => {
                  const hasMarks = allResults.some(r => r.dsId === ds.id);
                  return `
                    <option value="${ds.id}" ${ds.id === selectedStudentDsId ? 'selected' : ''}>
                      ${ds.title} (${ds.examTypeName || ds.examType}) ${hasMarks ? '✓ Marks Available' : '(Awaiting Marks)'}
                    </option>
                  `;
                }).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Result Presentation Area -->
    <div id="studentResultCardArea">
      ${!selectedDsObj ? `
        <div class="card">
          <div class="card-body" style="text-align:center; padding:3rem 1.5rem; color:var(--text-muted);">
            <div style="font-size:2rem; color:#94a3b8; margin-bottom:0.5rem;">${icon('calendar')}</div>
            <h4 style="margin:0 0 0.25rem 0; font-weight:700; color:var(--text-main);">No Examination Scheduled</h4>
            <p style="font-size:0.85rem; max-width:420px; margin:0 auto;">
              No date sheets have been published under this category for your class yet. Check the <b>Date Sheets & Notice Board</b> tab for upcoming schedules.
            </p>
          </div>
        </div>
      ` : (!currentResult ? `
        <div class="card">
          <div class="card-body" style="text-align:center; padding:3rem 1.5rem; color:var(--text-muted);">
            <div style="font-size:2rem; color:#f59e0b; margin-bottom:0.5rem;">${icon('edit')}</div>
            <h4 style="margin:0 0 0.25rem 0; font-weight:700; color:var(--text-main);">${escapeHtml(selectedDsObj.title)}</h4>
            <p style="font-size:0.88rem; max-width:460px; margin:0 auto 1rem;">
              Examination date sheet is published, but subject teachers have not finished tabulating marks for this assessment yet.
            </p>
            <button class="btn btn-outline btn-sm" onclick="previewDatesheet('${selectedDsObj.id}')">
              ${icon('calendar')} View Exam Schedule / Timetable
            </button>
          </div>
        </div>
      ` : `
        <!-- Official Student Result Card -->
        <div class="card printable-result-card" style="box-shadow:0 4px 12px rgba(0,0,0,0.06);">
          <!-- Institutional Card Header -->
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.75rem;">
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge ${currentResult.status === 'PASS' ? 'badge-success' : 'badge-danger'}" style="font-size:0.85rem; padding:0.35rem 0.75rem;">
                  ${currentResult.status}
                </span>
                <h3 style="margin:0; font-size:1.25rem; font-weight:700; color:var(--primary);">
                  ${escapeHtml(currentResult.dsTitle)}
                </h3>
              </div>
              <p style="margin:4px 0 0; font-size:0.85rem; color:var(--text-muted);">
                Class: <b>${escapeHtml(currentResult.className)}</b> &bull; Academic Session: <b>${escapeHtml(currentResult.session)}</b>
              </p>
            </div>

            <div class="no-print" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              <button type="button" class="btn btn-outline btn-sm" onclick="shareResultOnWhatsApp('${currentResult.dsId}', '${currentResult.roll}')" style="background:#25D366; color:#ffffff; border-color:#25D366;">
                ${icon('share')} <span>Share on WhatsApp</span>
              </button>
              <button type="button" class="btn btn-primary btn-sm" onclick="previewIndividualStudentResultCard('${currentResult.dsId}', '${currentResult.roll}')">
                ${icon('printer')} <span>Print / Save Result Card (PDF)</span>
              </button>
            </div>
          </div>

          <div class="card-body">
            <!-- Key Academic Summary Badges -->
            <div class="award-stats-summary" style="margin-bottom:1.25rem;">
              <div class="award-stat-card">
                <div class="award-stat-val" style="color:var(--primary);">${currentResult.totalObtained} / ${currentResult.totalMax}</div>
                <div class="award-stat-lbl">Aggregate Marks</div>
              </div>
              <div class="award-stat-card">
                <div class="award-stat-val" style="color:#0369a1;">${currentResult.percentage}%</div>
                <div class="award-stat-lbl">Percentage</div>
              </div>
              <div class="award-stat-card">
                <div class="award-stat-val">
                  <span class="grade-badge grade-${currentResult.grade.replace('+', '-plus')}" style="font-size:1.15rem; padding:0.25rem 0.65rem;">
                    ${currentResult.grade}
                  </span>
                </div>
                <div class="award-stat-lbl">Letter Grade</div>
              </div>
              <div class="award-stat-card">
                <div class="award-stat-val" style="color:#16a34a;">
                  ${typeof currentResult.rank === 'number' 
                    ? `<span class="rank-badge rank-badge-${currentResult.rank <= 3 ? currentResult.rank : 'general'}" style="font-size:1.1rem; padding:0.25rem 0.6rem;">${currentResult.rank}${getOrdinalSuffix(currentResult.rank)}</span>` 
                    : '-'}
                </div>
                <div class="award-stat-lbl">Class Rank / Position</div>
              </div>
            </div>

            <!-- Subject-Wise Marks Breakdown Table -->
            <div class="table-responsive">
              <table class="table table-bordered table-sm" style="margin:0;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="width:40px; text-align:center;">#</th>
                    <th style="width:115px;">Subject Code</th>
                    <th>Curriculum Subject Title</th>
                    <th style="width:90px; text-align:center;">Max Marks</th>
                    <th style="width:90px; text-align:center;">Passing (40%)</th>
                    <th style="width:110px; text-align:center;">Obtained Marks</th>
                    <th style="width:95px; text-align:center;">Status</th>
                    <th style="width:150px; text-align:center;">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  ${(currentResult.entries || []).map((entry, idx) => {
                    const isAbs = (entry.val === 'ABS');
                    const passMarks = Math.round(entry.max * 0.4);
                    let displayVal = '-';
                    let statusBadge = '<span class="badge badge-secondary">Pending</span>';
                    let performanceBar = '-';

                    if (isAbs) {
                      displayVal = '<b style="color:#dc2626;">ABS</b>';
                      statusBadge = '<span class="badge badge-danger">ABSENT</span>';
                      performanceBar = '<span style="font-size:0.75rem; color:#dc2626; font-weight:600;">Remained Absent</span>';
                    } else if (typeof entry.val === 'number') {
                      displayVal = `<b>${entry.val}</b>`;
                      const pct = Math.round((entry.val / entry.max) * 100);
                      if (entry.val >= passMarks) {
                        statusBadge = '<span class="badge badge-success">PASS</span>';
                        let perfColor = pct >= 75 ? '#16a34a' : (pct >= 60 ? '#0284c7' : '#d97706');
                        let perfLabel = pct >= 75 ? 'Excellent' : (pct >= 60 ? 'Good' : 'Satisfactory');
                        performanceBar = `
                          <div style="font-size:0.75rem; color:${perfColor}; font-weight:700;">
                            ${pct}% &bull; ${perfLabel}
                          </div>
                        `;
                      } else {
                        statusBadge = '<span class="badge badge-danger">FAIL</span>';
                        performanceBar = `
                          <div style="font-size:0.75rem; color:#dc2626; font-weight:700;">
                            ${pct}% &bull; Below 40% Pass Mark
                          </div>
                        `;
                      }
                    }

                    return `
                      <tr style="${entry.isFail ? 'background:#fff5f5;' : ''}">
                        <td style="text-align:center;">${idx + 1}</td>
                        <td><b>${escapeHtml(entry.code)}</b></td>
                        <td>${escapeHtml(entry.title || entry.code)}</td>
                        <td style="text-align:center;">${entry.max}</td>
                        <td style="text-align:center; color:var(--text-muted);">${passMarks}</td>
                        <td style="text-align:center; font-size:0.95rem;">${displayVal}</td>
                        <td style="text-align:center;">${statusBadge}</td>
                        <td style="text-align:center;">${performanceBar}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Examination Standards Notice -->
            <div style="margin-top:1rem; padding:0.65rem 0.85rem; background:#f8fafc; border:1px solid var(--border-color); border-radius:6px; font-size:0.8rem; color:var(--text-muted);">
              <b>Grading Policy:</b> Minimum passing marks are 40% in each individual theory subject. 
              Top 3 ranks are awarded to passing candidates based on total aggregate score. 
              This electronic result card is computer-generated for official departmental notification.
            </div>
          </div>
        </div>
      `)}
    </div>
  `;
}

function setStudentCategoryFilter(cat) {
  selectedStudentCategory = cat;
  const contentArea = document.getElementById('studentTabContent');
  if (contentArea) renderStudentResultsTab(contentArea);
}

function onStudentExamSelectChange(dsId) {
  selectedStudentDsId = dsId;
  const contentArea = document.getElementById('studentTabContent');
  if (contentArea) renderStudentResultsTab(contentArea);
}

function getOrdinalSuffix(i) {
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return "st Position";
  if (j === 2 && k !== 12) return "nd Position";
  if (j === 3 && k !== 13) return "rd Position";
  return "th Rank";
}

/**
 * Diagnostic & Weak/Strong Subject Tab
 */
function renderStudentDiagnosticsTab(container) {
  if (!authStudent) return;

  const student = authStudent;
  const allResults = getAllStudentResults(student.roll);
  const diag = analyzeStudentStrengthsAndWeaknesses(allResults);

  container.innerHTML = `
    <!-- Top Overall Performance Summary Card -->
    <div class="card" style="margin-bottom:1.25rem;">
      <div class="card-header">
        <span class="card-title">
          ${icon('trendingUp')}
          <span>Academic Performance & Diagnostic Overview</span>
        </span>
      </div>
      <div class="card-body">
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.25rem;">
          This analysis reviews your performance across all recorded examinations to identify strong subjects, borderline scores, and critical weak areas requiring revision before final Board examinations.
        </p>

        <div class="award-stats-summary">
          <div class="award-stat-card">
            <div class="award-stat-val" style="color:var(--primary);">${diag.totalExams}</div>
            <div class="award-stat-lbl">Exams Evaluated</div>
          </div>
          <div class="award-stat-card">
            <div class="award-stat-val" style="color:#16a34a;">${diag.examsPassed}</div>
            <div class="award-stat-lbl">Exams Passed</div>
          </div>
          <div class="award-stat-card">
            <div class="award-stat-val" style="color:#dc2626;">${diag.examsFailed}</div>
            <div class="award-stat-lbl">Exams with Failures</div>
          </div>
          <div class="award-stat-card">
            <div class="award-stat-val" style="color:#7c3aed;">${diag.overallAvg}%</div>
            <div class="award-stat-lbl">Cumulative Average</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Diagnostic Sections Grid -->
    <div class="row">
      <!-- 1. Critical Weaknesses -->
      <div class="col-md-6" style="margin-bottom:1.25rem;">
        <div class="card" style="border-top:4px solid #dc2626; height:100%;">
          <div class="card-header" style="background:#fef2f2; color:#991b1b;">
            <span class="card-title" style="color:#991b1b;">
              ${icon('alert')}
              <span>Subjects Requiring Immediate Attention (${diag.weakSubjects.length})</span>
            </span>
          </div>
          <div class="card-body">
            <p style="font-size:0.82rem; color:#7f1d1d; margin-bottom:0.75rem;">
              You have failed or scored below the mandatory 40% passing threshold in these subjects. Focus extra revision time on these topics.
            </p>

            ${diag.weakSubjects.length === 0 ? `
              <div style="text-align:center; padding:1.5rem; background:#f0fdf4; border-radius:6px; color:#166534; font-size:0.88rem; font-weight:600;">
                ✓ Excellent! No failing or critical weak subjects found.
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:0.6rem;">
                ${diag.weakSubjects.map(sub => `
                  <div class="diagnostic-alert-card diagnostic-weak">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                      <span class="badge badge-danger">${sub.code}</span>
                      <span style="font-weight:700; color:#dc2626; font-size:0.95rem;">${sub.avgPct}% Average</span>
                    </div>
                    <div style="font-weight:600; font-size:0.85rem; color:#0f172a; margin-bottom:0.25rem;">
                      ${escapeHtml(sub.title)}
                    </div>
                    <div style="font-size:0.75rem; color:#b91c1c;">
                      ${sub.fails > 0 ? `Failed ${sub.fails} time(s). ` : ''}
                      ${sub.absents > 0 ? `Absent ${sub.absents} time(s). ` : ''}
                      Passing requires at least 40%.
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- 2. Borderline Subjects (Needs Improvement) -->
      <div class="col-md-6" style="margin-bottom:1.25rem;">
        <div class="card" style="border-top:4px solid #f59e0b; height:100%;">
          <div class="card-header" style="background:#fffbeb; color:#92400e;">
            <span class="card-title" style="color:#92400e;">
              ${icon('edit')}
              <span>Borderline Subjects &mdash; Needs Improvement (${diag.borderlineSubjects.length})</span>
            </span>
          </div>
          <div class="card-body">
            <p style="font-size:0.82rem; color:#78350f; margin-bottom:0.75rem;">
              You have passed these subjects, but your score is between 40% and 54% (close to cutoff). Practice past papers to improve your grade.
            </p>

            ${diag.borderlineSubjects.length === 0 ? `
              <div style="text-align:center; padding:1.5rem; background:#f8fafc; border-radius:6px; color:var(--text-muted); font-size:0.85rem;">
                No borderline subjects currently recorded.
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:0.6rem;">
                ${diag.borderlineSubjects.map(sub => `
                  <div class="diagnostic-alert-card diagnostic-borderline">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                      <span class="badge" style="background:#fef3c7; color:#92400e; font-weight:700;">${sub.code}</span>
                      <span style="font-weight:700; color:#b45309; font-size:0.95rem;">${sub.avgPct}% Average</span>
                    </div>
                    <div style="font-weight:600; font-size:0.85rem; color:#0f172a; margin-bottom:0.25rem;">
                      ${escapeHtml(sub.title)}
                    </div>
                    <div style="font-size:0.75rem; color:#78350f;">
                      Passing safely, but needs reinforcement to reach 60%+ (Grade B/A).
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Strong Subjects Showcase -->
    <div class="card" style="border-top:4px solid #16a34a; margin-bottom:1.25rem;">
      <div class="card-header" style="background:#f0fdf4; color:#166534;">
        <span class="card-title" style="color:#166534;">
          ${icon('award')}
          <span>Strong Subjects &mdash; High Academic Achievement (${diag.strongSubjects.length})</span>
        </span>
      </div>
      <div class="card-body">
        <p style="font-size:0.82rem; color:#14532d; margin-bottom:0.75rem;">
          You achieved 70% or higher (Grade A/A+) in these subjects. Maintain your consistency in these core areas.
        </p>

        ${diag.strongSubjects.length === 0 ? `
          <div style="text-align:center; padding:1.5rem; background:#f8fafc; border-radius:6px; color:var(--text-muted); font-size:0.85rem;">
            No subjects currently above 70%. Keep working hard!
          </div>
        ` : `
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:0.75rem;">
            ${diag.strongSubjects.map(sub => `
              <div class="diagnostic-alert-card diagnostic-strong">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                  <span class="badge badge-success">${sub.code}</span>
                  <span style="font-weight:700; color:#15803d; font-size:1.05rem;">${sub.avgPct}%</span>
                </div>
                <div style="font-weight:600; font-size:0.88rem; color:#0f172a;">
                  ${escapeHtml(sub.title)}
                </div>
                <div style="font-size:0.75rem; color:#166534; margin-top:2px;">
                  High Mastery &bull; Grade A/A+ Performance
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>

    <!-- 4. Examination Progression History -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          ${icon('calendar')}
          <span>Exam-by-Exam Performance Progression</span>
        </span>
      </div>
      <div class="card-body p-0">
        ${allResults.length === 0 ? `
          <div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:0.85rem;">
            No exam results recorded for your roll number yet.
          </div>
        ` : `
          <div class="table-responsive">
            <table class="table table-bordered table-sm" style="margin:0;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="width:40px; text-align:center;">#</th>
                  <th>Assessment Title</th>
                  <th style="width:130px; text-align:center;">Exam Type</th>
                  <th style="width:120px; text-align:center;">Marks</th>
                  <th style="width:100px; text-align:center;">Percentage</th>
                  <th style="width:90px; text-align:center;">Grade</th>
                  <th style="width:120px; text-align:center;">Class Position</th>
                  <th style="width:95px; text-align:center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${allResults.map((res, i) => `
                  <tr>
                    <td style="text-align:center;">${i + 1}</td>
                    <td><b>${escapeHtml(res.dsTitle)}</b></td>
                    <td style="text-align:center;">
                      <span class="badge badge-secondary" style="font-size:0.72rem;">${escapeHtml(res.examTypeName)}</span>
                    </td>
                    <td style="text-align:center; font-weight:600;">${res.totalObtained} / ${res.totalMax}</td>
                    <td style="text-align:center; font-weight:700; color:var(--primary);">${res.percentage}%</td>
                    <td style="text-align:center;">
                      <span class="grade-badge grade-${res.grade.replace('+', '-plus')}">${res.grade}</span>
                    </td>
                    <td style="text-align:center;">
                      ${typeof res.rank === 'number' 
                        ? `<span class="rank-badge rank-badge-${res.rank <= 3 ? res.rank : 'general'}">${res.rank}${getOrdinalSuffix(res.rank).split(' ')[0]}</span>` 
                        : '-'}
                    </td>
                    <td style="text-align:center;">
                      <span class="badge ${res.status === 'PASS' ? 'badge-success' : 'badge-danger'}">${res.status}</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * 1-Click WhatsApp Result Share Generator
 */
function shareResultOnWhatsApp(dsId, rollNo) {
  const allResults = getAllStudentResults(rollNo);
  const result = allResults.find(r => r.dsId === dsId);
  if (!result) {
    showToast("Result not found to share.", true);
    return;
  }

  const institutionName = (appData.institution && appData.institution.name) || "Technical College";
  const departmentName = (appData.institution && appData.institution.department) || "CIT Department";

  const message = 
`🎓 *${institutionName.toUpperCase()}*
🏛️ *${departmentName.toUpperCase()}*
📋 *OFFICIAL EXAMINATION RESULT NOTIFICATION*
━━━━━━━━━━━━━━━━━━━━━━
👤 *Student Name:* ${result.studentName}
🆔 *Roll Number:* ${result.roll}
🏫 *Class:* ${result.className} (${result.session})
📝 *Examination:* ${result.dsTitle}
━━━━━━━━━━━━━━━━━━━━━━
📊 *Total Obtained:* ${result.totalObtained} / ${result.totalMax}
📈 *Percentage:* ${result.percentage}%
🏆 *Letter Grade:* ${result.grade}
🎖️ *Class Rank:* ${typeof result.rank === 'number' ? `${result.rank}${getOrdinalSuffix(result.rank)}` : 'N/A'}
✅ *Final Status:* ${result.status}
━━━━━━━━━━━━━━━━━━━━━━
_CIT Result Management System &bull; Electronic Award Verification_`;

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
}

// Global exports
window.renderStudentResultsTab = renderStudentResultsTab;
window.setStudentCategoryFilter = setStudentCategoryFilter;
window.onStudentExamSelectChange = onStudentExamSelectChange;
window.renderStudentDiagnosticsTab = renderStudentDiagnosticsTab;
window.shareResultOnWhatsApp = shareResultOnWhatsApp;
