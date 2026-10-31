/**
 * CIT Examination & Result Management System
 * Core State & Academic Model Helpers
 */

var appData = null;
var authRole = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cit_auth_role') : null) || null; // 'admin', 'teacher', or null
var authTeacher = null;
try {
  const cachedTeacher = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem('cit_auth_teacher') : null;
  if (cachedTeacher) authTeacher = JSON.parse(cachedTeacher);
} catch (e) {
  authTeacher = null;
}

var loginSelectedRole = 'teacher'; // 'admin' or 'teacher' on login screen
var adminActiveTab = 'datesheets'; // 'datesheets', 'results', 'students', 'teachers', 'marks', 'requests', 'settings'
var teacherActiveTab = 'marks'; // 'marks', 'subject_pdf', 'datesheet_pdf'
var activeRosterClass = 'cit1'; // 'cit1', 'cit2', 'cit3', or 'passouts'
var editingTeacherId = null; // ID of teacher being edited in admin portal

var CIT_APP_STORAGE_VERSION = 'v5_cit_excel_2026';
var activeStorageSource = 'cloud'; // 'database', 'json_fallback', 'local_fallback'

function ensureAppDataIntegrity() {
  if (!appData) return;
  if (!appData.currentSession) appData.currentSession = "2026-2027";
  if (!appData.passouts) appData.passouts = [];
  if (!appData.passwords) appData.passwords = { admin: "admin123", teacher: "teacher123" };
  if (!appData.marks || Array.isArray(appData.marks) || typeof appData.marks !== 'object') {
    appData.marks = {};
  }
  if (!appData.sheetLocks || typeof appData.sheetLocks !== 'object') {
    appData.sheetLocks = {};
  }
  if (!appData.editRequests || !Array.isArray(appData.editRequests)) {
    appData.editRequests = [];
  }

  // Ensure default teacher exists if empty
  if (!appData.teachers || !Array.isArray(appData.teachers) || appData.teachers.length === 0) {
    const curRef = (typeof CIT_CURRICULUM !== 'undefined' ? CIT_CURRICULUM : null) || 
                   (typeof window !== 'undefined' ? window.CIT_CURRICULUM : null);
    appData.teachers = [
      {
        id: "tch_default",
        name: "Engr. CIT Subject Teacher",
        username: "teacher",
        password: (appData.passwords && appData.passwords.teacher) ? appData.passwords.teacher : "teacher123",
        assignedClasses: ["cit1", "cit2", "cit3"],
        assignedSubjects: {
          "cit1": curRef ? curRef.cit1.midterm.map(s => s.code) : ["GEN-111","TTQ-111","Eng-112","Math-123-A","Math-123-B","Phy-132","Ch-132","CIT-101","CIT-103","CIT-124","CIT-114"],
          "cit2": curRef ? curRef.cit2.midterm.map(s => s.code) : ["Gen-211","TTQ-211","Math-223-A","Math-223-B","Mgm-211","CIT-203","CIT-273","CIT-222","CIT-283","CIT-293","CIT-204"],
          "cit3": curRef ? curRef.cit3.midterm.map(s => s.code) : ["GEN-311","CIT-322","CIT-312","CIT-313","CIT-314","CIT-343","CIT-372"]
        },
        createdAt: "2026-10-31"
      }
    ];
  }

  // Ensure classes exist
  if (!appData.classes || !Array.isArray(appData.classes) || appData.classes.length === 0) {
    appData.classes = [
      { id: "cit1", name: "CIT 1st Year", session: appData.currentSession },
      { id: "cit2", name: "CIT 2nd Year", session: appData.currentSession },
      { id: "cit3", name: "CIT 3rd Year", session: appData.currentSession }
    ];
  }

  // Ensure curriculum exists
  if (!appData.curriculum) {
    const curRef = (typeof CIT_CURRICULUM !== 'undefined' ? CIT_CURRICULUM : null) || 
                   (typeof window !== 'undefined' ? window.CIT_CURRICULUM : null);
    if (curRef) appData.curriculum = curRef;
  }
}

/**
 * Checks if a specific subject is assigned to a teacher
 */
function isSubjectAssignedToTeacher(teacher, classId, subCode) {
  if (!teacher) return true; // Administrator or unrestricted
  if (teacher.assignedClasses && teacher.assignedClasses.length > 0) {
    if (!teacher.assignedClasses.includes(classId)) return false;
  }

  if (!teacher.assignedSubjects) return true;

  let classSubjects = [];
  if (Array.isArray(teacher.assignedSubjects)) {
    classSubjects = teacher.assignedSubjects;
  } else if (typeof teacher.assignedSubjects === 'object' && teacher.assignedSubjects[classId]) {
    classSubjects = teacher.assignedSubjects[classId];
  } else {
    return false;
  }

  if (classSubjects.length === 0) return false;

  const baseSubCode = subCode.replace(/-[AB]$/i, '');
  return classSubjects.some(assignedCode => {
    const baseAssigned = assignedCode.replace(/-[AB]$/i, '');
    return assignedCode.toLowerCase() === subCode.toLowerCase() ||
           baseAssigned.toLowerCase() === baseSubCode.toLowerCase();
  });
}

function isSheetLocked(dsId, subCode) {
  if (!appData || !appData.sheetLocks) return false;
  const lock = appData.sheetLocks[`${dsId}_${subCode}`];
  return Boolean(lock && lock.locked);
}

function getSheetLockInfo(dsId, subCode) {
  if (!appData || !appData.sheetLocks) return null;
  return appData.sheetLocks[`${dsId}_${subCode}`] || null;
}

function getPendingEditRequest(dsId, subCode) {
  if (!appData || !appData.editRequests) return null;
  return appData.editRequests.find(r => r.dsId === dsId && r.subCode === subCode && r.status === 'pending') || null;
}

function getApprovedEditRequest(dsId, subCode) {
  if (!appData || !appData.editRequests) return null;
  return appData.editRequests.find(r => r.dsId === dsId && r.subCode === subCode && r.status === 'approved') || null;
}

function getCurriculumSubjects(classId, examType) {
  const cur = (appData && appData.curriculum) ? appData.curriculum : (typeof CIT_CURRICULUM !== 'undefined' ? CIT_CURRICULUM : {});
  if (!cur || !cur[classId]) return [];
  if (examType === 'monthly') {
    return cur[classId].monthly || [];
  }
  return cur[classId][examType] || cur[classId].midterm || [];
}

function getSubjectMaxMarks(classId, subjectCode, examType) {
  if (examType === 'monthly') return 20;

  const cur = (appData && appData.curriculum) ? appData.curriculum : (typeof CIT_CURRICULUM !== 'undefined' ? CIT_CURRICULUM : null);
  if (cur && cur[classId] && cur[classId][examType]) {
    const found = cur[classId][examType].find(s => s.code === subjectCode);
    if (found && found.maxMarks) return found.maxMarks;
  }

  if (subjectCode.includes('112') || subjectCode.includes('124') || subjectCode.includes('114') ||
      subjectCode.includes('203') || subjectCode.includes('273') || subjectCode.includes('283') || 
      subjectCode.includes('204') || subjectCode.includes('314') || subjectCode.includes('343')) {
    return 100;
  }
  if (subjectCode.includes('132') || subjectCode.includes('313')) {
    return 75;
  }
  return 50;
}

function getLetterGrade(percentage, hasFail) {
  if (hasFail || percentage < 40) return 'FAIL';
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  return 'D';
}

function calculateNextSession(currentSession) {
  if (!currentSession) return "2027-2028";
  const parts = currentSession.split('-');
  if (parts.length === 2) {
    const y1 = parseInt(parts[0], 10);
    const y2 = parseInt(parts[1], 10);
    if (!isNaN(y1) && !isNaN(y2)) {
      return `${y1 + 1}-${y2 + 1}`;
    }
  }
  return "2027-2028";
}

function detectClassFromString(str) {
  if (!str) return null;
  const s = str.toLowerCase();
  if (s.includes('1st') || s.includes('first') || s.includes('cit-1') || s.includes('cit 1') || s.includes('cit1')) return 'cit1';
  if (s.includes('2nd') || s.includes('second') || s.includes('cit-2') || s.includes('cit 2') || s.includes('cit2')) return 'cit2';
  if (s.includes('3rd') || s.includes('third') || s.includes('cit-3') || s.includes('cit 3') || s.includes('cit3')) return 'cit3';
  return null;
}

if (typeof window !== 'undefined') {
  window.appData = appData;
  window.authRole = authRole;
  window.authTeacher = authTeacher;
  window.loginSelectedRole = loginSelectedRole;
  window.adminActiveTab = adminActiveTab;
  window.teacherActiveTab = teacherActiveTab;
  window.activeRosterClass = activeRosterClass;
  window.editingTeacherId = editingTeacherId;
  window.CIT_APP_STORAGE_VERSION = CIT_APP_STORAGE_VERSION;
  window.activeStorageSource = activeStorageSource;

  window.ensureAppDataIntegrity = ensureAppDataIntegrity;
  window.isSubjectAssignedToTeacher = isSubjectAssignedToTeacher;
  window.isSheetLocked = isSheetLocked;
  window.getSheetLockInfo = getSheetLockInfo;
  window.getPendingEditRequest = getPendingEditRequest;
  window.getApprovedEditRequest = getApprovedEditRequest;
  window.getCurriculumSubjects = getCurriculumSubjects;
  window.getSubjectMaxMarks = getSubjectMaxMarks;
  window.getLetterGrade = getLetterGrade;
  window.calculateNextSession = calculateNextSession;
  window.getNextSession = calculateNextSession;
  window.detectClassFromString = detectClassFromString;
}
