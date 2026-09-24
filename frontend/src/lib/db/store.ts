import { 
  Organization, 
  Branch, 
  User, 
  Course, 
  Batch, 
  Student, 
  Lead, 
  ClassSession, 
  AttendanceRecord, 
  Invoice, 
  Payment, 
  Question, 
  Test, 
  Intervention, 
  AuditLog 
} from '../types';

import {
  SEED_ORGANIZATIONS,
  SEED_BRANCHES,
  SEED_USERS,
  SEED_COURSES,
  SEED_BATCHES,
  SEED_STUDENTS,
  SEED_LEADS,
  SEED_CLASS_SESSIONS,
  SEED_ATTENDANCE,
  SEED_INVOICES,
  SEED_PAYMENTS,
  SEED_QUESTIONS,
  SEED_TESTS,
  SEED_INTERVENTIONS,
  SEED_AUDIT_LOGS,
} from './initial-seed';

class DatabaseStore {
  private organizations: Organization[] = [...SEED_ORGANIZATIONS];
  private branches: Branch[] = [...SEED_BRANCHES];
  private users: User[] = [...SEED_USERS];
  private courses: Course[] = [...SEED_COURSES];
  private batches: Batch[] = [...SEED_BATCHES];
  private students: Student[] = [...SEED_STUDENTS];
  private leads: Lead[] = [...SEED_LEADS];
  private classSessions: ClassSession[] = [...SEED_CLASS_SESSIONS];
  private attendanceRecords: AttendanceRecord[] = [...SEED_ATTENDANCE];
  private invoices: Invoice[] = [...SEED_INVOICES];
  private payments: Payment[] = [...SEED_PAYMENTS];
  private questions: Question[] = [...SEED_QUESTIONS];
  private tests: Test[] = [...SEED_TESTS];
  private interventions: Intervention[] = [...SEED_INTERVENTIONS];
  private auditLogs: AuditLog[] = [...SEED_AUDIT_LOGS];

  // --- Organizations & Branches ---
  getOrganizations() {
    return this.organizations;
  }

  getOrganizationById(id: string) {
    return this.organizations.find(o => o.id === id);
  }

  getBranches(organizationId: string) {
    return this.branches.filter(b => b.organizationId === organizationId);
  }

  // --- Users ---
  getUsers(organizationId: string) {
    return this.users.filter(u => u.organizationId === organizationId);
  }

  getUserById(id: string) {
    return this.users.find(u => u.id === id);
  }

  getUserByPhone(phone: string) {
    const clean = phone.replace(/[^0-9]/g, '');
    return this.users.find(u => {
      const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
      return clean.length >= 7 && (uPhone.endsWith(clean.slice(-10)) || clean.endsWith(uPhone.slice(-10)));
    });
  }

  addUser(user: User): User {
    const idx = this.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      this.users[idx] = user;
    } else {
      this.users.push(user);
    }
    return user;
  }

  updateUserPassword(userId: string, newPass: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.password = newPass;
      return true;
    }
    return false;
  }

  // --- Courses & Batches ---
  getCourses(organizationId: string) {
    return this.courses.filter(c => c.organizationId === organizationId);
  }

  getBatches(organizationId: string, branchId?: string) {
    return this.batches.filter(b => 
      b.organizationId === organizationId && (!branchId || b.branchId === branchId)
    );
  }

  createBatch(batch: Batch): Batch {
    this.batches.unshift(batch);
    this.logAudit(batch.organizationId, 'Director', 'OWNER', 'CREATE_BATCH', 'batches', batch.id);
    return batch;
  }

  // --- Students ---
  getStudents(organizationId: string, batchId?: string) {
    return this.students.filter(s => 
      s.organizationId === organizationId && (!batchId || s.batchId === batchId)
    );
  }

  getStudentById(id: string) {
    return this.students.find(s => s.id === id);
  }

  // --- Leads & CRM ---
  getLeads(organizationId: string, branchId?: string) {
    return this.leads.filter(l => 
      l.organizationId === organizationId && (!branchId || l.branchId === branchId)
    );
  }

  createLead(lead: Omit<Lead, 'id' | 'createdAt'>): Lead {
    const newLead: Lead = {
      ...lead,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.leads.unshift(newLead);
    this.logAudit(lead.organizationId, 'System', 'COUNSELLOR', 'CREATE_LEAD', 'leads', newLead.id);
    return newLead;
  }

  updateLeadStage(id: string, stage: Lead['stage'], notes?: string): Lead | null {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return null;
    lead.stage = stage;
    if (notes) lead.notes = `${lead.notes ? lead.notes + ' | ' : ''}${notes}`;
    return lead;
  }

  // --- Atomic Admission Conversion ---
  convertLeadToAdmission(params: {
    leadId: string;
    organizationId: string;
    branchId: string;
    batchId: string;
    feePlanId?: string;
    totalAmountPaise: number;
    discountAmountPaise: number;
    paidAmountPaise: number;
    paymentMethod: Payment['paymentMethod'];
    admittedBy: string;
  }): { student: Student; invoice: Invoice; payment?: Payment; studentUser: User; parentUser: User } {
    const lead = this.leads.find(l => l.id === params.leadId);
    if (!lead) throw new Error('Lead not found');

    lead.stage = 'CONVERTED';

    const studentId = `stu-${Date.now().toString().slice(-6)}`;
    const studentUniqueId = `STU-KOTA-2026-${this.students.length + 1}`;
    
    const newStudent: Student = {
      id: studentId,
      organizationId: params.organizationId,
      primaryBranchId: params.branchId,
      studentUniqueId,
      fullName: lead.studentName,
      gender: 'MALE',
      phone: lead.phone,
      email: lead.email,
      batchId: params.batchId,
      rollNumber: `KOTA-JEE-27-${String(this.students.length + 1).padStart(2, '0')}`,
      guardianName: lead.guardianName || 'Guardian',
      guardianPhone: lead.guardianPhone || lead.phone,
      guardianRelationship: 'FATHER',
      dpdpConsentGranted: true,
      status: 'ACTIVE',
    };
    this.students.push(newStudent);

    // Auto-create Student User Account (User ID = Mobile Number, initial temporary password = Student@123)
    const studentUserId = `usr-stu-${studentId}`;
    const studentUser: User = {
      id: studentUserId,
      organizationId: params.organizationId,
      primaryBranchId: params.branchId,
      phone: lead.phone,
      email: lead.email || `${lead.phone.replace(/[^0-9]/g, '')}@student.aarohan.edu.in`,
      fullName: lead.studentName,
      role: 'STUDENT',
      designation: 'Enrolled Student',
      password: 'Student@123',
      studentId: studentId,
    };
    this.addUser(studentUser);

    // Auto-create Parent User Account (User ID = Parent Mobile Number, initial temporary password = Parent@123)
    const guardianPhone = lead.guardianPhone || lead.phone;
    const parentUserId = `usr-par-${studentId}`;
    const parentUser: User = {
      id: parentUserId,
      organizationId: params.organizationId,
      primaryBranchId: params.branchId,
      phone: guardianPhone,
      email: `${guardianPhone.replace(/[^0-9]/g, '')}@parent.aarohan.edu.in`,
      fullName: lead.guardianName ? `${lead.guardianName} (Parent)` : `${lead.studentName}'s Parent`,
      role: 'PARENT',
      designation: 'Guardian',
      password: 'Parent@123',
      studentId: studentId,
    };
    this.addUser(parentUser);

    // Update batch capacity
    const batch = this.batches.find(b => b.id === params.batchId);
    if (batch) batch.currentEnrollment += 1;

    // Create Invoice
    const netAmountPaise = params.totalAmountPaise - params.discountAmountPaise;
    const balanceAmountPaise = netAmountPaise - params.paidAmountPaise;
    const invoiceId = `inv-2026-${Date.now().toString().slice(-5)}`;

    const newInvoice: Invoice = {
      id: invoiceId,
      organizationId: params.organizationId,
      branchId: params.branchId,
      studentId,
      invoiceNumber: `INV-2026-AAR-${Date.now().toString().slice(-5)}`,
      totalAmountPaise: params.totalAmountPaise,
      discountAmountPaise: params.discountAmountPaise,
      netAmountPaise,
      paidAmountPaise: params.paidAmountPaise,
      balanceAmountPaise,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: balanceAmountPaise === 0 ? 'PAID' : params.paidAmountPaise > 0 ? 'PARTIALLY_PAID' : 'ISSUED',
    };
    this.invoices.push(newInvoice);

    // Create Payment if paid amount > 0
    let payment: Payment | undefined;
    if (params.paidAmountPaise > 0) {
      payment = {
        id: `pay-${Date.now()}`,
        organizationId: params.organizationId,
        branchId: params.branchId,
        invoiceId,
        studentId,
        amountPaise: params.paidAmountPaise,
        paymentMethod: params.paymentMethod,
        paymentChannel: params.paymentMethod === 'CASH' ? 'COUNTER_CASH' : 'COUNTER_POS',
        provider: 'NONE',
        receiptNumber: `REC-AAR-2026-${Date.now().toString().slice(-5)}`,
        status: 'CAPTURED',
        reconciled: true,
        createdAt: new Date().toISOString(),
      };
      this.payments.push(payment);
    }

    this.logAudit(params.organizationId, params.admittedBy, 'COUNSELLOR', 'CONVERT_ADMISSION', 'students', studentId);

    return { student: newStudent, invoice: newInvoice, payment, studentUser, parentUser };
  }

  // --- Class Sessions & Attendance ---
  getClassSessions(organizationId: string, batchId?: string) {
    return this.classSessions.filter(cs => 
      cs.organizationId === organizationId && (!batchId || cs.batchId === batchId)
    );
  }

  getAttendanceForSession(sessionId: string) {
    return this.attendanceRecords.filter(a => a.sessionId === sessionId);
  }

  getAttendanceRecords(organizationId?: string, studentId?: string) {
    return this.attendanceRecords.filter(a => 
      (!organizationId || a.organizationId === organizationId) &&
      (!studentId || a.studentId === studentId)
    );
  }

  saveBulkAttendance(sessionId: string, organizationId: string, records: { studentId: string; status: AttendanceRecord['status']; reason?: string }[]) {
    // Remove existing for this session to make idempotent
    this.attendanceRecords = this.attendanceRecords.filter(a => a.sessionId !== sessionId);
    const now = new Date().toISOString();
    
    for (const r of records) {
      this.attendanceRecords.push({
        id: `att-${Date.now()}-${r.studentId}`,
        organizationId,
        sessionId,
        studentId: r.studentId,
        status: r.status,
        reason: r.reason,
        markedAt: now,
      });
    }

    // Mark session as completed
    const session = this.classSessions.find(cs => cs.id === sessionId);
    if (session) session.status = 'COMPLETED';

    this.logAudit(organizationId, 'Prof. Alok Mukherjee', 'TEACHER', 'MARK_BULK_ATTENDANCE', 'class_sessions', sessionId);
    return this.getAttendanceForSession(sessionId);
  }

  // --- Invoices & Payments ---
  getInvoices(organizationId: string, branchId?: string) {
    return this.invoices.filter(i => 
      i.organizationId === organizationId && (!branchId || i.branchId === branchId)
    );
  }

  getPayments(organizationId: string) {
    return this.payments.filter(p => p.organizationId === organizationId);
  }

  recordPayment(params: {
    organizationId: string;
    branchId: string;
    invoiceId: string;
    studentId: string;
    amountPaise: number;
    paymentMethod: Payment['paymentMethod'];
    channel: Payment['paymentChannel'];
    provider?: Payment['provider'];
    providerPaymentId?: string;
  }): Payment {
    const invoice = this.invoices.find(i => i.id === params.invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const payment: Payment = {
      id: `pay-${Date.now()}`,
      organizationId: params.organizationId,
      branchId: params.branchId,
      invoiceId: params.invoiceId,
      studentId: params.studentId,
      amountPaise: params.amountPaise,
      paymentMethod: params.paymentMethod,
      paymentChannel: params.channel,
      provider: params.provider || 'NONE',
      providerPaymentId: params.providerPaymentId,
      receiptNumber: `REC-AAR-2026-${Date.now().toString().slice(-5)}`,
      status: 'CAPTURED',
      reconciled: true,
      createdAt: new Date().toISOString(),
    };
    this.payments.unshift(payment);

    invoice.paidAmountPaise += params.amountPaise;
    invoice.balanceAmountPaise = Math.max(0, invoice.netAmountPaise - invoice.paidAmountPaise);
    if (invoice.balanceAmountPaise === 0) {
      invoice.status = 'PAID';
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }

    this.logAudit(params.organizationId, 'Suresh Nair', 'ACCOUNTANT', 'RECORD_PAYMENT', 'payments', payment.id);
    return payment;
  }

  // --- Interventions ---
  getInterventions(organizationId: string) {
    return this.interventions.filter(i => i.organizationId === organizationId);
  }

  createIntervention(intervention: any): Intervention {
    const newIntervention: Intervention = {
      id: `int-${Date.now()}`,
      organizationId: intervention.organizationId || 'org-kota-001',
      studentId: intervention.studentId || '',
      studentName: intervention.studentName || 'Student',
      batchName: intervention.batchName || 'Default Batch',
      triggerReason: intervention.triggerType || intervention.triggerReason || 'Academic Need',
      evidenceSummary: intervention.description || intervention.evidenceSummary || 'Teacher support action requested',
      status: intervention.status || 'OPEN',
      ownerUserId: intervention.ownerId || intervention.ownerUserId || 'usr-002',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      playbook: intervention.playbookAssigned || intervention.playbook || '1-on-1 Concept Remedial + Parent Call',
      playbookAssigned: intervention.playbookAssigned || '1-on-1 Concept Remedial + Parent Call',
      description: intervention.description || '',
      triggerType: intervention.triggerType || 'TEACHER_REFERRAL',
      createdAt: new Date().toISOString(),
    };
    this.interventions.unshift(newIntervention);
    return newIntervention;
  }

  updateInterventionStatus(id: string, status: Intervention['status'], notes?: string): Intervention | null {
    const intervention = this.interventions.find(i => i.id === id);
    if (!intervention) return null;
    intervention.status = status;
    if (notes) intervention.outcomeNotes = notes;
    return intervention;
  }

  resolveIntervention(id: string, notes?: string): Intervention | null {
    return this.updateInterventionStatus(id, 'RESOLVED_RECOVERED', notes);
  }

  // --- Questions & Tests ---
  getQuestions(organizationId: string) {
    return this.questions.filter(q => q.organizationId === organizationId);
  }

  addQuestion(question: Omit<Question, 'id'>): Question {
    const newQuestion: Question = {
      ...question,
      id: `q-${Date.now()}`,
    };
    this.questions.unshift(newQuestion);
    return newQuestion;
  }

  getTests(organizationId: string) {
    return this.tests.filter(t => t.organizationId === organizationId);
  }

  // --- Audit Logs ---
  getAuditLogs(organizationId: string) {
    return this.auditLogs.filter(a => a.organizationId === organizationId);
  }

  private logAudit(organizationId: string, actorName: string, actorRole: string, action: string, entityName: string, entityId: string) {
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      organizationId,
      actorName,
      actorRole,
      action,
      entityName,
      entityId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Seed rich demo data for a newly registered organization.
   * Clones all org-kota-001 data with new IDs mapped to the target org & branch.
   */
  seedDemoDataForOrg(params: {
    orgId: string;
    branchId: string;
    ownerUserId: string;
    ownerName: string;
    orgName: string;
  }) {
    // Skip if already seeded
    if (this.batches.some(b => b.organizationId === params.orgId)) return;

    const ts = Date.now();
    const { orgId, branchId, ownerUserId, ownerName, orgName } = params;

    // ── Course ──────────────────────────────────────────────────────
    const courseId = `crs-demo-${ts}`;
    this.courses.push({
      id: courseId,
      organizationId: orgId,
      name: '2-Year JEE / NEET Integrated Batch',
      targetExam: 'JEE_ADVANCED',
      durationMonths: 24,
      status: 'ACTIVE',
    });

    // ── Batches ──────────────────────────────────────────────────────
    const batchA = `bat-demo-eve-${ts}`;
    const batchB = `bat-demo-mor-${ts}`;
    this.batches.push(
      {
        id: batchA,
        organizationId: orgId,
        branchId,
        courseId,
        name: 'Evening Batch (Super 30)',
        academicYear: '2025-2027',
        maxCapacity: 30,
        currentEnrollment: 22,
        startDate: '2025-06-01',
        endDate: '2027-05-30',
        status: 'ACTIVE',
      },
      {
        id: batchB,
        organizationId: orgId,
        branchId,
        courseId,
        name: 'Morning Batch (Regular)',
        academicYear: '2025-2027',
        maxCapacity: 50,
        currentEnrollment: 44,
        startDate: '2025-06-01',
        endDate: '2027-05-30',
        status: 'ACTIVE',
      }
    );

    // ── Students ─────────────────────────────────────────────────────
    const studentDefs = [
      { name: 'Arjun Patel',      gender: 'MALE'  as const, phone: '+919801100001', gName: 'Sunil Patel',    gPhone: '+919801200001', batch: batchA, roll: '01' },
      { name: 'Sneha Sharma',     gender: 'FEMALE'as const, phone: '+919801100002', gName: 'Ravi Sharma',    gPhone: '+919801200002', batch: batchA, roll: '02' },
      { name: 'Rohit Gupta',      gender: 'MALE'  as const, phone: '+919801100003', gName: 'Ajay Gupta',     gPhone: '+919801200003', batch: batchA, roll: '03' },
      { name: 'Neha Singh',       gender: 'FEMALE'as const, phone: '+919801100004', gName: 'Manish Singh',   gPhone: '+919801200004', batch: batchA, roll: '04' },
      { name: 'Vivek Yadav',      gender: 'MALE'  as const, phone: '+919801100005', gName: 'Suresh Yadav',   gPhone: '+919801200005', batch: batchA, roll: '05' },
      { name: 'Prachi Tiwari',    gender: 'FEMALE'as const, phone: '+919801100006', gName: 'Deepak Tiwari',  gPhone: '+919801200006', batch: batchA, roll: '06' },
      { name: 'Karan Mehta',      gender: 'MALE'  as const, phone: '+919801100007', gName: 'Vikash Mehta',   gPhone: '+919801200007', batch: batchA, roll: '07' },
      { name: 'Anjali Mishra',    gender: 'FEMALE'as const, phone: '+919801100008', gName: 'Anil Mishra',    gPhone: '+919801200008', batch: batchA, roll: '08' },
      { name: 'Shubham Verma',    gender: 'MALE'  as const, phone: '+919801100009', gName: 'Rajesh Verma',   gPhone: '+919801200009', batch: batchB, roll: '09' },
      { name: 'Divya Soni',       gender: 'FEMALE'as const, phone: '+919801100010', gName: 'Pradeep Soni',   gPhone: '+919801200010', batch: batchB, roll: '10' },
      { name: 'Mohit Agarwal',    gender: 'MALE'  as const, phone: '+919801100011', gName: 'Ramesh Agarwal', gPhone: '+919801200011', batch: batchB, roll: '11' },
      { name: 'Pooja Khanna',     gender: 'FEMALE'as const, phone: '+919801100012', gName: 'Girish Khanna',  gPhone: '+919801200012', batch: batchB, roll: '12' },
    ];

    const stuIds: string[] = [];
    studentDefs.forEach((s, i) => {
      const stuId = `stu-demo-${ts}-${i}`;
      stuIds.push(stuId);
      this.students.push({
        id: stuId,
        organizationId: orgId,
        primaryBranchId: branchId,
        studentUniqueId: `STU-DEMO-${ts.toString().slice(-4)}-${String(i + 1).padStart(3, '0')}`,
        fullName: s.name,
        gender: s.gender,
        dob: `200${7 + (i % 3)}-0${(i % 9) + 1}-15`,
        phone: s.phone,
        batchId: s.batch,
        rollNumber: `DEMO-${ts.toString().slice(-4)}-${s.roll}`,
        guardianName: s.gName,
        guardianPhone: s.gPhone,
        guardianRelationship: 'FATHER',
        dpdpConsentGranted: true,
        status: 'ACTIVE',
      });
    });

    // ── Leads ────────────────────────────────────────────────────────
    const leadDefs = [
      { name: 'Sanya Rawat',   phone: '+919900001001', stage: 'DEMO_SCHEDULED' as const, src: 'META_ADS'  as const },
      { name: 'Gaurav Bose',   phone: '+919900001002', stage: 'CONTACTED'      as const, src: 'WALK_IN'   as const },
      { name: 'Ritika Pandey', phone: '+919900001003', stage: 'NEW'            as const, src: 'WHATSAPP'  as const },
      { name: 'Harsh Tomar',   phone: '+919900001004', stage: 'CONVERTED'      as const, src: 'REFERRAL'  as const },
    ];
    leadDefs.forEach((l, i) => {
      this.leads.push({
        id: `lead-demo-${ts}-${i}`,
        organizationId: orgId,
        branchId,
        source: l.src,
        studentName: l.name,
        phone: l.phone,
        interestedCourseId: courseId,
        stage: l.stage,
        notes: 'Prospective student inquiry — auto-seeded demo data.',
        followUpDate: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      });
    });

    // ── Class Sessions ───────────────────────────────────────────────
    const sessId1 = `sess-demo-${ts}-1`;
    const sessId2 = `sess-demo-${ts}-2`;
    this.classSessions.push(
      {
        id: sessId1,
        organizationId: orgId,
        batchId: batchA,
        subjectId: 'sub-phy',
        teacherUserId: ownerUserId,
        classroomName: 'Classroom 1',
        scheduledStart: new Date(Date.now() - 2 * 86400000).toISOString(),
        scheduledEnd:   new Date(Date.now() - 2 * 86400000 + 2 * 3600000).toISOString(),
        topicName: "Newton's Laws of Motion",
        status: 'COMPLETED',
      },
      {
        id: sessId2,
        organizationId: orgId,
        batchId: batchA,
        subjectId: 'sub-phy',
        teacherUserId: ownerUserId,
        classroomName: 'Classroom 1',
        scheduledStart: new Date(Date.now() + 86400000).toISOString(),
        scheduledEnd:   new Date(Date.now() + 86400000 + 2 * 3600000).toISOString(),
        topicName: 'Work, Energy & Power',
        status: 'SCHEDULED',
      }
    );


    // ── Attendance (for sessId1) ──────────────────────────────────────
    stuIds.slice(0, 8).forEach((stuId, i) => {
      this.attendanceRecords.push({
        id: `att-demo-${ts}-${i}`,
        organizationId: orgId,
        sessionId: sessId1,
        studentId: stuId,
        status: i === 2 ? 'ABSENT' : i === 5 ? 'LATE' : 'PRESENT',
        reason: i === 2 ? 'Unwell (parent informed)' : i === 5 ? 'Bus delay' : undefined,
        markedAt: new Date(Date.now() - 2 * 86400000 + 300000).toISOString(),
      });
    });

    // ── Invoices & Payments ──────────────────────────────────────────
    const feeBase = 12000000; // ₹1,20,000
    stuIds.slice(0, 6).forEach((stuId, i) => {
      const invId = `inv-demo-${ts}-${i}`;
      const paid = i === 1 ? feeBase : i === 2 ? 0 : Math.floor(feeBase * 0.4);
      const bal  = feeBase - paid;
      const status: Invoice['status'] = i === 1 ? 'PAID' : bal === feeBase ? 'OVERDUE' : 'PARTIALLY_PAID';
      this.invoices.push({
        id: invId,
        organizationId: orgId,
        branchId,
        studentId: stuId,
        invoiceNumber: `INV-DEMO-${ts.toString().slice(-5)}-${String(i + 1).padStart(3, '0')}`,
        totalAmountPaise: feeBase,
        discountAmountPaise: i === 0 ? 1000000 : 0,
        netAmountPaise: feeBase - (i === 0 ? 1000000 : 0),
        paidAmountPaise: paid,
        balanceAmountPaise: bal,
        dueDate: new Date(Date.now() + (i - 2) * 15 * 86400000).toISOString().split('T')[0],
        status,
      });
      if (paid > 0) {
        this.payments.push({
          id: `pay-demo-${ts}-${i}`,
          organizationId: orgId,
          branchId,
          invoiceId: invId,
          studentId: stuId,
          amountPaise: paid,
          paymentMethod: i % 2 === 0 ? 'UPI' : 'BANK_TRANSFER',
          paymentChannel: 'GATEWAY_LINK',
          provider: 'RAZORPAY',
          receiptNumber: `REC-DEMO-${ts.toString().slice(-5)}-${i + 1}`,
          status: 'CAPTURED',
          reconciled: true,
          createdAt: new Date(Date.now() - (i + 1) * 5 * 86400000).toISOString(),
        });
      }
    });

    // ── Test ─────────────────────────────────────────────────────────
    this.tests.push({
      id: `tst-demo-${ts}`,
      organizationId: orgId,
      courseId,
      title: 'Weekly Test 01: Mechanics & Kinematics',
      totalMarks: 100,
      durationMinutes: 60,
      questionsCount: 25,
      status: 'PUBLISHED',
    });

    // ── Interventions ────────────────────────────────────────────────
    if (stuIds.length >= 3) {
      this.interventions.push({
        id: `int-demo-${ts}`,
        organizationId: orgId,
        studentId: stuIds[2],
        studentName: studentDefs[2].name,
        batchName: 'Evening Batch (Super 30)',
        triggerReason: 'attendance_and_topic_signal',
        evidenceSummary: 'Missed 2 classes; scored below 40% in last test; fee instalment pending.',
        status: 'OPEN',
        ownerUserId,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        playbook: '1-on-1 Concept Remedial + Parent Call',
        createdAt: new Date().toISOString(),
      });
    }

    // ── Audit Log ────────────────────────────────────────────────────
    this.logAudit(orgId, ownerName, 'OWNER', 'INITIALIZE_ORGANIZATION', 'organizations', orgId);
  }
}

// Global Singleton for in-memory persistence during development server lifecycle
const globalForDb = globalThis as unknown as { dbStore?: DatabaseStore };
export const db = globalForDb.dbStore || new DatabaseStore();
if (process.env.NODE_ENV !== 'production') globalForDb.dbStore = db;

// Ensure prototype method exists on hot-reloaded singleton
if (!db.getAttendanceRecords) {
  (db as any).getAttendanceRecords = function(organizationId?: string, studentId?: string) {
    return (this.attendanceRecords || []).filter((a: any) => 
      (!organizationId || a.organizationId === organizationId) &&
      (!studentId || a.studentId === studentId)
    );
  };
}
