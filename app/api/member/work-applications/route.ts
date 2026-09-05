import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireApprovedMember } from '@/lib/members-auth';
import { rateLimit } from '@/lib/rate-limit';
import { EMPLOYMENT_TYPES } from '@/lib/work-applications';

const createSchema = z.object({
  position: z.string().trim().min(2).max(120),
  employmentType: z.enum(EMPLOYMENT_TYPES).default('FULL_TIME'),
  contactPhone: z.string().trim().min(7).max(20).optional(),
  region: z.string().trim().max(80).optional(),
  licenceClass: z.string().trim().max(40).optional(),
  licenceNumber: z.string().trim().max(60).optional(),
  licenceExpiry: z.string().datetime({ offset: true }).optional().nullable(),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  platforms: z.string().trim().max(200).optional(),
  cvUrl: z.string().trim().max(500).optional(),
  coverNote: z.string().trim().max(2000).optional(),
  consent: z.literal(true)
});

export async function GET() {
  const member = await requireApprovedMember();
  if (!member) return NextResponse.json({ error: 'Approved member session required.' }, { status: 401 });

  const applications = await db.workApplication.findMany({
    where: { memberId: member.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, position: true, employmentType: true, region: true, status: true,
      paymentState: true, createdAt: true, updatedAt: true, cvUrl: true
    }
  });
  return NextResponse.json({ applications });
}

export async function POST(request: Request) {
  const member = await requireApprovedMember();
  if (!member) return NextResponse.json({ error: 'Only approved members can apply for work. Sign in and get approved first.' }, { status: 401 });

  const limit = rateLimit(`work-app:${member.id}`, 5);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many applications submitted. Please wait a moment.' }, { status: 429 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Please complete all required fields.' }, { status: 400 });
  }

  const data = parsed.data;

  // Prevent duplicate open applications for the same position.
  const existing = await db.workApplication.findFirst({
    where: {
      memberId: member.id,
      position: { equals: data.position, mode: 'insensitive' },
      status: { in: ['NEW', 'REVIEWING', 'INTERVIEW'] }
    }
  });
  if (existing) return NextResponse.json({ error: 'You already have an open application for this position.' }, { status: 409 });

  const application = await db.workApplication.create({
    data: {
      memberId: member.id,
      position: data.position,
      employmentType: data.employmentType,
      // Prefer the phone the member typed on the form; fall back to the
      // number on their profile so recruiters always have a contact line.
      contactPhone: data.contactPhone || member.phone,
      region: data.region || null,
      licenceClass: data.licenceClass || null,
      licenceNumber: data.licenceNumber || null,
      licenceExpiry: data.licenceExpiry ? new Date(data.licenceExpiry) : null,
      experienceYears: data.experienceYears ?? null,
      platforms: data.platforms || null,
      cvUrl: data.cvUrl || null,
      coverNote: data.coverNote || null,
      consent: true,
      // Applications are free — every submission goes straight to recruiters.
      paymentState: 'NOT_REQUIRED'
    },
    select: { id: true, position: true, paymentState: true, createdAt: true }
  });

  await db.auditLog.create({ data: { action: 'CREATE', entity: 'work_application', entityId: application.id, metadata: { memberId: member.id } } });
  return NextResponse.json({ application }, { status: 201 });
}
