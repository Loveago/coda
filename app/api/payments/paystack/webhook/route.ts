import { NextResponse } from 'next/server';
import { verifyPaystackSignature } from '@/lib/paystack';
import { processVerifiedPayment } from '@/lib/payment-processor';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // Verify webhook signature if secret key is present
    if (process.env.PAYSTACK_SECRET_KEY && !verifyPaystackSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid Paystack signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const reference = payload.data?.reference;

    if (event === 'charge.success' && reference) {
      const result = await processVerifiedPayment(reference);
      return NextResponse.json({ received: true, ...result });
    }

    return NextResponse.json({ received: true, ignored: true });
  } catch (error: any) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
