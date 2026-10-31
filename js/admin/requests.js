/**
 * CIT Result Management System - Admin Edit Requests Module
 * Handles review, approval (unlocking the sheet), and rejection of Teacher Marks Edit Requests.
 */

function renderAdminEditRequests(container) {
  const requests = appData.editRequests || [];
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  container.innerHTML = `
    <div class="card">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
        <span class="card-title">
          ${icon('shield')}
          <span>Teacher Marks Edit Permission Requests</span>
        </span>
        <div style="display:flex; gap:0.4rem;">
          <span class="badge" style="background:#fef3c7; color:#92400e; font-weight:700;">Pending: ${pendingCount}</span>
          <span class="badge" style="background:#dcfce7; color:#166534; font-weight:700;">Approved: ${approvedCount}</span>
          <span class="badge" style="background:#fee2e2; color:#991b1b; font-weight:700;">Rejected: ${rejectedCount}</span>
        </div>
      </div>
      <div class="card-body">
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.25rem;">
          When subject teachers submit their marks sheet, it automatically locks to prevent accidental modifications. If a teacher enters marks incorrectly, they submit an edit request below. Approving a request unlocks that marks sheet for the teacher to correct and re-submit.
        </p>

        ${requests.length === 0 ? `
          <div style="text-align:center; padding:3rem 1.5rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; color:var(--text-muted);">
            <div style="font-size:1.1rem; font-weight:600; margin-bottom:0.25rem;">No Edit Requests</div>
            <p style="font-size:0.85rem; margin:0;">No teacher has requested permission to edit locked marks sheets.</p>
          </div>
        ` : `
          <div class="table-responsive">
            <table class="table table-bordered table-sm">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="width:130px;">Requested At</th>
                  <th>Teacher</th>
                  <th>Examination & Class</th>
                  <th>Subject</th>
                  <th>Teacher's Reason for Edit</th>
                  <th style="width:100px; text-align:center;">Status</th>
                  <th style="width:160px; text-align:center;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${requests.map(req => {
                  const isPending = (req.status === 'pending');
                  let statusBadge = '';
                  if (req.status === 'pending') {
                    statusBadge = '<span class="badge badge-pending">PENDING</span>';
                  } else if (req.status === 'approved') {
                    statusBadge = '<span class="badge badge-approved">APPROVED & UNLOCKED</span>';
                  } else if (req.status === 'rejected') {
                    statusBadge = '<span class="badge badge-rejected">REJECTED</span>';
                  } else {
                    statusBadge = '<span class="badge badge-secondary">COMPLETED</span>';
                  }

                  return `
                    <tr style="${isPending ? 'background:#fffdf5;' : ''}">
                      <td style="font-size:0.8rem; color:var(--text-muted);">
                        ${req.createdAt || '-'}
                      </td>
                      <td>
                        <div style="font-weight:700; color:#0f172a;">${escapeHtml(req.teacherName || req.teacherUsername)}</div>
                        <small style="color:var(--text-muted); font-family:monospace;">@${escapeHtml(req.teacherUsername)}</small>
                      </td>
                      <td>
                        <div><b>${escapeHtml(req.examTitle || 'Exam')}</b></div>
                        <small style="color:var(--text-muted);">${escapeHtml(req.className || req.classId)}</small>
                      </td>
                      <td>
                        <span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:700;">${escapeHtml(req.subCode)}</span>
                      </td>
                      <td style="font-size:0.85rem; color:#334155; line-height:1.4;">
                        <em>"${escapeHtml(req.reason)}"</em>
                        ${req.reviewedAt ? `
                          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px;">
                            Reviewed on: ${req.reviewedAt}
                          </div>
                        ` : ''}
                      </td>
                      <td style="text-align:center;">
                        ${statusBadge}
                      </td>
                      <td style="text-align:center;">
                        ${isPending ? `
                          <div style="display:inline-flex; gap:0.35rem;">
                            <button type="button" class="btn btn-sm btn-primary" style="padding:0.25rem 0.6rem; font-size:0.8rem;" onclick="approveEditRequestAdmin('${req.id}')" title="Approve and unlock marks sheet">
                              ${icon('unlock')} Approve
                            </button>
                            <button type="button" class="btn btn-sm btn-danger" style="padding:0.25rem 0.5rem; font-size:0.8rem;" onclick="rejectEditRequestAdmin('${req.id}')" title="Reject request">
                              Reject
                            </button>
                          </div>
                        ` : `
                          <button type="button" class="btn btn-outline btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="deleteEditRequestLog('${req.id}')">
                            Delete Log
                          </button>
                        `}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;
}

async function approveEditRequestAdmin(reqId) {
  const req = (appData.editRequests || []).find(r => r.id === reqId);
  if (!req) return;

  req.status = 'approved';
  req.reviewedAt = new Date().toLocaleString();
  req.reviewedBy = 'Administrator';

  appData.sheetLocks = appData.sheetLocks || {};
  const lockKey = `${req.dsId}_${req.subCode}`;
  appData.sheetLocks[lockKey] = {
    locked: false,
    unlockedAt: new Date().toLocaleString(),
    unlockedBy: 'Administrator',
    requestId: req.id,
    dsId: req.dsId,
    subCode: req.subCode
  };

  await persistData();
  showToast(`Approved! Marks sheet unlocked for ${req.subCode}. Teacher ${req.teacherName} can now edit marks.`);
  renderAdminEditRequests(document.getElementById('adminTabContent'));
}

async function rejectEditRequestAdmin(reqId) {
  const req = (appData.editRequests || []).find(r => r.id === reqId);
  if (!req) return;

  req.status = 'rejected';
  req.reviewedAt = new Date().toLocaleString();
  req.reviewedBy = 'Administrator';

  await persistData();
  showToast(`Rejected edit request for ${req.subCode}.`);
  renderAdminEditRequests(document.getElementById('adminTabContent'));
}

async function deleteEditRequestLog(reqId) {
  appData.editRequests = (appData.editRequests || []).filter(r => r.id !== reqId);
  await persistData();
  showToast("Request log removed.");
  renderAdminEditRequests(document.getElementById('adminTabContent'));
}

// Global exports
window.renderAdminEditRequests = renderAdminEditRequests;
window.approveEditRequestAdmin = approveEditRequestAdmin;
window.rejectEditRequestAdmin = rejectEditRequestAdmin;
window.deleteEditRequestLog = deleteEditRequestLog;

