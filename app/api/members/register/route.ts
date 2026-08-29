import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { rateLimit, requestAddress } from '@/lib/rate-limit';
import { getFees } from '@/lib/fees';
import { nextMemberNumber } from '@/lib/membership';
import { MEMBER_SESSION_COOKIE, MEMBER_SESSION_MAX_AGE, createMemberSessionToken, generateToken, hashToken } from '@/lib/members-auth';
import { createPaymentIntent } from '@/lib/payments/payment-service';

// Ghana Card numbers follow the format GHC-XXXXXXXXX-X (9 digits, then a check digit).
const ghanaCardSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase().replace(/\s+/g, ''))
  .refine((value) => /^GHC-?\d{9}-?\d$/.test(value), {
    message: 'Ghana Card number must look like GHC-123456789-0.'
  })
  .transform((value) => {
    const digits = value.replace(/^GHC-?/, '').replace(/-/g, '');
    return `GHC-${digits.slice(0, 9)}-${digits.slice(9)}`;
  });

const schema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  ghanaCardNumber: ghanaCardSchema,
  password: z.string().min(8),
  dateOfBirth: z.string().trim().min(1),
  gender: z.string().trim().min(1),
  location: z.string().trim().min(2),
  platform: z.string().optional(),
  yearsExperience: z.coerce.number().int().min(0).max(80).optional(),
  vehicleInfo: z.string().optional(),
  vehicleRegistration: z.string().optional(),
  emergencyName: z.string().trim().min(2),
  emergencyPhone: z.string().trim().min(7),
  emergencyRelationship: z.string().trim().min(2),
  emergency2Name: z.string().trim().min(2),
  emergency2Phone: z.string().trim().min(7),
  emergency2Relationship: z.string().trim().min(2)
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
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const field = first?.path[0];
    // Surface format problems (e.g. the Ghana Card pattern) directly, but keep
    // the generic prompt for missing/blank required fields.
    const message = field === 'ghanaCardNumber'
      ? first.message
      : 'Please complete all required fields correctly (password must be at least 8 characters).';
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await db.member.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'This email is already registered. Please log in or reset your password.' }, { status: 409 });
  }
  const cardCollision = await db.member.findUnique({ where: { ghanaCardNumber: data.ghanaCardNumber } });
  if (cardCollision) {
    return NextResponse.json({ error: 'This Ghana Card number is already registered to another member.' }, { status: 409 });
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
      ghanaCardNumber: data.ghanaCardNumber,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender || null,
      location: data.location || null,
      platform: data.platform || null,
      yearsExperience: data.yearsExperience ?? null,
      vehicleInfo: data.vehicleInfo || null,
      vehicleRegistration: data.vehicleRegistration || null,
      emergencyName: data.emergencyName,
      emergencyPhone: data.emergencyPhone,
      emergencyRelationship: data.emergencyRelationship,
      emergency2Name: data.emergency2Name,
      emergency2Phone: data.emergency2Phone,
      emergency2Relationship: data.emergency2Relationship,
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

  // Pay-first flow: the applicant is auto-logged-in and we immediately create
  // the registration-fee payment intent so the browser can be redirected to
  // Paystack right after "Submit Application". The application only reaches
  // the admin panel once the fee is settled (webhook / callback verification).
  // If Paystack initialization fails we still keep the draft application and
  // tell the client to retry payment from the portal — no data is lost.
  let authorizationUrl: string | undefined;
  let paymentReference: string | undefined;
  let paymentStartError: string | undefined;
  if (fees.registrationFeeEnabled) {
    try {
      const intent = await createPaymentIntent(member.id, 'REGISTRATION_FEE', origin);
      authorizationUrl = intent.authorizationUrl;
      paymentReference = intent.reference;
    } catch (error) {
      paymentStartError = error instanceof Error ? error.message : 'Unable to start the payment.';
    }
  }

  const response = NextResponse.json({
    success: true,
    memberNumber: member.memberNumber,
    registrationFeeRequired: fees.registrationFeeEnabled,
    registrationFeeAmount: fees.registrationFeeEnabled ? fees.registrationFeeAmount : 0,
    authorizationUrl,
    paymentReference,
    paymentStartError,
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
