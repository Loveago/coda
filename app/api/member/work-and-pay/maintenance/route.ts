import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';

export async function POST(request: Request) {
  const portal = await getPortalMember();
  if (!portal) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { agreementId, serviceType, mileage, cost, serviceCenter, notes } = body;

    if (!agreementId) {
      return NextResponse.json({ error: 'Agreement ID is required.' }, { status: 400 });
    }

    const record = await (db as any).workPayMaintenanceRecord.create({
      data: {
        agreementId,
        serviceType: serviceType || 'OTHER',
        serviceDate: new Date(),
        mileage: mileage ? Number(mileage) : null,
        cost: cost ? Number(cost) : 0,
        paidBy: 'DRIVER',
        serviceCenter: serviceCenter || null,
        notes: notes || null,
        status: 'COMPLETED'
      }
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating maintenance record:', err);
    return NextResponse.json({ error: err.message || 'Failed to record maintenance.' }, { status: 500 });
  }
}
