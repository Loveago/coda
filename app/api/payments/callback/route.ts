import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { applySuccessfulPayment, paystackConfigured, verifyWithPaystack } from '@/lib/payments/payment-service';

export const dynamic = 'force-dynamic';

/**
 * Paystack returns the browser here after checkout. The browser is never
 * trusted: we re-verify the transaction against the Paystack API server-side
 * before recording anything, then redirect to the portal with an outcome flag.
 *
 * Fallback behaviour is deliberately forgiving — if verification cannot be
 * completed (network hiccup, Paystack latency, user closed the tab early) we
 * send the member back to the dashboard where pending payments are reconciled
 * automatically on load. The webhook remains the authoritative safety net.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference')?.trim();
  const origin = url.origin;

  // A dashboard return is always the safe destination.
  const back = (status: string, target = '/member/dashboard') => NextResponse.redirect(`${origin}${target}?payment=${status}`);

  if (!reference) return back('missing');

  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment) return back('missing');

  // Work application fees return to the Work & Pay page so the member sees
  // their application flip to "submitted" right after checkout.
  const home = payment.type === 'WORK_APPLICATION_FEE' ? '/member/work' : '/member/dashboard';

  // Already settled — nothing to do, just send the member to their portal.
  if (payment.status === 'SUCCESSFUL') {
    return NextResponse.redirect(`${origin}${home}?payment=success`);
  }

  // Simulator payments have no Paystack record to verify against; the
  // simulate page handles those explicitly.
  if (payment.provider !== 'paystack' || !(await paystackConfigured())) {
    return NextResponse.redirect(`${origin}/member/payments/simulate?reference=${encodeURIComponent(reference)}`);
  }

  try {
    const verified = await verifyWithPaystack(reference);

    if (verified.status === 'success') {
      if (verified.amount !== payment.amount || verified.currency !== payment.currency) {
        // Amount mismatch is a hard stop — never credit a transaction we
        // cannot reconcile with our own record.
        return back('mismatch');
      }
      await applySuccessfulPayment(reference, String(verified.id));
      return NextResponse.redirect(`${origin}${home}?payment=success`);
    }

    if (verified.status === 'failed' || verified.status === 'abandoned' || verified.status === 'invalid') {
      await db.payment.update({ where: { reference }, data: { status: 'FAILED' } });
      return back('failed');
    }

    // 'open' / 'pending' — the charge may still be processing. Leave the
    // payment PENDING so the dashboard reconciliation (or the webhook) can
    // finalise it shortly.
    return back('pending');
  } catch {
    // Paystack unreachable — do not mark anything failed.
    return back('pending');
  }
}
