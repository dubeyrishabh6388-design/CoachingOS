import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import dotenv from 'dotenv';
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
} from './initial-seed.js';

dotenv.config();

const dbConfig: PoolOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'coachingos_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const p = getPool();
  const [results] = await p.query(sql, params);
  return results as T;
}

export async function execute<T = any>(sql: string, params?: any[]): Promise<T> {
  const p = getPool();
  const [results] = await p.execute(sql, params);
  return results as T;
}

/**
 * Initializes the MySQL schema and populates initial records if empty.
 */
export async function initializeDatabase(): Promise<void> {
  console.log(`[MYSQL] Connecting to database '${dbConfig.database}' on ${dbConfig.host}:${dbConfig.port}...`);

  // 1. Ensure database exists
  const rootConn = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  });
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await rootConn.end();

  const p = getPool();

  // 2. Create tables
  await p.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id VARCHAR(64) PRIMARY KEY,
      legal_name VARCHAR(255) NOT NULL,
      trade_name VARCHAR(255) NOT NULL,
      gstin VARCHAR(32),
      timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
      currency VARCHAR(8) NOT NULL DEFAULT 'INR',
      tier VARCHAR(32) NOT NULL DEFAULT 'GROWTH',
      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS branches (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      branch_code VARCHAR(32) NOT NULL,
      name VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(64) NOT NULL,
      state VARCHAR(64) NOT NULL,
      pincode VARCHAR(16) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      primary_branch_id VARCHAR(64),
      phone VARCHAR(32) NOT NULL,
      email VARCHAR(255),
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL,
      designation VARCHAR(128),
      avatar_url TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      target_exam VARCHAR(64) NOT NULL,
      duration_months INT NOT NULL DEFAULT 12,
      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS batches (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      branch_id VARCHAR(64) NOT NULL,
      course_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(32),
      academic_year VARCHAR(32) NOT NULL,
      max_capacity INT NOT NULL DEFAULT 40,
      current_enrollment INT NOT NULL DEFAULT 0,
      start_date VARCHAR(32) NOT NULL,
      end_date VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      primary_branch_id VARCHAR(64) NOT NULL,
      student_unique_id VARCHAR(64) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      gender VARCHAR(16) NOT NULL DEFAULT 'MALE',
      dob VARCHAR(32),
      phone VARCHAR(32),
      email VARCHAR(255),
      batch_id VARCHAR(64) NOT NULL,
      roll_number VARCHAR(64) NOT NULL,
      guardian_name VARCHAR(255) NOT NULL,
      guardian_phone VARCHAR(32) NOT NULL,
      guardian_email VARCHAR(255),
      guardian_relationship VARCHAR(32) NOT NULL DEFAULT 'FATHER',
      dpdp_consent_granted TINYINT(1) NOT NULL DEFAULT 1,
      grade VARCHAR(32),
      board VARCHAR(32),
      target_exam VARCHAR(64),
      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      branch_id VARCHAR(64) NOT NULL,
      source VARCHAR(32) NOT NULL DEFAULT 'WALK_IN',
      student_name VARCHAR(255) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      email VARCHAR(255),
      guardian_name VARCHAR(255),
      guardian_phone VARCHAR(32),
      interested_course_id VARCHAR(64) NOT NULL,
      target_course VARCHAR(128),
      assigned_counsellor_id VARCHAR(64),
      stage VARCHAR(32) NOT NULL DEFAULT 'NEW',
      notes TEXT,
      follow_up_date VARCHAR(32),
      created_at VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS class_sessions (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      batch_id VARCHAR(64) NOT NULL,
      subject_id VARCHAR(64) NOT NULL,
      teacher_user_id VARCHAR(64) NOT NULL,
      classroom_name VARCHAR(128) NOT NULL,
      scheduled_start VARCHAR(64) NOT NULL,
      scheduled_end VARCHAR(64) NOT NULL,
      topic_name VARCHAR(255) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      session_id VARCHAR(64) NOT NULL,
      student_id VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'PRESENT',
      reason TEXT,
      marked_at VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      branch_id VARCHAR(64) NOT NULL,
      student_id VARCHAR(64) NOT NULL,
      invoice_number VARCHAR(64) NOT NULL,
      total_amount_paise BIGINT NOT NULL DEFAULT 0,
      discount_amount_paise BIGINT NOT NULL DEFAULT 0,
      net_amount_paise BIGINT NOT NULL DEFAULT 0,
      paid_amount_paise BIGINT NOT NULL DEFAULT 0,
      balance_amount_paise BIGINT NOT NULL DEFAULT 0,
      due_date VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'ISSUED',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      branch_id VARCHAR(64) NOT NULL,
      invoice_id VARCHAR(64) NOT NULL,
      student_id VARCHAR(64) NOT NULL,
      amount_paise BIGINT NOT NULL DEFAULT 0,
      payment_method VARCHAR(32) NOT NULL DEFAULT 'UPI',
      payment_channel VARCHAR(32) NOT NULL DEFAULT 'COUNTER_POS',
      provider VARCHAR(32) NOT NULL DEFAULT 'NONE',
      provider_payment_id VARCHAR(128),
      receipt_number VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'CAPTURED',
      reconciled TINYINT(1) NOT NULL DEFAULT 1,
      created_at VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      topic_name VARCHAR(128),
      stem_latex TEXT NOT NULL,
      options_json JSON,
      correct_answer VARCHAR(32) NOT NULL,
      explanation_latex TEXT,
      difficulty VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
      is_ai_generated TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS tests (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      course_id VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      total_marks INT NOT NULL DEFAULT 100,
      duration_minutes INT NOT NULL DEFAULT 180,
      questions_count INT NOT NULL DEFAULT 30,
      status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS interventions (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      student_id VARCHAR(64) NOT NULL,
      student_name VARCHAR(255) NOT NULL,
      batch_name VARCHAR(255) NOT NULL,
      trigger_reason TEXT NOT NULL,
      evidence_summary TEXT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
      owner_user_id VARCHAR(64) NOT NULL,
      due_date VARCHAR(32) NOT NULL,
      playbook TEXT NOT NULL,
      outcome_notes TEXT,
      created_at VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      actor_name VARCHAR(255) NOT NULL,
      actor_role VARCHAR(64) NOT NULL,
      action VARCHAR(64) NOT NULL,
      entity_name VARCHAR(64) NOT NULL,
      entity_id VARCHAR(64) NOT NULL,
      timestamp VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS study_materials (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      course_id VARCHAR(64) NOT NULL,
      batch_id VARCHAR(64),
      subject VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_type VARCHAR(32) NOT NULL DEFAULT 'PDF',
      file_url VARCHAR(512) NOT NULL,
      file_size_kb INT NOT NULL DEFAULT 1024,
      download_count INT NOT NULL DEFAULT 0,
      uploaded_by VARCHAR(255) NOT NULL,
      created_at VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      recipient_type VARCHAR(32) NOT NULL,
      recipient_target VARCHAR(255) NOT NULL,
      channel VARCHAR(32) NOT NULL DEFAULT 'WHATSAPP',
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'SENT',
      sent_by VARCHAR(255) NOT NULL,
      sent_at VARCHAR(64) NOT NULL,
      delivered_count INT NOT NULL DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS test_results (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      test_id VARCHAR(64) NOT NULL,
      student_id VARCHAR(64) NOT NULL,
      batch_id VARCHAR(64) NOT NULL,
      score_obtained INT NOT NULL,
      total_marks INT NOT NULL,
      percentage DECIMAL(5,2) NOT NULL,
      rank_in_batch INT NOT NULL,
      physics_score INT,
      chemistry_score INT,
      maths_score INT,
      weak_topics JSON,
      strong_topics JSON,
      recommended_action TEXT,
      taken_at VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS payment_accounts (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL UNIQUE,
      upi_enabled TINYINT(1) NOT NULL DEFAULT 1,
      upi_id VARCHAR(128) NOT NULL,
      upi_merchant_name VARCHAR(255) NOT NULL,
      upi_qr_image_url TEXT,
      gateway_enabled TINYINT(1) NOT NULL DEFAULT 1,
      gateway_provider VARCHAR(32) NOT NULL DEFAULT 'SANDBOX',
      gateway_key_id VARCHAR(128),
      gateway_key_secret VARCHAR(128),
      gateway_webhook_secret VARCHAR(128),
      bank_transfer_enabled TINYINT(1) NOT NULL DEFAULT 1,
      bank_name VARCHAR(128),
      bank_account_number VARCHAR(64),
      bank_ifsc VARCHAR(32),
      bank_account_holder VARCHAR(255),
      bank_instructions TEXT,
      cash_enabled TINYINT(1) NOT NULL DEFAULT 1,
      payment_links_enabled TINYINT(1) NOT NULL DEFAULT 1,
      test_mode TINYINT(1) NOT NULL DEFAULT 1,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS invoice_installments (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      invoice_id VARCHAR(64) NOT NULL,
      installment_number INT NOT NULL,
      title VARCHAR(128) NOT NULL,
      amount_paise BIGINT NOT NULL DEFAULT 0,
      due_date VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
      paid_at VARCHAR(64),
      payment_id VARCHAR(64),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS refunds (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      payment_id VARCHAR(64) NOT NULL,
      invoice_id VARCHAR(64) NOT NULL,
      student_id VARCHAR(64) NOT NULL,
      amount_paise BIGINT NOT NULL DEFAULT 0,
      reason TEXT NOT NULL,
      requested_by VARCHAR(128) NOT NULL,
      approved_by VARCHAR(128),
      status VARCHAR(32) NOT NULL DEFAULT 'PROCESSED',
      provider_refund_id VARCHAR(128),
      created_at VARCHAR(64) NOT NULL,
      processed_at VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS payment_webhook_events (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      provider VARCHAR(32) NOT NULL,
      event_id VARCHAR(128) NOT NULL,
      event_type VARCHAR(64) NOT NULL,
      idempotency_key VARCHAR(128),
      payload JSON NOT NULL,
      processed TINYINT(1) NOT NULL DEFAULT 1,
      created_at VARCHAR(64) NOT NULL,
      UNIQUE KEY uniq_provider_event (provider, event_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Safe migrations for payments table
  const [payCols] = await p.query<any[]>("SHOW COLUMNS FROM payments LIKE 'idempotency_key'");
  if (payCols.length === 0) {
    try {
      await p.query("ALTER TABLE payments ADD COLUMN currency VARCHAR(8) DEFAULT 'INR'");
      await p.query("ALTER TABLE payments ADD COLUMN provider_order_id VARCHAR(128)");
      await p.query("ALTER TABLE payments ADD COLUMN idempotency_key VARCHAR(128)");
      await p.query("ALTER TABLE payments ADD COLUMN notes TEXT");
      await p.query("ALTER TABLE payments ADD COLUMN verified_by VARCHAR(128)");
      await p.query("ALTER TABLE payments ADD COLUMN verified_at VARCHAR(64)");
    } catch (e) {
      // Ignored if column already exists
    }
  }

  // Safe migrations for invoices table
  const [invCols] = await p.query<any[]>("SHOW COLUMNS FROM invoices LIKE 'scholarship_amount_paise'");
  if (invCols.length === 0) {
    try {
      await p.query("ALTER TABLE invoices ADD COLUMN fee_type VARCHAR(64) DEFAULT 'TUITION'");
      await p.query("ALTER TABLE invoices ADD COLUMN course_id VARCHAR(64)");
      await p.query("ALTER TABLE invoices ADD COLUMN batch_id VARCHAR(64)");
      await p.query("ALTER TABLE invoices ADD COLUMN scholarship_amount_paise BIGINT DEFAULT 0");
    } catch (e) {
      // Ignored if column already exists
    }
  }

  // Safe migration for users table: password column
  const [usrCols] = await p.query<any[]>("SHOW COLUMNS FROM users LIKE 'password'");
  if (usrCols.length === 0) {
    try {
      await p.query("ALTER TABLE users ADD COLUMN password VARCHAR(255) DEFAULT NULL");
    } catch (e) {
      // Ignored if column already exists
    }
  }

  console.log('[MYSQL] All 23 tables verified in MySQL schema with payment architecture.');


  // 3. Seed data if tables are empty
  const [orgRows] = await p.query<any[]>('SELECT COUNT(*) as count FROM organizations');
  if (orgRows[0].count === 0) {
    console.log('[MYSQL] Seeding initial data into MySQL database...');

    // Organizations
    for (const org of SEED_ORGANIZATIONS) {
      await p.query(
        'INSERT IGNORE INTO organizations (id, legal_name, trade_name, gstin, timezone, currency, tier, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [org.id, org.legalName, org.tradeName, org.gstin || null, org.timezone, org.currency, org.tier, org.status]
      );
    }

    // Branches
    for (const b of SEED_BRANCHES) {
      await p.query(
        'INSERT IGNORE INTO branches (id, organization_id, branch_code, name, address, city, state, pincode, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [b.id, b.organizationId, b.branchCode, b.name, b.address, b.city, b.state, b.pincode, b.phone, b.status]
      );
    }

    // Users
    for (const u of SEED_USERS) {
      await p.query(
        'INSERT IGNORE INTO users (id, organization_id, primary_branch_id, phone, email, full_name, role, designation, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.organizationId, u.primaryBranchId || null, u.phone, u.email || null, u.fullName, u.role, u.designation || null, u.avatarUrl || null]
      );
    }

    // Courses
    for (const c of SEED_COURSES) {
      await p.query(
        'INSERT IGNORE INTO courses (id, organization_id, name, target_exam, duration_months, status) VALUES (?, ?, ?, ?, ?, ?)',
        [c.id, c.organizationId, c.name, c.targetExam, c.durationMonths, c.status]
      );
    }

    // Batches
    for (const b of SEED_BATCHES) {
      await p.query(
        'INSERT IGNORE INTO batches (id, organization_id, branch_id, course_id, name, code, academic_year, max_capacity, current_enrollment, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [b.id, b.organizationId, b.branchId, b.courseId, b.name, b.code || null, b.academicYear, b.maxCapacity, b.currentEnrollment, b.startDate, b.endDate, b.status]
      );
    }

    // Students
    for (const s of SEED_STUDENTS) {
      await p.query(
        'INSERT IGNORE INTO students (id, organization_id, primary_branch_id, student_unique_id, full_name, gender, dob, phone, email, batch_id, roll_number, guardian_name, guardian_phone, guardian_email, guardian_relationship, dpdp_consent_granted, grade, board, target_exam, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [s.id, s.organizationId, s.primaryBranchId, s.studentUniqueId, s.fullName, s.gender, s.dob || null, s.phone || null, s.email || null, s.batchId, s.rollNumber, s.guardianName, s.guardianPhone, s.guardianEmail || null, s.guardianRelationship, s.dpdpConsentGranted ? 1 : 0, s.grade || null, s.board || null, s.targetExam || null, s.status]
      );
    }

    // Leads
    for (const l of SEED_LEADS) {
      await p.query(
        'INSERT IGNORE INTO leads (id, organization_id, branch_id, source, student_name, phone, email, guardian_name, guardian_phone, interested_course_id, target_course, assigned_counsellor_id, stage, notes, follow_up_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [l.id, l.organizationId, l.branchId, l.source, l.studentName, l.phone, l.email || null, l.guardianName || null, l.guardianPhone || null, l.interestedCourseId, l.targetCourse || null, l.assignedCounsellorId || null, l.stage, l.notes || null, l.followUpDate || null, l.createdAt]
      );
    }

    // Class Sessions
    for (const cs of SEED_CLASS_SESSIONS) {
      await p.query(
        'INSERT IGNORE INTO class_sessions (id, organization_id, batch_id, subject_id, teacher_user_id, classroom_name, scheduled_start, scheduled_end, topic_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [cs.id, cs.organizationId, cs.batchId, cs.subjectId, cs.teacherUserId, cs.classroomName, cs.scheduledStart, cs.scheduledEnd, cs.topicName, cs.status]
      );
    }

    // Attendance Records
    for (const att of SEED_ATTENDANCE) {
      await p.query(
        'INSERT IGNORE INTO attendance_records (id, organization_id, session_id, student_id, status, reason, marked_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [att.id, att.organizationId, att.sessionId, att.studentId, att.status, att.reason || null, att.markedAt]
      );
    }

    // Invoices
    for (const inv of SEED_INVOICES) {
      await p.query(
        'INSERT IGNORE INTO invoices (id, organization_id, branch_id, student_id, invoice_number, total_amount_paise, discount_amount_paise, net_amount_paise, paid_amount_paise, balance_amount_paise, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [inv.id, inv.organizationId, inv.branchId, inv.studentId, inv.invoiceNumber, inv.totalAmountPaise, inv.discountAmountPaise, inv.netAmountPaise, inv.paidAmountPaise, inv.balanceAmountPaise, inv.dueDate, inv.status]
      );
    }

    // Payments
    for (const pay of SEED_PAYMENTS) {
      await p.query(
        'INSERT IGNORE INTO payments (id, organization_id, branch_id, invoice_id, student_id, amount_paise, payment_method, payment_channel, provider, provider_payment_id, receipt_number, status, reconciled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [pay.id, pay.organizationId, pay.branchId, pay.invoiceId, pay.studentId, pay.amountPaise, pay.paymentMethod, pay.paymentChannel, pay.provider || 'NONE', pay.providerPaymentId || null, pay.receiptNumber, pay.status, pay.reconciled ? 1 : 0, pay.createdAt]
      );
    }

    // Questions
    for (const q of SEED_QUESTIONS) {
      await p.query(
        'INSERT IGNORE INTO questions (id, organization_id, topic_name, stem_latex, options_json, correct_answer, explanation_latex, difficulty, is_ai_generated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [q.id, q.organizationId, q.topicName || q.topic || null, q.stemLatex, JSON.stringify(q.optionsJson || q.options || []), q.correctAnswer, q.explanationLatex || q.explanation || null, q.difficulty, q.isAiGenerated ? 1 : 0]
      );
    }

    // Tests
    for (const t of SEED_TESTS) {
      await p.query(
        'INSERT IGNORE INTO tests (id, organization_id, course_id, title, total_marks, duration_minutes, questions_count, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [t.id, t.organizationId, t.courseId, t.title, t.totalMarks, t.durationMinutes, t.questionsCount, t.status]
      );
    }

    // Interventions
    for (const int of SEED_INTERVENTIONS) {
      await p.query(
        'INSERT IGNORE INTO interventions (id, organization_id, student_id, student_name, batch_name, trigger_reason, evidence_summary, status, owner_user_id, due_date, playbook, outcome_notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [int.id, int.organizationId, int.studentId, int.studentName, int.batchName, int.triggerReason, int.evidenceSummary, int.status, int.ownerUserId || int.ownerId || 'usr-004', int.dueDate, int.playbook || int.playbookAssigned || 'Playbook', int.outcomeNotes || null, int.createdAt]
      );
    }

    // Audit Logs
    for (const al of SEED_AUDIT_LOGS) {
      await p.query(
        'INSERT IGNORE INTO audit_logs (id, organization_id, actor_name, actor_role, action, entity_name, entity_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [al.id, al.organizationId, al.actorName, al.actorRole, al.action, al.entityName, al.entityId, al.timestamp]
      );
    }

    console.log('[MYSQL] Initial seed data successfully inserted into MySQL tables.');
  } else {
    console.log(`[MYSQL] Database already contains ${orgRows[0].count} organization(s). Using existing live database data.`);
  }

  // 4. Ensure new feature tables are populated even if organizations was already seeded
  const [matRows] = await p.query<any[]>('SELECT COUNT(*) as count FROM study_materials');
  if (matRows[0].count === 0) {
    console.log('[MYSQL] Seeding study_materials...');
    const materials = [
      { id: 'mat-01', orgId: 'org-kota-001', courseId: 'crs-jee-adv', batchId: 'batch-01', subject: 'Physics', title: 'Complete Physics Formula Handbook (Mechanics & Waves)', desc: 'Concise summary sheet of all critical formulae, dimensions and standard graph curves for JEE Advanced.', type: 'PDF', url: '/materials/physics_formula_handbook.pdf', size: 2450, downloads: 48, uploadedBy: 'Prof. Alok Mukherjee' },
      { id: 'mat-02', orgId: 'org-kota-001', courseId: 'crs-jee-adv', batchId: 'batch-01', subject: 'Chemistry', title: 'Ionic Equilibrium & Chemical Kinetics Lecture Notes', desc: 'Handwritten classroom annotations with Ostwald dilution law, buffer solutions, and solubility products.', type: 'NOTES', url: '/materials/ionic_equilibrium_notes.pdf', size: 1820, downloads: 36, uploadedBy: 'Dr. Anita Deshmukh' },
      { id: 'mat-03', orgId: 'org-kota-001', courseId: 'crs-jee-adv', batchId: 'batch-01', subject: 'Mathematics', title: 'Daily Practice Problem (DPP #04): Definite Integrals', desc: '25 graded subjective and single-choice questions covering King and Queen properties and reduction formulae.', type: 'DPP', url: '/materials/dpp_04_definite_integrals.pdf', size: 850, downloads: 41, uploadedBy: 'Prof. H.C. Verma' },
      { id: 'mat-04', orgId: 'org-kota-001', courseId: 'crs-jee-adv', batchId: 'batch-01', subject: 'Physics', title: 'Friction, Pseudo Force & Wedge Constraints Video Lecture', desc: 'Recorded live stream from Kota Hall 3A with step-by-step free-body diagram breakdown.', type: 'VIDEO', url: 'https://youtube.com/watch?v=placeholder_lecture', size: 45000, downloads: 72, uploadedBy: 'Prof. Alok Mukherjee' },
      { id: 'mat-05', orgId: 'org-kota-001', courseId: 'crs-jee-adv', batchId: 'batch-02', subject: 'Physics', title: 'JEE Advanced 2026 Physics Full Mock Test Paper with Hints', desc: 'Full length 3-hour mock paper designed strictly on latest NTA CBT pattern with detailed video solution keys.', type: 'ASSIGNMENT', url: '/materials/jee_adv_full_mock.pdf', size: 3200, downloads: 29, uploadedBy: 'Prof. Alok Mukherjee' },
    ];
    for (const m of materials) {
      await p.query(
        'INSERT IGNORE INTO study_materials (id, organization_id, course_id, batch_id, subject, title, description, file_type, file_url, file_size_kb, download_count, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [m.id, m.orgId, m.courseId, m.batchId, m.subject, m.title, m.desc, m.type, m.url, m.size, m.downloads, m.uploadedBy, new Date().toISOString()]
      );
    }
  }

  const [msgRows] = await p.query<any[]>('SELECT COUNT(*) as count FROM messages');
  if (msgRows[0].count === 0) {
    console.log('[MYSQL] Seeding messages & communications...');
    const msgs = [
      { id: 'msg-01', orgId: 'org-kota-001', recipientType: 'SINGLE_PARENT', target: 'Rajesh Kumar (Priya Sharma Guardian, +91 98100 11223)', channel: 'WHATSAPP', title: 'Absence Notice: Friction Class Today', content: 'Dear Rajesh ji, your ward Priya was marked Absent in today Physics class. Please ensure regular attendance for JEE Advanced preparation.', status: 'SENT', sentBy: 'Prof. Alok Mukherjee', sentAt: 'Today, 11:30 AM', delivered: 1 },
      { id: 'msg-02', orgId: 'org-kota-001', recipientType: 'BATCH_PARENTS', target: 'Batch A - JEE Advanced 2027 Parents (36 Recipients)', channel: 'WHATSAPP', title: 'Upcoming CBT Mock Assessment & Syllabus Circular', content: 'Respected Parents, Monthly CBT Assessment #02 is scheduled for this Sunday 9:00 AM. Test results & topic-level diagnostic reports will be sent by Sunday evening.', status: 'SENT', sentBy: 'Institute Director', sentAt: 'Yesterday, 04:15 PM', delivered: 36 },
      { id: 'msg-03', orgId: 'org-kota-001', recipientType: 'ALL_PARENTS', target: 'Kota Main Campus Enrolled Guardians (184 Recipients)', channel: 'SMS', title: 'Holiday Circular: Dussehra Academic Schedule', content: 'Aarohan Academy will remain closed on Oct 12 for Dussehra. Special revision doubt clearing camp will operate on Oct 13 10:00 AM to 02:00 PM.', status: 'SENT', sentBy: 'Admin Office', sentAt: '2 days ago', delivered: 184 },
      { id: 'msg-04', orgId: 'org-kota-001', recipientType: 'SINGLE_PARENT', target: 'Smt. Sunita Tiwari (Devansh Tiwari Guardian)', channel: 'WHATSAPP', title: 'Urgent: Academic Performance Review Call Request', content: 'Dear Parent, Devansh scored 47% in recent Physics Mechanics test. We request a 15-minute 1-on-1 counseling session with Prof. Alok on Thursday 4 PM.', status: 'SENT', sentBy: 'Pooja Verma (Counsellor)', sentAt: 'Today, 09:45 AM', delivered: 1 },
    ];
    for (const msg of msgs) {
      await p.query(
        'INSERT IGNORE INTO messages (id, organization_id, recipient_type, recipient_target, channel, title, content, status, sent_by, sent_at, delivered_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [msg.id, msg.orgId, msg.recipientType, msg.target, msg.channel, msg.title, msg.content, msg.status, msg.sentBy, msg.sentAt, msg.delivered]
      );
    }
  }

  const [resRows] = await p.query<any[]>('SELECT COUNT(*) as count FROM test_results');
  if (resRows[0].count === 0) {
    console.log('[MYSQL] Seeding test_results & diagnostics...');
    const results = [
      { id: 'res-01', orgId: 'org-kota-001', testId: 'tst-01', studentId: 'stu-001', batchId: 'batch-01', score: 245, total: 300, pct: 81.67, rank: 1, phy: 85, chem: 80, math: 80, weak: ['Rotational Dynamics'], strong: ['Ray Optics', 'Electrostatics', 'Definite Integrals'], action: 'Assign Advanced Level Problems on Rotational Inertia to push for Top 100 AIR.', date: '2026-09-18' },
      { id: 'res-02', orgId: 'org-kota-001', testId: 'tst-01', studentId: 'stu-000184', batchId: 'batch-01', score: 218, total: 300, pct: 72.67, rank: 2, phy: 70, chem: 78, math: 70, weak: ['Friction & Wedge Constraints'], strong: ['Chemical Bonding', 'Matrices & Determinants'], action: 'Attend concept booster session on 2-block friction with Prof. Alok Mukherjee.', date: '2026-09-18' },
      { id: 'res-03', orgId: 'org-kota-001', testId: 'tst-01', studentId: 'stu-000188', batchId: 'batch-01', score: 185, total: 300, pct: 61.67, rank: 3, phy: 60, chem: 65, math: 60, weak: ['Thermodynamics', 'Indefinite Integration'], strong: ['Kinematics', 'Periodic Table'], action: 'Solve DPP #03 revision drill & attend Saturday doubt clearing clinic.', date: '2026-09-18' },
      { id: 'res-04', orgId: 'org-kota-001', testId: 'tst-01', studentId: 'stu-000186', batchId: 'batch-01', score: 142, total: 300, pct: 47.33, rank: 4, phy: 42, chem: 50, math: 50, weak: ['Newton Laws', 'Friction', 'Complex Numbers'], strong: ['Stoichiometry'], action: '1-on-1 Remedial Session (#int-00073) scheduled + Parent progress call with Prof. Alok.', date: '2026-09-18' },
      { id: 'res-05', orgId: 'org-kota-001', testId: 'tst-01', studentId: 'stu-000187', batchId: 'batch-01', score: 168, total: 300, pct: 56.00, rank: 5, phy: 52, chem: 58, math: 58, weak: ['Circular Motion', 'Vectors'], strong: ['Atomic Structure', 'Permutations'], action: 'Review Chapter 3 recorded video & retake diagnostic micro-quiz.', date: '2026-09-18' },
    ];
    for (const r of results) {
      await p.query(
        'INSERT IGNORE INTO test_results (id, organization_id, test_id, student_id, batch_id, score_obtained, total_marks, percentage, rank_in_batch, physics_score, chemistry_score, maths_score, weak_topics, strong_topics, recommended_action, taken_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.orgId, r.testId, r.studentId, r.batchId, r.score, r.total, r.pct, r.rank, r.phy, r.chem, r.math, JSON.stringify(r.weak), JSON.stringify(r.strong), r.action, r.date]
      );
    }
  }

  // 5. Seed multi-tenant payment accounts for all organizations
  const [paRows] = await p.query<any[]>('SELECT COUNT(*) as count FROM payment_accounts');
  if (paRows[0].count === 0) {
    console.log('[MYSQL] Seeding multi-tenant payment accounts...');
    const accounts = [
      {
        id: 'pa-org-kota-001',
        orgId: 'org-kota-001',
        upiId: 'aarohanjee@icici',
        name: 'Aarohan JEE Academy',
        bankName: 'ICICI Bank',
        accNum: '001205001234',
        ifsc: 'ICIC0000012',
        holder: 'Aarohan Educational Foundation Pvt Ltd',
        instructions: 'Mention student registration number & invoice ID in transfer notes.',
      },
      {
        id: 'pa-org-pune-002',
        orgId: 'org-pune-002',
        upiId: 'apexprep@hdfcbank',
        name: 'Apex CAT & Banking Prep',
        bankName: 'HDFC Bank',
        accNum: '50200011223344',
        ifsc: 'HDFC0000123',
        holder: 'Apex Career Institute LLP',
        instructions: 'Direct RTGS/NEFT transfer. Share bank UTR receipt with accounts office.',
      },
      {
        id: 'pa-org-blr-003',
        orgId: 'org-blr-003',
        upiId: 'pragati.learning@sbi',
        name: 'Pragati Tuition Centre',
        bankName: 'State Bank of India',
        accNum: '30129845678',
        ifsc: 'SBIN0001234',
        holder: 'Pragati Learning Systems',
        instructions: 'Please verify IFSC code before submitting payment.',
      },
      {
        id: 'pa-org-hyd-004',
        orgId: 'org-hyd-004',
        upiId: 'dronatech@axisbank',
        name: 'Drona Tech Academy',
        bankName: 'Axis Bank',
        accNum: '918020034567890',
        ifsc: 'UTIB0000456',
        holder: 'Drona Skilltech Solutions Pvt Ltd',
        instructions: 'Submit UTR reference on payment completion for instant verification.',
      },
    ];

    for (const a of accounts) {
      await p.query(
        `INSERT IGNORE INTO payment_accounts 
         (id, organization_id, upi_enabled, upi_id, upi_merchant_name, gateway_enabled, gateway_provider, gateway_key_id, gateway_key_secret, gateway_webhook_secret, bank_transfer_enabled, bank_name, bank_account_number, bank_ifsc, bank_account_holder, bank_instructions, cash_enabled, payment_links_enabled, test_mode) 
         VALUES (?, ?, 1, ?, ?, 1, 'SANDBOX', ?, ?, ?, 1, ?, ?, ?, ?, ?, 1, 1, 1)`,
        [
          a.id,
          a.orgId,
          a.upiId,
          a.name,
          `rzp_test_${a.orgId.replace(/[^a-zA-Z0-9]/g, '')}`,
          `mock_secret_${a.orgId}`,
          `whsec_${a.orgId}`,
          a.bankName,
          a.accNum,
          a.ifsc,
          a.holder,
          a.instructions,
        ]
      );
    }
  }

  // 6. Seed installments for invoices if none exist
  const [instRows] = await p.query<any[]>('SELECT COUNT(*) as count FROM invoice_installments');
  if (instRows[0].count === 0) {
    console.log('[MYSQL] Generating installment schedules for existing invoices...');
    const [invoices] = await p.query<any[]>('SELECT * FROM invoices LIMIT 50');
    for (const inv of invoices) {
      const net = Number(inv.net_amount_paise) || Number(inv.total_amount_paise) || 12000000;
      const paid = Number(inv.paid_amount_paise) || 0;

      const inst1Amount = Math.round(net * 0.4);
      const inst2Amount = Math.round(net * 0.3);
      const inst3Amount = net - inst1Amount - inst2Amount;

      const inst1Status = paid >= inst1Amount ? 'PAID' : 'PENDING';
      const inst2Status = paid >= inst1Amount + inst2Amount ? 'PAID' : (paid > inst1Amount ? 'OVERDUE' : 'PENDING');
      const inst3Status = paid >= net ? 'PAID' : 'PENDING';

      const installments = [
        { num: 1, title: 'Term 1 — Admission & Course Registration', amount: inst1Amount, due: '2026-06-15', status: inst1Status },
        { num: 2, title: 'Term 2 — Mid-Year Advanced Modules', amount: inst2Amount, due: '2026-09-10', status: inst2Status },
        { num: 3, title: 'Term 3 — Final Mock Drill & Rank Booster', amount: inst3Amount, due: '2026-11-20', status: inst3Status },
      ];

      for (const inst of installments) {
        await p.query(
          `INSERT IGNORE INTO invoice_installments 
           (id, organization_id, invoice_id, installment_number, title, amount_paise, due_date, status, paid_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `inst-${inv.id}-${inst.num}`,
            inv.organization_id,
            inv.id,
            inst.num,
            inst.title,
            inst.amount,
            inst.due,
            inst.status,
            inst.status === 'PAID' ? '2026-06-15' : null,
          ]
        );
      }
    }
  }
}

