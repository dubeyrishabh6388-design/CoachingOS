# CoachingOS Current System Audit & Evolution Plan

**Audit Date:** September 2026  
**Auditor:** Autonomous Product Engineering Lead  
**Scope:** Full codebase inspection of `C:\Users\rishabh\.gemini\antigravity\scratch\coachingos`

---

## 1. System Inventory

| Component / Layer | Current Status | Quality Evaluation | Action Plan |
| :--- | :--- | :--- | :--- |
| **Framework & Engine** | Next.js 15.5.25 + React 19 + TypeScript | High performance, zero build warnings, 100% type-safe | **KEEP** — Foundation is solid |
| **Styling & Design System** | Tailwind CSS v3.4 + Lucide Icons + KaTeX | Clean dark theme, responsive grids, crisp contrast | **KEEP & EXPAND** — Add Command Palette & Drawer patterns |
| **Data Layer** | `src/lib/db/store.ts` + `initial-seed.ts` | 5 diverse Indian coaching institutes seeded with foreign key links | **KEEP & EXPAND** — Add CSV import mutations, batch scheduling, unified student queries |
| **REST APIs** | `/api/v1/leads`, `/admissions`, `/attendance`, `/invoices`, `/payments`, `/interventions`, `/ai/queries` | Validated route handlers with proper status codes and error envelopes | **KEEP & EXPAND** — Add `/students/[id]`, `/batches`, `/import`, `/search` |
| **Today's Queue** | `src/app/page.tsx` | Persona-aware triage views (Owner, Teacher, Counsellor, Accountant, Student) | **KEEP & POLISH** — Enhance with quick inline actions |
| **CRM & Admissions** | `src/app/leads/page.tsx` | Kanban pipeline, E.164 phone normalization, 1-click atomic conversion | **KEEP** |
| **Attendance** | `src/app/academics/attendance/page.tsx` | <20s bulk attendance with offline-safe sync & simulated WhatsApp dispatch | **KEEP** |
| **Finance & Ledger** | `src/app/finance/page.tsx` | Invoices table, NPCI standard dynamic UPI QR generator (`qrcode`), receipts | **KEEP** |
| **Interventions** | `src/app/interventions/page.tsx` | Early-warning trigger cases with remediation playbook execution | **KEEP** |
| **Assessments** | `src/app/academics/tests/page.tsx` | LaTeX question bank & timed mock exam player with auto scoring | **KEEP** |
| **AI Copilots** | `src/app/copilot/page.tsx` | Grounded Institute Copilot with citations, Teacher studio, Socratic tutor | **KEEP** |

---

## 2. Gaps to Close in Autonomous Build Mode

1. **Global Search & Command Palette (`Cmd + K` / `Ctrl + K`):**
   Staff and owners need instant search across students, leads, batches, invoices, and rapid actions without clicking through menus.
2. **Unified 360° Student Workspace (`/students/[id]`):**
   A consolidated profile bringing together personal records, guardian consent, attendance timeline, concept mastery, fee status, and past interventions in one place.
3. **Batch & Timetable Management (`/academics/batches`):**
   Weekly schedule grid, room allocation, teacher assignment, and conflict warnings.
4. **Data Import Engine (`/settings/import`):**
   Real CSV import with sample file downloads, column mapping, duplicate preview, and batch commit.
5. **Security & Audit Logs (`/settings/audit`):**
   Visual audit trail showing privileged actions, actor roles, timestamps, and entity changes.
6. **Documentation Suite:**
   Complete set of architectural, database, API, and setup documentation in `/docs`.
