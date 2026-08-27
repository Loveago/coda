import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import { createPaymentIntent } from '@/lib/payments/payment-service';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({ type: z.enum(['REGISTRATION_FEE', 'ANNUAL_DUES']) });

export async function POST(request: Request) {
  const member = await getPortalMember();
  if (!member) return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 });

  const limit = rateLimit(`pay-init:${member.id}`, 6);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many payment attempts. Please wait a moment.' }, { status: 429 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payment type.' }, { status: 400 });

  if (parsed.data.type === 'ANNUAL_DUES' && member.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Annual dues can only be paid by approved members.' }, { status: 403 });
  }

  try {
    const origin = new URL(request.url).origin;
    const result = await createPaymentIntent(member.id, parsed.data.type, origin);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to start this payment.' }, { status: 400 });
  }
}
