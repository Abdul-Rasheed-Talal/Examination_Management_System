# CIT Department Academic & Result Management System

A simple, lightweight, fast, and easy-to-understand web application built specifically for the **Computer Information Technology (CIT) Department** at a technical college.

Designed specifically for **non-technical administrators and subject teachers**. It runs directly as pure **HTML, CSS, and JavaScript** with local and server text-file persistence (`data.json`), without requiring any databases or complex backend frameworks.

---

## Key Features

1. **Password-Protected Roles:**
   - **Administrator Portal:** Full control over date sheets, student rosters, session promotion, complete class results, rankings, PDF generation, passwords, and backups.
   - **Subject Teacher Portal:** Simple interface to enter subject test marks, plus one-click download/print of the official Result PDF and Date Sheet PDF to share directly with students via WhatsApp or noticeboards.

   | Role | Default Password | What They Can Do |
   | :--- | :---: | :--- |
   | **Administrator** | `admin123` | Create date sheets, manage student rosters session-wise, execute annual promotions, view and print results, change passwords, and download backups. |
   | **Subject Teacher** | `teacher123` | Enter and save student marks for their subject, and download/print Result & Date Sheet PDFs to share on WhatsApp. |

   *(Both passwords can be changed at any time in the Admin Settings tab).*

2. **Official CIT Department Student Roster Pre-Loaded (138 Students):**
   - Automatically loaded from the official department register (`CIT register_names1st-2nd-3rd.xlsx`):
     - **CIT 1st Year:** 50 Students (`26-CIT-101` to `26-CIT-150`)
     - **CIT 2nd Year:** 44 Students (`25-CIT-102` to `25-CIT-152`)
     - **CIT 3rd Year:** 44 Students (`24-CIT-101` to `24-CIT-154`)
   - All previous dummy date sheets and dummy students have been completely removed.
   - Includes a **Restore Department Register (138)** button to restore back to the original roster at any time.

3. **Session-Wise Student Management & Annual Promotion (Rollover):**
   - **Active Academic Session:** Track active sessions (e.g. `2026-2027`, `2027-28`).
   - **Filter & Search by Session:** View students filtered by their specific session intake.
   - **Annual Session Promotion Workflow:** When a new session arrives (e.g. `2027-28`), 1-click promotion shifts:
     1. **CIT 3rd Year** &rarr; Archived as **Passout / Graduated Alumni** (tagged with graduation session).
     2. **CIT 2nd Year** &rarr; Promoted to **CIT 3rd Year**.
     3. **CIT 1st Year** &rarr; Promoted to **CIT 2nd Year**.
     4. **CIT 1st Year** &rarr; Emptied and ready for new admissions of the new session.
   - **Passout / Alumni Register:** Dedicated tab to search, filter by graduation session, and export past graduates to CSV.

4. **Advanced Excel & CSV Importer:**
   - Supports native Excel files (`.xlsx`, `.xls`, `.csv`).
   - Automatically parses multi-sheet workbooks (`CIT-1st`, `CIT-2nd`, `CIT-3rd`).
   - Automatically parses **multi-column register layouts** (paired columns where Roll & Name appear in multiple columns across the sheet).
   - Allows direct copy-pasting from Excel (`Ctrl+C` in Excel &rarr; `Ctrl+V` into the portal).

5. **3 Academic Classes (No Sections, Theory Only):**
   - **CIT 1st Year**
   - **CIT 2nd Year**
   - **CIT 3rd Year**
   - *(Practical-only subjects CIT-141, CIT-381, CIT-392 are excluded from theory examinations).*

6. **3 Supported Examination Types & Mark Rules:**
   - **Monthly Test:** Exactly **20 Marks** for every subject. **Date only &mdash; no time slot needed**. Math is taken as a single paper (`Math-123` or `Math-223`).
   - **Mid-Term Examination:** Full marks per curriculum (50 / 75 / 100 per subject). Math is split into **Paper A (75 Marks)** and **Paper B (75 Marks)** taken separately with time slots.
   - **Send-Up Examination ("Sandup"):** Full marks per curriculum (50 / 75 / 100 per subject). Math is split into **Paper A (75 Marks)** and **Paper B (75 Marks)** taken separately with time slots.

7. **Automatic Student Ranking & Visual Highlighting:**
   - **Rank Categorization:** Automatically calculates rank positions based on student scores.
   - **Top 3 Performing Students Highlighted in GREEN:** 1st Position, 2nd Position, and 3rd Position highlighted with green badges and soft green row backgrounds.
   - **Failed Students Marked in RED:** Any student who scores below 40% in any subject or is absent is highlighted in red with a bold `FAIL` badge.
   - **Letter Grades & Percentage:** Automatically computes and displays percentages and official letter grades (`A+`, `A`, `B`, `C`, `D`, `F`).

---

## Curriculum Subjects & Theory Marks Breakdown

### CIT 1st Year (Theory)
| Subject Code | Subject Title | Monthly Test | Mid-Term | Send-Up (Sandup) |
| :--- | :--- | :---: | :---: | :---: |
| `GEN-111` | Islamiat & Pak Studies | **20** | **50** | **50** |
| `TTQ-111` | Tarjumat-ul-Quran | **20** | **50** | **50** |
| `Eng-112` | English | **20** | **100** | **100** |
| `Math-123` | Applied Mathematics-I *(Single Paper)* | **20** | — | — |
| `Math-123-A` | Applied Mathematics-I *(Paper A)* | — | **75** | **75** |
| `Math-123-B` | Applied Mathematics-I *(Paper B)* | — | **75** | **75** |
| `Phy-132` | Applied Physics | **20** | **50** | **50** |
| `Ch-132` | Applied Chemistry | **20** | **50** | **50** |
| `CIT-101` | Occupational Health Safety & Environment | **20** | **50** | **50** |
| `CIT-103` | Introduction to Computing & Application Software | **20** | **50** | **50** |
| `CIT-124` | Basic Electronics | **20** | **100** | **100** |
| `CIT-114` | Introduction to Computer Programming | **20** | **100** | **100** |

*Note: Total Mid-Term & Send-Up Theory Marks for CIT 1st Year = 750 Marks (Math Total = 150 Marks).*  
*(Excluded: `CIT-141` Computer & Peripheral Maintenance — practical only)*

### CIT 2nd Year (Theory)
| Subject Code | Subject Title | Monthly Test | Mid-Term | Send-Up (Sandup) |
| :--- | :--- | :---: | :---: | :---: |
| `Gen-211` | Islamiat & Pak Studies | **20** | **50** | **50** |
| `TTQ-211` | Tarjumat-ul-Quran / Civics | **20** | **50** | **50** |
| `Math-223` | Applied Mathematics-II *(Single Paper)* | **20** | — | — |
| `Math-223-A` | Applied Mathematics-II *(Paper A)* | — | **75** | **75** |
| `Math-223-B` | Applied Mathematics-II *(Paper B)* | — | **75** | **75** |
| `Mgm-211` | Business Communication | **20** | **50** | **50** |
| `CIT-203` | Data Communication & Computer Networks | **20** | **100** | **100** |
| `CIT-273` | Digital Logic Design | **20** | **100** | **100** |
| `CIT-222` | Operating System | **20** | **50** | **50** |
| `CIT-283` | Database Management System | **20** | **100** | **100** |
| `CIT-293` | Computer Graphics Designing | **20** | **50** | **50** |
| `CIT-204` | Web Development | **20** | **100** | **100** |

*Note: Total Mid-Term & Send-Up Theory Marks for CIT 2nd Year = 750 Marks (Math Total = 150 Marks).*

### CIT 3rd Year (Theory)
| Subject Code | Subject Title | Monthly Test | Mid-Term | Send-Up (Sandup) |
| :--- | :--- | :---: | :---: | :---: |
| `GEN-311` | Islamiat & Pak Studies | **20** | **50** | **50** |
| `CIT-322` | Entrepreneurship & Freelancing | **20** | **50** | **50** |
| `CIT-312` | Internet of Things | **20** | **50** | **50** |
| `CIT-313` | Network and Server Administration | **20** | **50** | **50** |
| `CIT-314` | Mobile Applications Development | **20** | **100** | **100** |
| `CIT-343` | Microprocessor Fundamentals | **20** | **100** | **100** |
| `CIT-372` | UI / UX Design | **20** | **50** | **50** |

*Note: Total Mid-Term & Send-Up Theory Marks for CIT 3rd Year = 450 Marks.*  
*(Excluded: `CIT-381` Software Quality Assurance & `CIT-392` Project — practical only)*

---

## Step-by-Step Workflow

### 1. Managing Students & Academic Sessions (Admin)
1. Sign in as **Administrator** (password: `admin123`).
2. Go to **Student Rosters & Sessions**.
3. View the 138 official students organized into:
   - **CIT 1st Year (50 students)**
   - **CIT 2nd Year (44 students)**
   - **CIT 3rd Year (44 students)**
4. **Search & Filter:** Search by Roll No or Student Name, or filter by specific session intake.
5. **Edit / Remove:** Click the edit icon to correct a student's Roll No, Name, or Session tag.
6. **Annual Session Promotion:**
   - When a new academic session arrives (e.g. `2027-28`), click **Annual Session Promotion & Class Shifting**.
   - Enter the new session name (`2027-28`).
   - Confirm the rollover:
     - 3rd Year students graduate and move to the **Passout / Alumni Archive**.
     - 2nd Year students shift to 3rd Year.
     - 1st Year students shift to 2nd Year.
     - 1st Year is emptied and ready for new admissions.
   - Upload the new session Excel sheet or add 1st Year students directly.

### 2. Creating a Date Sheet (Admin)
1. In the Admin portal, click **Date Sheets**.
2. Select Class (e.g. **CIT 1st Year**) and Exam Type (**Monthly Test**, **Midterm**, or **Send-Up**).
3. The assessment title defaults dynamically to the current month and year.
4. Set the date for the first subject:
   - **Auto-Fill Feature:** Selecting a date for the first subject automatically fills the exact same date (day, month, year) across all other subjects in the assessment!
   - **Auto Day Name Calculation:** When a date is selected, the day name (e.g. `Wednesday`, `Monday`) is automatically calculated and displayed next to the date, and saved to the date sheet.
   - You can still adjust individual subjects if an exam falls on another date.
   - For **Monthly Tests**: Only the exam date is needed (no time slot).
   - For **Midterms & Send-Ups**: Date is auto-filled and time defaults to 09:00 AM (also editable).
5. Click **Generate & Save Date Sheet**.
6. Click **Print / PDF** to preview and print the official timetable with the Day column included.

### 3. Subject Teacher Enters Marks
1. Teacher signs in with password: `teacher123`.
2. Selects Class &rarr; Scheduled Assessment &rarr; Respective Subject.
3. The student list loads automatically with the subject's maximum marks (20, 50, 75, or 100).
4. Teacher enters marks for each student (use **Enter** or **Down Arrow (↓)** to jump quickly to the next student).
5. If a student is absent, check the **Absent** box.
6. Click **Save Marks Sheet**.

### 4. Downloading & Sharing Result / Date Sheet PDF (Teacher & Admin)
1. Both Teachers and Admin can preview and download the complete official Result Sheet PDF at any time.
2. Select the assessment to view the full compiled result sheet with:
   - Rank numbers for passing students
   - Top 3 students highlighted in green (1st, 2nd, 3rd Position)
   - Failed students highlighted in red
   - Accurate letter grades (A+, A, B, C, D, FAIL) and percentages
3. **Landscape A4 PDF Layout (All Columns Guaranteed to Fit):**
   - Click **Print / PDF Preview** or **Print / Save as PDF (Landscape)** to open the high-resolution, institutional merit list document.
   - Designed specifically with `@page { size: A4 landscape; margin: 4mm 5mm; }` and proportional column widths (`table-layout: fixed; width: 100%`).
   - All 18–19 columns (Rank, Roll, Student Name, all 10–11 curriculum theory subjects, Total Obtained, Percentage, Grade, and Status) fit completely onto the page without horizontal cut-off or clipping.
   - Includes official candidate grading criteria and college authority signature blocks (Incharge Tabulation, Head of Department, Controller of Examinations).
   - Direct save to PDF for instant sharing with students via WhatsApp or printing for departmental noticeboards.

---

## Deployment Instructions

### Method A: Shared Hosting / cPanel Subdomain (with PHP)
1. Upload all files (`index.html`, `api.php`, `data.json`, `css/`, `js/`) into your subdomain folder (e.g. `public_html/cit/`).
2. Ensure `data.json` is writable (`chmod 666 data.json`).
3. Teachers and administrators can access the site from any computer or mobile browser, and all changes will automatically save to `data.json`.

### Method B: Pure Static Hosting (GitHub Pages, Netlify, or Local File)
1. Upload the files to any static host, or simply open `index.html` directly in your browser.
2. All data saves immediately into the browser's `localStorage`.
