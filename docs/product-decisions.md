# CoachingOS Product Decisions & Rationale

**Document Date:** September 2026  
**Audience:** Founders, Engineers, EdTech Stakeholders

---

## 1. Why an "Operating System", Not an LMS or ERP?
- **The Problem with ERPs:** Legacy coaching ERPs are digital filing cabinets. They require employees to type in data, and then the data sits idle until an executive generates an export at month-end.
- **The Operating System Paradigm:** CoachingOS is event-driven. An event in one domain automatically creates an action in another:
  - *Attendance Event:* Student marked absent $\rightarrow$ triggers instant WhatsApp message $\rightarrow$ if repeated twice, auto-generates an Academic Intervention Case.
  - *CRM Event:* Lead marked "Converted" $\rightarrow$ atomically provisions Student ID, assigns Batch, issues Invoices with instalment due dates, and sets up parent portal credentials.
  - *Payment Event:* UPI QR scanned at counter $\rightarrow$ captures funds, balances ledger, generates GST receipt, and suppresses fee reminder broadcasts.

---

## 2. Technical Decisions & Trade-Offs

### A. Next.js 15 App Router Fullstack Architecture
- **Decision:** Use unified Next.js TypeScript fullstack rather than splitting into separate Node/Express and Vite repos.
- **Rationale:** Eliminates CORS issues, unifies TypeScript types between client and API route handlers, ensures fast page loads with React Server Components, and provides zero-friction deployment to Vercel, AWS Amplify, or a Docker container.

### B. High-Performance Embedded Seed & Data Store with PostgreSQL DDL Parity
- **Decision:** Ship with an in-memory/persisted SQLite/JSON data store that adheres 100% to our PostgreSQL schema specifications.
- **Rationale:** Allows any developer or prospect to clone and run the application instantly without configuring a PostgreSQL daemon, while providing standard SQL DDL scripts (`coachingos_database_and_seed_data.sql`) for production deployments on RDS/Supabase.

### C. Direct Merchant Settlement for UPI (RBI PA/PG Compliance)
- **Decision:** CoachingOS does not act as a Payment Aggregator (PA) and does not touch or escrow client funds.
- **Rationale:** Comply with Reserve Bank of India (RBI) circulars. Institutes connect directly with Razorpay, Cashfree, or ICICI Eazypay. Payments settle directly into the institute's current bank account.

### D. Grounded AI vs. Unbounded Chatbots
- **Decision:** The AI Copilot translates user queries into authorized SQL filters against structured database records.
- **Rationale:** An AI that hallucinates financial balances or student attendance destroys user trust. If data is missing or uncertainty is high, the copilot explicitly states "Insufficient verified data".

### E. DPDP Act (2023) Compliance for Minor Students
- **Decision:** Outbound marketing and operational messages require purpose-specific parental consent recorded with timestamps and guardian relationships.
- **Rationale:** Protects coaching institutes from severe regulatory fines under the Digital Personal Data Protection Act regarding minor data handling.
