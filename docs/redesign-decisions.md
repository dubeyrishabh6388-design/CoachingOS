# CoachingOS Redesign Decisions & Architectural Blueprint

---

## 1. Global Shell & Navigation Redesign
- **Decision:** Integrate a responsive mobile navigation drawer with hamburger trigger, add breadcrumb trails across all inner pages, and add a persistent **"+ Quick Create"** action bar in the Navbar.
- **Rationale:** Ensures frictionless navigation on mobile/tablet screens and reduces clicks for high-frequency workflows (creating a lead or student).

## 2. Dedicated Master Student Directory (`/students`)
- **Decision:** Add a dedicated `/students` directory page with real-time search, batch filters, status filters, and instant navigation to the 360° profile.
- **Rationale:** Prevents staff from having to rely exclusively on search or command palette to view their cohort rosters.

## 3. Dynamic Hydration for 360° Student Workspace
- **Decision:** Refactor `/students/[id]` to query `db.getStudentById(id)` dynamically, pulling related attendance, invoices, and intervention cases directly from the database store.
- **Rationale:** Eliminates hardcoded fallbacks and ensures any newly admitted student immediately has a full 360° workspace.

## 4. GST Tax Receipt & Invoice Modal in Finance
- **Decision:** Add a realistic GST-compliant Tax Receipt viewer modal to `/finance` displaying SAC Code 999293, CGST 9%, SGST 9%, and an instant print/download action.
- **Rationale:** Coaching accountants frequently handle parent demands for physical/PDF GST receipts for school tuition and tax deduction claims.

## 5. Teacher Remediation Case Creation in Interventions
- **Decision:** Add a modal in `/interventions` allowing teachers to manually raise an intervention case on any student.
- **Rationale:** Real classroom interventions are often spotted by human teachers before statistical drops occur.

## 6. Real Client-Side CSV File Upload in Import Studio
- **Decision:** Implement browser `FileReader` API in `/settings/import` so that dropping an actual `.csv` file parses headers, normalizes rows, and maps columns automatically.
- **Rationale:** Eliminates mock-only upload flows and delivers genuine file migration capability.
