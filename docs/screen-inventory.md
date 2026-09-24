# CoachingOS Complete Screen Inventory & UX Audit

**Audit Baseline:** September 2026  
**Total Identified & Planned Screens:** 12

---

### Screen 1: Today's Operational Triage Queue (`/`)
- **Route:** `/`
- **Roles:** All (Owner, Teacher, Counsellor, Accountant, Student, Parent)
- **Purpose:** Surfaces high-priority action items requiring immediate decision today, tailored to the logged-in role.
- **Primary Action:** Role-specific (e.g. 1-Tap Attendance for Teachers, Defaulter POS for Accountants, Lead Conversion for Counsellors).
- **Secondary Actions:** Launch AI Copilot, inspect high-risk students, view branch trends.
- **Current Problems:** Lacks a global quick-create action bar and week-over-week performance sparklines.
- **Mobile Considerations:** Top cards should stack cleanly into single-column swipeable cards.

---

### Screen 2: Omnichannel CRM & Admission Pipeline (`/leads`)
- **Route:** `/leads`
- **Roles:** Owner, Counsellor, Branch Admin
- **Purpose:** Ingests leads from Meta ads, walk-ins, and WhatsApp, tracking them across Kanban stages to atomic admission.
- **Primary Action:** 1-Click Admission Stepper modal.
- **Secondary Actions:** Ingest new lead, filter by source/stage, schedule demo.
- **Current Problems:** Lacks lead search filter and conversation history drawer.
- **Mobile Considerations:** Horizontal drag-and-drop requires toggleable stage tabs or touch scroll on small viewports.

---

### Screen 3: Master Student Directory (`/students`) [NEW]
- **Route:** `/students`
- **Roles:** Owner, Teacher, Admin, Accountant
- **Purpose:** Searchable and filterable master directory of all enrolled students across batches and branches.
- **Primary Action:** Click into 360° Student Workspace (`/students/[id]`).
- **Secondary Actions:** Filter by batch, attendance risk status, fee status; export CSV roster.
- **Current Gaps:** Currently missing as a dedicated list screen; users only have access via direct links or ⌘K.

---

### Screen 4: Unified 360° Student Profile (`/students/[id]`)
- **Route:** `/students/[id]`
- **Roles:** Owner, Teacher, Admin, Student, Parent
- **Purpose:** Consolidated single-screen profile unifying personal records, attendance pulse, concept mastery, fee ledgers, and remedial interventions.
- **Primary Action:** Generate remedial practice drill or open Counter POS.
- **Secondary Actions:** View detailed test attempts, review guardian DPDP consent, view past intervention logs.
- **Current Problems:** Hardcoded fallback for non-seeded IDs; needs dynamic hydration for any student in the database.

---

### Screen 5: Rapid Bulk Attendance & Safety Dispatch (`/academics/attendance`)
- **Route:** `/academics/attendance`
- **Roles:** Teacher, Owner, Branch Admin
- **Purpose:** Fast offline-safe attendance marking for 80+ student batches in under 20 seconds.
- **Primary Action:** 1-Tap Status Toggles (Present/Absent/Late) & Sync.
- **Secondary Actions:** Mark all present, view simulated WhatsApp absence alert preview.
- **Current Problems:** Needs batch selector and date picker to view past session attendance.

---

### Screen 6: Batch Rosters & Timetable Scheduler (`/academics/batches`)
- **Route:** `/academics/batches`
- **Roles:** Owner, Teacher, Branch Admin, Manager
- **Purpose:** Batch capacity tracking, faculty assignments, classroom allocations, and weekly clash-free timetables.
- **Primary Action:** Create Batch / Schedule Class.
- **Secondary Actions:** View roster drawer of enrolled students per batch.
- **Current Problems:** Roster drawer not yet interactive; needs direct "Add Student to Batch" modal.

---

### Screen 7: Double-Entry Fee Ledger & Dynamic UPI POS (`/finance`)
- **Route:** `/finance`
- **Roles:** Owner, Accountant, Parent
- **Purpose:** Invoice ledger, defaulter aging tracking, counter POS dynamic UPI QR generation, and bank settlement reconciliation.
- **Primary Action:** Generate Counter POS UPI QR and simulate scan capture.
- **Secondary Actions:** Search invoices, filter overdue balances, view GST tax receipts.
- **Current Problems:** Missing GST invoice PDF modal with tax breakdown (CGST/SGST 9%).

---

### Screen 8: Closed-Loop Academic Interventions (`/interventions`)
- **Route:** `/interventions`
- **Roles:** Owner, Teacher, Branch Admin
- **Purpose:** Early-warning detection of concept and attendance decay, assigning faculty playbooks and tracking score recovery.
- **Primary Action:** Execute Playbook & Log Remediation Notes.
- **Secondary Actions:** Create Manual Intervention case, filter cases by status (`OPEN`, `IN_PROGRESS`, `RESOLVED`).
- **Current Problems:** Lacks a "Create Case" button for ad-hoc teacher concerns.

---

### Screen 9: Question Bank & Timed Mock Exam Player (`/academics/tests`)
- **Route:** `/academics/tests`
- **Roles:** Owner, Teacher, Student
- **Purpose:** LaTeX math question authoring and distraction-free timed test delivery with +4/-1 scoring.
- **Primary Action:** Take Exam & Submit for Immediate Grading.
- **Secondary Actions:** Author new question with formula editor, filter by difficulty.
- **Current Problems:** Needs a "Create Test from Question Bank" modal.

---

### Screen 10: Grounded AI Copilot Suite (`/copilot`)
- **Route:** `/copilot`
- **Roles:** All
- **Purpose:** Multi-agent AI hub providing operational SQL Q&A, LaTeX worksheet generator, and Socratic STEM doubt solver.
- **Primary Action:** Query operational data or generate practice worksheet.
- **Secondary Actions:** Export answer tables to CSV, copy LaTeX equations.
- **Current Problems:** Needs confirmation dialog for privileged broadcast actions.

---

### Screen 11: CSV / Excel Data Import Studio (`/settings/import`)
- **Route:** `/settings/import`
- **Roles:** Owner, Branch Admin, Manager
- **Purpose:** Legacy spreadsheet migration with column mapping, deduplication preview, and 1-click batch commit.
- **Primary Action:** Upload CSV or load sample dataset, review deduplication, commit.
- **Current Problems:** File drop zone is visual only; needs real in-browser FileReader parsing.

---

### Screen 12: Security & Immutable Audit Trail (`/settings/audit`)
- **Route:** `/settings/audit`
- **Roles:** Owner, Super Admin
- **Purpose:** Cryptographic audit log verifying all mutations, payments, attendance marks, and AI executions.
- **Primary Action:** Search / Filter audit logs by actor or action; export trail.
- **Secondary Actions:** Verify record integrity hash.
