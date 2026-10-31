/**
 * CIT Result Management System - Teacher Datesheet PDF Module
 * Handles viewing and downloading published date sheets as PDF for sharing with students (e.g. on WhatsApp).
 */

function renderTeacherDatesheetPdfDownload(container) {
  const datesheets = appData.datesheets || [];

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">
          ${icon('calendar')}
          <span>Download & Print Date Sheets (for WhatsApp)</span>
        </span>
      </div>
      <div class="card-body">
        <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.5rem;">
          Click "Print / Save PDF" on any date sheet below to save it as a PDF or print it to share with students on WhatsApp or noticeboards.
        </p>

        ${datesheets.length === 0 ? '<p style="text-align:center; color:var(--text-muted); padding:2rem;">No date sheets published yet.</p>' : ''}
        ${datesheets.map(ds => {
          const className = (appData.classes.find(c => c.id === ds.classId) || {}).name || ds.classId;
          const isMonthly = (ds.examType === 'monthly');

          return `
            <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem; margin-bottom: 1.25rem; background: #fff;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom: 0.75rem;">
                <div>
                  <h4 style="margin:0; font-weight:700; color:var(--primary);">${ds.title}</h4>
                  <small style="color:var(--text-muted);">${className} &bull; ${ds.session} &bull; ${ds.items.length} Theory Subjects</small>
                </div>
                <button class="btn btn-primary btn-sm no-print" onclick="previewDatesheet('${ds.id}')">
                  ${icon('printer')} Print / Save PDF
                </button>
              </div>

              <table class="table table-sm table-bordered">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="width:40px;">#</th>
                    <th style="width:110px;">Code</th>
                    <th>Subject</th>
                    <th style="width:85px; text-align:center;">Marks</th>
                    <th style="width:120px;">Exam Date</th>
                    <th style="width:105px; text-align:center;">Day</th>
                    ${!isMonthly ? '<th style="width:90px;">Time</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${ds.items.map((it, idx) => {
                    const maxM = it.maxMarks || getSubjectMaxMarks(ds.classId, it.code, ds.examType);
                    const dayStr = it.day || getDayNameFromDate(it.date);
                    return `
                      <tr>
                        <td>${idx + 1}</td>
                        <td><b>${it.code}</b></td>
                        <td>${it.title}</td>
                        <td style="text-align:center;"><b>${maxM}</b></td>
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
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Global exports
window.renderTeacherDatesheetPdfDownload = renderTeacherDatesheetPdfDownload;

