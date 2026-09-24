# CoachingOS Deep Product & Architectural Audit

**Audit Date:** September 2026  
**Evaluation Standard:** Production-Grade Modern SaaS / EdTech  
**Application Scope:** `coachingos` (Next.js 15.5 App Router fullstack)

---

## 1. Architectural & Codebase Assessment

### 1.1 Foundation & Performance
- **Framework:** Next.js 15.5.25 with React 19 and TypeScript. Build compiles cleanly in ~5.9 seconds.
- **Routing:** 19 compiled routes across static and dynamic handlers.
- **Data Layer:** `src/lib/db/store.ts` provides transactional memory persistence with real-world Indian seed entities.
- **Security:** Strict `organization_id` tenant parameterization across all operations.

### 1.2 Identified Architectural & UX Weaknesses
1. **Missing Student Directory (`/students`):** While `/students/[id]` exists, there is no master student directory screen where admins/teachers can filter by batch, search by roll number, sort by attendance, and export rosters.
2. **Batch Detail & Student Roster Drawer:** In `/academics/batches`, clicking a batch does not expand its enrolled student list or allow adding students directly into the batch.
3. **Manual Intervention Case Creation:** In `/interventions`, cases are populated from seed data, but teachers cannot manually raise an intervention case for a student exhibiting behavioral or fee distress.
4. **Test Authoring Wizard:** In `/academics/tests`, the question bank and player exist, but there is no "New Test Creator" modal allowing faculty to select blueprint weighting and assign to a specific batch.
5. **Real Client-Side CSV File Parsing:** In `/settings/import`, clicking "Load Sample" works, but dragging and dropping an actual `.csv` file from disk needs browser-native FileReader parsing.
6. **Mobile Layout Constraints:** The sidebar is fixed at 256px (`w-64`) without a mobile hamburger drawer or bottom navigation bar for small screens (<768px).
7. **GST Receipt Modal:** In `/finance`, after simulating a payment capture, users should be able to view and print a realistic GST-compliant Tax Receipt with SAC Code 999293 and CGST/SGST tax breakdown.
8. **Universal Quick Action (+):** A persistent quick action button in the top navigation allowing 1-click creation of a Lead, Student, Attendance record, or Payment from any screen.

---

## 2. Component Reusability & Design System Audit

### 2.1 Design Tokens
- **Palette:** Navy/Slate (`slate-900`, `slate-950`, `navy-900`) with Emerald (`emerald-500`, `emerald-600`) primary actions, Sky (`sky-400`) academic accents, Amber (`amber-400`) warning tags, and Rose (`rose-400`) risk indicators.
- **Typography:** Inter / system sans-serif with JetBrains Mono / monospace fonts for identifiers, roll numbers, currency figures, and LaTeX formulas.
- **Borders & Radii:** Consistent `rounded-xl` and `rounded-2xl` with subtle `border-slate-800` dividers.

### 2.2 Reusability Gaps to Unify
- Modals, drawers, and confirmation dialogues currently use inline markup rather than a unified modal component.
- Breadcrumb trails are needed on subpages to provide clear spatial orientation (`Home > Academics > Batches`).
- Empty states should offer a dedicated action button rather than plain italic text.
