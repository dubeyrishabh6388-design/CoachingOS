// Automated test for Login, Registration, and Password Reset flows
async function runAuthTests() {
  console.log('================================================================');
  console.log('      CoachingOS Multi-Tenant Auth & Onboarding QA Suite        ');
  console.log('================================================================\n');

  // Test 1: Fetch demo personas
  console.log('[AUTH TEST 1] GET /api/v1/auth/demo-users...');
  const res1 = await fetch('http://localhost:4000/api/v1/auth/demo-users');
  const d1 = await res1.json();
  if (res1.status === 200 && d1.data?.length >= 5) {
    console.log(`[PASS] Fetched ${d1.data.length} demo personas: ${d1.data.map(p=>p.role).join(', ')}`);
  } else {
    throw new Error('Failed to load demo personas');
  }

  // Test 2: Standard Login with Director credentials
  console.log('\n[AUTH TEST 2] POST /api/v1/auth/login with Director credentials...');
  const res2 = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrPhone: 'rajesh.sharma@aarohan.edu.in',
      password: 'password123',
    }),
  });
  const d2 = await res2.json();
  if (res2.status === 200 && d2.data?.user?.fullName === 'Dr. Rajesh Sharma' && d2.data.token) {
    console.log(`[PASS] Successfully logged in as ${d2.data.user.fullName} (${d2.data.user.role}) with token.`);
  } else {
    throw new Error('Failed to authenticate director');
  }

  // Test 3: Standard Login with Mobile Number
  console.log('\n[AUTH TEST 3] POST /api/v1/auth/login with Mobile Number...');
  const res3 = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrPhone: '9829023456',
      password: 'password123',
    }),
  });
  const d3 = await res3.json();
  if (res3.status === 200 && d3.data?.user?.role === 'TEACHER') {
    console.log(`[PASS] Mobile number login successful: ${d3.data.user.fullName} (${d3.data.user.role}).`);
  } else {
    throw new Error('Failed to authenticate via phone number');
  }

  // Test 4: Register a new Coaching Institute
  console.log('\n[AUTH TEST 4] POST /api/v1/auth/register new Coaching Institute...');
  const newInstPayload = {
    instituteName: 'Shikhar Career Point',
    legalName: 'Shikhar Education Foundation LLP',
    directorName: 'Er. Manoj Tiwari',
    email: 'manoj.tiwari@shikhar.edu.in',
    phone: '+919876543210',
    password: 'securePassword123',
    city: 'Patna',
    state: 'Bihar',
    studentTier: 'GROWTH',
  };
  const res4 = await fetch('http://localhost:4000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newInstPayload),
  });
  const d4 = await res4.json();
  if (res4.status === 201 && d4.data?.organization?.tradeName === 'Shikhar Career Point') {
    console.log(`[PASS] Institute onboarded: ${d4.data.organization.tradeName} (ID: ${d4.data.organization.id}), Director: ${d4.data.user.fullName}`);
  } else {
    throw new Error('Failed to register new coaching institute');
  }

  // Test 5: Forgot Password
  console.log('\n[AUTH TEST 5] POST /api/v1/auth/forgot-password...');
  const res5 = await fetch('http://localhost:4000/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrPhone: 'manoj.tiwari@shikhar.edu.in' }),
  });
  const d5 = await res5.json();
  if (res5.status === 200 && d5.data?.demoOtp) {
    console.log(`[PASS] Verification code dispatched: ${d5.data.demoOtp} (valid for ${d5.data.expiresIn})`);
  } else {
    throw new Error('Failed forgot-password request');
  }

  console.log('\n================================================================');
  console.log('   Auth Verification Finished: 5/5 Tests Passed!               ');
  console.log('================================================================');
}

runAuthTests().catch(err => {
  console.error('[TEST SUITE FAILED]:', err);
  process.exit(1);
});
