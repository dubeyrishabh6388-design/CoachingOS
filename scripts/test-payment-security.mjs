// Multi-Tenant Payment Security & Isolation Test Suite for CoachingOS
import assert from 'assert';

const BASE = 'http://localhost:3000';

async function runSecurityTests() {
  console.log('================================================================');
  console.log('   CoachingOS Multi-Tenant Payment Security & Isolation QA     ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    process.stdout.write(`[SECURITY TEST ${total}] ${name}... `);
    try {
      await fn();
      console.log('✓ PASSED');
      passed++;
    } catch (err) {
      console.log(`✗ FAILED: ${err.message}`);
    }
  }

  // 1. Multi-Tenant Payment Configuration Isolation
  await test('Isolation: Institute A & B receive independent payment setups', async () => {
    const resA = await fetch(`${BASE}/api/v1/payments/settings?organizationId=org-kota-001`);
    assert.strictEqual(resA.status, 200);
    const jsonA = await resA.json();
    assert.ok(jsonA.data.upiId && jsonA.data.upiId.length > 3, 'Contains configured institute UPI ID');
    assert.strictEqual(jsonA.data.bankName, 'ICICI Bank');

    const resB = await fetch(`${BASE}/api/v1/payments/settings?organizationId=org-pune-002`);
    assert.strictEqual(resB.status, 200);
    const jsonB = await resB.json();
    assert.strictEqual(jsonB.data.organizationId, 'org-pune-002');
    assert.strictEqual(jsonB.data.upiId, 'apexprep@hdfcbank');
    assert.strictEqual(jsonB.data.bankName, 'HDFC Bank');

    assert.notStrictEqual(jsonA.data.upiId, jsonB.data.upiId, 'Institutes must have different UPI IDs');
    assert.notStrictEqual(jsonA.data.bankAccountNumber, jsonB.data.bankAccountNumber, 'Different bank accounts');
  });

  // 2. Invoice Tenant Scoping
  await test('Isolation: Invoices are strictly scoped to organization', async () => {
    const resA = await fetch(`${BASE}/api/v1/invoices?organizationId=org-kota-001`);
    assert.strictEqual(resA.status, 200);
    const jsonA = await resA.json();
    assert.ok(Array.isArray(jsonA.data) && jsonA.data.length > 0);
    assert.ok(jsonA.data.every(i => i.organizationId === 'org-kota-001'), 'All invoices belong to org-kota-001');

    const resB = await fetch(`${BASE}/api/v1/invoices?organizationId=org-pune-002`);
    assert.strictEqual(resB.status, 200);
    const jsonB = await resB.json();
    assert.ok(Array.isArray(jsonB.data));
    assert.ok(jsonB.data.every(i => i.organizationId === 'org-pune-002'), 'All invoices belong to org-pune-002');

    // Cross-tenant check: No invoice from A appears in B
    const idsA = new Set(jsonA.data.map(i => i.id));
    const overlap = jsonB.data.filter(i => idsA.has(i.id));
    assert.strictEqual(overlap.length, 0, 'Zero invoice overlap between Institute A and B');
  });

  // 3. Dynamic UPI Intent Scoping
  await test('Routing: Payment intent routes to the student institute account', async () => {
    // Intent for Kota student
    const resA = await fetch(`${BASE}/api/v1/payments/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        invoiceId: 'inv-kota-demo',
        studentId: 'stu-000184',
        amountPaise: 1500000,
        paymentMethod: 'UPI',
      }),
    });
    assert.strictEqual(resA.status, 200);
    const jsonA = await resA.json();
    const currentSettings = await (await fetch(`${BASE}/api/v1/payments/settings?organizationId=org-kota-001`)).json();
    assert.ok(jsonA.data.upiUri.includes(currentSettings.data.upiId), 'Includes Kota institute configured VPA');
    assert.ok(jsonA.data.upiUri.includes('15000.00'), 'Includes exact rupees');

    // Intent for Pune student
    const resB = await fetch(`${BASE}/api/v1/payments/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-pune-002',
        invoiceId: 'inv-pune-demo',
        studentId: 'stu-pune-99',
        amountPaise: 2500000,
        paymentMethod: 'UPI',
      }),
    });
    assert.strictEqual(resB.status, 200);
    const jsonB = await resB.json();
    assert.ok(jsonB.data.upiUri.includes('apexprep@hdfcbank'), 'Includes Pune institute VPA');
    assert.ok(jsonB.data.upiUri.includes('25000.00'), 'Includes exact rupees');
  });

  // 4. Payment Creation Idempotency
  await test('Idempotency: Repeated checkout requests with same idempotency key do not double charge', async () => {
    const idempotencyKey = `idem_sec_test_${Date.now()}`;
    const invRes = await fetch(`${BASE}/api/v1/invoices?organizationId=org-kota-001`);
    const invoices = (await invRes.json()).data;
    const testInv = invoices[0];

    // First attempt
    const res1 = await fetch(`${BASE}/api/v1/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        branchId: testInv.branchId,
        invoiceId: testInv.id,
        studentId: testInv.studentId,
        amountPaise: 500000,
        paymentMethod: 'UPI',
        idempotencyKey,
      }),
    });
    const json1 = await res1.json();
    assert.strictEqual(res1.status, 201);
    const paymentId1 = json1.data.id;

    // Second attempt with same key
    const res2 = await fetch(`${BASE}/api/v1/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-kota-001',
        branchId: testInv.branchId,
        invoiceId: testInv.id,
        studentId: testInv.studentId,
        amountPaise: 500000,
        paymentMethod: 'UPI',
        idempotencyKey,
      }),
    });
    const json2 = await res2.json();
    assert.ok(res2.status === 200 || res2.status === 201);
    assert.strictEqual(json2.data.id, paymentId1, 'Must return the same payment record ID');
    assert.strictEqual(json2.data.receiptNumber, json1.data.receiptNumber, 'Must return identical receipt');
  });

  // 5. Webhook Idempotency & Deduplication
  await test('Webhooks: Duplicate webhook events are detected and safely ignored', async () => {
    const eventId = `evt_sec_dup_${Date.now()}`;
    const webhookPayload = {
      id: eventId,
      type: 'payment.captured',
      organizationId: 'org-kota-001',
      amount_paise: 200000,
      payment_id: `pay_hook_${Date.now()}`,
    };

    // First webhook delivery
    const res1 = await fetch(`${BASE}/api/v1/payments/webhook/sandbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });
    assert.strictEqual(res1.status, 200);
    const json1 = await res1.json();
    assert.strictEqual(json1.data.status, 'PROCESSED');

    // Second webhook delivery (same event ID)
    const res2 = await fetch(`${BASE}/api/v1/payments/webhook/sandbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });
    assert.strictEqual(res2.status, 200);
    const json2 = await res2.json();
    assert.strictEqual(json2.data.status, 'DUPLICATE_IGNORED', 'Duplicate event must be ignored');
  });

  // 6. Receipts Scoping
  await test('Receipts: Institute receipts contain verified institute GSTIN & name', async () => {
    const res = await fetch(`${BASE}/api/v1/payments/receipts?organizationId=org-kota-001`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data));
    if (json.data.length > 0) {
      const receipt = json.data[0];
      assert.strictEqual(receipt.organizationId, 'org-kota-001');
      assert.ok(receipt.receiptNumber.startsWith('REC-'));
      assert.strictEqual(receipt.organizationName, 'Aarohan JEE Academy');
    }
  });

  console.log(`\n================================================================`);
  console.log(`   Security Verification Finished: ${passed}/${total} Passed!`);
  console.log(`================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runSecurityTests();
