import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getFees } from '@/lib/fees';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/members/[id] — administrative member actions.
 *
 *   { action: 'RENEW', months?, note? }      Record an off-platform annual-dues
 *                                            payment (cash/MoMo) and extend the
 *                                            membership year accordingly.
 *   { action: 'MARK_REGISTRATION_PAID' }     Settle the registration fee manually.
 *   { action: 'SUSPEND' | 'REINSTATE' }      Toggle member status.
 *   { action: 'VERIFY_EMAIL' }               Confirm the member's email address.
 *   { action: 'DELETE' }                     Permanently remove the member and
 *                                            their payment/token history.
 */

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('RENEW'), months: z.number().int().min(1).max(36).optional(), note: z.string().trim().max(500).optional() }),
  z.object({ action: z.literal('MARK_REGISTRATION_PAID') }),
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

  if (input.action === 'RENEW') {
    if (member.status !== 'APPROVED') return NextResponse.json({ error: 'Only approved members can be renewed.' }, { status: 409 });
    const fees = await getFees();
    const months = input.months ?? 12;
    // Renewals stack: extend from the later of "now" and the current expiry.
    const base = member.membershipEndDate && member.membershipEndDate.getTime() > Date.now() ? new Date(member.membershipEndDate) : new Date();
    const end = new Date(base);
    end.setMonth(end.getMonth() + months);

    const reference = `GACODA-ANNUAL_DUES-MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const result = await db.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          memberId: member.id,
          type: 'ANNUAL_DUES',
          amount: fees.annualDuesAmount,
          currency: 'GHS',
          reference,
          provider: 'manual',
          status: 'SUCCESSFUL',
          paidAt: new Date(),
          metadata: { recordedBy: user.name, months, note: input.note ?? null, manual: true }
        }
      });
      const updated = await tx.member.update({
        where: { id: member.id },
        data: { membershipStartDate: member.membershipStartDate ?? base, membershipEndDate: end }
      });
      return { payment, updated };
    });

    await db.auditLog.create({
      data: { userId: user.id, action: 'RENEW', entity: 'members', entityId: member.id, metadata: { memberNumber: member.memberNumber, months, reference, note: input.note ?? null } }
    });
    return NextResponse.json({ success: true, membershipEndDate: result.updated.membershipEndDate, reference });
  }

  if (input.action === 'MARK_REGISTRATION_PAID') {
    if (member.registrationPayment === 'PAID') return NextResponse.json({ error: 'Registration fee is already marked paid.' }, { status: 409 });
    const fees = await getFees();
    const reference = `GACODA-REGISTRATION_FEE-MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await db.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          memberId: member.id,
          type: 'REGISTRATION_FEE',
          amount: fees.registrationFeeAmount,
          currency: 'GHS',
          reference,
          provider: 'manual',
          status: 'SUCCESSFUL',
          paidAt: new Date(),
          metadata: { recordedBy: user.name, manual: true }
        }
      });
      await tx.member.update({ where: { id: member.id }, data: { registrationPayment: 'PAID' } });
    });
    await db.auditLog.create({ data: { userId: user.id, action: 'UPDATE', entity: 'members', entityId: member.id, metadata: { registrationPaidManually: true, memberNumber: member.memberNumber } } });
    return NextResponse.json({ success: true });
  }

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
