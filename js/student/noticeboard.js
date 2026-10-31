/**
 * CIT Result Management System - Student Notice Board & Date Sheets Module
 * Displays examination schedules, timetables, and departmental notices for students.
 */

var noticeboardSelectedClass = null;

function renderStudentNoticeboard(container, isPublicVisitor = false) {
  // If student is logged in, default to student's class; else 'cit1'
  if (!noticeboardSelectedClass) {
    noticeboardSelectedClass = (authStudent && authStudent.classId && authStudent.classId !== 'passouts') 
      ? authStudent.classId 
      : 'cit1';
  }

  const classes = appData.classes || [
    { id: 'cit1', name: 'CIT 1st Year' },
    { id: 'cit2', name: 'CIT 2nd Year' },
    { id: 'cit3', name: 'CIT 3rd Year' }
  ];

  const datesheets = (appData.datesheets || []).filter(ds => ds.classId === noticeboardSelectedClass);
  const activeClassObj = classes.find(c => c.id === noticeboardSelectedClass) || { name: 'CIT Class' };

  container.innerHTML = `
    ${isPublicVisitor ? `
      <!-- Quick Result Switcher Banner for Public Visitors -->
      <div class="no-print" style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color:#ffffff; padding:0.85rem 1.25rem; border-radius:8px; margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.6rem; border:1px solid rgba(255,255,255,0.1); box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <div style="background:var(--primary); width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; flex-shrink:0;">
            ${icon('award')}
          </div>
          <div>
            <div style="font-weight:700; font-size:0.92rem;">Looking for your Individual Examination Results?</div>
            <div style="font-size:0.76rem; color:#cbd5e1;">Enter your College Roll Number to view detailed marks, DMC & rank position.</div>
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-sm" style="font-weight:700; font-size:0.82rem; white-space:nowrap;" onclick="typeof setStudentPortalMode === 'function' ? setStudentPortalMode('search') : (window.location.href='index.html')">
          ${icon('search')} <span>Check My Result</span> &rarr;
        </button>
      </div>
    ` : ''}

    <!-- Notice Board Header Card -->
    <div class="card no-print" style="margin-bottom:1.25rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); border-radius:8px;">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; padding:1rem 1.25rem;">
        <div>
          <span class="card-title" style="font-size:1.15rem; font-weight:700;">
            ${icon('calendar')}
            <span>Departmental Examination Notice Board</span>
          </span>
          <small style="color:var(--text-muted); display:block; margin-top:3px; font-size:0.8rem;">
            Official theory examination timetables, dates, and candidate instructions for CIT students
          </small>
        </div>
        
        <!-- Class Filter Pill Buttons -->
        <div style="display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap;">
          ${classes.map(c => `
            <button type="button" class="btn btn-sm ${c.id === noticeboardSelectedClass ? 'btn-primary' : 'btn-outline'}" style="font-size:0.82rem; padding:0.35rem 0.75rem; font-weight:600;" onclick="onNoticeboardClassFilterChange('${c.id}')">
              ${escapeHtml(c.name)}
            </button>
          `).join('')}
        </div>
      </div>
      <div class="card-body" style="padding:0.9rem 1.25rem;">
        <!-- Institutional Notice Banner -->
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; padding:0.75rem 1rem; color:#1e40af; font-size:0.85rem; display:flex; align-items:flex-start; gap:0.6rem;">
          <div style="font-size:1.15rem; margin-top:2px;">${icon('shield')}</div>
          <div>
            <b>Examination Directorate Instructions:</b> All students must carry their official Technical College Roll Number Slip & ID Card. Entry into examination halls closes 15 minutes after the scheduled start time. Mobile phones and smartwatches are strictly prohibited inside the hall.
          </div>
        </div>
      </div>
    </div>

    <!-- Active Schedules Presentation -->
    <div id="noticeboardSchedulesArea">
      ${datesheets.length === 0 ? `
        <div class="card">
          <div class="card-body" style="text-align:center; padding:3rem 1.5rem; color:var(--text-muted);">
            <div style="font-size:2rem; color:#94a3b8; margin-bottom:0.5rem;">${icon('calendar')}</div>
            <h4 style="margin:0 0 0.25rem 0; font-weight:700; color:var(--text-main);">No Scheduled Exams for ${escapeHtml(activeClassObj.name)}</h4>
            <p style="font-size:0.85rem; max-width:440px; margin:0 auto;">
              No examination date sheets have been published for this class yet. New date sheets will appear here immediately once scheduled by the department.
            </p>
          </div>
        </div>
      ` : datesheets.map((ds, dsIdx) => {
        const isMonthly = (ds.examType === 'monthly');
        const items = ds.items || [];

        return `
          <div class="card" style="margin-bottom:1.5rem; box-shadow:0 3px 10px rgba(0,0,0,0.05);">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                  <span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:700; font-size:0.8rem;">
                    ${escapeHtml(ds.examTypeName || ds.examType)}
                  </span>
                  <h3 style="margin:0; font-size:1.15rem; font-weight:700; color:var(--primary);">
                    ${escapeHtml(ds.title)}
                  </h3>
                </div>
                <div style="font-size:0.82rem; color:var(--text-muted); margin-top:3px;">
                  Class: <b>${escapeHtml(activeClassObj.name)}</b> &bull; Academic Session: <b>${escapeHtml(ds.session)}</b> &bull; <b>${items.length}</b> Theory Papers
                </div>
              </div>
              <div class="no-print" style="display:flex; gap:0.4rem;">
                <button type="button" class="btn btn-primary btn-sm" onclick="previewDatesheet('${ds.id}')">
                  ${icon('printer')} <span>Print / Save Timetable (PDF)</span>
                </button>
              </div>
            </div>

            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-bordered table-sm" style="margin:0;">
                  <thead>
                    <tr style="background:#f8fafc;">
                      <th style="width:40px; text-align:center;">#</th>
                      <th style="width:110px;">Subject Code</th>
                      <th>Curriculum Subject Title</th>
                      <th style="width:85px; text-align:center;">Max Marks</th>
                      <th style="width:130px; text-align:center;">Examination Date</th>
                      <th style="width:110px; text-align:center;">Day</th>
                      ${!isMonthly ? '<th style="width:100px; text-align:center;">Timings</th>' : ''}
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map((it, idx) => {
                      const maxM = it.maxMarks || getSubjectMaxMarks(ds.classId, it.code, ds.examType);
                      const dayStr = it.day || getDayNameFromDate(it.date);

                      return `
                        <tr>
                          <td style="text-align:center;">${idx + 1}</td>
                          <td><b>${escapeHtml(it.code)}</b></td>
                          <td>${escapeHtml(it.title || it.code)}</td>
                          <td style="text-align:center;">
                            <span class="badge" style="background:#f1f5f9; color:#0f172a; font-weight:700;">${maxM}</span>
                          </td>
                          <td style="text-align:center; font-weight:600;">${formatDate(it.date)}</td>
                          <td style="text-align:center;">
                            <span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:600;">${escapeHtml(dayStr)}</span>
                          </td>
                          ${!isMonthly ? `<td style="text-align:center; font-size:0.8rem; font-weight:600;">${escapeHtml(it.time || '09:00 AM')}</td>` : ''}
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function onNoticeboardClassFilterChange(classId) {
  noticeboardSelectedClass = classId;
  const contentArea = document.getElementById('studentTabContent') || 
                      document.getElementById('noticeboardPublicArea') || 
                      document.getElementById('publicNoticeboardArea') || 
                      document.getElementById('publicNoticeboardModalArea') || 
                      document.getElementById('mainContentArea');
  if (contentArea) renderStudentNoticeboard(contentArea, !authStudent);
}

// Global exports
window.renderStudentNoticeboard = renderStudentNoticeboard;
window.onNoticeboardClassFilterChange = onNoticeboardClassFilterChange;
