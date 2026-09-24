# CoachingOS — Enterprise Multi-Institute Operating System

CoachingOS is a comprehensive, production-ready operating system built for coaching institutes, tuition centers, and multi-branch academies.

---

## Architecture Overview

CoachingOS is structured as a modular monorepo containing two dedicated services:

```
coachingos/
├── package.json          # Monorepo orchestration scripts
├── README.md             # Project documentation
├── docs/                 # System architecture, database schemas, API specs
├── scripts/              # Verification, testing & automated audit tools
│
├── frontend/             # Next.js 15 App (Turbopack, Tailwind CSS, Lucide icons)
│   ├── package.json      # Frontend scripts & dependencies
│   ├── tsconfig.json
│   ├── next.config.ts    # API proxy and performance optimization
│   └── src/
│       ├── app/          # Dynamic Dashboards, Admissions CRM, Academics, Finance
│       ├── components/   # Isolated UI components, Modals, Role-based Navbars
│       └── lib/          # AppContext state engine, DB store, utility helpers
│
└── backend/              # Node / Express REST API Server
    ├── package.json      # Backend scripts & dependencies
    ├── tsconfig.json
    └── src/
        ├── index.ts      # Server entry point
        ├── routes/       # Auth, Leads, Admissions, Invoices, Attendance, Tests
        └── db/           # Relational schemas, seed store & business controllers
```

---

## Core Capabilities

- **Role-Based Isolation**: Tailored workstations for Owners/Directors, Teachers, Students, and Parents.
- **Biometric & Attendance Log**: Daily check-in tracking and automated absentee alerts.
- **Smart Admissions & Leads CRM**: Lead capture, follow-ups, and 1-tap admission credential generation.
- **Finance & Fee Ledger**: GST invoices, fee collection, PDC cheque vault, and direct payment tracking.
- **Academics & Tests**: Batch timetables, homework & DPP distribution, test analysis, and rank diagnostics.

---

## Getting Started

### 1. Run Concurrently
```bash
npm run dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:4000](http://localhost:4000)

### 2. Build for Production
```bash
npm run build
npm start
```

### 3. Verification & Testing
```bash
npm run audit
npm run test
```

---

*Confidential & Proprietary. All rights reserved.*
