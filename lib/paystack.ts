import crypto from 'crypto';

export interface PaystackInitializeOptions {
  email: string;
  amountInPesewas: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
  channels?: ('card' | 'mobile_money')[];
}

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number; // in pesewas
    currency: string;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    paid_at: string | null;
    channel: 'card' | 'mobile_money';
    authorization?: {
      channel: string;
      card_type?: string;
      bank?: string;
      mobile_money_provider?: string;
    };
    customer: {
      id: number;
      email: string;
      phone?: string;
    };
    metadata?: Record<string, any>;
  };
}

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

export function isPaystackConfigured(): boolean {
  return Boolean(PAYSTACK_SECRET && PAYSTACK_SECRET.startsWith('sk_'));
}

export function generatePaymentReference(prefix: 'REG' | 'DUES' | 'WP-PAY' | 'WP-DEP' | 'GEN' = 'GEN'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `MTA-${prefix}-${timestamp}-${random}`;
}

/**
 * Initialize a Paystack transaction.
 * If PAYSTACK_SECRET_KEY is not configured or in simulated dev mode,
 * returns a simulated authorization URL pointing to the local callback.
 */
// Global memory store for development simulation mode
const globalForPaystack = globalThis as unknown as {
  simulatedTransactions?: Map<string, { amountInPesewas: number; metadata?: Record<string, any> }>;
};
const simulatedTransactions = globalForPaystack.simulatedTransactions ?? new Map();
if (process.env.NODE_ENV !== 'production') globalForPaystack.simulatedTransactions = simulatedTransactions;

export async function initializePaystackPayment(options: PaystackInitializeOptions): Promise<PaystackInitResponse> {
  const { email, amountInPesewas, reference, callbackUrl, metadata, channels = ['card', 'mobile_money'] } = options;

  // Track in simulated transactions store
  simulatedTransactions.set(reference, { amountInPesewas, metadata });

  if (isPaystackConfigured()) {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amountInPesewas),
          reference,
          callback_url: callbackUrl,
          metadata,
          channels
        })
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        throw new Error(data.message || 'Failed to initialize Paystack payment.');
      }

      return {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference
      };
    } catch (err: any) {
      console.error('Paystack initialization error:', err);
      throw err;
    }
  }

  // Development simulation mode when no live API key is set
  const simulatedCallback = callbackUrl || '/api/payments/paystack/verify';
  const url = new URL(simulatedCallback, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  url.searchParams.set('reference', reference);
  url.searchParams.set('simulated', 'true');

  return {
    authorization_url: url.toString(),
    access_code: `mock_code_${reference}`,
    reference
  };
}

/**
 * Verify a Paystack transaction by reference.
 */
export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResponse> {
  if (isPaystackConfigured()) {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`
      }
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return {
        status: false,
        message: data.message || 'Transaction verification failed.',
        data: {
          id: 0,
          reference,
          amount: 0,
          currency: 'GHS',
          status: 'failed',
          paid_at: null,
          channel: 'mobile_money',
          customer: { id: 0, email: '' }
        }
      };
    }

    return data;
  }

  // Simulated successful payment in development mode
  const stored = simulatedTransactions.get(reference);
  const isWpPay = reference.includes('-WP-PAY-');
  const isWpDep = reference.includes('-WP-DEP-');
  const isDues = reference.includes('-DUES-');

  let defaultAmount = 2000;
  let inferredType = 'REGISTRATION_FEE';
  if (isWpPay) {
    defaultAmount = 80000;
    inferredType = 'WORK_PAY_INSTALLMENT';
  } else if (isWpDep) {
    defaultAmount = 500000;
    inferredType = 'WORK_PAY_DEPOSIT';
  } else if (isDues) {
    defaultAmount = 20000;
    inferredType = 'ANNUAL_DUES';
  }

  const effectiveAmount = stored?.amountInPesewas || defaultAmount;
  const effectiveMetadata = stored?.metadata || { paymentType: inferredType };

  return {
    status: true,
    message: 'Simulation verified successfully',
    data: {
      id: Math.floor(Math.random() * 1000000),
      reference,
      amount: effectiveAmount,
      currency: 'GHS',
      status: 'success',
      paid_at: new Date().toISOString(),
      channel: 'mobile_money',
      authorization: {
        channel: 'mobile_money',
        mobile_money_provider: 'MTN Mobile Money'
      },
      customer: {
        id: 12345,
        email: 'driver@demo.mrtruthagency.com'
      },
      metadata: effectiveMetadata
    }
  };
}

/**
 * Verify Paystack webhook signature header.
 */
export function verifyPaystackSignature(payloadString: string, signature: string | null): boolean {
  if (!PAYSTACK_SECRET || !signature) return false;
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(payloadString).digest('hex');
  return hash === signature;
}
