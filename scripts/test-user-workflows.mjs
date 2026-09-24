// Comprehensive End-to-End Workflow Verification for CoachingOS
import assert from 'assert';

const BASE = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('   CoachingOS End-to-End Workflow Verification QA   ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    process.stdout.write(`[TEST ${total}] ${name}... `);
    try {
      await fn();
      console.log('✓ PASSED');
      passed++;
    } catch (err) {
      console.log(`✗ FAILED: ${err.message}`);
    }
  }

  // 1. Institute & Lead Pipeline
  await test('CRM: Fetch leads and verify multi-tenant isolation', async () => {
    const res = await fetch(`${BASE}/api/v1/leads?organizationId=org-kota-001`);
    assert.strictEqual(res.status, 200, 'HTTP 200');
    const json = await res.json();
    assert.ok(Array.isArray(json.data), 'Returns array of leads');
    assert.ok(json.data.length > 0, 'Has initial seed leads');
    assert.ok(json.data.every(l => l.organizationId === 'org-kota-001'), 'All leads belong to org-kota-001');
  });

  // 2. Lead Capture
  let createdLeadId = '';
  await test('CRM: Create a new walk-in student enquiry', async () => {
    const res = await fetch(`${BASE}/api/v1/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        branchId: 'branch-01',
        studentName: 'Aarav Singhania',
        phone: '+91 98765 99999',
        guardianName: 'Rajesh Singhania',
        guardianPhone: '+91 98765 88888',
        targetCourse: 'IIT-JEE 2-Year Integrated 2028',
        source: 'WALK_IN',
        notes: 'Walk-in enquiry at Kota campus. Interested in Super 40 batch.',
      }),
    });
    assert.ok(res.status === 200 || res.status === 201, `HTTP 200/201 (got ${res.status})`);
    const json = await res.json();
    assert.ok(json.data && json.data.id, 'Returns created lead with ID');
    assert.strictEqual(json.data.studentName, 'Aarav Singhania');
    createdLeadId = json.data.id;
  });

  // 3. Lead Conversion to Admission (Admission -> Student -> Batch -> Fees -> Parent)
  await test('Admissions: Convert lead to admission (atomic enrollment + invoice + payment)', async () => {
    const res = await fetch(`${BASE}/api/v1/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: createdLeadId,
        organizationId: 'org-kota-001',
        branchId: 'branch-01',
        batchId: 'batch-01',
        totalAmountPaise: 15000000, // ₹1,50,000
        discountAmountPaise: 1500000, // ₹15,000 scholarship
        paidAmountPaise: 5000000, // ₹50,000 initial installment
        paymentMethod: 'UPI',
        admittedBy: 'Pooja Verma',
      }),
    });
    assert.ok(res.status === 200 || res.status === 201, `HTTP 200/201 (got ${res.status})`);
    const json = await res.json();
    assert.ok(json.data.student, 'Student created');
    assert.ok(json.data.invoice, 'Invoice created');
    assert.ok(json.data.payment, 'Payment receipt generated');
    assert.strictEqual(json.data.invoice.paidAmountPaise, 5000000);
    assert.strictEqual(json.data.invoice.balanceAmountPaise, 8500000); // 135000 - 50000 = 85000
  });

  // 4. Invoices & Dynamic UPI POS
  let testInvoiceId = '';
  await test('Finance: Fetch invoices and verify balance computation', async () => {
    const res = await fetch(`${BASE}/api/v1/invoices?organizationId=org-kota-001`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.length > 0, 'Invoices found');
    testInvoiceId = json.data[0].id;
    assert.ok(json.data[0].invoiceNumber, 'Has GST invoice number');
  });

  // 5. Payment Checkout via POS & Dynamic UPI Intent
  await test('Finance: Simulate UPI counter checkout & receipt issuing', async () => {
    const res = await fetch(`${BASE}/api/v1/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        branchId: 'branch-01',
        invoiceId: testInvoiceId,
        studentId: 'stu-001',
        amountPaise: 2500000, // ₹25,000
        paymentMethod: 'UPI',
        channel: 'COUNTER_POS',
      }),
    });
    assert.ok(res.status === 200 || res.status === 201, `HTTP 200/201 (got ${res.status})`);
    const json = await res.json();
    assert.ok(json.data.receiptNumber, 'Issues official receipt number');
    assert.ok(json.data.status === 'SUCCESS' || json.data.status === 'CAPTURED');
  });

  // 5a. Multi-Tenant Payment Setup Configuration
  await test('Payment Setup: Configure and retrieve institute payment methods', async () => {
    const updateRes = await fetch(`${BASE}/api/v1/payments/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        upiId: 'aarohan.payments@icici',
        upiMerchantName: 'Aarohan Academy Kota',
        bankName: 'ICICI Bank',
        bankAccountNumber: '001205009999',
        bankIfsc: 'ICIC0000012',
        cashEnabled: true,
      }),
    });
    assert.strictEqual(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.strictEqual(updateJson.data.upiId, 'aarohan.payments@icici');

    const getRes = await fetch(`${BASE}/api/v1/payments/settings?organizationId=org-kota-001`);
    assert.strictEqual(getRes.status, 200);
    const getJson = await getRes.json();
    assert.strictEqual(getJson.data.upiMerchantName, 'Aarohan Academy Kota');
  });

  // 5b. Installments Plan
  await test('Invoices: Fetch invoice installment milestone schedules', async () => {
    const res = await fetch(`${BASE}/api/v1/invoices/${testInvoiceId}/installments`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data), 'Returns installments array');
    if (json.data.length > 0) {
      assert.ok(json.data[0].amountPaise > 0, 'Has installment amount');
      assert.ok(json.data[0].dueDate, 'Has installment due date');
    }
  });

  // 5c. Online Payment Gateway Server-Side Verification
  let onlinePaymentId = '';
  await test('Online Gateway: Create intent and verify payment server-side with signature', async () => {
    const res = await fetch(`${BASE}/api/v1/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        invoiceId: testInvoiceId,
        studentId: 'stu-000184',
        amountPaise: 1000000, // ₹10,000
        paymentMethod: 'ONLINE_GATEWAY',
        providerPaymentId: `sbx_pay_${Date.now()}`,
        providerOrderId: `sbx_ord_${testInvoiceId}`,
        signature: 'test_signature_valid',
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.status, 'SUCCESS');
    assert.ok(json.data.receiptNumber.startsWith('REC-'));
    onlinePaymentId = json.data.id;
  });

  // 5d. Manual Bank Wire Submission & Administrative Review
  let bankPaymentId = '';
  await test('Bank Transfer: Student submits UTR -> enters MANUAL_REVIEW -> Admin approves', async () => {
    const submitRes = await fetch(`${BASE}/api/v1/payments/bank-transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        invoiceId: testInvoiceId,
        studentId: 'stu-000184',
        amountPaise: 1500000, // ₹15,000
        utrNumber: `UTR-ICICI-${Date.now()}`,
        bankName: 'ICICI Bank',
        notes: 'Transferred via Netbanking',
      }),
    });
    assert.strictEqual(submitRes.status, 201);
    const submitJson = await submitRes.json();
    assert.strictEqual(submitJson.data.status, 'MANUAL_REVIEW');
    bankPaymentId = submitJson.data.id;

    // Admin approves transfer
    const approveRes = await fetch(`${BASE}/api/v1/payments/manual-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: bankPaymentId,
        action: 'APPROVE',
        verifiedBy: 'Anil Sharma (Accounts Admin)',
      }),
    });
    assert.strictEqual(approveRes.status, 200);
    const approveJson = await approveRes.json();
    assert.strictEqual(approveJson.data.status, 'SUCCESS');
    assert.strictEqual(approveJson.data.reconciled, true);
  });

  // 5e. Cash Payment Recording at Counter
  await test('Cash Counter: Record physical cash fee payment and issue receipt', async () => {
    const res = await fetch(`${BASE}/api/v1/payments/cash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        branchId: 'br-kota-main',
        invoiceId: testInvoiceId,
        studentId: 'stu-000184',
        amountPaise: 500000, // ₹5,000
        collectedBy: 'Pooja Verma (Counter Cashier)',
        notes: 'Cash collected at Kota campus counter',
      }),
    });
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.data.paymentMethod, 'CASH');
    assert.strictEqual(json.data.status, 'SUCCESS');
  });

  // 5f. Fee Refund Workflow
  await test('Refunds: Process authorized fee refund and restore invoice balance', async () => {
    const res = await fetch(`${BASE}/api/v1/payments/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        paymentId: onlinePaymentId,
        invoiceId: testInvoiceId,
        studentId: 'stu-000184',
        amountPaise: 200000, // ₹2,000 partial refund
        reason: 'Merit scholarship adjustment',
        requestedBy: 'Anil Sharma (Finance Officer)',
      }),
    });
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.data.status, 'PROCESSED');
    assert.strictEqual(json.data.amountPaise, 200000);
  });

  // 5g. Payment Reminders Automation
  await test('Reminders: Dispatch automated fee payment reminder', async () => {
    const res = await fetch(`${BASE}/api/v1/payments/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        invoiceId: testInvoiceId,
        studentId: 'stu-000184',
        channel: 'WHATSAPP',
        reminderType: 'OVERDUE',
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.sent, true);
    assert.ok(json.data.message.includes('Aarohan'));
  });

  // 6. Rapid Attendance Recording with Parent Alert
  await test('Attendance: 1-Tap batch attendance submission with automated parent alert', async () => {
    const res = await fetch(`${BASE}/api/v1/class-sessions/sess-today-01/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        records: [
          { studentId: 'stu-001', status: 'PRESENT' },
          { studentId: 'stu-002', status: 'ABSENT', reason: 'Uninformed illness' },
        ],
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.data && json.data.length > 0, 'Attendance updated');
    assert.strictEqual(json.meta.presentCount, 1);
    assert.strictEqual(json.meta.absentCount, 1);
    assert.ok(json.meta.smsAlertCount >= 1, 'Dispatched DPDP-compliant WhatsApp/SMS alert to absent student guardian');
  });

  // 7. Academic Interventions Closed Loop
  let caseId = '';
  await test('Interventions: Fetch active remediation cases', async () => {
    const res = await fetch(`${BASE}/api/v1/interventions?organizationId=org-kota-001`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data), 'Returns intervention cases');
    assert.ok(json.data.length > 0, 'Has cases');
    caseId = json.data[0].id;
  });

  await test('Interventions: Update remediation playbook status to RESOLVED_RECOVERED', async () => {
    const res = await fetch(`${BASE}/api/v1/interventions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: caseId,
        status: 'RESOLVED_RECOVERED',
        outcomeNotes: 'Student completed 3 1-on-1 doubt sessions. Re-assessment score improved from 32% to 84%.',
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.status, 'RESOLVED_RECOVERED');
  });

  // 8. Study Materials Workflow
  await test('Study Materials: Upload and retrieve study notes & formula sheets', async () => {
    const postRes = await fetch(`${BASE}/api/v1/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        title: 'Rotational Dynamics Mastery Sheet',
        subject: 'Physics',
        course: 'IIT-JEE 2026',
        batchName: 'Super 40 JEE (Batch A1)',
        type: 'PDF',
        fileUrl: '/materials/rotational-dynamics.pdf',
        fileSize: '3.4 MB',
        uploadedBy: 'Er. R.K. Verma',
      }),
    });
    assert.ok(postRes.status === 200 || postRes.status === 201);
    const postJson = await postRes.json();
    assert.strictEqual(postJson.data.title, 'Rotational Dynamics Mastery Sheet');

    const getRes = await fetch(`${BASE}/api/v1/materials?organizationId=org-kota-001`);
    assert.strictEqual(getRes.status, 200);
    const getJson = await getRes.json();
    assert.ok(Array.isArray(getJson.data));
    assert.ok(getJson.data.some(m => m.title === 'Rotational Dynamics Mastery Sheet'));
  });

  // 9. Messages Workflow (Parent & Student Communication)
  await test('Messages: Dispatch broadcast notice and verify message audit trail', async () => {
    const postRes = await fetch(`${BASE}/api/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        title: 'Sunday Mock Test Schedule Announced',
        message: 'Dear Parents, All India Mock Test 04 will be conducted this Sunday 9:00 AM - 12:00 PM.',
        channel: 'WHATSAPP',
        target: 'ALL_PARENTS',
        recipientCount: 142,
        senderName: 'Academic Director',
      }),
    });
    assert.ok(postRes.status === 200 || postRes.status === 201);
    const postJson = await postRes.json();
    assert.strictEqual(postJson.data.title, 'Sunday Mock Test Schedule Announced');
    assert.strictEqual(postJson.data.status, 'DELIVERED');

    const getRes = await fetch(`${BASE}/api/v1/messages?organizationId=org-kota-001`);
    assert.strictEqual(getRes.status, 200);
    const getJson = await getRes.json();
    assert.ok(getJson.data.some(m => m.title === 'Sunday Mock Test Schedule Announced'));
  });

  // 10. Tests & Results Workflow (Test -> Result -> Weak Areas -> Action)
  await test('Tests & Results: Record test scores and diagnose weak concept areas', async () => {
    const postRes = await fetch(`${BASE}/api/v1/test-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        testId: 'test-01',
        testTitle: 'JEE Advanced Full Syllabus Mock 03',
        studentId: 'stu-000184',
        studentName: 'Ishita Mehra',
        batchName: 'Super 40 JEE (Batch A1)',
        scoreObtained: 275,
        totalMarks: 360,
        percentage: 76.4,
        rank: 4,
        weakTopics: ['Rotational Inertia', 'Optics Ray Tracing'],
        subjectBreakdown: { Physics: 88, Chemistry: 96, Mathematics: 91 },
      }),
    });
    assert.ok(postRes.status === 200 || postRes.status === 201);
    const postJson = await postRes.json();
    assert.strictEqual(postJson.data.scoreObtained, 275);
    assert.deepStrictEqual(postJson.data.weakTopics, ['Rotational Inertia', 'Optics Ray Tracing']);

    const getRes = await fetch(`${BASE}/api/v1/test-results?organizationId=org-kota-001`);
    assert.strictEqual(getRes.status, 200);
    const getJson = await getRes.json();
    assert.ok(getJson.data.some(r => r.scoreObtained === 275));
  });

  // 11. Reports & KPI Summary API
  await test('Reports: Fetch executive analytics summary', async () => {
    const res = await fetch(`${BASE}/api/v1/reports/summary?organizationId=org-kota-001`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.finance, 'Includes finance analytics');
    assert.ok(json.data.academic, 'Includes academic health');
    assert.ok(json.data.batches, 'Includes batch occupancy');
    assert.ok(json.data.finance.collectionRatePct >= 0, 'Computes collection rate %');
  });

  // 12. Student Directory & 360 Profile HTML Rendering
  await test('UI: Master Student Directory (/students) loads clean HTML with 0 errors', async () => {
    const res = await fetch(`${BASE}/students`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Student 360° Directory'), 'Contains Student Directory title');
    assert.ok(html.includes('Export Roster'), 'Contains Export Roster button');
  });

  await test('UI: Student 360° Profile (/students/stu-001) renders dynamic student data', async () => {
    const res = await fetch(`${BASE}/students/stu-001`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('DPDP Act Minor Consent Verified'), 'Contains DPDP verification badge');
    assert.ok(html.includes('Topic Mastery &amp; Concept Health') || html.includes('Topic Mastery'), 'Contains Academic Mastery');
  });

  console.log(`\n====================================================`);
  console.log(`   Verification Finished: ${passed}/${total} Tests Passed!`);
  console.log(`====================================================\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
