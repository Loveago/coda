import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { applySuccessfulPayment, verifyWebhookSignature, verifyWithPaystack } from '@/lib/payments/payment-service';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!(await verifyWebhookSignature(rawBody, signature))) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string; id?: number; status?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  if (event.event !== 'charge.success' || !event.data?.reference) {
    return NextResponse.json({ received: true });
  }

  const payment = await db.payment.findUnique({ where: { reference: event.data.reference } });
  if (!payment) return NextResponse.json({ received: true });

  // Idempotency: a SUCCESSFUL payment is never reprocessed.
  if (payment.status === 'SUCCESSFUL') return NextResponse.json({ received: true, alreadyProcessed: true });

  // Re-verify with Paystack before trusting the webhook payload.
  try {
    const verified = await verifyWithPaystack(payment.reference);
    if (verified.status === 'success' && verified.amount === payment.amount && verified.currency === payment.currency) {
      await applySuccessfulPayment(payment.reference, String(verified.id));
    } else {
      await db.payment.update({ where: { reference: payment.reference }, data: { status: 'FAILED' } });
    }
  } catch {
    return NextResponse.json({ error: 'Verification failed.' }, { status: 502 });
  }

  return NextResponse.json({ received: true });
}
