import { NextResponse } from 'next/server';
import { processVerifiedPayment } from '@/lib/payment-processor';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  if (!reference) {
    return NextResponse.redirect(`${origin}/membership?error=missing_reference`);
  }

  const result = await processVerifiedPayment(reference);

  if (!result.success) {
    return NextResponse.redirect(`${origin}/membership?error=${encodeURIComponent(result.error || 'Payment failed')}`);
  }

  if (result.type === 'REGISTRATION_FEE') {
    return NextResponse.redirect(`${origin}/member/dashboard?payment=success&type=registration`);
  }

  if (result.type === 'ANNUAL_DUES') {
    return NextResponse.redirect(`${origin}/member/dashboard?payment=success&type=dues`);
  }

  if (result.type === 'WORK_PAY_INSTALLMENT' || result.type === 'WORK_PAY_DEPOSIT') {
    return NextResponse.redirect(`${origin}/member/work-and-pay/payments?payment=success&ref=${encodeURIComponent(reference)}`);
  }

  return NextResponse.redirect(`${origin}/member/dashboard?payment=success`);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reference = body.reference;
    if (!reference) {
      return NextResponse.json({ error: 'Transaction reference is required.' }, { status: 400 });
    }

    const result = await processVerifiedPayment(reference);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Verification failed.' }, { status: 400 });
    }

    return NextResponse.json({ ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment verification failed.' }, { status: 500 });
  }
}
