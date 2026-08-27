import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { rateLimit, requestAddress } from '@/lib/rate-limit';
import { getFees } from '@/lib/fees';
import { nextMemberNumber } from '@/lib/membership';
import { MEMBER_SESSION_COOKIE, MEMBER_SESSION_MAX_AGE, createMemberSessionToken, generateToken, hashToken } from '@/lib/members-auth';

const schema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  password: z.string().min(8),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  location: z.string().optional(),
  platform: z.string().optional(),
  yearsExperience: z.coerce.number().int().min(0).max(80).optional(),
  vehicleInfo: z.string().optional(),
  vehicleRegistration: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelationship: z.string().optional()
});

export async function POST(request: Request) {
  const limit = rateLimit(`register:${requestAddress(request)}`, 5);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please complete all required fields correctly (password must be at least 8 characters).' }, { status: 400 });
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await db.member.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'This email is already registered. Please log in or reset your password.' }, { status: 409 });
  }
  const adminCollision = await db.user.findUnique({ where: { email } });
  if (adminCollision) {
    return NextResponse.json({ error: 'This email is already registered. Please log in or reset your password.' }, { status: 409 });
  }

  const fees = await getFees();
  const member = await db.member.create({
    data: {
      memberNumber: await nextMemberNumber(),
      email,
      passwordHash: await hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender || null,
      location: data.location || null,
      platform: data.platform || null,
      yearsExperience: data.yearsExperience ?? null,
      vehicleInfo: data.vehicleInfo || null,
      vehicleRegistration: data.vehicleRegistration || null,
      emergencyName: data.emergencyName || null,
      emergencyPhone: data.emergencyPhone || null,
      emergencyRelationship: data.emergencyRelationship || null,
      status: 'PENDING',
      registrationPayment: fees.registrationFeeEnabled ? 'PENDING' : 'NOT_REQUIRED'
    }
  });

  const token = generateToken();
  await db.memberToken.create({
    data: { memberId: member.id, tokenHash: hashToken(token), type: 'EMAIL_VERIFICATION', expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48) }
  });

  // Email delivery is provider-abstracted; without SMTP configured we surface
  // the verification link directly so the flow remains testable.
  const origin = new URL(request.url).origin;
  const devVerifyUrl = `${origin}/verify-email?token=${token}`;

  // Auto-login the applicant so they can immediately pay the registration fee
  // (when enabled) from the member portal. The application only reaches the
  // admin panel once the fee is settled.
  const response = NextResponse.json({
    success: true,
    memberNumber: member.memberNumber,
    registrationFeeRequired: fees.registrationFeeEnabled,
    registrationFeeAmount: fees.registrationFeeEnabled ? fees.registrationFeeAmount : 0,
    devVerifyUrl: process.env.SMTP_URL ? undefined : devVerifyUrl
  }, { status: 201 });
  response.cookies.set(MEMBER_SESSION_COOKIE, createMemberSessionToken(member.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MEMBER_SESSION_MAX_AGE
  });
  return response;
}
