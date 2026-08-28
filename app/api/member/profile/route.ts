import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';

const schema = z.object({
  phone: z.string().trim().min(7).optional(),
  location: z.string().trim().max(120).optional(),
  platform: z.string().trim().max(80).optional(),
  vehicleInfo: z.string().trim().max(160).optional(),
  vehicleRegistration: z.string().trim().max(40).optional(),
  emergencyName: z.string().trim().min(2).max(80),
  emergencyPhone: z.string().trim().min(7).max(40),
  emergencyRelationship: z.string().trim().min(2).max(60),
  emergency2Name: z.string().trim().max(80).optional(),
  emergency2Phone: z.string().trim().max(40).optional(),
  emergency2Relationship: z.string().trim().max(60).optional(),
  photoUrl: z.string().url().optional()
});

export async function PATCH(request: Request) {
  const portal = await getPortalMember();
  if (!portal) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  if (portal.status !== 'APPROVED') return NextResponse.json({ error: 'Your account must be approved before editing your profile.' }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid profile values.' }, { status: 400 });

  const updated = await db.member.update({ where: { id: portal.id }, data: parsed.data });
  return NextResponse.json({
    success: true,
    profile: {
      phone: updated.phone,
      location: updated.location,
      platform: updated.platform,
      vehicleInfo: updated.vehicleInfo,
      vehicleRegistration: updated.vehicleRegistration,
      emergencyName: updated.emergencyName,
      emergencyPhone: updated.emergencyPhone,
      emergencyRelationship: updated.emergencyRelationship,
      emergency2Name: updated.emergency2Name,
      emergency2Phone: updated.emergency2Phone,
      emergency2Relationship: updated.emergency2Relationship,
      photoUrl: updated.photoUrl
    }
  });
}
