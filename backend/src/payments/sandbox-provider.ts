import crypto from 'crypto';
import {
  IPaymentProvider,
  CreateIntentParams,
  IntentResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  WebhookResult,
  RefundParams,
  RefundResult,
} from './provider.interface.js';

export class SandboxGatewayProvider implements IPaymentProvider {
  readonly name = 'SANDBOX';
  private secretKey: string;

  constructor(secretKey: string = 'sandbox_secret_key_coachingos') {
    this.secretKey = secretKey;
  }

  async createPaymentIntent(params: CreateIntentParams): Promise<IntentResult> {
    const timestamp = Date.now();
    const providerOrderId = `sbx_ord_${params.invoiceId.replace(/[^a-zA-Z0-9]/g, '')}_${timestamp}`;
    const clientSecret = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${providerOrderId}|${params.amountPaise}`)
      .digest('hex');

    return {
      providerOrderId,
      clientSecret,
      paymentUrl: `https://checkout.sandbox.coachingos.internal/pay/${providerOrderId}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    // In sandbox, payment IDs starting with 'sbx_pay_' or valid signatures pass
    if (!params.providerPaymentId) {
      return { verified: false, status: 'FAILED', errorMessage: 'Missing payment ID' };
    }

    // Fail intentionally if payment ID contains 'fail'
    if (params.providerPaymentId.includes('fail')) {
      return {
        verified: true,
        status: 'FAILED',
        errorMessage: 'Payment declined by issuing bank (Sandbox simulation)',
      };
    }

    // Signature verification if provided
    if (params.signature && params.providerOrderId) {
      const expected = crypto
        .createHmac('sha256', this.secretKey)
        .update(`${params.providerOrderId}|${params.providerPaymentId}`)
        .digest('hex');

      if (params.signature !== expected && params.signature !== 'test_signature_valid') {
        return { verified: false, status: 'FAILED', errorMessage: 'Signature mismatch' };
      }
    }

    return {
      verified: true,
      status: 'SUCCESS',
      transactionReference: `TXN-SBX-${params.providerPaymentId.slice(-8).toUpperCase()}`,
    };
  }

  async processWebhook(eventPayload: any, signature?: string): Promise<WebhookResult> {
    const eventId = eventPayload.id || `evt_${Date.now()}`;
    const eventType = eventPayload.type || 'payment.captured';
    const paymentData = eventPayload.data?.object || eventPayload;

    return {
      verified: true,
      eventId,
      eventType,
      status: eventType.includes('failed') ? 'FAILED' : 'SUCCESS',
      providerPaymentId: paymentData.payment_id || paymentData.id || `pay_${Date.now()}`,
      invoiceId: paymentData.invoice_id || paymentData.notes?.invoiceId,
      amountPaise: paymentData.amount || paymentData.amount_paise,
      rawEvent: eventPayload,
    };
  }

  async processRefund(params: RefundParams): Promise<RefundResult> {
    const refundId = `sbx_ref_${Date.now()}`;
    return {
      refundId,
      status: 'SUCCESS',
    };
  }
}
