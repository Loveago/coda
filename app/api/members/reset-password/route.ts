import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { hashToken } from '@/lib/members-auth';
import { rateLimit, requestAddress } from '@/lib/rate-limit';

const schema = z.object({ token: z.string().min(10), password: z.string().min(8) });

export async function POST(request: Request) {
  const limit = rateLimit(`reset:${requestAddress(request)}`, 6);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

  const record = await db.memberToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!record || record.type !== 'PASSWORD_RESET' || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired. Please request a new one.' }, { status: 400 });
  }

  await db.$transaction([
    db.member.update({ where: { id: record.memberId }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    db.memberToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
  ]);

  return NextResponse.json({ success: true });
}
