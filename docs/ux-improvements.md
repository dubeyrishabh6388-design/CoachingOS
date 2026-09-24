# CoachingOS UX Problem Map & Refactoring Plan

---

## 1. Global Shell & Navigation Improvements
- **Problem:** On viewports <1024px, the sidebar shrinks content and there is no mobile drawer.
- **Solution:** Add a responsive mobile slide-out drawer with a hamburger trigger and bottom navigation shortcuts on small screens.
- **Problem:** Users have to search across multiple pages to create new items (e.g. going to Leads to create a lead, going to Finance to collect a payment).
- **Solution:** Add a persistent global **"+ Quick Create"** action dropdown in the top navigation bar with 1-click modals for:
  - *New Lead*
  - *New Student*
  - *Collect Fee (POS)*
  - *Mark Attendance*
  - *Create Test*

---

## 2. CRM & Admission Flow
- **Problem:** Kanban board does not allow searching by student name or filtering by counsellor/source.
- **Solution:** Add an inline search bar, source filters (`All`, `Meta Ads`, `Walk-in`, `WhatsApp`), and a lead detail slide-over drawer to inspect call notes without opening a modal.

---

## 3. Master Student Directory (`/students`)
- **Problem:** No central table to view all students, sort by roll number, batch, attendance percentage, or payment status.
- **Solution:** Build a dedicated `/students` directory with search, batch filters, status badges, and direct links to `/students/[id]`.

---

## 4. Unified Student Workspace (`/students/[id]`)
- **Problem:** Viewing non-seeded IDs displayed fallback data.
- **Solution:** Hydrate dynamically from `db.getStudentById(id)`. If student is found, compute dynamic concept mastery, attendance timeline, invoices, and intervention cases.

---

## 5. Attendance & Timetable
- **Problem:** Attendance is fixed to one session (`sess-today-01`).
- **Solution:** Add a Batch Switcher and Class Session Selector so teachers can record attendance for any scheduled session.
- **Problem:** Batches screen lacks an interactive student roster drawer.
- **Solution:** Add an interactive drawer showing the list of students enrolled in the selected batch.

---

## 6. Finance & Dynamic UPI POS
- **Problem:** After simulating UPI capture, no invoice document or formal receipt is viewable.
- **Solution:** Add a realistic **GST Tax Receipt Viewer** modal displaying:
  - GSTIN, Receipt Number, HSN/SAC Code 999293
  - Course Tuition Line Item, CGST (9%), SGST (9%), Total Paid, and Balance.
  - Print / Download PDF simulation.

---

## 7. Interventions Engine
- **Problem:** Only system-generated interventions exist.
- **Solution:** Add a **"+ Raise Intervention Case"** button allowing any faculty or manager to manually flag a student for attendance decay, behavioral concern, or test score drop.

---

## 8. Assessments & Test Creator
- **Problem:** Tests screen only allows playing the pre-seeded mock test.
- **Solution:** Add a **"Create Test Blueprint"** modal allowing teachers to select questions from the bank, set test duration, and assign to a specific batch.
