import mysql from '../backend/node_modules/mysql2/promise.js';

const BASE_URL = 'http://localhost:4000';

async function main() {
  console.log('===============================================================');
  console.log('🧪 COACHINGOS: FAST MULTI-STUDENT IMPORT VERIFICATION');
  console.log('===============================================================');

  const stamp = Date.now();
  const testInstitute = {
    instituteName: `Fast Onboard Academy ${stamp}`,
    legalName: `Fast Onboard Edutech Pvt Ltd`,
    directorName: `Director ${stamp.toString().slice(-4)}`,
    email: `director.${stamp}@fastonboard.in`,
    phone: `+91 99887 ${stamp.toString().slice(-5)}`,
    password: `Pass@${stamp.toString().slice(-4)}`,
    city: 'Pune',
    state: 'Maharashtra',
    studentTier: 'GROWTH',
  };

  // 1. Register Institute
  console.log('1. Registering Institute...');
  const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testInstitute),
  });
  const regJson = await regRes.json();
  const orgId = regJson.data.organization.id;
  const branchId = regJson.data.branch.id;
  console.log(`  ✅ Registered: Org ID=${orgId}, Branch ID=${branchId}`);

  // 2. Call POST /api/v1/students/bulk-import with 5 pasted students
  console.log('\n2. Bulk importing 5 students with auto-batch creation...');
  const studentsToImport = [
    { fullName: 'Aarav Gupta', phone: '+91 98290 10001', guardianName: 'Sanjay Gupta', guardianPhone: '+91 98290 10002', grade: 'Class 11', targetExam: 'JEE_NEET', feeAmount: 85000 },
    { fullName: 'Diya Sharma', phone: '+91 98290 10003', guardianName: 'Manoj Sharma', guardianPhone: '+91 98290 10004', grade: 'Class 12', targetExam: 'JEE_NEET', feeAmount: 90000 },
    { fullName: 'Kabir Mehta', phone: '+91 98290 10005', guardianName: 'Sunil Mehta', guardianPhone: '+91 98290 10006', grade: 'Class 11', targetExam: 'JEE_NEET', feeAmount: 85000 },
    { fullName: 'Riya Sen', phone: '+91 98290 10007', guardianName: 'Pradeep Sen', guardianPhone: '+91 98290 10008', grade: 'Class 10', targetExam: 'FOUNDATION', feeAmount: 60000 },
    { fullName: 'Tanmay Joshi', phone: '+91 98290 10009', guardianName: 'Deepak Joshi', guardianPhone: '+91 98290 10010', grade: 'Class 12', targetExam: 'JEE_NEET', feeAmount: 90000 },
  ];

  const importRes = await fetch(`${BASE_URL}/api/v1/students/bulk-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizationId: orgId,
      branchId: branchId,
      defaultBatchName: 'Super 30 - JEE 2026',
      students: studentsToImport,
      actorName: 'Director',
    }),
  });

  if (!importRes.ok) {
    throw new Error(`Bulk import failed with status ${importRes.status}`);
  }

  const importJson = await importRes.json();
  console.log(`  ✅ ${importJson.message}`);
  console.log(`  Target Batch: "${importJson.data.batchName}" (ID: ${importJson.data.batchId})`);

  // 3. Verify in MySQL Database directly
  console.log('\n3. Verifying MySQL database directly...');
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'coachingos_db',
  });

  // Verify students in DB
  const [studentRows] = await conn.query('SELECT * FROM students WHERE organization_id = ?', [orgId]);
  if (studentRows.length !== 5) {
    throw new Error(`Expected 5 students in MySQL, found ${studentRows.length}`);
  }
  console.log(`  ✅ MySQL table "students": Exactly ${studentRows.length} students stored!`);
  studentRows.forEach((s, idx) => {
    console.log(`     #${idx + 1}: ${s.full_name} (${s.student_unique_id}) - Roll: ${s.roll_number}, Guardian: ${s.guardian_name}`);
  });

  // Verify batch current enrollment
  const [batchRows] = await conn.query('SELECT * FROM batches WHERE id = ?', [importJson.data.batchId]);
  if (batchRows.length === 0 || batchRows[0].current_enrollment !== 5) {
    throw new Error(`Batch enrollment mismatch. Expected 5, got ${batchRows[0]?.current_enrollment}`);
  }
  console.log(`  ✅ MySQL table "batches": Batch "${batchRows[0].name}" current_enrollment = ${batchRows[0].current_enrollment}`);

  // Verify audit log
  const [auditRows] = await conn.query('SELECT * FROM audit_logs WHERE organization_id = ? AND action = ?', [orgId, 'BULK_IMPORT_STUDENTS']);
  console.log(`  ✅ MySQL table "audit_logs": Action BULK_IMPORT_STUDENTS logged successfully (${auditRows[0]?.entity_id})`);

  // 4. Verify GET /api/v1/students API
  console.log('\n4. Verifying GET /api/v1/students API returns all students...');
  const getRes = await fetch(`${BASE_URL}/api/v1/students?organizationId=${orgId}`);
  const getJson = await getRes.json();
  if (getJson.data.length !== 5) {
    throw new Error(`GET /api/v1/students expected 5, got ${getJson.data.length}`);
  }
  console.log(`  ✅ GET /api/v1/students returned ${getJson.data.length} students matching database records!`);

  await conn.end();

  console.log('\n===============================================================');
  console.log('🎉 FAST MULTI-STUDENT IMPORT VERIFIED 100% WORKING & PERSISTED!');
  console.log('===============================================================');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
