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

export class UPIProvider implements IPaymentProvider {
  readonly name = 'UPI_DIRECT';
  private upiId: string;
  private merchantName: string;

  constructor(upiId: string = 'coachingos@upi', merchantName: string = 'Coaching Institute') {
    this.upiId = upiId;
    this.merchantName = merchantName;
  }

  async createPaymentIntent(params: CreateIntentParams): Promise<IntentResult> {
    const amountRupees = (params.amountPaise / 100).toFixed(2);
    const invoiceRef = params.invoiceId.slice(-6);
    const transactionNote = encodeURIComponent(`Fee Inv ${invoiceRef}`);
    const encodedMerchant = encodeURIComponent(this.merchantName);

    // Standard NPCI UPI URI scheme
    const upiUri = `upi://pay?pa=${this.upiId}&pn=${encodedMerchant}&am=${amountRupees}&cu=INR&tn=${transactionNote}`;

    return {
      providerOrderId: `upi_ord_${params.invoiceId}_${Date.now()}`,
      upiUri,
      qrCodeData: upiUri,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    return {
      verified: true,
      status: 'SUCCESS',
      transactionReference: `UPI-REF-${params.providerPaymentId || Date.now()}`,
    };
  }

  async processWebhook(eventPayload: any): Promise<WebhookResult> {
    return {
      verified: true,
      eventId: eventPayload.id || `evt_upi_${Date.now()}`,
      eventType: 'upi.payment.success',
      status: 'SUCCESS',
      providerPaymentId: eventPayload.utr || `upi_${Date.now()}`,
      invoiceId: eventPayload.invoiceId,
      amountPaise: eventPayload.amountPaise,
      rawEvent: eventPayload,
    };
  }

  async processRefund(params: RefundParams): Promise<RefundResult> {
    return {
      refundId: `upi_ref_${Date.now()}`,
      status: 'SUCCESS',
    };
  }
}
