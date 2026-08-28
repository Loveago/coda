import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit, requestAddress } from '@/lib/rate-limit';

const querySchema = z.object({
  query: z.string().trim().min(3).max(120)
});

function maskName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts.map((part, index) => (index === 0 ? part : `${part[0]}.`)).join(' ');
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export async function POST(request: Request) {
  const limit = rateLimit(`membership-status:${requestAddress(request)}`, 10);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many lookups. Please try again shortly.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = querySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid phone number or email address.' }, { status: 400 });
  }

  const query = parsed.data.query;
  const isEmail = query.includes('@');

  // Applications now live in the Member table (created via the registration
  // form). Phone numbers are stored as typed, so compare digits only.
  const application = isEmail
    ? await db.member.findFirst({
        where: { email: { equals: query.toLowerCase() } },
        orderBy: { createdAt: 'desc' },
        select: { firstName: true, lastName: true, status: true, registrationPayment: true, createdAt: true }
      })
    : (await db.member.findMany({
        orderBy: { createdAt: 'desc' },
        select: { firstName: true, lastName: true, phone: true, status: true, registrationPayment: true, createdAt: true }
      })).find((member) => digitsOnly(member.phone) === digitsOnly(query)) ?? null;

  if (!application) {
    return NextResponse.json({ found: false });
  }

  // Pay-first flow: while the registration fee is outstanding the application
  // has not actually reached the admin panel yet, so report that explicitly.
  const status =
    application.status === 'PENDING' && application.registrationPayment === 'PENDING'
      ? 'AWAITING_PAYMENT'
      : application.status;

  return NextResponse.json({
    found: true,
    status,
    name: maskName(`${application.firstName} ${application.lastName}`),
    submittedAt: application.createdAt.toISOString()
  });
}
