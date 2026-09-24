# CoachingOS REST API Reference

Base URL: `http://localhost:3000/api/v1`

## Endpoints

### 1. Leads & Inquiries
- **`GET /leads?organizationId={id}&branchId={id}`**
  - Returns list of leads in the pipeline.
- **`POST /leads`**
  - Body: `{ organizationId, branchId, studentName, phone, guardianName, source, notes }`
  - Normalizes phone numbers, performs duplicate checks, returns created lead or duplicate warning.

### 2. Admissions
- **`POST /admissions`**
  - Body: `{ leadId, organizationId, branchId, batchId, totalAmountPaise, discountAmountPaise, paidAmountPaise, paymentMethod, admittedBy }`
  - Atomically creates student, generates roll number, issues fee invoice, and records initial payment.

### 3. Class Sessions & Attendance
- **`GET /class-sessions/{id}/attendance`**
  - Returns attendance records for the given class session.
- **`PUT /class-sessions/{id}/attendance`**
  - Body: `{ organizationId, records: [{ studentId, status, reason }] }`
  - Idempotently updates student presence states and queues parent WhatsApp notifications.

### 4. Invoices & Payments
- **`GET /invoices?organizationId={id}`**
  - Returns list of student fee invoices with balances and due dates.
- **`POST /payments/checkout`**
  - Body: `{ organizationId, branchId, invoiceId, studentId, amountPaise, paymentMethod, channel, action }`
  - If `action: 'GENERATE_UPI_QR'`, returns dynamic NPCI `upi://pay` URI string.
  - Otherwise captures payment, balances the ledger, and generates receipt number.

### 5. Academic Interventions
- **`GET /interventions?organizationId={id}`**
  - Returns active remediation cases flagged by the early-warning engine.
- **`PATCH /interventions`**
  - Body: `{ id, status, outcomeNotes }`
  - Updates remediation state (`IN_PROGRESS`, `RESOLVED_RECOVERED`).

### 6. Grounded AI Copilot
- **`POST /ai/queries`**
  - Body: `{ query, organizationId, branchId }`
  - Executes semantic query matching against verified database entities, returning structured data and citations.
