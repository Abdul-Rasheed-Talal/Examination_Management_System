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

var authStudent = null;
try {
  const cachedStudent = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem('cit_auth_student') : null;
  if (cachedStudent) authStudent = JSON.parse(cachedStudent);
} catch (e) {
  authStudent = null;
}

var loginSelectedRole = 'teacher'; // 'teacher' or 'admin' on main faculty login screen
var adminActiveTab = 'datesheets'; // 'datesheets', 'results', 'students', 'teachers', 'marks', 'requests', 'settings'
var teacherActiveTab = 'marks'; // 'marks', 'subject_pdf', 'datesheet_pdf'
var studentActiveTab = 'results'; // 'results', 'diagnostics', 'noticeboard'
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

  // Ensure teachers array is valid and purge any guest/default accounts
  if (!appData.teachers || !Array.isArray(appData.teachers)) {
    appData.teachers = [];
  } else {
    appData.teachers = appData.teachers.filter(t => t.id !== 'tch_default' && t.username !== 'teacher');
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

/**
 * Student Search by Roll Number across active rosters & passouts
 * Enforces full roll number matching (e.g. 24-CIT-101, 25-CIT-102, 26-CIT-101)
 * to prevent collisions where the same number (e.g. 101) exists across multiple classes.
 * Suffix matching (e.g. 101) is only permitted if the specific class is explicitly selected.
 */
function findStudentByRoll(rollNo, optionalClassId = null) {
  if (!rollNo || !appData || !appData.students) return null;
  const raw = String(rollNo).trim();
  const lower = raw.toLowerCase();
  const normalized = lower.replace(/[^a-z0-9]/g, '');

  if (!normalized) return null;

  // Check if input is only 1-3 digits without year/session prefix (e.g. "101")
  const isNumericOnly = /^\d+$/.test(normalized) && normalized.length <= 3;

  // If numeric only and no class selected, it is ambiguous because roll 101, 102 etc. exist in 1st, 2nd, and 3rd year!
  if (isNumericOnly && !optionalClassId) {
    return {
      ambiguous: true,
      message: `Roll number "${raw}" exists in multiple classes (1st Year, 2nd Year, 3rd Year). Please enter your full roll number (e.g. 24-CIT-${raw} for 3rd Year, 25-CIT-${raw} for 2nd Year, 26-CIT-${raw} for 1st Year) or select your class from the dropdown.`
    };
  }

  const checkList = optionalClassId ? [optionalClassId] : ['cit1', 'cit2', 'cit3'];

  // 1. Primary: Exact full roll match (case/space/hyphen-insensitive)
  for (const cId of checkList) {
    const list = appData.students[cId] || [];
    for (const st of list) {
      if (!st.roll) continue;
      const stLower = st.roll.toLowerCase();
      const stNorm = stLower.replace(/[^a-z0-9]/g, '');

      // Matches "24-cit-101" === "24-cit-101", "24cit101" === "24cit101", "24101" === "24101"
      if (stLower === lower || stNorm === normalized || stNorm.replace('cit', '') === normalized.replace('cit', '')) {
        const classObj = (appData.classes || []).find(c => c.id === cId);
        return {
          roll: st.roll,
          name: st.name,
          session: st.session || appData.currentSession || '2026-2027',
          classId: cId,
          className: classObj ? classObj.name : cId,
          isPassout: false
        };
      }
    }
  }

  // 2. Secondary: If a specific class was explicitly chosen, allow numeric suffix match (e.g. class is cit3 and entered 101)
  if (optionalClassId && optionalClassId !== 'passouts') {
    const list = appData.students[optionalClassId] || [];
    for (const st of list) {
      if (!st.roll) continue;
      const stLower = st.roll.toLowerCase();
      if (stLower.endsWith('-' + lower) || stLower.endsWith(lower)) {
        const classObj = (appData.classes || []).find(c => c.id === optionalClassId);
        return {
          roll: st.roll,
          name: st.name,
          session: st.session || appData.currentSession || '2026-2027',
          classId: optionalClassId,
          className: classObj ? classObj.name : optionalClassId,
          isPassout: false
        };
      }
    }
  }

  // 3. Passouts archive (full roll match)
  if (appData.passouts && Array.isArray(appData.passouts)) {
    for (const st of appData.passouts) {
      if (!st.roll) continue;
      const stLower = st.roll.toLowerCase();
      const stNorm = stLower.replace(/[^a-z0-9]/g, '');
      if (stLower === lower || stNorm === normalized) {
        return {
          roll: st.roll,
          name: st.name,
          session: st.passoutSession || st.originalSession || 'Alumni',
          classId: 'passouts',
          className: 'Graduated / Alumni',
          isPassout: true
        };
      }
    }
  }

  return null;
}

/**
 * Retrieve all examination results for a specific student
 */
function getAllStudentResults(rollNo) {
  if (!rollNo || !appData || !appData.datesheets) return [];
  const studentInfo = findStudentByRoll(rollNo);
  if (!studentInfo) return [];

  const results = [];
  const datesheets = (appData.datesheets || []).filter(ds => ds.classId === studentInfo.classId);

  datesheets.forEach(ds => {
    if (typeof evaluateDatesheetResults === 'function') {
      const evalData = evaluateDatesheetResults(ds.id);
      if (evalData && evalData.evaluatedRows) {
        const studentRow = evalData.evaluatedRows.find(r => r.roll.toLowerCase() === studentInfo.roll.toLowerCase());
        if (studentRow && studentRow.hasAnyMarks) {
          results.push({
            dsId: ds.id,
            dsTitle: ds.title,
            examType: ds.examType,
            examTypeName: ds.examTypeName || (ds.examType === 'monthly' ? 'Monthly Test' : (ds.examType === 'midterm' ? 'Mid-Term Examination' : 'Send-Up Examination')),
            session: ds.session,
            classId: ds.classId,
            className: studentInfo.className,
            studentName: studentInfo.name,
            roll: studentInfo.roll,
            rank: studentRow.rank,
            totalObtained: studentRow.totalObt,
            totalMax: studentRow.totalMax,
            percentage: studentRow.percentage,
            grade: studentRow.grade,
            status: studentRow.status,
            entries: studentRow.entries || [],
            evalData: evalData
          });
        }
      }
    }
  });

  return results;
}

/**
 * Analyze subject performance for weak & strong areas
 */
function analyzeStudentStrengthsAndWeaknesses(studentResults) {
  if (!studentResults || studentResults.length === 0) {
    return {
      weakSubjects: [],
      borderlineSubjects: [],
      strongSubjects: [],
      overallAvg: 0,
      totalExams: 0,
      examsPassed: 0,
      examsFailed: 0
    };
  }

  const subjectAgg = {};

  studentResults.forEach(res => {
    (res.entries || []).forEach(entry => {
      const code = entry.code;
      if (!code) return;
      if (!subjectAgg[code]) {
        subjectAgg[code] = {
          code: code,
          title: entry.title || code,
          totalObt: 0,
          totalMax: 0,
          attempts: 0,
          fails: 0,
          absents: 0,
          scores: []
        };
      }

      if (entry.val === 'ABS') {
        subjectAgg[code].absents++;
        subjectAgg[code].fails++;
        subjectAgg[code].totalMax += entry.max;
        subjectAgg[code].scores.push({ exam: res.dsTitle, pct: 0, isAbs: true });
      } else if (typeof entry.val === 'number') {
        subjectAgg[code].totalObt += entry.val;
        subjectAgg[code].totalMax += entry.max;
        subjectAgg[code].attempts++;
        const pct = Math.round((entry.val / entry.max) * 100);
        if (entry.isFail) subjectAgg[code].fails++;
        subjectAgg[code].scores.push({ exam: res.dsTitle, pct: pct, isAbs: false });
      }
    });
  });

  const weakSubjects = [];
  const borderlineSubjects = [];
  const strongSubjects = [];

  for (const code in subjectAgg) {
    const item = subjectAgg[code];
    const avgPct = item.totalMax > 0 ? Math.round((item.totalObt / item.totalMax) * 100) : 0;
    item.avgPct = avgPct;

    if (item.fails > 0 || avgPct < 40 || item.absents > 0) {
      weakSubjects.push(item);
    } else if (avgPct >= 40 && avgPct < 55) {
      borderlineSubjects.push(item);
    } else if (avgPct >= 70) {
      strongSubjects.push(item);
    }
  }

  weakSubjects.sort((a, b) => a.avgPct - b.avgPct);
  borderlineSubjects.sort((a, b) => a.avgPct - b.avgPct);
  strongSubjects.sort((a, b) => b.avgPct - a.avgPct);

  const totalExams = studentResults.length;
  const examsPassed = studentResults.filter(r => r.status === 'PASS').length;
  const examsFailed = studentResults.filter(r => r.status === 'FAIL').length;
  const overallAvg = Math.round(studentResults.reduce((sum, r) => sum + r.percentage, 0) / totalExams);

  return {
    weakSubjects,
    borderlineSubjects,
    strongSubjects,
    overallAvg,
    totalExams,
    examsPassed,
    examsFailed
  };
}

if (typeof window !== 'undefined') {
  window.appData = appData;
  window.authRole = authRole;
  window.authTeacher = authTeacher;
  window.authStudent = authStudent;
  window.loginSelectedRole = loginSelectedRole;
  window.adminActiveTab = adminActiveTab;
  window.teacherActiveTab = teacherActiveTab;
  window.studentActiveTab = studentActiveTab;
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
  window.findStudentByRoll = findStudentByRoll;
  window.getAllStudentResults = getAllStudentResults;
  window.analyzeStudentStrengthsAndWeaknesses = analyzeStudentStrengthsAndWeaknesses;
}
