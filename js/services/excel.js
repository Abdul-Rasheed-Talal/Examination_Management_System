/**
 * CIT Examination & Result Management System
 * Excel / CSV Parsing & Student Import Service (SheetJS Integration)
 */

function extractStudentsFromParts(parts, targetClassId, defaultSession) {
  const results = [];
  if (!parts || parts.length === 0) return results;

  const cleaned = parts.map(p => String(p === null || p === undefined ? '' : p).trim()).filter(Boolean);
  if (cleaned.length === 0) return results;

  // 1. Check if Sr. prefixed format: [ "1", "26-CIT-101", "Muhammad Tayab Hanif" ]
  if (cleaned.length >= 3 && /^\d+$/.test(cleaned[0]) && parseInt(cleaned[0], 10) < 300) {
    if (/\d/.test(cleaned[1]) && !/^\d+$/.test(cleaned[2])) {
      results.push({
        roll: cleaned[1],
        name: cleaned[2],
        classId: targetClassId,
        session: defaultSession
      });
      return results;
    }
  }

  // 2. Scan pairs across row: (0,1), (2,3), (4,5), (6,7), (8,9)
  let i = 0;
  while (i < cleaned.length - 1) {
    const p1 = cleaned[i];
    const p2 = cleaned[i + 1];
    const p1Lower = p1.toLowerCase();

    // Skip header words
    if (['roll', 'sr', 's#', 's.no', 'name', 'reg', 'class'].some(h => p1Lower.startsWith(h))) {
      i += 2;
      continue;
    }

    // p1 looks like Roll (contains digits or 'CIT') and p2 looks like Name (not pure digits)
    if (/\d/.test(p1) && !/^\d+$/.test(p2) && p2.length >= 2) {
      results.push({
        roll: p1,
        name: p2,
        classId: targetClassId,
        session: defaultSession
      });
      i += 2;
    } else if (/\d/.test(p2) && !/^\d+$/.test(p1) && p1.length >= 2 && cleaned.length === 2) {
      // Reversed layout (Name in Col 0, Roll in Col 1)
      results.push({
        roll: p2,
        name: p1,
        classId: targetClassId,
        session: defaultSession
      });
      i += 2;
    } else {
      i += 1;
    }
  }

  return results;
}

function parsePastedStudentText(text, targetClassId, sessionTag) {
  if (!text) return 0;
  const lines = text.split('\n');
  let addedCount = 0;

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    let parts = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(',')) {
      parts = line.split(',');
    } else {
      parts = line.split(/\s{2,}|\t/);
      if (parts.length < 2) {
        const tokens = line.split(/\s+/);
        if (tokens.length >= 2) parts = [tokens[0], tokens.slice(1).join(' ')];
      }
    }

    const extracted = extractStudentsFromParts(parts, targetClassId, sessionTag);
    extracted.forEach(st => {
      const cid = (targetClassId === 'auto') ? (detectClassFromString(st.classId) || 'cit1') : targetClassId;
      appData.students[cid] = appData.students[cid] || [];
      if (!appData.students[cid].some(s => s.roll === st.roll)) {
        appData.students[cid].push({
          roll: st.roll,
          name: st.name,
          session: sessionTag || appData.currentSession || "2026-2027"
        });
        addedCount++;
      }
    });
  });

  return addedCount;
}

function handlePastedExcelImport() {
  const textarea = document.getElementById('pastedExcelText');
  const targetClass = document.getElementById('excelTargetClass').value;
  const sessionTag = (document.getElementById('excelStudentSession') || {}).value || appData.currentSession || "2026-2027";

  if (!textarea || !textarea.value.trim()) {
    showToast("Please paste students from Excel first.", true);
    return;
  }

  const added = parsePastedStudentText(textarea.value, targetClass, sessionTag);
  persistData();
  textarea.value = '';

  if (added > 0) {
    showToast(`Successfully imported ${added} students into class roster.`);
  } else {
    showToast("No new students found or duplicates were skipped.", true);
  }

  renderAdminStudents(document.getElementById('adminTabContent'));
}

function handleExcelFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const targetClass = document.getElementById('excelTargetClass').value;
  const sessionTag = (document.getElementById('excelStudentSession') || {}).value || appData.currentSession || "2026-2027";
  const fileName = file.name.toLowerCase();

  // CSV or Text File
  if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const added = parsePastedStudentText(e.target.result, targetClass, sessionTag);
      persistData();
      showToast(`Imported ${added} students from ${file.name}`);
      renderAdminStudents(document.getElementById('adminTabContent'));
    };
    reader.readAsText(file);
    return;
  }

  // Excel (.xlsx or .xls)
  if (window.XLSX) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let summary = { cit1: 0, cit2: 0, cit3: 0 };
        let totalAdded = 0;

        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          if (!rows || rows.length === 0) return;

          let sheetClass = targetClass;
          if (targetClass === 'auto') {
            sheetClass = detectClassFromString(sheetName) || 'cit1';
          }

          rows.forEach(row => {
            if (!row || row.length === 0) return;
            const extracted = extractStudentsFromParts(row, sheetClass, sessionTag);
            extracted.forEach(st => {
              const cid = (targetClass === 'auto') ? (detectClassFromString(st.classId) || sheetClass) : targetClass;
              appData.students[cid] = appData.students[cid] || [];
              if (!appData.students[cid].some(s => s.roll === st.roll)) {
                appData.students[cid].push({
                  roll: st.roll,
                  name: st.name,
                  session: st.session || sessionTag
                });
                summary[cid] = (summary[cid] || 0) + 1;
                totalAdded++;
              }
            });
          });
        });

        persistData();
        const details = [];
        if (summary.cit1 > 0) details.push(`${summary.cit1} to CIT 1st`);
        if (summary.cit2 > 0) details.push(`${summary.cit2} to CIT 2nd`);
        if (summary.cit3 > 0) details.push(`${summary.cit3} to CIT 3rd`);

        const msg = details.length > 0 
          ? `Imported ${totalAdded} students (${details.join(', ')}) from ${file.name}`
          : `No new students added from ${file.name} (all duplicates skipped).`;
        showToast(msg, totalAdded === 0);
        renderAdminStudents(document.getElementById('adminTabContent'));
      } catch (err) {
        console.error(err);
        showToast("Error reading Excel file. Try copying and pasting columns instead.", true);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    showToast("Excel library not loaded. Please copy and paste columns from Excel.", true);
  }
}

if (typeof window !== 'undefined') {
  window.extractStudentsFromParts = extractStudentsFromParts;
  window.parsePastedStudentText = parsePastedStudentText;
  window.handlePastedExcelImport = handlePastedExcelImport;
  window.handleExcelFileUpload = handleExcelFileUpload;
}

