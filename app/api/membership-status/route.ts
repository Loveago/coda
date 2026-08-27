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

  const application = await db.membershipApplication.findFirst({
    where: isEmail
      ? { email: { equals: query.toLowerCase() } }
      : { phone: query.replace(/[\s-]/g, '') },
    orderBy: { createdAt: 'desc' },
    select: { fullName: true, status: true, createdAt: true }
  });

  if (!application) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    status: application.status,
    name: maskName(application.fullName),
    submittedAt: application.createdAt.toISOString()
  });
}
