import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';
import { PaymentService } from '../payments/payment.service.js';
import { SandboxGatewayProvider } from '../payments/sandbox-provider.js';

export const paymentsRouter = Router();
const sandboxProvider = new SandboxGatewayProvider();

// ==========================================
// 1. Institute Payment Configuration Settings
// ==========================================

// GET /api/v1/payments/settings
paymentsRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string) || (req.headers['x-organization-id'] as string) || 'org-kota-001';
    let account = await db.getPaymentAccount(organizationId);

    if (!account) {
      // Auto-initialize default account if not present
      const org = await db.getOrganizationById(organizationId);
      account = await db.updatePaymentAccount(organizationId, {
        upiId: `${organizationId.replace(/[^a-zA-Z0-9]/g, '')}@upi`,
        upiMerchantName: org?.tradeName || 'Coaching Institute',
        upiEnabled: true,
        gatewayEnabled: true,
        gatewayProvider: 'SANDBOX',
        bankTransferEnabled: true,
        bankName: 'HDFC Bank',
        bankAccountNumber: '50200099887766',
        bankIfsc: 'HDFC0000123',
        bankAccountHolder: org?.legalName || org?.tradeName || 'Coaching Institute',
        cashEnabled: true,
        paymentLinksEnabled: true,
        testMode: true,
      });
    }

    res.json({
      data: account,
      meta: { message: 'Payment settings fetched' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching payment settings' },
    });
  }
});

// PUT /api/v1/payments/settings
paymentsRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.body.organizationId as string) || (req.headers['x-organization-id'] as string) || 'org-kota-001';
    const updated = await db.updatePaymentAccount(organizationId, req.body);

    res.json({
      data: updated,
      meta: { message: 'Payment settings successfully updated' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error updating payment settings' },
    });
  }
});

// ==========================================
// 2. Payments Ledger & Transactions
// ==========================================

// GET /api/v1/payments
paymentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string) || (req.headers['x-organization-id'] as string) || 'org-kota-001';
    const studentId = req.query.studentId as string | undefined;
    const invoiceId = req.query.invoiceId as string | undefined;
    const status = req.query.status as string | undefined;
    const method = req.query.method as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const payments = await db.getPayments(organizationId, {
      studentId,
      invoiceId,
      status,
      method,
      limit,
    });

    res.json({
      data: payments,
      meta: { count: payments.length },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching payments' },
    });
  }
});

// ==========================================
// 3. Payment Intents (Dynamic UPI & Online Gateway)
// ==========================================

// POST /api/v1/payments/intent
paymentsRouter.post('/intent', async (req: Request, res: Response) => {
  try {
    const {
      organizationId = 'org-kota-001',
      invoiceId,
      studentId,
      amountPaise,
      paymentMethod = 'UPI',
    } = req.body;

    if (!invoiceId || !studentId || !amountPaise) {
      res.status(400).json({
        data: null,
        error: { message: 'invoiceId, studentId, and amountPaise are required' },
      });
      return;
    }

    if (paymentMethod === 'UPI') {
      const upiIntent = await PaymentService.generateUPIIntent(organizationId, invoiceId, studentId, amountPaise);
      res.json({
        data: upiIntent,
        meta: { message: 'Institute UPI intent generated' },
        error: null,
      });
      return;
    }

    if (paymentMethod === 'ONLINE_GATEWAY' || paymentMethod === 'CARD' || paymentMethod === 'NET_BANKING') {
      const gatewayIntent = await PaymentService.createGatewayIntent(organizationId, invoiceId, studentId, amountPaise);
      res.json({
        data: gatewayIntent,
        meta: { message: 'Online gateway payment session initiated' },
        error: null,
      });
      return;
    }

    res.status(400).json({
      data: null,
      error: { message: `Unsupported intent method ${paymentMethod}` },
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error creating payment intent' },
    });
  }
});

// POST /api/v1/payments/verify
paymentsRouter.post('/verify', async (req: Request, res: Response) => {
  try {
    const {
      organizationId = 'org-kota-001',
      branchId = 'br-main',
      invoiceId,
      studentId,
      amountPaise,
      paymentMethod = 'ONLINE_GATEWAY',
      providerPaymentId,
      providerOrderId,
      signature,
      idempotencyKey,
    } = req.body;

    if (!invoiceId || !studentId || !amountPaise || !providerPaymentId) {
      res.status(400).json({
        data: null,
        error: { message: 'invoiceId, studentId, amountPaise, and providerPaymentId are required' },
      });
      return;
    }

    const payment = await PaymentService.verifyAndCapturePayment({
      organizationId,
      branchId,
      invoiceId,
      studentId,
      amountPaise,
      paymentMethod,
      providerPaymentId,
      providerOrderId,
      signature,
      idempotencyKey,
    });

    res.status(200).json({
      data: payment,
      meta: { message: 'Payment successfully verified and settled' },
      error: null,
    });
  } catch (err: any) {
    res.status(400).json({
      data: null,
      error: { message: err.message || 'Payment verification failed' },
    });
  }
});

// ==========================================
// 4. Counter POS & Legacy Checkout
// ==========================================

// POST /api/v1/payments/checkout
paymentsRouter.post('/checkout', async (req: Request, res: Response) => {
  try {
    const {
      organizationId = 'org-kota-001',
      branchId = 'br-kota-main',
      invoiceId,
      studentId,
      amountPaise,
      paymentMethod = 'UPI',
      channel = 'COUNTER_POS',
      action = 'COLLECT',
      idempotencyKey,
    } = req.body;

    if (!invoiceId || !studentId || !amountPaise) {
      res.status(400).json({
        data: null,
        error: { message: 'invoiceId, studentId, and amountPaise are required' },
      });
      return;
    }

    if (action === 'GENERATE_UPI_QR') {
      const upiIntent = await PaymentService.generateUPIIntent(organizationId, invoiceId, studentId, amountPaise);
      res.json({
        data: upiIntent,
        meta: { message: 'Dynamic UPI QR intent generated' },
        error: null,
      });
      return;
    }

    // Record verified payment
    const payment = await db.recordPayment({
      organizationId,
      branchId,
      invoiceId,
      studentId,
      amountPaise,
      paymentMethod,
      channel,
      provider: paymentMethod === 'UPI' ? 'UPI_DIRECT' : (paymentMethod === 'CASH' ? 'CASH' : 'SANDBOX'),
      providerPaymentId: `pos_${Date.now()}`,
      status: 'SUCCESS',
      idempotencyKey,
      verifiedBy: 'Counter Staff',
    });

    res.status(201).json({
      data: payment,
      meta: { message: 'Payment successfully captured and ledger updated' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error processing payment' },
    });
  }
});

// ==========================================
// 5. Manual Bank Transfer & Review Flow
// ==========================================

// POST /api/v1/payments/bank-transfer
paymentsRouter.post('/bank-transfer', async (req: Request, res: Response) => {
  try {
    const {
      organizationId = 'org-kota-001',
      branchId = 'br-main',
      invoiceId,
      studentId,
      amountPaise,
      utrNumber,
      bankName,
      transferDate = new Date().toISOString().slice(0, 10),
      notes,
    } = req.body;

    if (!invoiceId || !studentId || !amountPaise || !utrNumber) {
      res.status(400).json({
        data: null,
        error: { message: 'invoiceId, studentId, amountPaise, and utrNumber are required' },
      });
      return;
    }

    const payment = await db.recordPayment({
      organizationId,
      branchId,
      invoiceId,
      studentId,
      amountPaise,
      paymentMethod: 'BANK_TRANSFER',
      channel: 'STUDENT_PORTAL',
      provider: 'BANK_MANUAL',
      providerPaymentId: utrNumber,
      status: 'MANUAL_REVIEW',
      notes: `Bank Transfer via ${bankName || 'NEFT/RTGS'}. UTR: ${utrNumber} on ${transferDate}. ${notes || ''}`,
    });

    res.status(201).json({
      data: payment,
      meta: { message: 'Bank transfer submitted for administrative verification' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error recording bank transfer' },
    });
  }
});

// POST /api/v1/payments/manual-review
paymentsRouter.post('/manual-review', async (req: Request, res: Response) => {
  try {
    const { paymentId, action, reason, verifiedBy = 'Accounts Admin' } = req.body;

    if (!paymentId || !action) {
      res.status(400).json({
        data: null,
        error: { message: 'paymentId and action ("APPROVE" or "REJECT") are required' },
      });
      return;
    }

    let updated: any;
    if (action === 'APPROVE') {
      updated = await db.approveManualBankTransfer(paymentId, verifiedBy);
    } else if (action === 'REJECT') {
      updated = await db.rejectManualBankTransfer(paymentId, reason || 'Unverified bank statement entry', verifiedBy);
    } else {
      res.status(400).json({ data: null, error: { message: 'Invalid action. Must be APPROVE or REJECT' } });
      return;
    }

    res.json({
      data: updated,
      meta: { message: `Bank transfer successfully ${action.toLowerCase()}d` },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error updating manual review status' },
    });
  }
});

// ==========================================
// 6. Cash Payments & Counter Operations
// ==========================================

// POST /api/v1/payments/cash
paymentsRouter.post('/cash', async (req: Request, res: Response) => {
  try {
    const {
      organizationId = 'org-kota-001',
      branchId = 'br-main',
      invoiceId,
      studentId,
      amountPaise,
      collectedBy = 'Counter Cashier',
      notes,
      idempotencyKey,
    } = req.body;

    if (!invoiceId || !studentId || !amountPaise) {
      res.status(400).json({
        data: null,
        error: { message: 'invoiceId, studentId, and amountPaise are required' },
      });
      return;
    }

    const payment = await db.recordPayment({
      organizationId,
      branchId,
      invoiceId,
      studentId,
      amountPaise,
      paymentMethod: 'CASH',
      channel: 'COUNTER_CASH',
      provider: 'CASH',
      status: 'SUCCESS',
      idempotencyKey,
      notes: `Cash collected by ${collectedBy}. ${notes || ''}`,
      verifiedBy: collectedBy,
    });

    res.status(201).json({
      data: payment,
      meta: { message: 'Cash payment recorded and official receipt generated' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error recording cash payment' },
    });
  }
});

// ==========================================
// 7. Refunds Management
// ==========================================

// POST /api/v1/payments/refund
paymentsRouter.post('/refund', async (req: Request, res: Response) => {
  try {
    const {
      organizationId = 'org-kota-001',
      paymentId,
      invoiceId,
      studentId,
      amountPaise,
      reason,
      requestedBy = 'Finance Officer',
      approvedBy,
    } = req.body;

    if (!paymentId || !invoiceId || !studentId || !amountPaise || !reason) {
      res.status(400).json({
        data: null,
        error: { message: 'paymentId, invoiceId, studentId, amountPaise, and reason are required' },
      });
      return;
    }

    const refund = await db.processRefund({
      organizationId,
      paymentId,
      invoiceId,
      studentId,
      amountPaise,
      reason,
      requestedBy,
      approvedBy,
    });

    res.status(201).json({
      data: refund,
      meta: { message: 'Refund successfully processed and invoice balance restored' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error processing refund' },
    });
  }
});

// ==========================================
// 8. Provider Webhook Handling & Idempotency
// ==========================================

// POST /api/v1/payments/webhook/:provider
paymentsRouter.post('/webhook/:provider', async (req: Request, res: Response) => {
  try {
    const providerParam = req.params.provider?.toUpperCase() || 'SANDBOX';
    const signature = (req.headers['x-webhook-signature'] as string) || '';
    const payload = req.body;

    // Process webhook event via provider abstraction
    const webhookResult = await sandboxProvider.processWebhook(payload, signature);

    // Check duplicate event protection (Idempotency)
    const isAlreadyProcessed = await db.checkWebhookEventProcessed(providerParam, webhookResult.eventId);
    if (isAlreadyProcessed) {
      res.json({
        data: { eventId: webhookResult.eventId, status: 'DUPLICATE_IGNORED' },
        meta: { message: 'Webhook event already processed earlier (idempotent no-op)' },
        error: null,
      });
      return;
    }

    const organizationId = payload.organizationId || payload.data?.organizationId || 'org-kota-001';

    // Record webhook event into MySQL log
    await db.recordWebhookEvent({
      organizationId,
      provider: providerParam,
      eventId: webhookResult.eventId,
      eventType: webhookResult.eventType,
      payload,
    });

    // If payment captured, update ledger
    if (webhookResult.status === 'SUCCESS' && webhookResult.invoiceId && webhookResult.amountPaise) {
      await db.recordPayment({
        organizationId,
        branchId: 'br-main',
        invoiceId: webhookResult.invoiceId,
        studentId: payload.studentId || payload.data?.studentId || 'stu-001',
        amountPaise: webhookResult.amountPaise,
        paymentMethod: 'ONLINE_GATEWAY',
        channel: 'WEBHOOK',
        provider: 'SANDBOX',
        providerPaymentId: webhookResult.providerPaymentId,
        status: 'SUCCESS',
        idempotencyKey: webhookResult.eventId,
        notes: `Webhook captured: ${webhookResult.eventType}`,
      });
    }

    res.json({
      data: { eventId: webhookResult.eventId, status: 'PROCESSED' },
      meta: { message: 'Webhook event successfully verified and processed' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error processing webhook event' },
    });
  }
});

// ==========================================
// 9. Official GST Receipts
// ==========================================

// GET /api/v1/payments/receipts
paymentsRouter.get('/receipts', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string) || (req.headers['x-organization-id'] as string) || 'org-kota-001';
    const search = req.query.search as string | undefined;

    const receipts = await db.getReceipts(organizationId, search);

    res.json({
      data: receipts,
      meta: { count: receipts.length },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching receipts' },
    });
  }
});

// ==========================================
// 10. Financial Reconciliation
// ==========================================

// GET /api/v1/payments/reconciliation
paymentsRouter.get('/reconciliation', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string) || (req.headers['x-organization-id'] as string) || 'org-kota-001';
    const summary = await db.getReconciliation(organizationId);

    res.json({
      data: summary,
      meta: { message: 'Reconciliation summary computed' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error computing reconciliation' },
    });
  }
});

// ==========================================
// 11. Payment Reminders Automation
// ==========================================

// POST /api/v1/payments/reminders
paymentsRouter.post('/reminders', async (req: Request, res: Response) => {
  try {
    const {
      organizationId = 'org-kota-001',
      invoiceId,
      studentId,
      channel = 'WHATSAPP',
      reminderType = 'OVERDUE',
    } = req.body;

    const org = await db.getOrganizationById(organizationId);
    const invoices = await db.getInvoices(organizationId, undefined, studentId);
    const invoice = invoices.find(i => i.id === invoiceId) || invoices[0];

    const balanceRupees = ((invoice?.balanceAmountPaise || 2000000) / 100).toLocaleString('en-IN');
    const reminderMsg = `Dear Parent/Student, a fee balance of ₹${balanceRupees} for ${invoice?.studentName || 'Student'} is ${reminderType.toLowerCase()}. Kindly settle via our portal or UPI: ${(await db.getPaymentAccount(organizationId))?.upiId || 'institute@upi'}. — ${org?.tradeName || 'Institute Accounts'}`;

    // Dispatches message to communications center
    await db.createMessage({
      organizationId,
      recipientType: 'SINGLE_PARENT',
      recipientTarget: `${invoice?.studentName || 'Student'} Guardian`,
      channel: channel as any,
      title: `Fee Payment Reminder: ${invoice?.invoiceNumber || 'INV-001'}`,
      content: reminderMsg,
      status: 'SENT',
      sentBy: 'Accounts Automated Reminder',
      deliveredCount: 1,
    });

    res.json({
      data: {
        sent: true,
        channel,
        message: reminderMsg,
        invoiceNumber: invoice?.invoiceNumber,
      },
      meta: { message: `Fee reminder dispatched via ${channel}` },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error dispatching payment reminder' },
    });
  }
});
