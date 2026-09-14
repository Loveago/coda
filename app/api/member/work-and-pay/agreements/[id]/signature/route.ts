import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const member = await getPortalMember();
    if (!member) {
      return NextResponse.json({ error: 'Unauthorized. Member session required.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { signatureData, signatoryName } = body;

    if (!signatureData || !signatoryName) {
      return NextResponse.json(
        { error: 'Missing required signature data or signatory name.' },
        { status: 400 }
      );
    }

    const agreement = await (db as any).workPayAgreement.findUnique({
      where: { id },
      include: { member: true }
    });

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 });
    }

    // Verify ownership
    const isOwner =
      agreement.memberId === member.id ||
      agreement.driverPhone === member.phone ||
      agreement.driverEmail?.toLowerCase() === member.email?.toLowerCase();

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden. You do not own this agreement.' }, { status: 403 });
    }

    const now = new Date();
    const updateData: any = {
      driverSignature: signatureData,
      driverSignedAt: now,
      driverSignedName: signatoryName.trim()
    };

    // If Agency already signed, activate agreement
    if (agreement.agencySignature && agreement.status === 'PENDING_SIGNATURE') {
      updateData.status = 'ACTIVE';
      updateData.signedAt = now;
    }

    const updated = await (db as any).workPayAgreement.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Agreement signed successfully.',
      agreement: updated
    });
  } catch (error: any) {
    console.error('Error in member signing agreement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sign agreement.' },
      { status: 500 }
    );
  }
}
