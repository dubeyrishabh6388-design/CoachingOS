export type RoleCode = 
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'BRANCH_ADMIN'
  | 'MANAGER'
  | 'COUNSELLOR'
  | 'TEACHER'
  | 'ACCOUNTANT'
  | 'STUDENT'
  | 'PARENT';

export interface Organization {
  id: string;
  legalName: string;
  tradeName: string;
  gstin?: string;
  timezone: string;
  currency: string;
  tier: 'STARTER' | 'GROWTH' | 'PRO_INSTITUTE' | 'MULTI_BRANCH' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface Branch {
  id: string;
  organizationId: string;
  branchCode: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface User {
  id: string;
  organizationId: string;
  primaryBranchId?: string;
  phone: string;
  email?: string;
  fullName: string;
  role: RoleCode;
  designation?: string;
  avatarUrl?: string;
}

export interface Course {
  id: string;
  organizationId: string;
  name: string;
  targetExam: string;
  durationMonths: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Subject {
  id: string;
  organizationId: string;
  courseId: string;
  name: string;
  code: string;
}

export interface Batch {
  id: string;
  organizationId: string;
  branchId: string;
  courseId: string;
  name: string;
  code?: string;
  academicYear: string;
  maxCapacity: number;
  currentEnrollment: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface Student {
  id: string;
  organizationId: string;
  primaryBranchId: string;
  studentUniqueId: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob?: string;
  phone?: string;
  email?: string;
  batchId: string;
  rollNumber: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianRelationship: 'FATHER' | 'MOTHER' | 'LEGAL_GUARDIAN';
  dpdpConsentGranted: boolean;
  grade?: string;
  board?: string;
  targetExam?: string;
  status: 'ACTIVE' | 'ALUMNI' | 'DROPOUT';
}

export interface Lead {
  id: string;
  organizationId: string;
  branchId: string;
  source: 'WALK_IN' | 'META_ADS' | 'WEBSITE' | 'WHATSAPP' | 'REFERRAL';
  studentName: string;
  phone: string;
  email?: string;
  guardianName?: string;
  guardianPhone?: string;
  interestedCourseId: string;
  targetCourse?: string;
  assignedCounsellorId?: string;
  stage: 'NEW' | 'CONTACTED' | 'DEMO_SCHEDULED' | 'CONVERTED' | 'LOST';
  notes?: string;
  followUpDate?: string;
  createdAt: string;
}

export interface ClassSession {
  id: string;
  organizationId: string;
  batchId: string;
  subjectId: string;
  teacherUserId: string;
  classroomName: string;
  scheduledStart: string;
  scheduledEnd: string;
  topicName: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  sessionId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  reason?: string;
  markedAt: string;
}

export type PaymentStatus = 
  | 'INITIATED' 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'SUCCESS' 
  | 'CAPTURED' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'REFUNDED' 
  | 'PARTIALLY_REFUNDED' 
  | 'REVERSED' 
  | 'MANUAL_REVIEW';

export type PaymentMethod = 
  | 'UPI' 
  | 'ONLINE_GATEWAY' 
  | 'CARD' 
  | 'NET_BANKING' 
  | 'BANK_TRANSFER' 
  | 'CASH' 
  | 'PAYMENT_LINK' 
  | 'CHEQUE';

export type PaymentChannel = 
  | 'STUDENT_PORTAL' 
  | 'GATEWAY_LINK' 
  | 'COUNTER_POS' 
  | 'COUNTER_CASH' 
  | 'WEBHOOK' 
  | 'PAYMENT_LINK';

export type PaymentProvider = 
  | 'SANDBOX' 
  | 'RAZORPAY' 
  | 'STRIPE' 
  | 'CASHFREE' 
  | 'UPI_DIRECT' 
  | 'BANK_MANUAL' 
  | 'CASH' 
  | 'NONE';

export interface PaymentAccount {
  id: string;
  organizationId: string;
  upiEnabled: boolean;
  upiId: string;
  upiMerchantName: string;
  upiQrImageUrl?: string;
  gatewayEnabled: boolean;
  gatewayProvider: 'SANDBOX' | 'RAZORPAY' | 'STRIPE' | 'CASHFREE';
  gatewayKeyId?: string;
  gatewayKeySecretMasked?: string;
  gatewayWebhookSecret?: string;
  bankTransferEnabled: boolean;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolder?: string;
  bankInstructions?: string;
  cashEnabled: boolean;
  paymentLinksEnabled: boolean;
  testMode: boolean;
  updatedAt?: string;
}

export interface FeePlan {
  id: string;
  organizationId: string;
  courseId: string;
  name: string;
  totalAmountPaise: number;
}

export interface Invoice {
  id: string;
  organizationId: string;
  branchId: string;
  studentId: string;
  invoiceNumber: string;
  feeType?: string;
  courseId?: string;
  batchId?: string;
  totalAmountPaise: number;
  discountAmountPaise: number;
  scholarshipAmountPaise?: number;
  netAmountPaise: number;
  paidAmountPaise: number;
  balanceAmountPaise: number;
  dueDate: string;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  studentName?: string;
  studentRoll?: string;
  batchName?: string;
  installmentsCount?: number;
  installments?: InvoiceInstallment[];
  createdAt?: string;
}

export interface InvoiceInstallment {
  id: string;
  organizationId: string;
  invoiceId: string;
  installmentNumber: number;
  title: string;
  amountPaise: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: string;
  paymentId?: string;
  createdAt?: string;
}

export interface Payment {
  id: string;
  organizationId: string;
  branchId: string;
  invoiceId: string;
  studentId: string;
  amountPaise: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  paymentChannel: PaymentChannel;
  provider: PaymentProvider;
  providerPaymentId?: string;
  providerOrderId?: string;
  receiptNumber: string;
  status: PaymentStatus;
  reconciled: boolean;
  idempotencyKey?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  studentName?: string;
  studentRoll?: string;
  invoiceNumber?: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  organizationId: string;
  paymentId: string;
  invoiceId: string;
  studentId: string;
  amountPaise: number;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'REQUESTED' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  providerRefundId?: string;
  createdAt: string;
  processedAt?: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  organizationId: string;
  organizationName: string;
  organizationGstin?: string;
  organizationAddress?: string;
  branchName?: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  batchName?: string;
  courseName?: string;
  amountPaise: number;
  paymentMethod: string;
  paymentDate: string;
  transactionReference: string;
  status: string;
  verifiedBy?: string;
}

export interface ReconciliationSummary {
  expectedCollectionPaise: number;
  actualCollectedPaise: number;
  pendingDuesPaise: number;
  overdueDuesPaise: number;
  failedAmountPaise: number;
  refundedAmountPaise: number;
  manualReviewsPendingCount: number;
  onlineCollectionsPaise: number;
  cashCollectionsPaise: number;
  bankTransferCollectionsPaise: number;
  discrepancyPaise: number;
  reconciledPercentage: number;
}

export interface Question {
  id: string;
  organizationId: string;
  topicName?: string;
  topic?: string;
  subject?: string;
  questionType?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'NUMERICAL';
  questionText?: string;
  stemLatex: string;
  optionsJson?: string[];
  options?: string[];
  correctAnswer: string;
  explanationLatex?: string;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isAiGenerated: boolean;
}

export interface Test {
  id: string;
  organizationId: string;
  courseId: string;
  title: string;
  totalMarks: number;
  durationMinutes: number;
  questionsCount: number;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface Intervention {
  id: string;
  organizationId: string;
  studentId: string;
  studentName: string;
  batchName: string;
  triggerReason: string;
  evidenceSummary: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED_RECOVERED';
  ownerUserId: string;
  dueDate: string;
  playbook: string;
  outcomeNotes?: string;
  createdAt: string;
  playbookAssigned?: string;
  description?: string;
  triggerType?: string;
  ownerId?: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityName: string;
  entityId: string;
  timestamp: string;
}

export interface StudyMaterial {
  id: string;
  organizationId: string;
  courseId: string;
  batchId?: string;
  subject: string;
  title: string;
  description: string;
  fileType: 'PDF' | 'NOTES' | 'DPP' | 'ASSIGNMENT' | 'VIDEO';
  fileUrl: string;
  fileSizeKb: number;
  downloadCount: number;
  uploadedBy: string;
  createdAt: string;
}

export interface MessageItem {
  id: string;
  organizationId: string;
  recipientType: 'ALL_PARENTS' | 'BATCH_PARENTS' | 'SINGLE_PARENT' | 'ALL_STUDENTS';
  recipientTarget: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
  title: string;
  content: string;
  status: 'SENT' | 'SCHEDULED' | 'DRAFT';
  sentBy: string;
  sentAt: string;
  deliveredCount: number;
}

export interface TestResult {
  id: string;
  organizationId: string;
  testId: string;
  testTitle?: string;
  studentId: string;
  studentName?: string;
  rollNumber?: string;
  batchId: string;
  batchName?: string;
  scoreObtained: number;
  totalMarks: number;
  percentage: number;
  rankInBatch: number;
  physicsScore?: number;
  chemistryScore?: number;
  mathsScore?: number;
  weakTopics: string[];
  strongTopics: string[];
  recommendedAction: string;
  takenAt: string;
}

