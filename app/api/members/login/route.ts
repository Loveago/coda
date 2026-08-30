import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { MEMBER_SESSION_COOKIE, MEMBER_SESSION_MAX_AGE, createMemberSessionToken } from '@/lib/members-auth';
import { syncDemoMemberFromEnv } from '@/lib/credentials';
import { rateLimit, requestAddress } from '@/lib/rate-limit';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  const limit = rateLimit(`member-login:${requestAddress(request)}`, 8);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many login attempts. Please wait a moment.' }, { status: 429 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });

  try { await syncDemoMemberFromEnv(); } catch { /* env sync is best-effort */ }

  let member = null;
  try {
    member = await db.member.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  } catch {
    return NextResponse.json({ error: 'The service is waking up — please try again in a few seconds.' }, { status: 503 });
  }
  if (!member || !(await verifyPassword(parsed.data.password, member.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  // PENDING applicants are allowed in so they can complete the registration
  // fee payment; the portal gates everything else until an admin approves.
  if (member.status === 'REJECTED') {
    return NextResponse.json({ error: 'Your application was not approved. Please contact the Mr Truth team.' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true, suspended: member.status === 'SUSPENDED' });
  response.cookies.set(MEMBER_SESSION_COOKIE, createMemberSessionToken(member.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MEMBER_SESSION_MAX_AGE
  });
  return response;
}
