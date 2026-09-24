# CoachingOS Testing & Verification Protocols

## Automated Verification
1. **Type Safety & Build:** `npm run build` verifies complete TypeScript compilation and route bundling across all pages.
2. **API Smoke Tests:** Tested via PowerShell / curl against `/api/v1/leads`, `/api/v1/invoices`, `/api/v1/attendance`, and `/api/v1/interventions`.

## Manual Flow Scenarios
- **Lead to Enrolled Student:** Ingest new prospect in CRM $\rightarrow$ Open 1-click admission modal $\rightarrow$ Submit $\rightarrow$ Verify presence in Batch Roster and Invoice Ledger.
- **Attendance to WhatsApp Dispatch:** Open attendance grid $\rightarrow$ Toggle absent students $\rightarrow$ Click Sync $\rightarrow$ Verify simulated WhatsApp notice with guardian name and branch phone.
- **Dynamic Counter UPI POS:** Open unpaid invoice in Finance $\rightarrow$ Click Counter POS QR $\rightarrow$ Scan generated QR code $\rightarrow$ Click Simulate Capture $\rightarrow$ Verify invoice balance reaches ₹0 and receipt generated.
- **Academic Remediation:** Inspect at-risk student $\rightarrow$ Review root-cause attendance/test drop signal $\rightarrow$ Log remedial action $\rightarrow$ Mark In Progress or Recovered.
- **AI Operational Q&A:** Query Institute Copilot $\rightarrow$ Verify returned data table and source citations.
