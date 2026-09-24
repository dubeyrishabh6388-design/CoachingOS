// Automated route & API inspector for CoachingOS
const routes = [
  '/',
  '/admissions',
  '/students',
  '/students/stu-001',
  '/academics/batches',
  '/academics/attendance',
  '/academics/tests',
  '/materials',
  '/finance',
  '/messages',
  '/reports',
  '/settings',
  '/settings/import',
  '/settings/audit',
  '/interventions',
  '/copilot',
  '/login',
  '/register',
  '/forgot-password',
  '/api/v1/leads',
  '/api/v1/students',
  '/api/v1/batches',
  '/api/v1/invoices',
  '/api/v1/interventions',
  '/api/v1/materials',
  '/api/v1/messages',
  '/api/v1/test-results',
  '/api/v1/reports/summary',
  '/api/v1/payments/settings',
  '/api/v1/payments',
  '/api/v1/payments/receipts',
  '/api/v1/payments/reconciliation',
  '/api/v1/class-sessions/sess-today-01/attendance',
];

async function runAudit() {
  console.log('--- Starting CoachingOS Full Route Audit ---');
  let passCount = 0;
  for (const r of routes) {
    const t0 = Date.now();
    try {
      const res = await fetch('http://localhost:3000' + r);
      const latency = Date.now() - t0;
      if (res.status === 200) {
        console.log(`[PASS] ${r.padEnd(50)} Status: ${res.status} (${latency}ms)`);
        passCount++;
      } else {
        console.warn(`[WARN] ${r.padEnd(50)} Status: ${res.status} (${latency}ms)`);
      }
    } catch (err) {
      console.error(`[FAIL] ${r.padEnd(50)} Error: ${err.message}`);
    }
  }
  console.log(`\n--- Audit Complete: ${passCount}/${routes.length} routes healthy ---`);
  if (passCount !== routes.length) {
    process.exit(1);
  }
}

runAudit();
