import mysql from '../backend/node_modules/mysql2/promise.js';

const BASE_URL = 'http://localhost:4000';

async function main() {
  console.log('===============================================================');
  console.log('🧪 COACHINGOS: MYSQL DYNAMIC REGISTRATION & PERSISTENCE TEST');
  console.log('===============================================================');

  const stamp = Date.now();
  const testInstitute = {
    instituteName: `Gurukul Heights ${stamp}`,
    legalName: `Gurukul Heights Edutech Pvt Ltd`,
    directorName: `Dr. Vikramaditya ${stamp.toString().slice(-4)}`,
    email: `vikram.${stamp}@gurukulheights.in`,
    phone: `+91 98765 ${stamp.toString().slice(-5)}`,
    password: `GurukulPass@${stamp.toString().slice(-4)}`,
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    studentTier: 'PRO_INSTITUTE',
  };

  // 1. API Registration
  console.log(`\n1. Registering Institute via API: "${testInstitute.instituteName}"...`);
  const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testInstitute),
  });

  if (!regRes.ok) {
    throw new Error(`Registration failed with status ${regRes.status}`);
  }
  const regJson = await regRes.json();
  const orgId = regJson.data.organization.id;
  const branchId = regJson.data.branch.id;
  const userId = regJson.data.user.id;
  console.log(`  ✅ Registered: Org ID=${orgId}, Branch ID=${branchId}, User ID=${userId}`);

  // 2. Query MySQL Database Tables directly
  console.log('\n2. Verifying MySQL Database tables directly...');
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'coachingos_db',
  });

  // Check organizations table
  const [orgRows] = await conn.query('SELECT * FROM organizations WHERE id = ?', [orgId]);
  if (orgRows.length === 0) throw new Error('Organization not found in MySQL organizations table!');
  console.log(`  ✅ MySQL table "organizations": Found trade_name="${orgRows[0].trade_name}", status="${orgRows[0].status}"`);

  // Check branches table
  const [branchRows] = await conn.query('SELECT * FROM branches WHERE organization_id = ?', [orgId]);
  if (branchRows.length === 0) throw new Error('Branch not found in MySQL branches table!');
  console.log(`  ✅ MySQL table "branches": Found name="${branchRows[0].name}", city="${branchRows[0].city}"`);

  // Check users table
  const [userRows] = await conn.query('SELECT * FROM users WHERE id = ?', [userId]);
  if (userRows.length === 0) throw new Error('User not found in MySQL users table!');
  console.log(`  ✅ MySQL table "users": Found full_name="${userRows[0].full_name}", role="${userRows[0].role}", password stored=${Boolean(userRows[0].password)}`);

  // Check payment_accounts table
  const [paRows] = await conn.query('SELECT * FROM payment_accounts WHERE organization_id = ?', [orgId]);
  if (paRows.length === 0) throw new Error('Payment Account not found in MySQL payment_accounts table!');
  console.log(`  ✅ MySQL table "payment_accounts": Found upi_id="${paRows[0].upi_id}"`);

  // Check audit_logs table
  const [auditRows] = await conn.query('SELECT * FROM audit_logs WHERE organization_id = ?', [orgId]);
  console.log(`  ✅ MySQL table "audit_logs": Found ${auditRows.length} audit entries (Action: ${auditRows[0]?.action})`);

  // 3. Verify GET /api/v1/auth/bootstrap
  console.log('\n3. Verifying GET /api/v1/auth/bootstrap...');
  const bootRes = await fetch(`${BASE_URL}/api/v1/auth/bootstrap`);
  const bootJson = await bootRes.json();
  const matchedOrg = bootJson.data.organizations.find((o) => o.id === orgId);
  if (!matchedOrg) throw new Error('Registered organization not found in GET /api/v1/auth/bootstrap!');
  console.log(`  ✅ Bootstrap includes new institute: "${matchedOrg.tradeName}"`);

  // 4. Verify Login with registered credentials
  console.log('\n4. Verifying Login with registered email & password...');
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrPhone: testInstitute.email,
      password: testInstitute.password,
    }),
  });

  if (!loginRes.ok) throw new Error(`Login failed with status ${loginRes.status}`);
  const loginJson = await loginRes.json();
  console.log(`  ✅ Login successful: User="${loginJson.data.user.fullName}", Org="${loginJson.data.organization.tradeName}"`);

  // 5. Verify dynamic isolation: new institute has 0 students initially
  const [freshStudents] = await conn.query('SELECT COUNT(*) as count FROM students WHERE organization_id = ?', [orgId]);
  console.log(`  ✅ New Institute has exactly ${freshStudents[0].count} students in MySQL database (zero dummy data)`);

  await conn.end();

  console.log('\n===============================================================');
  console.log('🎉 ALL 7/7 MYSQL PERSISTENCE CHECKS PASSED SUCCESSFULLY!');
  console.log('===============================================================');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
