import { db } from '../db/store.js';
import { IPaymentProvider } from './provider.interface.js';
import { SandboxGatewayProvider } from './sandbox-provider.js';
import { UPIProvider } from './upi-provider.js';
import { Payment, PaymentAccount, PaymentMethod } from '../types.js';

export class PaymentService {
  private static sandboxProvider = new SandboxGatewayProvider();

  /**
   * Resolves the institute-specific payment account and configured provider
   */
  static async getInstitutePaymentContext(organizationId: string): Promise<{
    account: PaymentAccount;
    provider: IPaymentProvider;
  }> {
    const account = await db.getPaymentAccount(organizationId);
    if (!account) {
      throw new Error(`Payment account not configured for organization ${organizationId}`);
    }

    if (account.gatewayProvider === 'SANDBOX' || account.testMode) {
      return { account, provider: this.sandboxProvider };
    }

    // Default fallback to Sandbox provider in development
    return { account, provider: this.sandboxProvider };
  }

  /**
   * Generates dynamic UPI Intent & QR parameters using the institute's custom VPA
   */
  static async generateUPIIntent(organizationId: string, invoiceId: string, studentId: string, amountPaise: number) {
    const { account } = await this.getInstitutePaymentContext(organizationId);
    if (!account.upiEnabled) {
      throw new Error(`UPI payments are currently disabled by ${account.upiMerchantName}`);
    }

    const upiProvider = new UPIProvider(account.upiId, account.upiMerchantName);
    const intent = await upiProvider.createPaymentIntent({
      organizationId,
      invoiceId,
      studentId,
      amountPaise,
    });

    return {
      ...intent,
      merchantName: account.upiMerchantName,
      upiId: account.upiId,
      amountRupees: (amountPaise / 100).toFixed(2),
    };
  }

  /**
   * Creates an online gateway checkout intent
   */
  static async createGatewayIntent(organizationId: string, invoiceId: string, studentId: string, amountPaise: number) {
    const { account, provider } = await this.getInstitutePaymentContext(organizationId);
    if (!account.gatewayEnabled) {
      throw new Error(`Online gateway is currently disabled by ${account.upiMerchantName}`);
    }

    const intent = await provider.createPaymentIntent({
      organizationId,
      invoiceId,
      studentId,
      amountPaise,
    });

    return {
      ...intent,
      keyId: account.gatewayKeyId || 'rzp_test_default',
      testMode: account.testMode,
    };
  }

  /**
   * Server-side verification of payment with provider and atomic settlement in MySQL
   */
  static async verifyAndCapturePayment(params: {
    organizationId: string;
    branchId?: string;
    invoiceId: string;
    studentId: string;
    amountPaise: number;
    paymentMethod: PaymentMethod;
    providerPaymentId: string;
    providerOrderId?: string;
    signature?: string;
    idempotencyKey?: string;
  }): Promise<Payment> {
    const { provider } = await this.getInstitutePaymentContext(params.organizationId);

    // 1. Verify with provider
    const verification = await provider.verifyPayment({
      providerPaymentId: params.providerPaymentId,
      providerOrderId: params.providerOrderId,
      signature: params.signature,
    });

    if (!verification.verified || verification.status !== 'SUCCESS') {
      throw new Error(verification.errorMessage || 'Provider verification failed');
    }

    // 2. Settle payment atomically into institute ledger
    const payment = await db.recordPayment({
      organizationId: params.organizationId,
      branchId: params.branchId || 'br-main',
      invoiceId: params.invoiceId,
      studentId: params.studentId,
      amountPaise: params.amountPaise,
      paymentMethod: params.paymentMethod,
      channel: 'STUDENT_PORTAL',
      provider: params.paymentMethod === 'UPI' ? 'UPI_DIRECT' : 'SANDBOX',
      providerPaymentId: params.providerPaymentId,
      providerOrderId: params.providerOrderId,
      idempotencyKey: params.idempotencyKey,
      status: 'SUCCESS',
      notes: `Verified by ${provider.name} gateway. Ref: ${verification.transactionReference || params.providerPaymentId}`,
    });

    return payment;
  }
}
