import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import { applySuccessfulPayment, paystackConfigured, verifyWithPaystack } from '@/lib/payments/payment-service';

/**
 * Server-side verification. The browser never decides the outcome — for real
 * Paystack transactions we re-verify against the Paystack API; simulator
 * payments are confirmed through the same applySuccessfulPayment path used by
 * the webhook.
 */
export async function POST(request: Request) {
  const member = await getPortalMember();
  if (!member) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });

  const reference = new URL(request.url).searchParams.get('reference');
  if (!reference) return NextResponse.json({ error: 'Payment reference is required.' }, { status: 400 });

  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment || payment.memberId !== member.id) {
    return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
  }
  if (payment.status === 'SUCCESSFUL') {
    return NextResponse.json({ success: true, alreadyProcessed: true });
  }

  try {
    if ((await paystackConfigured()) && payment.provider === 'paystack') {
      const verified = await verifyWithPaystack(reference);
      if (verified.status !== 'success') {
        await db.payment.update({ where: { reference }, data: { status: 'FAILED' } });
        return NextResponse.json({ success: false, status: verified.status });
      }
      if (verified.amount !== payment.amount || verified.currency !== payment.currency) {
        return NextResponse.json({ error: 'Payment amount mismatch — contact support.' }, { status: 400 });
      }
      await applySuccessfulPayment(reference, String(verified.id));
    } else {
      // Simulator driver (no Paystack keys configured).
      await applySuccessfulPayment(reference);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Verification failed.' }, { status: 400 });
  }
}
