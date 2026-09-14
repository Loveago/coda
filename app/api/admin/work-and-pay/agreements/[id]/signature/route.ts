import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role, signatureData, signatoryName, witnessPhone } = body;

    if (!role || !signatureData || !signatoryName) {
      return NextResponse.json(
        { error: 'Missing required parameters: role, signatureData, and signatoryName are mandatory.' },
        { status: 400 }
      );
    }

    const agreement = await (db as any).workPayAgreement.findUnique({
      where: { id },
      include: { vehicle: true }
    });

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 });
    }

    const now = new Date();
    const updateData: any = {};

    switch (role) {
      case 'DRIVER':
        updateData.driverSignature = signatureData;
        updateData.driverSignedAt = now;
        updateData.driverSignedName = signatoryName;
        break;
      case 'GUARANTOR_1':
        updateData.guarantor1Signature = signatureData;
        updateData.guarantor1SignedAt = now;
        updateData.guarantor1SignedName = signatoryName;
        break;
      case 'GUARANTOR_2':
        updateData.guarantor2Signature = signatureData;
        updateData.guarantor2SignedAt = now;
        updateData.guarantor2SignedName = signatoryName;
        break;
      case 'AGENCY':
        updateData.agencySignature = signatureData;
        updateData.agencySignedAt = now;
        updateData.agencySignedBy = signatoryName || admin.name || 'Mr Truth Agency Director';
        break;
      case 'WITNESS':
        updateData.witnessSignature = signatureData;
        updateData.witnessSignedAt = now;
        updateData.witnessName = signatoryName;
        if (witnessPhone) updateData.witnessPhone = witnessPhone;
        break;
      default:
        return NextResponse.json({ error: `Invalid signatory role: ${role}` }, { status: 400 });
    }

    // Check if both Driver and Agency have signed; if so, update status to ACTIVE if still PENDING_SIGNATURE
    const willHaveDriverSig = updateData.driverSignature || agreement.driverSignature;
    const willHaveAgencySig = updateData.agencySignature || agreement.agencySignature;
    if (willHaveDriverSig && willHaveAgencySig && agreement.status === 'PENDING_SIGNATURE') {
      updateData.status = 'ACTIVE';
      updateData.signedAt = now;
    }

    const updated = await (db as any).workPayAgreement.update({
      where: { id },
      data: updateData
    });

    // Create Audit Log
    await (db as any).workPayAuditLog.create({
      data: {
        agreementId: id,
        userId: admin.id,
        action: 'RECORD_SIGNATURE',
        details: `Recorded digital signature for ${role} (${signatoryName}) by admin ${admin.name || admin.email}.`
      }
    });

    return NextResponse.json({
      success: true,
      message: `Signature for ${role} successfully recorded.`,
      agreement: updated
    });
  } catch (error: any) {
    console.error('Error recording agreement signature:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record signature.' },
      { status: 500 }
    );
  }
}
