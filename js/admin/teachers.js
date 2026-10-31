/**
 * CIT Result Management System - Admin Teachers Module
 * Handles Teacher CRUD operations, username/password provisioning, and fine-grained class/subject scoping.
 */

let editingTeacherId = null;

function renderAdminTeachers(container) {
  const teachers = appData.teachers || [];
  const cur = appData.curriculum || (typeof CIT_CURRICULUM !== 'undefined' ? CIT_CURRICULUM : {});
  const classes = appData.classes || [
    { id: 'cit1', name: 'CIT 1st Year' },
    { id: 'cit2', name: 'CIT 2nd Year' },
    { id: 'cit3', name: 'CIT 3rd Year' }
  ];

  const editingTeacher = editingTeacherId ? teachers.find(t => t.id === editingTeacherId) : null;

  container.innerHTML = `
    <div class="row">
      <!-- Left: Create / Edit Teacher Form -->
      <div class="col-md-5 no-print">
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <span class="card-title">
              ${icon(editingTeacher ? 'edit' : 'plus')}
              <span>${editingTeacher ? 'Edit Teacher Account' : 'Create New Teacher Account'}</span>
            </span>
            ${editingTeacher ? `
              <button class="btn btn-outline btn-sm" onclick="cancelEditTeacher()" title="Cancel editing">
                Cancel Edit
              </button>
            ` : ''}
          </div>
          <div class="card-body">
            <form onsubmit="handleSaveTeacher(event)">
              <div class="form-group">
                <label class="form-label" for="teacherFormName">
                  Teacher Full Name *
                </label>
                <input type="text" id="teacherFormName" class="form-control" placeholder="e.g. Engr. Muhammad Tariq" required value="${editingTeacher ? escapeHtml(editingTeacher.name) : ''}">
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label" for="teacherFormUsername">
                      Login Username *
                    </label>
                    <input type="text" id="teacherFormUsername" class="form-control" placeholder="e.g. tariq" required autocomplete="off" value="${editingTeacher ? escapeHtml(editingTeacher.username) : ''}">
                    <small style="font-size:0.75rem; color:var(--text-muted);">Unique username for teacher sign in</small>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label" for="teacherFormPassword">
                      Login Password *
                    </label>
                    <input type="text" id="teacherFormPassword" class="form-control" placeholder="Enter password" required autocomplete="off" value="${editingTeacher ? escapeHtml(editingTeacher.password) : 'teacher123'}">
                    <small style="font-size:0.75rem; color:var(--text-muted);">Teacher password to log in</small>
                  </div>
                </div>
              </div>

              <div style="margin-top:1rem; margin-bottom:0.5rem;">
                <h5 style="margin:0 0 0.35rem 0; font-size:0.92rem; font-weight:700; color:#0f172a;">
                  Assign Classes & Subjects
                </h5>
                <p style="margin:0; font-size:0.8rem; color:var(--text-muted);">
                  The teacher will only be able to enter marks and download marks sheets for checked subjects.
                </p>
              </div>

              ${classes.map(cls => {
                const classCurSubjects = (cur[cls.id] && cur[cls.id].midterm) ? cur[cls.id].midterm : [];
                const isClassAssigned = editingTeacher ? (editingTeacher.assignedClasses || []).includes(cls.id) : false;
                
                let assignedSubs = [];
                if (editingTeacher) {
                  if (editingTeacher.assignedSubjects && typeof editingTeacher.assignedSubjects === 'object' && !Array.isArray(editingTeacher.assignedSubjects)) {
                    assignedSubs = editingTeacher.assignedSubjects[cls.id] || [];
                  } else if (Array.isArray(editingTeacher.assignedSubjects)) {
                    assignedSubs = editingTeacher.assignedSubjects;
                  }
                }

                return `
                  <div class="teacher-assign-card" id="card_assign_${cls.id}">
                    <div class="teacher-assign-header">
                      <label style="cursor:pointer; display:inline-flex; align-items:center; gap:0.5rem; font-weight:700; font-size:0.9rem; color:#0f172a; margin:0;">
                        <input type="checkbox" id="assign_class_${cls.id}" ${isClassAssigned ? 'checked' : ''} onchange="onClassAssignCheckboxChange('${cls.id}', this.checked)">
                        <span>${cls.name}</span>
                      </label>
                      <div style="display:flex; gap:0.35rem;">
                        <button type="button" class="btn btn-outline btn-sm" style="padding:0.2rem 0.5rem; font-size:0.72rem;" onclick="selectAllSubjectsForClass('${cls.id}')">Select All</button>
                        <button type="button" class="btn btn-outline btn-sm" style="padding:0.2rem 0.5rem; font-size:0.72rem;" onclick="clearAllSubjectsForClass('${cls.id}')">Clear</button>
                      </div>
                    </div>

                    <div class="subject-checkbox-grid" id="grid_assign_${cls.id}">
                      ${classCurSubjects.map(sub => {
                        const isChecked = assignedSubs.some(s => s.toLowerCase() === sub.code.toLowerCase() || s.toLowerCase() === sub.code.replace(/-[AB]$/i, '').toLowerCase());
                        return `
                          <label class="subject-check-item ${isChecked ? 'checked' : ''}" id="label_${cls.id}_${sub.code.replace(/[^a-zA-Z0-9]/g, '_')}">
                            <input type="checkbox" name="subject_${cls.id}" value="${sub.code}" ${isChecked ? 'checked' : ''} onchange="toggleSubjectCheckItem('${cls.id}', '${sub.code}', this.checked)">
                            <div>
                              <b>${sub.code}</b>
                              <div style="font-size:0.75rem; color:#64748b; line-height:1.2;">${sub.title}</div>
                            </div>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  </div>
                `;
              }).join('')}

              <div style="margin-top:1.25rem; display:flex; gap:0.5rem;">
                <button type="submit" class="btn btn-primary" style="flex:1;">
                  ${icon('check')}
                  <span>${editingTeacher ? 'Update Teacher Account' : 'Save Teacher Account'}</span>
                </button>
                ${editingTeacher ? `
                  <button type="button" class="btn btn-secondary" onclick="cancelEditTeacher()">
                    Cancel
                  </button>
                ` : ''}
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Right: Existing Teachers List -->
      <div class="col-md-7">
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <span class="card-title">
              ${icon('users')}
              <span>Registered Teachers (${teachers.length})</span>
            </span>
          </div>
          <div class="card-body p-0">
            ${teachers.length === 0 ? `
              <div style="text-align:center; padding:3rem 1.5rem; color:var(--text-muted);">
                <p style="font-size:1rem; font-weight:600; margin-bottom:0.25rem;">No teachers registered yet</p>
                <p style="font-size:0.85rem;">Use the form on the left to create subject teachers and assign their curriculum classes.</p>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="table table-bordered table-sm" style="margin:0;">
                  <thead>
                    <tr style="background:#f8fafc;">
                      <th style="width:40px; text-align:center;">#</th>
                      <th>Teacher Name & Username</th>
                      <th>Assigned Classes</th>
                      <th>Assigned Subjects</th>
                      <th style="width:110px;">Password</th>
                      <th style="width:115px; text-align:center;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${teachers.map((t, idx) => {
                      const assignedClassesNames = (t.assignedClasses || []).map(cid => {
                        const cObj = classes.find(c => c.id === cid);
                        return cObj ? cObj.name.replace('CIT ', '') : cid;
                      });

                      let subjectsCount = 0;
                      let subjectPills = [];
                      if (t.assignedSubjects && typeof t.assignedSubjects === 'object' && !Array.isArray(t.assignedSubjects)) {
                        for (const cid in t.assignedSubjects) {
                          const list = t.assignedSubjects[cid] || [];
                          subjectsCount += list.length;
                          list.forEach(code => {
                            subjectPills.push(`<span class="badge" style="background:#e0f2fe; color:#0369a1; margin:1px; font-size:0.72rem;">${code}</span>`);
                          });
                        }
                      } else if (Array.isArray(t.assignedSubjects)) {
                        subjectsCount = t.assignedSubjects.length;
                        t.assignedSubjects.forEach(code => {
                          subjectPills.push(`<span class="badge" style="background:#e0f2fe; color:#0369a1; margin:1px; font-size:0.72rem;">${code}</span>`);
                        });
                      }

                      return `
                        <tr style="${editingTeacherId === t.id ? 'background:#ecfdf5;' : ''}">
                          <td style="text-align:center;">${idx + 1}</td>
                          <td>
                            <div style="font-weight:700; color:#0f172a;">${escapeHtml(t.name)}</div>
                            <div style="font-size:0.8rem; color:var(--text-muted); font-family:monospace;">
                              Username: <b>${escapeHtml(t.username)}</b>
                            </div>
                          </td>
                          <td>
                            ${assignedClassesNames.length > 0 
                              ? assignedClassesNames.map(cn => `<span class="badge badge-secondary" style="margin-right:2px; font-size:0.72rem;">${cn}</span>`).join('') 
                              : '<span style="color:#94a3b8; font-size:0.8rem;">None</span>'}
                          </td>
                          <td>
                            <div style="font-size:0.8rem; font-weight:600; margin-bottom:2px;">
                              ${subjectsCount} Subject${subjectsCount === 1 ? '' : 's'}
                            </div>
                            <div style="max-height:80px; overflow-y:auto; line-height:1.3;">
                              ${subjectPills.length > 0 ? subjectPills.slice(0, 10).join(' ') : '<span style="color:#94a3b8; font-size:0.8rem;">None</span>'}
                              ${subjectPills.length > 10 ? `<span style="font-size:0.75rem; color:#64748b;">+${subjectPills.length - 10} more</span>` : ''}
                            </div>
                          </td>
                          <td style="font-family:monospace; font-size:0.85rem;">
                            <span id="pass_mask_${t.id}">••••••••</span>
                            <span id="pass_text_${t.id}" style="display:none; color:var(--primary); font-weight:bold;">${escapeHtml(t.password)}</span>
                            <button type="button" class="btn btn-outline btn-sm" style="padding:1px 5px; font-size:0.68rem; margin-left:4px;" onclick="togglePassVisibility('${t.id}')">Show</button>
                          </td>
                          <td style="text-align:center;">
                            <div style="display:inline-flex; gap:0.25rem;">
                              <button type="button" class="btn btn-outline btn-sm" style="padding:0.25rem 0.5rem;" onclick="handleEditTeacher('${t.id}')" title="Edit Teacher">
                                ${icon('edit')}
                              </button>
                              <button type="button" class="btn btn-danger btn-sm" style="padding:0.25rem 0.5rem;" onclick="handleDeleteTeacher('${t.id}')" title="Delete Teacher">
                                ${icon('trash')}
                              </button>
                            </div>
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
      </div>
    </div>
  `;
}

function togglePassVisibility(id) {
  const mask = document.getElementById(`pass_mask_${id}`);
  const text = document.getElementById(`pass_text_${id}`);
  if (!mask || !text) return;
  if (text.style.display === 'none') {
    text.style.display = 'inline';
    mask.style.display = 'none';
  } else {
    text.style.display = 'none';
    mask.style.display = 'inline';
  }
}

function onClassAssignCheckboxChange(classId, isChecked) {
  if (isChecked) {
    selectAllSubjectsForClass(classId);
  } else {
    clearAllSubjectsForClass(classId);
  }
}

function toggleSubjectCheckItem(classId, subCode, isChecked) {
  const safeId = `label_${classId}_${subCode.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const label = document.getElementById(safeId);
  if (label) {
    if (isChecked) label.classList.add('checked');
    else label.classList.remove('checked');
  }

  const classCheckbox = document.getElementById(`assign_class_${classId}`);
  const checkedSubs = document.querySelectorAll(`input[name="subject_${classId}"]:checked`);
  if (classCheckbox) {
    classCheckbox.checked = checkedSubs.length > 0;
  }
}

function selectAllSubjectsForClass(classId) {
  const checkboxes = document.querySelectorAll(`input[name="subject_${classId}"]`);
  checkboxes.forEach(cb => {
    cb.checked = true;
    const safeId = `label_${classId}_${cb.value.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const label = document.getElementById(safeId);
    if (label) label.classList.add('checked');
  });
  const classCb = document.getElementById(`assign_class_${classId}`);
  if (classCb) classCb.checked = true;
}

function clearAllSubjectsForClass(classId) {
  const checkboxes = document.querySelectorAll(`input[name="subject_${classId}"]`);
  checkboxes.forEach(cb => {
    cb.checked = false;
    const safeId = `label_${classId}_${cb.value.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const label = document.getElementById(safeId);
    if (label) label.classList.remove('checked');
  });
  const classCb = document.getElementById(`assign_class_${classId}`);
  if (classCb) classCb.checked = false;
}

async function handleSaveTeacher(e) {
  e.preventDefault();
  const nameInput = document.getElementById('teacherFormName');
  const userInput = document.getElementById('teacherFormUsername');
  const passInput = document.getElementById('teacherFormPassword');

  const name = nameInput ? nameInput.value.trim() : '';
  const username = userInput ? userInput.value.trim().toLowerCase() : '';
  const password = passInput ? passInput.value.trim() : '';

  if (!name || !username || !password) {
    showToast("Please provide Teacher Full Name, Username and Password.", true);
    return;
  }

  if (!/^[a-z0-9_-]+$/i.test(username)) {
    showToast("Username can only contain letters, numbers, hyphens, and underscores.", true);
    return;
  }

  appData.teachers = appData.teachers || [];
  const existingWithSameUser = appData.teachers.find(t => t.username.toLowerCase() === username && t.id !== editingTeacherId);
  if (existingWithSameUser) {
    showToast(`The username "${username}" is already assigned to another teacher. Please pick a unique username.`, true);
    if (userInput) userInput.focus();
    return;
  }

  const assignedClasses = [];
  const assignedSubjects = {};

  const classes = appData.classes || [{ id: 'cit1' }, { id: 'cit2' }, { id: 'cit3' }];
  classes.forEach(cls => {
    const classCb = document.getElementById(`assign_class_${cls.id}`);
    const checkedSubs = Array.from(document.querySelectorAll(`input[name="subject_${cls.id}"]:checked`)).map(cb => cb.value);

    if (checkedSubs.length > 0 || (classCb && classCb.checked)) {
      assignedClasses.push(cls.id);
      assignedSubjects[cls.id] = checkedSubs;
    }
  });

  if (editingTeacherId) {
    const idx = appData.teachers.findIndex(t => t.id === editingTeacherId);
    if (idx !== -1) {
      appData.teachers[idx].name = name;
      appData.teachers[idx].username = username;
      appData.teachers[idx].password = password;
      appData.teachers[idx].assignedClasses = assignedClasses;
      appData.teachers[idx].assignedSubjects = assignedSubjects;
      appData.teachers[idx].updatedAt = new Date().toISOString();
      showToast(`Teacher account "${name}" updated successfully!`);
    }
    editingTeacherId = null;
  } else {
    const newId = 'tch_' + Date.now();
    appData.teachers.push({
      id: newId,
      name: name,
      username: username,
      password: password,
      assignedClasses: assignedClasses,
      assignedSubjects: assignedSubjects,
      createdAt: new Date().toISOString().split('T')[0]
    });
    showToast(`Teacher account "${name}" (${username}) created successfully!`);
  }

  await persistData();
  renderAdminTeachers(document.getElementById('adminTabContent'));
}

function handleEditTeacher(teacherId) {
  editingTeacherId = teacherId;
  renderAdminTeachers(document.getElementById('adminTabContent'));
  const nameInput = document.getElementById('teacherFormName');
  if (nameInput) nameInput.focus();
}

function cancelEditTeacher() {
  editingTeacherId = null;
  renderAdminTeachers(document.getElementById('adminTabContent'));
}

async function handleDeleteTeacher(teacherId) {
  const teacher = (appData.teachers || []).find(t => t.id === teacherId);
  const teacherName = teacher ? teacher.name : 'this teacher';

  if (!confirm(`Are you sure you want to delete ${teacherName} (${teacher ? teacher.username : ''})?\nThis teacher will no longer be able to log in.`)) {
    return;
  }

  appData.teachers = (appData.teachers || []).filter(t => t.id !== teacherId);
  if (editingTeacherId === teacherId) editingTeacherId = null;

  await persistData();
  showToast(`Teacher account "${teacherName}" deleted successfully.`);
  renderAdminTeachers(document.getElementById('adminTabContent'));
}

// Global exports
window.renderAdminTeachers = renderAdminTeachers;
window.togglePassVisibility = togglePassVisibility;
window.onClassAssignCheckboxChange = onClassAssignCheckboxChange;
window.toggleSubjectCheckItem = toggleSubjectCheckItem;
window.selectAllSubjectsForClass = selectAllSubjectsForClass;
window.clearAllSubjectsForClass = clearAllSubjectsForClass;
window.handleSaveTeacher = handleSaveTeacher;
window.handleEditTeacher = handleEditTeacher;
window.cancelEditTeacher = cancelEditTeacher;
window.handleDeleteTeacher = handleDeleteTeacher;

