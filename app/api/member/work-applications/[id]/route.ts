import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireApprovedMember } from '@/lib/members-auth';

/**
 * Members may withdraw an application only while it is unpaid or still NEW
 * (recruiters have not started reviewing it). Paid applications that are under
 * review are kept for audit; the member can request removal via support.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await requireApprovedMember();
  if (!member) return NextResponse.json({ error: 'Approved member session required.' }, { status: 401 });

  const id = z.string().uuid().safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: 'Invalid application id.' }, { status: 400 });

  const application = await db.workApplication.findFirst({ where: { id: id.data, memberId: member.id } });
  if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  if (application.status !== 'NEW' || application.paymentState === 'PAID') {
    return NextResponse.json({ error: 'This application is already with our recruiters and cannot be withdrawn. Contact support instead.' }, { status: 409 });
  }

  await db.workApplication.delete({ where: { id: application.id } });
  await db.auditLog.create({ data: { action: 'DELETE', entity: 'work_application', entityId: application.id, metadata: { memberId: member.id, withdrawnByMember: true } } });
  return NextResponse.json({ success: true });
}
