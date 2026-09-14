import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const agreement = await (db as any).workPayAgreement.findUnique({
      where: { id },
      include: {
        vehicle: true,
        member: true,
        application: true,
        installments: { orderBy: { weekNumber: 'asc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
        vehicleAssignments: true,
        securityDeposits: true,
        maintenanceRecords: { orderBy: { serviceDate: 'desc' } },
        ownershipTransfer: true,
        auditLogs: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }
      }
    });

    if (!agreement) return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 });
    return NextResponse.json({ success: true, agreement });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const { status, notes, latePenaltyFee } = body;

    const agreement = await (db as any).workPayAgreement.findUnique({ where: { id } });
    if (!agreement) return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 });

    const updated = await (db as any).workPayAgreement.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        latePenaltyFee: latePenaltyFee !== undefined ? Number(latePenaltyFee) : undefined,
        actualCompletionDate: status === 'COMPLETED' ? new Date() : undefined
      }
    });

    // Write audit log
    await (db as any).workPayAuditLog.create({
      data: {
        agreementId: id,
        userId: admin.id,
        action: 'STATUS_UPDATED',
        details: `Status updated from ${agreement.status} to ${status || agreement.status} by ${admin.name}`,
        previousValues: { status: agreement.status },
        newValues: { status: updated.status }
      }
    });

    return NextResponse.json({ success: true, agreement: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed.' }, { status: 500 });
  }
}
