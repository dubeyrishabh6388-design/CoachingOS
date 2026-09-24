# CoachingOS — Multi-Tenant Coaching Institute OS

CoachingOS is structured as a monorepo containing two separate, independent services inside one parent directory:

```
coachingos/
├── package.json          # Root orchestration scripts
├── README.md             # Project documentation
├── scripts/              # QA test & route verification scripts
│   ├── audit-routes.mjs
│   └── test-user-workflows.mjs
│
├── frontend/             # Next.js 15 App (UI, pages, components)
│   ├── .env              # Frontend environment variables
│   ├── .env.example
│   ├── package.json      # Frontend dependencies & scripts
│   ├── tsconfig.json
│   ├── next.config.ts    # Configured with API rewrites to backend
│   ├── tailwind.config.ts
│   └── src/
│       ├── app/          # Dashboard, CRM, Academics, Finance, Settings
│       ├── components/   # AppShell, Navbar, Sidebar, CommandPalette
│       └── lib/          # AppContext, types, client utilities
│
└── backend/              # Express REST API Server (Business logic, DB store)
    ├── .env              # Backend environment variables
    ├── .env.example
    ├── package.json      # Backend dependencies & scripts
    ├── tsconfig.json
    └── src/
        ├── index.ts      # Express server entry point (Port 4000)
        ├── routes/       # Leads, Invoices, Admissions, Payments, Attendance, etc.
        ├── db/           # In-memory DB store & initial seed data
        └── lib/          # Email notifications (nodemailer), types
```

---

## Environment Variables (`.env`)

Each service has its own dedicated `.env` file:

### Frontend Environment (`frontend/.env`)
```env
PORT=3000
NODE_ENV=development

# Application & Backend URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Default Institute & Branch Context
NEXT_PUBLIC_DEFAULT_ORG_ID=org-kota-001
NEXT_PUBLIC_DEFAULT_BRANCH_ID=br-kota-main
```

### Backend Environment (`backend/.env`)
```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Multi-Tenant Cloud Default Identifiers
DEFAULT_ORG_ID=org-kota-001
DEFAULT_BRANCH_ID=br-kota-main

# Payment Gateway (Direct Merchant Settlement)
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=rzp_secret_placeholder

# AI Provider Configuration
LLM_PROVIDER=gemini
GEMINI_API_KEY=placeholder_api_key

# Absence Notification via Gmail SMTP (Free)
NOTIFY_FROM_EMAIL=yourname@gmail.com
NOTIFY_FROM_APP_PASS=xxxx xxxx xxxx xxxx
NOTIFY_TO_EMAIL=6388248689@test.com
```

---

## Getting Started

### 1. Run Both Services Concurrently
From the root directory:
```bash
npm run dev
```
This runs:
- **Frontend** at [http://localhost:3000](http://localhost:3000)
- **Backend** at [http://localhost:4000](http://localhost:4000)

### 2. Run Services Individually
```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

### 3. Build Both Services
```bash
npm run build
```

### 4. Verification & Testing
```bash
# Verify all 17 routes
npm run audit

# Run 10/10 automated E2E workflows
npm run test
```
