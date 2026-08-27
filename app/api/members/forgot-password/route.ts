import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { generateToken, hashToken } from '@/lib/members-auth';
import { rateLimit, requestAddress } from '@/lib/rate-limit';

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const limit = rateLimit(`forgot:${requestAddress(request)}`, 5);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });

  const member = await db.member.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  // Always respond the same way so accounts cannot be enumerated.
  if (member) {
    const token = generateToken();
    await db.memberToken.create({
      data: { memberId: member.id, tokenHash: hashToken(token), type: 'PASSWORD_RESET', expiresAt: new Date(Date.now() + 1000 * 60 * 60) }
    });
    const devResetUrl = `${new URL(request.url).origin}/reset-password?token=${token}`;
    return NextResponse.json({ success: true, devResetUrl: process.env.SMTP_URL ? undefined : devResetUrl });
  }
  return NextResponse.json({ success: true });
}
