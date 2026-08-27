import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashToken } from '@/lib/members-auth';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/verify-email?state=invalid', request.url));

  const record = await db.memberToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.type !== 'EMAIL_VERIFICATION' || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/verify-email?state=invalid', request.url));
  }

  await db.$transaction([
    db.member.update({ where: { id: record.memberId }, data: { emailVerified: true } }),
    db.memberToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
  ]);

  return NextResponse.redirect(new URL('/verify-email?state=success', request.url));
}
