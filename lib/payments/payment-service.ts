import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import type { PaymentType } from '@prisma/client';
import { getFees } from '@/lib/fees';

const PAYSTACK_SECRET_SETTING = 'paystack_secret_key';

/**
 * The Paystack secret key can be managed from the admin settings UI (stored in
 * the siteSetting table) — the environment variable is only a fallback so
 * existing deployments keep working without any migration.
 */
export async function getPaystackSecret(): Promise<string> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: PAYSTACK_SECRET_SETTING } });
    const stored = row?.value.trim();
    if (stored) return stored;
  } catch {
    // Database unavailable – fall back to the environment below.
  }
  return process.env.PAYSTACK_SECRET_KEY || '';
}

export async function paystackConfigured() {
  return Boolean(await getPaystackSecret());
}

export type InitResult = {
  authorizationUrl: string;
  reference: string;
  simulated: boolean;
};

async function paystackInit(reference: string, email: string, amountPesewas: number, metadata: Record<string, unknown>, callbackUrl: string): Promise<string> {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await getPaystackSecret()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reference,
      email,
      amount: amountPesewas,
      currency: 'GHS',
      metadata,
      callback_url: callbackUrl
    })
  });
  const result = await response.json();
  if (!response.ok || !result?.data?.authorization_url) {
    throw new Error(result?.message || 'Paystack initialization failed.');
  }
  return result.data.authorization_url as string;
}

export async function verifyWithPaystack(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${await getPaystackSecret()}` }
  });
  const result = await response.json();
  if (!response.ok || !result?.data) throw new Error('Unable to verify transaction with Paystack.');
  return result.data as { status: string; amount: number; currency: string; id: number; paid_at?: string };
}

export async function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = createHmac('sha512', await getPaystackSecret()).update(rawBody).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Creates a payment intent for a member. The server always determines the
 * amount from the database (fee snapshot) — never from the browser.
 */
export async function createPaymentIntent(memberId: string, type: PaymentType, origin: string): Promise<InitResult> {
  const member = await db.member.findUnique({ where: { id: memberId } });
  if (!member) throw new Error('Member not found.');
  const fees = await getFees();

  let amount: number;
  if (type === 'REGISTRATION_FEE') {
    if (!fees.registrationFeeEnabled) throw new Error('Registration fee is currently disabled.');
    amount = fees.registrationFeeAmount;
  } else {
    amount = fees.annualDuesAmount;
  }

  const paystackReady = await paystackConfigured();
  const reference = `GACODA-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  await db.payment.create({
    data: {
      memberId,
      type,
      amount,
      currency: 'GHS',
      reference,
      provider: paystackReady ? 'paystack' : 'simulator',
      status: 'PENDING',
      metadata: {
        memberNumber: member.memberNumber,
        paymentType: type,
        feeSnapshot: { registrationFeeEnabled: fees.registrationFeeEnabled, annualDuesAmount: fees.annualDuesAmount }
      }
    }
  });

  if (!paystackReady) {
    // Development simulator keeps the exact same server-verification flow.
    return { authorizationUrl: `${origin}/member/payments/simulate?reference=${encodeURIComponent(reference)}`, reference, simulated: true };
  }

  // Paystack redirects the browser back to our own verification endpoint, which
  // re-checks the transaction server-side before sending the user anywhere.
  const callbackUrl = `${origin}/api/payments/callback?reference=${encodeURIComponent(reference)}`;
  const authorizationUrl = await paystackInit(reference, member.email, amount, { memberId, memberNumber: member.memberNumber, paymentType: type }, callbackUrl);
  return { authorizationUrl, reference, simulated: false };
}

/**
 * Applies a verified successful payment exactly once (idempotent).
 * Extends membership only for ANNUAL_DUES payments.
 */
export async function applySuccessfulPayment(reference: string, providerTransactionId?: string) {
  const payment = await db.payment.findUnique({ where: { reference }, include: { member: true } });
  if (!payment) throw new Error('Unknown payment reference.');
  if (payment.status === 'SUCCESSFUL') return { alreadyProcessed: true, payment };

  const updated = await db.payment.update({
    where: { reference },
    data: { status: 'SUCCESSFUL', paidAt: new Date(), providerTransactionId: providerTransactionId ? String(providerTransactionId) : undefined }
  });

  if (payment.type === 'REGISTRATION_FEE') {
    await db.member.update({ where: { id: payment.memberId }, data: { registrationPayment: 'PAID' } });
  } else {
    const current = payment.member.membershipEndDate;
    const base = current && current.getTime() > Date.now() ? new Date(current) : new Date();
    const newEnd = new Date(base);
    newEnd.setFullYear(newEnd.getFullYear() + 1);
    await db.member.update({
      where: { id: payment.memberId },
      data: {
        membershipStartDate: payment.member.membershipStartDate ?? base,
        membershipEndDate: newEnd
      }
    });
  }

  return { alreadyProcessed: false, payment: updated };
}
