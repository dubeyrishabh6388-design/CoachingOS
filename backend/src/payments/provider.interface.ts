export interface CreateIntentParams {
  organizationId: string;
  invoiceId: string;
  studentId: string;
  amountPaise: number;
  currency?: string;
  customerInfo?: {
    name: string;
    phone: string;
    email?: string;
  };
  metadata?: Record<string, any>;
}

export interface IntentResult {
  providerOrderId: string;
  clientSecret?: string;
  paymentUrl?: string;
  upiUri?: string;
  qrCodeData?: string;
  expiresAt?: string;
}

export interface VerifyPaymentParams {
  providerPaymentId: string;
  providerOrderId?: string;
  signature?: string;
  rawPayload?: any;
}

export interface VerifyPaymentResult {
  verified: boolean;
  status: 'SUCCESS' | 'FAILED';
  amountPaise?: number;
  transactionReference?: string;
  errorMessage?: string;
}

export interface WebhookResult {
  verified: boolean;
  eventId: string;
  eventType: string;
  status: 'SUCCESS' | 'FAILED';
  providerPaymentId: string;
  invoiceId?: string;
  amountPaise?: number;
  rawEvent?: any;
}

export interface RefundParams {
  providerPaymentId: string;
  amountPaise: number;
  reason: string;
}

export interface RefundResult {
  refundId: string;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

export interface IPaymentProvider {
  readonly name: string;
  createPaymentIntent(params: CreateIntentParams): Promise<IntentResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
  processWebhook(eventPayload: any, signature?: string): Promise<WebhookResult>;
  processRefund(params: RefundParams): Promise<RefundResult>;
}
