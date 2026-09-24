import { query, getPool } from './mysql.js';
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
  AuditLog,
  StudyMaterial,
  MessageItem,
  TestResult,
  PaymentAccount,
  InvoiceInstallment,
  Refund,
  PaymentReceipt,
  ReconciliationSummary,
} from '../lib/types.js';

export class DatabaseStore {
  // --- Organizations & Branches ---
  async getOrganizations(): Promise<Organization[]> {
    const rows = await query<any[]>('SELECT id, legal_name as legalName, trade_name as tradeName, gstin, timezone, currency, tier, status FROM organizations ORDER BY created_at DESC');
    return rows;
  }

  async getOrganizationById(id: string): Promise<Organization | undefined> {
    const rows = await query<any[]>('SELECT id, legal_name as legalName, trade_name as tradeName, gstin, timezone, currency, tier, status FROM organizations WHERE id = ?', [id]);
    return rows[0];
  }

  async createOrganization(org: Organization): Promise<Organization> {
    await query(
      'INSERT INTO organizations (id, legal_name, trade_name, gstin, timezone, currency, tier, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [org.id, org.legalName, org.tradeName, org.gstin || null, org.timezone || 'Asia/Kolkata', org.currency || 'INR', org.tier || 'GROWTH', org.status || 'ACTIVE']
    );
    return org;
  }

  async getBranches(organizationId: string): Promise<Branch[]> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, branch_code as branchCode, name, address, city, state, pincode, phone, status FROM branches WHERE organization_id = ?', [organizationId]);
    return rows;
  }

  async getAllBranches(): Promise<Branch[]> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, branch_code as branchCode, name, address, city, state, pincode, phone, status FROM branches');
    return rows;
  }

  async createBranch(branch: Branch): Promise<Branch> {
    await query(
      'INSERT INTO branches (id, organization_id, branch_code, name, address, city, state, pincode, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [branch.id, branch.organizationId, branch.branchCode, branch.name, branch.address, branch.city, branch.state, branch.pincode, branch.phone, branch.status || 'ACTIVE']
    );
    return branch;
  }

  // --- Users ---
  async getUsers(organizationId: string): Promise<User[]> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, primary_branch_id as primaryBranchId, phone, email, full_name as fullName, role, designation, avatar_url as avatarUrl FROM users WHERE organization_id = ?', [organizationId]);
    return rows;
  }

  async getAllUsers(): Promise<User[]> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, primary_branch_id as primaryBranchId, phone, email, full_name as fullName, role, designation, avatar_url as avatarUrl FROM users');
    return rows;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, primary_branch_id as primaryBranchId, phone, email, full_name as fullName, role, designation, avatar_url as avatarUrl FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  async getUserByEmailOrPhone(identifier: string): Promise<(User & { password?: string }) | undefined> {
    const clean = identifier.trim().toLowerCase();
    const cleanPhone = clean.replace(/[^0-9]/g, '');
    let sql: string;
    let params: any[];

    if (cleanPhone.length >= 7) {
      sql = `SELECT id, organization_id as organizationId, primary_branch_id as primaryBranchId, phone, email, full_name as fullName, role, designation, avatar_url as avatarUrl, password
             FROM users
             WHERE LOWER(email) = ? OR (phone IS NOT NULL AND REPLACE(REPLACE(phone, ' ', ''), '-', '') LIKE ?)
             LIMIT 1`;
      params = [clean, `%${cleanPhone.slice(-10)}%`];
    } else {
      sql = `SELECT id, organization_id as organizationId, primary_branch_id as primaryBranchId, phone, email, full_name as fullName, role, designation, avatar_url as avatarUrl, password
             FROM users
             WHERE LOWER(email) = ?
             LIMIT 1`;
      params = [clean];
    }

    const rows = await query<any[]>(sql, params);
    return rows[0];
  }

  async createUser(user: User & { password?: string }): Promise<User> {
    await query(
      'INSERT INTO users (id, organization_id, primary_branch_id, phone, email, full_name, role, designation, avatar_url, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user.id, user.organizationId, user.primaryBranchId || null, user.phone, user.email || null, user.fullName, user.role, user.designation || null, user.avatarUrl || null, user.password || null]
    );
    return {
      id: user.id,
      organizationId: user.organizationId,
      primaryBranchId: user.primaryBranchId,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      designation: user.designation,
      avatarUrl: user.avatarUrl,
    };
  }

  async updateUserPassword(userId: string, newPass: string): Promise<boolean> {
    await query('UPDATE users SET password = ? WHERE id = ?', [newPass, userId]);
    return true;
  }

  // --- Courses & Batches ---
  async getCourses(organizationId: string): Promise<Course[]> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, name, target_exam as targetExam, duration_months as durationMonths, status FROM courses WHERE organization_id = ?', [organizationId]);
    return rows;
  }

  async getBatches(organizationId: string, branchId?: string): Promise<Batch[]> {
    let sql = 'SELECT id, organization_id as organizationId, branch_id as branchId, course_id as courseId, name, code, academic_year as academicYear, max_capacity as maxCapacity, current_enrollment as currentEnrollment, start_date as startDate, end_date as endDate, status FROM batches WHERE organization_id = ?';
    const params: any[] = [organizationId];
    if (branchId) {
      sql += ' AND branch_id = ?';
      params.push(branchId);
    }
    const rows = await query<any[]>(sql, params);
    return rows;
  }

  async getBatchById(id: string): Promise<Batch | undefined> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, branch_id as branchId, course_id as courseId, name, code, academic_year as academicYear, max_capacity as maxCapacity, current_enrollment as currentEnrollment, start_date as startDate, end_date as endDate, status FROM batches WHERE id = ?', [id]);
    return rows[0];
  }

  async createBatch(batch: Omit<Batch, 'id'> & { id?: string }): Promise<Batch> {
    const id = batch.id || `batch-${Date.now()}`;
    await query(
      'INSERT INTO batches (id, organization_id, branch_id, course_id, name, code, academic_year, max_capacity, current_enrollment, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, batch.organizationId, batch.branchId, batch.courseId || null, batch.name, batch.code, batch.academicYear, batch.maxCapacity, batch.currentEnrollment || 0, batch.startDate, batch.endDate, batch.status || 'ACTIVE']
    );
    await this.logAudit(batch.organizationId, 'Director', 'OWNER', 'CREATE_BATCH', 'batches', id);
    return {
      ...batch,
      id,
      currentEnrollment: batch.currentEnrollment || 0,
      status: batch.status || 'ACTIVE',
    };
  }

  // --- Students ---
  async getStudents(organizationId: string, batchId?: string): Promise<Student[]> {
    let sql = 'SELECT id, organization_id as organizationId, primary_branch_id as primaryBranchId, student_unique_id as studentUniqueId, full_name as fullName, gender, dob, phone, email, batch_id as batchId, roll_number as rollNumber, guardian_name as guardianName, guardian_phone as guardianPhone, guardian_email as guardianEmail, guardian_relationship as guardianRelationship, dpdp_consent_granted as dpdpConsentGranted, grade, board, target_exam as targetExam, status FROM students WHERE organization_id = ?';
    const params: any[] = [organizationId];
    if (batchId) {
      sql += ' AND batch_id = ?';
      params.push(batchId);
    }
    const rows = await query<any[]>(sql, params);
    return rows.map(r => ({ ...r, dpdpConsentGranted: Boolean(r.dpdpConsentGranted) }));
  }

  async getStudentById(id: string): Promise<Student | undefined> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, primary_branch_id as primaryBranchId, student_unique_id as studentUniqueId, full_name as fullName, gender, dob, phone, email, batch_id as batchId, roll_number as rollNumber, guardian_name as guardianName, guardian_phone as guardianPhone, guardian_email as guardianEmail, guardian_relationship as guardianRelationship, dpdp_consent_granted as dpdpConsentGranted, grade, board, target_exam as targetExam, status FROM students WHERE id = ?', [id]);
    if (!rows[0]) return undefined;
    return { ...rows[0], dpdpConsentGranted: Boolean(rows[0].dpdpConsentGranted) };
  }

  async bulkImportStudents(params: {
    organizationId: string;
    branchId: string;
    defaultBatchId?: string;
    defaultBatchName?: string;
    students: Array<{
      fullName: string;
      phone?: string;
      email?: string;
      gender?: string;
      guardianName?: string;
      guardianPhone?: string;
      guardianRelationship?: string;
      targetExam?: string;
      grade?: string;
      board?: string;
      batchId?: string;
      batchName?: string;
      feeAmount?: number;
    }>;
    actorName?: string;
  }): Promise<{ count: number; students: Student[]; batchId: string; batchName: string }> {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Resolve or create active batch for students
      let targetBatchId: string = params.defaultBatchId || '';
      let targetBatchName: string = params.defaultBatchName || 'Batch Alpha 2026';

      if (!targetBatchId) {
        const [existingBatches] = await conn.query<any[]>(
          'SELECT id, name FROM batches WHERE organization_id = ? LIMIT 1',
          [params.organizationId]
        );

        if (existingBatches.length > 0) {
          targetBatchId = existingBatches[0].id;
          targetBatchName = existingBatches[0].name;
        } else {
          targetBatchId = `batch-${Date.now()}`;
          await conn.query(
            `INSERT INTO batches (id, organization_id, branch_id, course_id, name, code, academic_year, max_capacity, current_enrollment, start_date, end_date, status)
             VALUES (?, ?, ?, 'crs-general', ?, 'ALPHA_01', '2026-2027', 60, 0, '2026-04-01', '2027-03-31', 'ACTIVE')`,
            [targetBatchId, params.organizationId, params.branchId, targetBatchName]
          );
        }
      }

      // 2. Count existing students for roll number sequence
      const [countRows] = await conn.query<any[]>(
        'SELECT COUNT(*) as cnt FROM students WHERE organization_id = ?',
        [params.organizationId]
      );
      let nextSeq = (countRows[0].cnt || 0) + 1;

      const createdStudents: Student[] = [];

      for (const s of params.students) {
        if (!s.fullName || s.fullName.trim().length === 0) continue;

        const studentId = `stu-${Date.now().toString().slice(-6)}-${nextSeq}`;
        const studentUniqueId = `STU-${String(nextSeq).padStart(4, '0')}`;
        const rollNumber = `R-${String(nextSeq).padStart(3, '0')}`;
        const phone = s.phone?.trim() || null;
        const guardianName = s.guardianName?.trim() || 'Parent / Guardian';
        const guardianPhone = s.guardianPhone?.trim() || phone || 'Not Provided';
        const gender = (s.gender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE') as any;
        const studentBatchId = s.batchId || targetBatchId;

        const student: Student = {
          id: studentId,
          organizationId: params.organizationId,
          primaryBranchId: params.branchId,
          studentUniqueId,
          fullName: s.fullName.trim(),
          gender,
          phone: phone || undefined,
          email: s.email?.trim() || undefined,
          batchId: studentBatchId,
          rollNumber,
          guardianName,
          guardianPhone,
          guardianRelationship: (s.guardianRelationship as any) || 'FATHER',
          dpdpConsentGranted: true,
          grade: s.grade || 'Class 11',
          board: s.board || 'CBSE',
          targetExam: s.targetExam || 'JEE_NEET',
          status: 'ACTIVE',
        };

        await conn.query(
          `INSERT INTO students 
           (id, organization_id, primary_branch_id, student_unique_id, full_name, gender, phone, email, batch_id, roll_number, guardian_name, guardian_phone, guardian_relationship, dpdp_consent_granted, grade, board, target_exam, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 'ACTIVE')`,
          [
            student.id,
            student.organizationId,
            student.primaryBranchId,
            student.studentUniqueId,
            student.fullName,
            student.gender,
            student.phone || null,
            student.email || null,
            student.batchId,
            student.rollNumber,
            student.guardianName,
            student.guardianPhone,
            student.guardianRelationship,
            student.grade || null,
            student.board || null,
            student.targetExam || null,
          ]
        );

        if (s.feeAmount && s.feeAmount > 0) {
          const feePaise = Math.round(s.feeAmount * 100);
          const invoiceId = `inv-init-${Date.now().toString().slice(-5)}-${nextSeq}`;
          const invNum = `INV-INIT-${String(nextSeq).padStart(4, '0')}`;
          const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

          await conn.query(
            `INSERT INTO invoices 
             (id, organization_id, branch_id, student_id, invoice_number, total_amount_paise, discount_amount_paise, net_amount_paise, paid_amount_paise, balance_amount_paise, due_date, status)
             VALUES (?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?, 'ISSUED')`,
            [invoiceId, params.organizationId, params.branchId, student.id, invNum, feePaise, feePaise, feePaise, dueDate]
          );
        }

        createdStudents.push(student);
        nextSeq++;
      }

      if (createdStudents.length > 0) {
        await conn.query(
          'UPDATE batches SET current_enrollment = current_enrollment + ? WHERE id = ?',
          [createdStudents.length, targetBatchId]
        );

        await conn.query(
          'INSERT INTO audit_logs (id, organization_id, actor_name, actor_role, action, entity_name, entity_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            `log-import-${Date.now()}`,
            params.organizationId,
            params.actorName || 'Director',
            'OWNER',
            'BULK_IMPORT_STUDENTS',
            'students',
            `${createdStudents.length} Students`,
            new Date().toISOString(),
          ]
        );
      }

      await conn.commit();

      return {
        count: createdStudents.length,
        students: createdStudents,
        batchId: targetBatchId,
        batchName: targetBatchName,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // --- Leads & CRM ---
  async getLeads(organizationId: string, branchId?: string): Promise<Lead[]> {
    let sql = 'SELECT id, organization_id as organizationId, branch_id as branchId, source, student_name as studentName, phone, email, guardian_name as guardianName, guardian_phone as guardianPhone, interested_course_id as interestedCourseId, target_course as targetCourse, assigned_counsellor_id as assignedCounsellorId, stage, notes, follow_up_date as followUpDate, created_at as createdAt FROM leads WHERE organization_id = ?';
    const params: any[] = [organizationId];
    if (branchId) {
      sql += ' AND branch_id = ?';
      params.push(branchId);
    }
    sql += ' ORDER BY created_at DESC';
    const rows = await query<any[]>(sql, params);
    return rows;
  }

  async createLead(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const id = `lead-${Date.now()}`;
    const createdAt = new Date().toISOString();
    await query(
      'INSERT INTO leads (id, organization_id, branch_id, source, student_name, phone, email, guardian_name, guardian_phone, interested_course_id, target_course, assigned_counsellor_id, stage, notes, follow_up_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, lead.organizationId, lead.branchId, lead.source, lead.studentName, lead.phone, lead.email || null, lead.guardianName || null, lead.guardianPhone || null, lead.interestedCourseId, lead.targetCourse || null, lead.assignedCounsellorId || null, lead.stage || 'NEW', lead.notes || null, lead.followUpDate || null, createdAt]
    );

    await this.logAudit(lead.organizationId, 'System', 'COUNSELLOR', 'CREATE_LEAD', 'leads', id);

    return {
      ...lead,
      id,
      createdAt,
    };
  }

  async updateLeadStage(id: string, stage: Lead['stage'], notes?: string): Promise<Lead | null> {
    const rows = await query<any[]>('SELECT * FROM leads WHERE id = ?', [id]);
    if (!rows[0]) return null;

    let updatedNotes = rows[0].notes;
    if (notes) {
      updatedNotes = updatedNotes ? `${updatedNotes} | ${notes}` : notes;
    }

    await query('UPDATE leads SET stage = ?, notes = ? WHERE id = ?', [stage, updatedNotes, id]);

    const updated = await query<any[]>('SELECT id, organization_id as organizationId, branch_id as branchId, source, student_name as studentName, phone, email, guardian_name as guardianName, guardian_phone as guardianPhone, interested_course_id as interestedCourseId, target_course as targetCourse, assigned_counsellor_id as assignedCounsellorId, stage, notes, follow_up_date as followUpDate, created_at as createdAt FROM leads WHERE id = ?', [id]);
    return updated[0];
  }

  // --- Atomic Admission Conversion ---
  async convertLeadToAdmission(params: {
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
  }): Promise<{ student: Student; invoice: Invoice; payment?: Payment; studentUser?: any; parentUser?: any }> {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Find lead
      const [leadRows] = await conn.query<any[]>('SELECT * FROM leads WHERE id = ? FOR UPDATE', [params.leadId]);
      if (!leadRows[0]) throw new Error('Lead not found');
      const lead = leadRows[0];

      // Update lead stage
      await conn.query('UPDATE leads SET stage = ? WHERE id = ?', ['CONVERTED', params.leadId]);

      // Count students for roll number
      const [countRows] = await conn.query<any[]>('SELECT COUNT(*) as cnt FROM students WHERE organization_id = ?', [params.organizationId]);
      const nextNum = (countRows[0].cnt || 0) + 1;

      const studentId = `stu-${Date.now().toString().slice(-6)}`;
      const studentUniqueId = `STU-KOTA-2026-${nextNum}`;
      const rollNumber = `KOTA-JEE-27-${String(nextNum).padStart(2, '0')}`;

      const newStudent: Student = {
        id: studentId,
        organizationId: params.organizationId,
        primaryBranchId: params.branchId,
        studentUniqueId,
        fullName: lead.student_name,
        gender: 'MALE',
        phone: lead.phone,
        email: lead.email || undefined,
        batchId: params.batchId,
        rollNumber,
        guardianName: lead.guardian_name || 'Guardian',
        guardianPhone: lead.guardian_phone || lead.phone,
        guardianRelationship: 'FATHER',
        dpdpConsentGranted: true,
        status: 'ACTIVE',
      };

      await conn.query(
        'INSERT INTO students (id, organization_id, primary_branch_id, student_unique_id, full_name, gender, phone, email, batch_id, roll_number, guardian_name, guardian_phone, guardian_relationship, dpdp_consent_granted, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newStudent.id, newStudent.organizationId, newStudent.primaryBranchId, newStudent.studentUniqueId, newStudent.fullName, newStudent.gender, newStudent.phone || null, newStudent.email || null, newStudent.batchId, newStudent.rollNumber, newStudent.guardianName, newStudent.guardianPhone, newStudent.guardianRelationship, 1, newStudent.status]
      );

      // Increment batch enrollment
      await conn.query('UPDATE batches SET current_enrollment = current_enrollment + 1 WHERE id = ?', [params.batchId]);

      // Create Invoice
      const netAmountPaise = params.totalAmountPaise - params.discountAmountPaise;
      const balanceAmountPaise = netAmountPaise - params.paidAmountPaise;
      const invoiceId = `inv-2026-${Date.now().toString().slice(-5)}`;
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const invoiceStatus: Invoice['status'] = balanceAmountPaise === 0 ? 'PAID' : params.paidAmountPaise > 0 ? 'PARTIALLY_PAID' : 'ISSUED';

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
        dueDate,
        status: invoiceStatus,
      };

      await conn.query(
        'INSERT INTO invoices (id, organization_id, branch_id, student_id, invoice_number, total_amount_paise, discount_amount_paise, net_amount_paise, paid_amount_paise, balance_amount_paise, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newInvoice.id, newInvoice.organizationId, newInvoice.branchId, newInvoice.studentId, newInvoice.invoiceNumber, newInvoice.totalAmountPaise, newInvoice.discountAmountPaise, newInvoice.netAmountPaise, newInvoice.paidAmountPaise, newInvoice.balanceAmountPaise, newInvoice.dueDate, newInvoice.status]
      );

      // Create Payment if paidAmount > 0
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

        await conn.query(
          'INSERT INTO payments (id, organization_id, branch_id, invoice_id, student_id, amount_paise, payment_method, payment_channel, provider, receipt_number, status, reconciled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [payment.id, payment.organizationId, payment.branchId, payment.invoiceId, payment.studentId, payment.amountPaise, payment.paymentMethod, payment.paymentChannel, payment.provider, payment.receiptNumber, payment.status, 1, payment.createdAt]
        );
      }

      // Auto-create Student User Account (Mobile is User ID, default password Student@123)
      const studentUserId = `usr-stu-${studentId}`;
      const studentPhone = lead.phone ? String(lead.phone).trim() : `+9198000${Math.floor(10000 + Math.random() * 90000)}`;
      const studentEmail = lead.email || `${studentPhone.replace(/[^0-9]/g, '')}@student.aarohan.edu.in`;
      const studentUser = {
        id: studentUserId,
        organizationId: params.organizationId,
        primaryBranchId: params.branchId,
        phone: studentPhone,
        email: studentEmail,
        fullName: lead.student_name,
        role: 'STUDENT' as const,
        designation: 'Enrolled Student',
        password: 'Student@123',
      };

      try {
        await conn.query(
          `INSERT INTO users (id, organization_id, primary_branch_id, phone, email, full_name, role, designation, password)
           VALUES (?, ?, ?, ?, ?, ?, 'STUDENT', 'Enrolled Student', 'Student@123')
           ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
          [studentUserId, params.organizationId, params.branchId, studentPhone, studentEmail, lead.student_name]
        );
      } catch (uErr) {
        console.warn('Could not insert student user into users table:', uErr);
      }

      // Auto-create Parent User Account (Mobile is User ID, default password Parent@123)
      const parentUserId = `usr-par-${studentId}`;
      const guardianPhone = lead.guardian_phone || studentPhone;
      const guardianName = lead.guardian_name ? `${lead.guardian_name} (Parent)` : `${lead.student_name}'s Parent`;
      const guardianEmail = `${String(guardianPhone).replace(/[^0-9]/g, '')}@parent.aarohan.edu.in`;
      const parentUser = {
        id: parentUserId,
        organizationId: params.organizationId,
        primaryBranchId: params.branchId,
        phone: guardianPhone,
        email: guardianEmail,
        fullName: guardianName,
        role: 'PARENT' as const,
        designation: 'Guardian',
        password: 'Parent@123',
      };

      try {
        await conn.query(
          `INSERT INTO users (id, organization_id, primary_branch_id, phone, email, full_name, role, designation, password)
           VALUES (?, ?, ?, ?, ?, ?, 'PARENT', 'Guardian', 'Parent@123')
           ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
          [parentUserId, params.organizationId, params.branchId, guardianPhone, guardianEmail, guardianName]
        );
      } catch (pErr) {
        console.warn('Could not insert parent user into users table:', pErr);
      }

      await conn.commit();

      await this.logAudit(params.organizationId, params.admittedBy, 'COUNSELLOR', 'CONVERT_ADMISSION', 'students', studentId);

      return { student: newStudent, invoice: newInvoice, payment, studentUser, parentUser };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // --- Class Sessions & Attendance ---
  async getClassSessions(organizationId: string, batchId?: string): Promise<ClassSession[]> {
    let sql = 'SELECT id, organization_id as organizationId, batch_id as batchId, subject_id as subjectId, teacher_user_id as teacherUserId, classroom_name as classroomName, scheduled_start as scheduledStart, scheduled_end as scheduledEnd, topic_name as topicName, status FROM class_sessions WHERE organization_id = ?';
    const params: any[] = [organizationId];
    if (batchId) {
      sql += ' AND batch_id = ?';
      params.push(batchId);
    }
    const rows = await query<any[]>(sql, params);
    return rows;
  }

  async getAttendanceForSession(sessionId: string): Promise<AttendanceRecord[]> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, session_id as sessionId, student_id as studentId, status, reason, marked_at as markedAt FROM attendance_records WHERE session_id = ?', [sessionId]);
    return rows;
  }

  async getAttendanceRecords(organizationId?: string, studentId?: string): Promise<AttendanceRecord[]> {
    let sql = 'SELECT id, organization_id as organizationId, session_id as sessionId, student_id as studentId, status, reason, marked_at as markedAt FROM attendance_records WHERE 1=1';
    const params: any[] = [];
    if (organizationId) {
      sql += ' AND organization_id = ?';
      params.push(organizationId);
    }
    if (studentId) {
      sql += ' AND student_id = ?';
      params.push(studentId);
    }
    const rows = await query<any[]>(sql, params);
    return rows;
  }

  async saveBulkAttendance(sessionId: string, organizationId: string, records: { studentId: string; status: AttendanceRecord['status']; reason?: string }[]): Promise<AttendanceRecord[]> {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Delete existing records for this session
      await conn.query('DELETE FROM attendance_records WHERE session_id = ?', [sessionId]);

      const now = new Date().toISOString();
      for (const r of records) {
        const id = `att-${Date.now()}-${r.studentId}`;
        await conn.query(
          'INSERT INTO attendance_records (id, organization_id, session_id, student_id, status, reason, marked_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, organizationId, sessionId, r.studentId, r.status, r.reason || null, now]
        );
      }

      // Mark session as completed
      await conn.query('UPDATE class_sessions SET status = ? WHERE id = ?', ['COMPLETED', sessionId]);

      await conn.commit();

      await this.logAudit(organizationId, 'Prof. Alok Mukherjee', 'TEACHER', 'MARK_BULK_ATTENDANCE', 'class_sessions', sessionId);

      return this.getAttendanceForSession(sessionId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // --- Invoices & Payments ---
  // --- Multi-Tenant Payment Accounts Configuration ---
  async getPaymentAccount(organizationId: string): Promise<PaymentAccount | null> {
    const rows = await query<any[]>('SELECT * FROM payment_accounts WHERE organization_id = ?', [organizationId]);
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      organizationId: r.organization_id,
      upiEnabled: Boolean(r.upi_enabled),
      upiId: r.upi_id,
      upiMerchantName: r.upi_merchant_name,
      upiQrImageUrl: r.upi_qr_image_url || undefined,
      gatewayEnabled: Boolean(r.gateway_enabled),
      gatewayProvider: r.gateway_provider,
      gatewayKeyId: r.gateway_key_id || undefined,
      gatewayKeySecretMasked: r.gateway_key_secret ? `${r.gateway_key_secret.slice(0, 4)}••••••••` : undefined,
      gatewayWebhookSecret: r.gateway_webhook_secret || undefined,
      bankTransferEnabled: Boolean(r.bank_transfer_enabled),
      bankName: r.bank_name || undefined,
      bankAccountNumber: r.bank_account_number || undefined,
      bankIfsc: r.bank_ifsc || undefined,
      bankAccountHolder: r.bank_account_holder || undefined,
      bankInstructions: r.bank_instructions || undefined,
      cashEnabled: Boolean(r.cash_enabled),
      paymentLinksEnabled: Boolean(r.payment_links_enabled),
      testMode: Boolean(r.test_mode),
      updatedAt: r.updated_at,
    };
  }

  async updatePaymentAccount(organizationId: string, data: Partial<PaymentAccount>): Promise<PaymentAccount> {
    const existing = await this.getPaymentAccount(organizationId);
    if (!existing) {
      const id = `pa-${organizationId}`;
      await query(
        `INSERT INTO payment_accounts (id, organization_id, upi_enabled, upi_id, upi_merchant_name, gateway_enabled, gateway_provider, gateway_key_id, gateway_key_secret, gateway_webhook_secret, bank_transfer_enabled, bank_name, bank_account_number, bank_ifsc, bank_account_holder, bank_instructions, cash_enabled, payment_links_enabled, test_mode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          organizationId,
          data.upiEnabled !== undefined ? (data.upiEnabled ? 1 : 0) : 1,
          data.upiId || 'institute@upi',
          data.upiMerchantName || 'Coaching Institute',
          data.gatewayEnabled !== undefined ? (data.gatewayEnabled ? 1 : 0) : 1,
          data.gatewayProvider || 'SANDBOX',
          data.gatewayKeyId || null,
          data.gatewayKeySecretMasked || null,
          data.gatewayWebhookSecret || null,
          data.bankTransferEnabled !== undefined ? (data.bankTransferEnabled ? 1 : 0) : 1,
          data.bankName || null,
          data.bankAccountNumber || null,
          data.bankIfsc || null,
          data.bankAccountHolder || null,
          data.bankInstructions || null,
          data.cashEnabled !== undefined ? (data.cashEnabled ? 1 : 0) : 1,
          data.paymentLinksEnabled !== undefined ? (data.paymentLinksEnabled ? 1 : 0) : 1,
          data.testMode !== undefined ? (data.testMode ? 1 : 0) : 1,
        ]
      );
    } else {
      await query(
        `UPDATE payment_accounts SET
          upi_enabled = ?,
          upi_id = ?,
          upi_merchant_name = ?,
          gateway_enabled = ?,
          gateway_provider = ?,
          bank_transfer_enabled = ?,
          bank_name = ?,
          bank_account_number = ?,
          bank_ifsc = ?,
          bank_account_holder = ?,
          bank_instructions = ?,
          cash_enabled = ?,
          payment_links_enabled = ?,
          test_mode = ?
         WHERE organization_id = ?`,
        [
          data.upiEnabled !== undefined ? (data.upiEnabled ? 1 : 0) : (existing.upiEnabled ? 1 : 0),
          data.upiId !== undefined ? data.upiId : existing.upiId,
          data.upiMerchantName !== undefined ? data.upiMerchantName : existing.upiMerchantName,
          data.gatewayEnabled !== undefined ? (data.gatewayEnabled ? 1 : 0) : (existing.gatewayEnabled ? 1 : 0),
          data.gatewayProvider !== undefined ? data.gatewayProvider : existing.gatewayProvider,
          data.bankTransferEnabled !== undefined ? (data.bankTransferEnabled ? 1 : 0) : (existing.bankTransferEnabled ? 1 : 0),
          data.bankName !== undefined ? data.bankName : existing.bankName || null,
          data.bankAccountNumber !== undefined ? data.bankAccountNumber : existing.bankAccountNumber || null,
          data.bankIfsc !== undefined ? data.bankIfsc : existing.bankIfsc || null,
          data.bankAccountHolder !== undefined ? data.bankAccountHolder : existing.bankAccountHolder || null,
          data.bankInstructions !== undefined ? data.bankInstructions : existing.bankInstructions || null,
          data.cashEnabled !== undefined ? (data.cashEnabled ? 1 : 0) : (existing.cashEnabled ? 1 : 0),
          data.paymentLinksEnabled !== undefined ? (data.paymentLinksEnabled ? 1 : 0) : (existing.paymentLinksEnabled ? 1 : 0),
          data.testMode !== undefined ? (data.testMode ? 1 : 0) : (existing.testMode ? 1 : 0),
          organizationId,
        ]
      );
    }
    await this.logAudit(organizationId, 'Institute Director', 'OWNER', 'UPDATE_PAYMENT_CONFIG', 'payment_accounts', organizationId);
    return (await this.getPaymentAccount(organizationId))!;
  }

  // --- Invoices & Installments ---
  async getInvoices(organizationId: string, branchId?: string, studentId?: string): Promise<Invoice[]> {
    let sql = `
      SELECT 
        i.id, i.organization_id as organizationId, i.branch_id as branchId, i.student_id as studentId, 
        i.invoice_number as invoiceNumber, i.total_amount_paise as totalAmountPaise, 
        i.discount_amount_paise as discountAmountPaise, i.net_amount_paise as netAmountPaise, 
        i.paid_amount_paise as paidAmountPaise, i.balance_amount_paise as balanceAmountPaise, 
        i.due_date as dueDate, i.status, i.created_at as createdAt,
        s.full_name as studentName, s.roll_number as studentRoll, b.name as batchName
      FROM invoices i
      LEFT JOIN students s ON i.student_id = s.id
      LEFT JOIN batches b ON s.batch_id = b.id
      WHERE i.organization_id = ?
    `;
    const params: any[] = [organizationId];
    if (branchId) {
      sql += ' AND i.branch_id = ?';
      params.push(branchId);
    }
    if (studentId) {
      sql += ' AND i.student_id = ?';
      params.push(studentId);
    }
    sql += ' ORDER BY i.created_at DESC';
    const rows = await query<any[]>(sql, params);
    return rows.map(r => ({
      ...r,
      totalAmountPaise: Number(r.totalAmountPaise),
      discountAmountPaise: Number(r.discountAmountPaise),
      netAmountPaise: Number(r.netAmountPaise),
      paidAmountPaise: Number(r.paidAmountPaise),
      balanceAmountPaise: Number(r.balanceAmountPaise),
      studentName: r.studentName || 'Enrolled Student',
      studentRoll: r.studentRoll || 'KOTA-001',
      batchName: r.batchName || 'General Batch',
    }));
  }

  async getInvoiceInstallments(invoiceId: string): Promise<InvoiceInstallment[]> {
    const rows = await query<any[]>(
      'SELECT id, organization_id as organizationId, invoice_id as invoiceId, installment_number as installmentNumber, title, amount_paise as amountPaise, due_date as dueDate, status, paid_at as paidAt, payment_id as paymentId, created_at as createdAt FROM invoice_installments WHERE invoice_id = ? ORDER BY installment_number ASC',
      [invoiceId]
    );
    return rows.map(r => ({
      ...r,
      amountPaise: Number(r.amountPaise),
    }));
  }

  // --- Payments & Multi-Status Lifecycle ---
  async getPayments(
    organizationId: string,
    options?: { studentId?: string; invoiceId?: string; status?: string; method?: string; limit?: number }
  ): Promise<Payment[]> {
    let sql = `
      SELECT 
        p.id, p.organization_id as organizationId, p.branch_id as branchId, p.invoice_id as invoiceId, 
        p.student_id as studentId, p.amount_paise as amountPaise, p.currency, p.payment_method as paymentMethod, 
        p.payment_channel as paymentChannel, p.provider, p.provider_payment_id as providerPaymentId, 
        p.provider_order_id as providerOrderId, p.receipt_number as receiptNumber, p.status, p.reconciled, 
        p.idempotency_key as idempotencyKey, p.notes, p.verified_by as verifiedBy, p.verified_at as verifiedAt, 
        p.created_at as createdAt,
        s.full_name as studentName, s.roll_number as studentRoll, i.invoice_number as invoiceNumber
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      WHERE p.organization_id = ?
    `;
    const params: any[] = [organizationId];

    if (options?.studentId) {
      sql += ' AND p.student_id = ?';
      params.push(options.studentId);
    }
    if (options?.invoiceId) {
      sql += ' AND p.invoice_id = ?';
      params.push(options.invoiceId);
    }
    if (options?.status) {
      sql += ' AND p.status = ?';
      params.push(options.status);
    }
    if (options?.method) {
      sql += ' AND p.payment_method = ?';
      params.push(options.method);
    }

    sql += ' ORDER BY p.created_at DESC';
    if (options?.limit) {
      sql += ` LIMIT ${Number(options.limit)}`;
    }

    const rows = await query<any[]>(sql, params);
    return rows.map(r => ({
      ...r,
      amountPaise: Number(r.amountPaise),
      reconciled: Boolean(r.reconciled),
      studentName: r.studentName || 'Student',
      studentRoll: r.studentRoll || '',
      invoiceNumber: r.invoiceNumber || '',
    }));
  }

  async recordPayment(params: {
    organizationId: string;
    branchId: string;
    invoiceId: string;
    studentId: string;
    amountPaise: number;
    currency?: string;
    paymentMethod: Payment['paymentMethod'];
    channel: Payment['paymentChannel'];
    provider?: Payment['provider'];
    providerPaymentId?: string;
    providerOrderId?: string;
    status?: Payment['status'];
    idempotencyKey?: string;
    notes?: string;
    verifiedBy?: string;
  }): Promise<Payment> {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Idempotency Check: if idempotency_key is provided and already exists, return existing
      if (params.idempotencyKey) {
        const [existing] = await conn.query<any[]>(
          'SELECT * FROM payments WHERE organization_id = ? AND idempotency_key = ?',
          [params.organizationId, params.idempotencyKey]
        );
        if (existing[0]) {
          await conn.rollback();
          const r = existing[0];
          return {
            ...r,
            organizationId: r.organization_id,
            branchId: r.branch_id,
            invoiceId: r.invoice_id,
            studentId: r.student_id,
            amountPaise: Number(r.amount_paise),
            paymentMethod: r.payment_method,
            paymentChannel: r.payment_channel,
            provider: r.provider,
            providerPaymentId: r.provider_payment_id,
            providerOrderId: r.provider_order_id,
            receiptNumber: r.receipt_number,
            status: r.status,
            reconciled: Boolean(r.reconciled),
            idempotencyKey: r.idempotency_key,
            notes: r.notes,
            verifiedBy: r.verified_by,
            verifiedAt: r.verified_at,
            createdAt: r.created_at,
          };
        }
      }

      // 2. Lock and fetch invoice
      const [invRows] = await conn.query<any[]>('SELECT * FROM invoices WHERE id = ? FOR UPDATE', [params.invoiceId]);
      if (!invRows[0]) throw new Error('Invoice not found');
      const invoice = invRows[0];

      const status: Payment['status'] = params.status || 'SUCCESS';
      const isSettled = status === 'SUCCESS' || status === 'CAPTURED';

      if (isSettled) {
        const currentPaid = Number(invoice.paid_amount_paise || 0);
        const currentNet = Number(invoice.net_amount_paise || 0);
        const newPaid = currentPaid + params.amountPaise;
        const newBalance = Math.max(0, currentNet - newPaid);
        const newStatus: Invoice['status'] = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

        await conn.query(
          'UPDATE invoices SET paid_amount_paise = ?, balance_amount_paise = ?, status = ? WHERE id = ?',
          [newPaid, newBalance, newStatus, params.invoiceId]
        );

        // Update installment milestones if applicable
        const [installments] = await conn.query<any[]>(
          'SELECT * FROM invoice_installments WHERE invoice_id = ? AND status != "PAID" ORDER BY installment_number ASC',
          [params.invoiceId]
        );
        let remAmount = params.amountPaise;
        for (const inst of installments) {
          const instAmount = Number(inst.amount_paise);
          if (remAmount >= instAmount) {
            await conn.query(
              'UPDATE invoice_installments SET status = "PAID", paid_at = ? WHERE id = ?',
              [new Date().toISOString(), inst.id]
            );
            remAmount -= instAmount;
          }
        }
      }

      const paymentId = `pay-${Date.now()}`;
      const receiptNumber = `REC-${params.organizationId.split('-')[1]?.toUpperCase() || 'INS'}-${Date.now().toString().slice(-6)}`;
      const createdAt = new Date().toISOString();

      await conn.query(
        `INSERT INTO payments 
         (id, organization_id, branch_id, invoice_id, student_id, amount_paise, currency, payment_method, payment_channel, provider, provider_payment_id, provider_order_id, receipt_number, status, reconciled, idempotency_key, notes, verified_by, verified_at, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentId,
          params.organizationId,
          params.branchId,
          params.invoiceId,
          params.studentId,
          params.amountPaise,
          params.currency || 'INR',
          params.paymentMethod,
          params.channel,
          params.provider || 'NONE',
          params.providerPaymentId || null,
          params.providerOrderId || null,
          receiptNumber,
          status,
          isSettled ? 1 : 0,
          params.idempotencyKey || null,
          params.notes || null,
          params.verifiedBy || (isSettled ? 'SYSTEM_GATEWAY' : null),
          isSettled ? createdAt : null,
          createdAt,
        ]
      );

      await conn.commit();

      await this.logAudit(
        params.organizationId,
        params.verifiedBy || 'System Gateway',
        'ACCOUNTANT',
        'RECORD_PAYMENT',
        'payments',
        paymentId
      );

      return {
        id: paymentId,
        organizationId: params.organizationId,
        branchId: params.branchId,
        invoiceId: params.invoiceId,
        studentId: params.studentId,
        amountPaise: params.amountPaise,
        currency: params.currency || 'INR',
        paymentMethod: params.paymentMethod,
        paymentChannel: params.channel,
        provider: params.provider || 'NONE',
        providerPaymentId: params.providerPaymentId,
        providerOrderId: params.providerOrderId,
        receiptNumber,
        status,
        reconciled: isSettled,
        idempotencyKey: params.idempotencyKey,
        notes: params.notes,
        verifiedBy: params.verifiedBy || (isSettled ? 'SYSTEM_GATEWAY' : undefined),
        verifiedAt: isSettled ? createdAt : undefined,
        createdAt,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // --- Bank Transfer Review & Approval ---
  async approveManualBankTransfer(paymentId: string, verifiedBy: string): Promise<Payment> {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [payRows] = await conn.query<any[]>('SELECT * FROM payments WHERE id = ? FOR UPDATE', [paymentId]);
      if (!payRows[0]) throw new Error('Payment not found');
      const payment = payRows[0];

      if (payment.status === 'SUCCESS' || payment.status === 'CAPTURED') {
        await conn.rollback();
        throw new Error('Payment is already settled and verified');
      }

      const [invRows] = await conn.query<any[]>('SELECT * FROM invoices WHERE id = ? FOR UPDATE', [payment.invoice_id]);
      if (!invRows[0]) throw new Error('Associated invoice not found');
      const invoice = invRows[0];

      const currentPaid = Number(invoice.paid_amount_paise || 0);
      const currentNet = Number(invoice.net_amount_paise || 0);
      const newPaid = currentPaid + Number(payment.amount_paise);
      const newBalance = Math.max(0, currentNet - newPaid);
      const newStatus: Invoice['status'] = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

      await conn.query(
        'UPDATE invoices SET paid_amount_paise = ?, balance_amount_paise = ?, status = ? WHERE id = ?',
        [newPaid, newBalance, newStatus, invoice.id]
      );

      const now = new Date().toISOString();
      await conn.query(
        'UPDATE payments SET status = "SUCCESS", reconciled = 1, verified_by = ?, verified_at = ? WHERE id = ?',
        [verifiedBy, now, paymentId]
      );

      await conn.commit();

      await this.logAudit(
        payment.organization_id,
        verifiedBy,
        'ACCOUNTANT',
        'APPROVE_BANK_TRANSFER',
        'payments',
        paymentId
      );

      const updated = await this.getPayments(payment.organization_id, { invoiceId: payment.invoice_id });
      return updated.find(p => p.id === paymentId)!;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async rejectManualBankTransfer(paymentId: string, reason: string, verifiedBy: string): Promise<Payment> {
    const [payRows] = await query<any[]>('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!payRows[0]) throw new Error('Payment not found');
    const payment = payRows[0];

    await query(
      'UPDATE payments SET status = "FAILED", notes = CONCAT(COALESCE(notes, ""), " | Rejected: ", ?), verified_by = ?, verified_at = ? WHERE id = ?',
      [reason, verifiedBy, new Date().toISOString(), paymentId]
    );

    await this.logAudit(
      payment.organization_id,
      verifiedBy,
      'ACCOUNTANT',
      'REJECT_BANK_TRANSFER',
      'payments',
      paymentId
    );

    const updated = await this.getPayments(payment.organization_id, { invoiceId: payment.invoice_id });
    return updated.find(p => p.id === paymentId)!;
  }

  // --- Refunds Management ---
  async processRefund(params: {
    organizationId: string;
    paymentId: string;
    invoiceId: string;
    studentId: string;
    amountPaise: number;
    reason: string;
    requestedBy: string;
    approvedBy?: string;
  }): Promise<Refund> {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [payRows] = await conn.query<any[]>('SELECT * FROM payments WHERE id = ? FOR UPDATE', [params.paymentId]);
      if (!payRows[0]) throw new Error('Payment not found');
      const payment = payRows[0];

      if (params.amountPaise > Number(payment.amount_paise)) {
        throw new Error('Refund amount cannot exceed original payment amount');
      }

      const [invRows] = await conn.query<any[]>('SELECT * FROM invoices WHERE id = ? FOR UPDATE', [params.invoiceId]);
      if (!invRows[0]) throw new Error('Invoice not found');
      const invoice = invRows[0];

      // Restore balance on invoice
      const newPaid = Math.max(0, Number(invoice.paid_amount_paise) - params.amountPaise);
      const newBalance = Number(invoice.net_amount_paise) - newPaid;
      const newStatus = newPaid === 0 ? 'ISSUED' : 'PARTIALLY_PAID';

      await conn.query(
        'UPDATE invoices SET paid_amount_paise = ?, balance_amount_paise = ?, status = ? WHERE id = ?',
        [newPaid, newBalance, newStatus, params.invoiceId]
      );

      // Update payment status
      const isFullRefund = params.amountPaise >= Number(payment.amount_paise);
      await conn.query(
        'UPDATE payments SET status = ? WHERE id = ?',
        [isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED', params.paymentId]
      );

      const refundId = `ref-${Date.now()}`;
      const now = new Date().toISOString();

      await conn.query(
        `INSERT INTO refunds (id, organization_id, payment_id, invoice_id, student_id, amount_paise, reason, requested_by, approved_by, status, created_at, processed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROCESSED', ?, ?)`,
        [
          refundId,
          params.organizationId,
          params.paymentId,
          params.invoiceId,
          params.studentId,
          params.amountPaise,
          params.reason,
          params.requestedBy,
          params.approvedBy || params.requestedBy,
          now,
          now,
        ]
      );

      await conn.commit();

      await this.logAudit(
        params.organizationId,
        params.requestedBy,
        'ACCOUNTANT',
        'PROCESS_REFUND',
        'refunds',
        refundId
      );

      return {
        id: refundId,
        organizationId: params.organizationId,
        paymentId: params.paymentId,
        invoiceId: params.invoiceId,
        studentId: params.studentId,
        amountPaise: params.amountPaise,
        reason: params.reason,
        requestedBy: params.requestedBy,
        approvedBy: params.approvedBy,
        status: 'PROCESSED',
        createdAt: now,
        processedAt: now,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // --- Official GST Fee Receipts ---
  async getReceipts(organizationId: string, search?: string): Promise<PaymentReceipt[]> {
    let sql = `
      SELECT 
        p.id as paymentId, p.receipt_number as receiptNumber, p.organization_id as organizationId,
        p.invoice_id as invoiceId, p.student_id as studentId, p.amount_paise as amountPaise,
        p.payment_method as paymentMethod, p.created_at as paymentDate,
        COALESCE(p.provider_payment_id, p.id) as transactionReference, p.status, p.verified_by as verifiedBy,
        o.trade_name as organizationName, o.gstin as organizationGstin,
        br.name as branchName, br.address as organizationAddress,
        i.invoice_number as invoiceNumber,
        s.full_name as studentName, s.roll_number as studentRoll,
        b.name as batchName, c.name as courseName
      FROM payments p
      JOIN organizations o ON p.organization_id = o.id
      LEFT JOIN branches br ON p.branch_id = br.id
      JOIN invoices i ON p.invoice_id = i.id
      JOIN students s ON p.student_id = s.id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN courses c ON b.course_id = c.id
      WHERE p.organization_id = ? AND p.status IN ('SUCCESS', 'CAPTURED', 'REFUNDED', 'PARTIALLY_REFUNDED')
    `;
    const params: any[] = [organizationId];

    if (search) {
      sql += ' AND (p.receipt_number LIKE ? OR s.full_name LIKE ? OR s.roll_number LIKE ? OR i.invoice_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY p.created_at DESC';
    const rows = await query<any[]>(sql, params);

    return rows.map(r => ({
      id: r.receiptNumber,
      receiptNumber: r.receiptNumber,
      organizationId: r.organizationId,
      organizationName: r.organizationName,
      organizationGstin: r.organizationGstin || '08AAACA1234F1Z5',
      organizationAddress: r.organizationAddress || 'Main Campus, Institutional Area',
      branchName: r.branchName || 'Main Branch',
      paymentId: r.paymentId,
      invoiceId: r.invoiceId,
      invoiceNumber: r.invoiceNumber,
      studentId: r.studentId,
      studentName: r.studentName,
      studentRoll: r.studentRoll,
      batchName: r.batchName,
      courseName: r.courseName,
      amountPaise: Number(r.amountPaise),
      paymentMethod: r.paymentMethod,
      paymentDate: r.paymentDate,
      transactionReference: r.transactionReference,
      status: r.status,
      verifiedBy: r.verifiedBy || 'System Verified',
    }));
  }

  // --- Financial Reconciliation ---
  async getReconciliation(organizationId: string): Promise<ReconciliationSummary> {
    const [invoices, payments, refunds] = await Promise.all([
      this.getInvoices(organizationId),
      query<any[]>('SELECT * FROM payments WHERE organization_id = ?', [organizationId]),
      query<any[]>('SELECT * FROM refunds WHERE organization_id = ?', [organizationId]),
    ]);

    const expectedCollectionPaise = invoices.reduce((sum, i) => sum + i.netAmountPaise, 0);
    const actualCollectedPaise = payments
      .filter(p => p.status === 'SUCCESS' || p.status === 'CAPTURED')
      .reduce((sum, p) => sum + Number(p.amount_paise), 0);

    const pendingDuesPaise = invoices
      .filter(i => i.status !== 'PAID')
      .reduce((sum, i) => sum + i.balanceAmountPaise, 0);

    const overdueDuesPaise = invoices
      .filter(i => i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.balanceAmountPaise, 0);

    const failedAmountPaise = payments
      .filter(p => p.status === 'FAILED')
      .reduce((sum, p) => sum + Number(p.amount_paise), 0);

    const refundedAmountPaise = refunds
      .filter(r => r.status === 'PROCESSED')
      .reduce((sum, r) => sum + Number(r.amount_paise), 0);

    const manualReviewsPendingCount = payments.filter(p => p.status === 'MANUAL_REVIEW').length;

    const onlineCollectionsPaise = payments
      .filter(p => (p.status === 'SUCCESS' || p.status === 'CAPTURED') && (p.payment_method === 'UPI' || p.payment_method === 'ONLINE_GATEWAY' || p.payment_method === 'CARD' || p.payment_method === 'NET_BANKING'))
      .reduce((sum, p) => sum + Number(p.amount_paise), 0);

    const cashCollectionsPaise = payments
      .filter(p => (p.status === 'SUCCESS' || p.status === 'CAPTURED') && p.payment_method === 'CASH')
      .reduce((sum, p) => sum + Number(p.amount_paise), 0);

    const bankTransferCollectionsPaise = payments
      .filter(p => (p.status === 'SUCCESS' || p.status === 'CAPTURED') && p.payment_method === 'BANK_TRANSFER')
      .reduce((sum, p) => sum + Number(p.amount_paise), 0);

    const discrepancyPaise = Math.max(0, expectedCollectionPaise - (actualCollectedPaise + pendingDuesPaise));
    const reconciledPercentage = expectedCollectionPaise > 0
      ? Math.min(100, Math.round((actualCollectedPaise / expectedCollectionPaise) * 100))
      : 100;

    return {
      expectedCollectionPaise,
      actualCollectedPaise,
      pendingDuesPaise,
      overdueDuesPaise,
      failedAmountPaise,
      refundedAmountPaise,
      manualReviewsPendingCount,
      onlineCollectionsPaise,
      cashCollectionsPaise,
      bankTransferCollectionsPaise,
      discrepancyPaise,
      reconciledPercentage,
    };
  }

  // --- Webhook Idempotency Store ---
  async checkWebhookEventProcessed(provider: string, eventId: string): Promise<boolean> {
    const rows = await query<any[]>(
      'SELECT id FROM payment_webhook_events WHERE provider = ? AND event_id = ?',
      [provider, eventId]
    );
    return rows.length > 0;
  }

  async recordWebhookEvent(data: {
    organizationId: string;
    provider: string;
    eventId: string;
    eventType: string;
    idempotencyKey?: string;
    payload: any;
  }): Promise<void> {
    const id = `evt-${Date.now()}`;
    await query(
      'INSERT IGNORE INTO payment_webhook_events (id, organization_id, provider, event_id, event_type, idempotency_key, payload, processed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)',
      [id, data.organizationId, data.provider, data.eventId, data.eventType, data.idempotencyKey || null, JSON.stringify(data.payload), new Date().toISOString()]
    );
  }

  // --- Questions & Tests ---
  async getQuestions(organizationId: string): Promise<Question[]> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, topic_name as topicName, stem_latex as stemLatex, options_json as optionsJson, correct_answer as correctAnswer, explanation_latex as explanationLatex, difficulty, is_ai_generated as isAiGenerated FROM questions WHERE organization_id = ?', [organizationId]);
    return rows.map(r => ({
      ...r,
      optionsJson: typeof r.optionsJson === 'string' ? JSON.parse(r.optionsJson) : r.optionsJson || [],
      isAiGenerated: Boolean(r.isAiGenerated),
    }));
  }

  async getTests(organizationId: string): Promise<Test[]> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, course_id as courseId, title, total_marks as totalMarks, duration_minutes as durationMinutes, questions_count as questionsCount, status FROM tests WHERE organization_id = ?', [organizationId]);
    return rows;
  }

  // --- Interventions ---
  async getInterventions(organizationId: string): Promise<Intervention[]> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, student_id as studentId, student_name as studentName, batch_name as batchName, trigger_reason as triggerReason, evidence_summary as evidenceSummary, status, owner_user_id as ownerUserId, due_date as dueDate, playbook, outcome_notes as outcomeNotes, created_at as createdAt FROM interventions WHERE organization_id = ?', [organizationId]);
    return rows;
  }

  async updateInterventionStatus(id: string, status: Intervention['status'], outcomeNotes?: string): Promise<Intervention | null> {
    const rows = await query<any[]>('SELECT * FROM interventions WHERE id = ?', [id]);
    if (!rows[0]) return null;

    let updatedOutcome = rows[0].outcome_notes;
    if (outcomeNotes) {
      updatedOutcome = updatedOutcome ? `${updatedOutcome} | ${outcomeNotes}` : outcomeNotes;
    }

    await query('UPDATE interventions SET status = ?, outcome_notes = ? WHERE id = ?', [status, updatedOutcome, id]);

    const updated = await query<any[]>('SELECT id, organization_id as organizationId, student_id as studentId, student_name as studentName, batch_name as batchName, trigger_reason as triggerReason, evidence_summary as evidenceSummary, status, owner_user_id as ownerUserId, due_date as dueDate, playbook, outcome_notes as outcomeNotes, created_at as createdAt FROM interventions WHERE id = ?', [id]);
    return updated[0];
  }

  // --- Audit Logs ---
  async logAudit(organizationId: string, actorName: string, actorRole: string, action: string, entityName: string, entityId: string): Promise<AuditLog> {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      organizationId,
      actorName,
      actorRole,
      action,
      entityName,
      entityId,
      timestamp: new Date().toISOString(),
    };
    await query(
      'INSERT INTO audit_logs (id, organization_id, actor_name, actor_role, action, entity_name, entity_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [log.id, log.organizationId, log.actorName, log.actorRole, log.action, log.entityName, log.entityId, log.timestamp]
    );
    return log;
  }

  async getAuditLogs(organizationId: string): Promise<AuditLog[]> {
    const rows = await query<any[]>('SELECT id, organization_id as organizationId, actor_name as actorName, actor_role as actorRole, action, entity_name as entityName, entity_id as entityId, timestamp FROM audit_logs WHERE organization_id = ? ORDER BY timestamp DESC LIMIT 100', [organizationId]);
    return rows;
  }

  // --- Study Materials ---
  async getStudyMaterials(organizationId: string, subject?: string, batchId?: string): Promise<StudyMaterial[]> {
    let sql = 'SELECT id, organization_id as organizationId, course_id as courseId, batch_id as batchId, subject, title, description, file_type as fileType, file_url as fileUrl, file_size_kb as fileSizeKb, download_count as downloadCount, uploaded_by as uploadedBy, created_at as createdAt FROM study_materials WHERE organization_id = ?';
    const params: any[] = [organizationId];
    if (subject && subject !== 'ALL') {
      sql += ' AND subject = ?';
      params.push(subject);
    }
    if (batchId && batchId !== 'ALL') {
      sql += ' AND (batch_id = ? OR batch_id IS NULL)';
      params.push(batchId);
    }
    sql += ' ORDER BY id ASC';
    const rows = await query<any[]>(sql, params);
    return rows;
  }

  async createStudyMaterial(data: Omit<StudyMaterial, 'id' | 'createdAt' | 'downloadCount'>): Promise<StudyMaterial> {
    const id = `mat-${Date.now()}`;
    const createdAt = new Date().toISOString();
    await query(
      'INSERT INTO study_materials (id, organization_id, course_id, batch_id, subject, title, description, file_type, file_url, file_size_kb, download_count, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.organizationId, data.courseId, data.batchId || null, data.subject, data.title, data.description || '', data.fileType, data.fileUrl, data.fileSizeKb || 1024, 0, data.uploadedBy, createdAt]
    );
    return {
      ...data,
      id,
      downloadCount: 0,
      createdAt,
    };
  }

  // --- Messages & Communication ---
  async getMessages(organizationId: string): Promise<MessageItem[]> {
    const rows = await query<any[]>(
      'SELECT id, organization_id as organizationId, recipient_type as recipientType, recipient_target as recipientTarget, channel, title, content, status, sent_by as sentBy, sent_at as sentAt, delivered_count as deliveredCount FROM messages WHERE organization_id = ? ORDER BY id DESC',
      [organizationId]
    );
    return rows;
  }

  async createMessage(data: Omit<MessageItem, 'id' | 'sentAt'>): Promise<MessageItem> {
    const id = `msg-${Date.now()}`;
    const sentAt = 'Just now';
    await query(
      'INSERT INTO messages (id, organization_id, recipient_type, recipient_target, channel, title, content, status, sent_by, sent_at, delivered_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.organizationId, data.recipientType, data.recipientTarget, data.channel, data.title, data.content, data.status || 'SENT', data.sentBy, sentAt, data.deliveredCount || 1]
    );
    return {
      ...data,
      id,
      sentAt,
    };
  }

  // --- Test Results & Diagnostic Breakdown ---
  async getTestResults(organizationId: string, testId?: string, studentId?: string): Promise<TestResult[]> {
    let sql = `
      SELECT 
        tr.id, tr.organization_id as organizationId, tr.test_id as testId, tr.student_id as studentId, 
        tr.batch_id as batchId, tr.score_obtained as scoreObtained, tr.total_marks as totalMarks, 
        tr.percentage, tr.rank_in_batch as rankInBatch, tr.physics_score as physicsScore, 
        tr.chemistry_score as chemistryScore, tr.maths_score as mathsScore, 
        tr.weak_topics as weakTopics, tr.strong_topics as strongTopics, 
        tr.recommended_action as recommendedAction, tr.taken_at as takenAt,
        COALESCE(s.full_name, 'Aarohan Student') as studentName, COALESCE(s.roll_number, 'KOTA-001') as rollNumber,
        COALESCE(t.title, 'Mock Test') as testTitle, COALESCE(b.name, 'General Batch') as batchName
      FROM test_results tr
      LEFT JOIN students s ON tr.student_id = s.id
      LEFT JOIN tests t ON tr.test_id = t.id
      LEFT JOIN batches b ON tr.batch_id = b.id
      WHERE tr.organization_id = ?
    `;
    const params: any[] = [organizationId];
    if (testId) {
      sql += ' AND tr.test_id = ?';
      params.push(testId);
    }
    if (studentId) {
      sql += ' AND tr.student_id = ?';
      params.push(studentId);
    }
    sql += ' ORDER BY tr.rank_in_batch ASC';
    const rows = await query<any[]>(sql, params);
    return rows.map(r => ({
      ...r,
      weakTopics: typeof r.weakTopics === 'string' ? JSON.parse(r.weakTopics) : r.weakTopics || [],
      strongTopics: typeof r.strongTopics === 'string' ? JSON.parse(r.strongTopics) : r.strongTopics || [],
      percentage: Number(r.percentage),
    }));
  }

  async createTestResult(data: Omit<TestResult, 'id'>): Promise<TestResult> {
    const id = `res-${Date.now()}`;
    await query(
      'INSERT INTO test_results (id, organization_id, test_id, student_id, batch_id, score_obtained, total_marks, percentage, rank_in_batch, physics_score, chemistry_score, maths_score, weak_topics, strong_topics, recommended_action, taken_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.organizationId, data.testId, data.studentId, data.batchId, data.scoreObtained, data.totalMarks, data.percentage, data.rankInBatch, data.physicsScore || 0, data.chemistryScore || 0, data.mathsScore || 0, JSON.stringify(data.weakTopics || []), JSON.stringify(data.strongTopics || []), data.recommendedAction, data.takenAt]
    );
    return {
      ...data,
      id,
    };
  }
}

export const db = new DatabaseStore();

