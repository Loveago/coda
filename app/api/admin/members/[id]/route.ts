import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/members/[id] — administrative member actions.
 *
 *   { action: 'SUSPEND' | 'REINSTATE' }      Toggle member status.
 *   { action: 'VERIFY_EMAIL' }               Confirm the member's email address.
 *   { action: 'DELETE' }                     Permanently remove the member and
 *                                            their payment/token history.
 *
 * Membership is free, so the old renewal / registration-fee actions are gone.
 */

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('SUSPEND') }),
  z.object({ action: z.literal('REINSTATE') }),
  z.object({ action: z.literal('VERIFY_EMAIL') }),
  z.object({ action: z.literal('DELETE') })
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });

  const id = z.string().uuid().safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: 'A valid member id is required.' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Unknown member action.' }, { status: 400 });
  const input = parsed.data;

  const member = await db.member.findUnique({ where: { id: id.data } });
  if (!member) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });

  if (input.action === 'SUSPEND' || input.action === 'REINSTATE') {
    if (member.status === 'PENDING') return NextResponse.json({ error: 'Pending applications are handled from the Applications page.' }, { status: 409 });
    const status = input.action === 'SUSPEND' ? 'SUSPENDED' : 'APPROVED';
    await db.member.update({ where: { id: member.id }, data: { status } });
    await db.auditLog.create({ data: { userId: user.id, action: 'UPDATE', entity: 'members', entityId: member.id, metadata: { status, memberNumber: member.memberNumber } } });
    return NextResponse.json({ success: true, status });
  }

  if (input.action === 'VERIFY_EMAIL') {
    await db.member.update({ where: { id: member.id }, data: { emailVerified: true } });
    await db.auditLog.create({ data: { userId: user.id, action: 'UPDATE', entity: 'members', entityId: member.id, metadata: { emailVerified: true, memberNumber: member.memberNumber } } });
    return NextResponse.json({ success: true });
  }

  // DELETE — remove the member and everything that hangs off them. A snapshot
  // is kept in the audit log so the deletion remains traceable.
  await db.$transaction(async (tx) => {
    await tx.memberToken.deleteMany({ where: { memberId: member.id } });
    await tx.payment.deleteMany({ where: { memberId: member.id } });
    await tx.member.delete({ where: { id: member.id } });
  });
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'DELETE',
      entity: 'members',
      entityId: member.id,
      metadata: {
        memberNumber: member.memberNumber,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        status: member.status,
        deletedBy: user.name
      }
    }
  });
  return NextResponse.json({ success: true });
}
