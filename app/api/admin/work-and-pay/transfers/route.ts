import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import { generateTransferCertificateNumber } from '@/lib/work-pay';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const transfers = await (db as any).workPayOwnershipTransfer.findMany({
      include: {
        agreement: {
          include: {
            vehicle: true,
            member: { select: { id: true, memberNumber: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Also get agreements that are COMPLETED but don't have a transfer record yet
    const completedWithoutTransfer = await (db as any).workPayAgreement.findMany({
      where: {
        status: 'COMPLETED',
        ownershipTransfer: null
      },
      include: { vehicle: true }
    });

    return NextResponse.json({ success: true, transfers, pendingAgreements: completedWithoutTransfer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { agreementId, dvlaPaperworkStatus, newRegistrationNumber, notes } = body;

    const certNumber = generateTransferCertificateNumber();

    const transfer = await (db as any).workPayOwnershipTransfer.upsert({
      where: { agreementId },
      create: {
        agreementId,
        transferCertificateNumber: certNumber,
        finalPayoffVerified: true,
        payoffVerifiedAt: new Date(),
        payoffVerifiedBy: admin.name || admin.email,
        transferClearance: true,
        dvlaPaperworkStatus: dvlaPaperworkStatus || 'PAPERS_SUBMITTED',
        dvlaSubmissionDate: new Date(),
        newRegistrationNumber: newRegistrationNumber || null,
        notes: notes || null
      },
      update: {
        dvlaPaperworkStatus: dvlaPaperworkStatus || undefined,
        newRegistrationNumber: newRegistrationNumber || undefined,
        notes: notes || undefined,
        dvlaCompletionDate: dvlaPaperworkStatus === 'COMPLETED' ? new Date() : undefined,
        handoverDate: dvlaPaperworkStatus === 'COMPLETED' ? new Date() : undefined
      }
    });

    if (dvlaPaperworkStatus === 'COMPLETED') {
      await (db as any).workPayAgreement.update({
        where: { id: agreementId },
        data: { status: 'OWNERSHIP_TRANSFERRED' }
      });
    }

    return NextResponse.json({ success: true, transfer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Operation failed.' }, { status: 500 });
  }
}
