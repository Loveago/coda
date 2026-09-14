import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const vehicle = await (db.vehicle as any).findUnique({
      where: { id },
      include: {
        images: true,
        workPayAgreements: {
          include: {
            installments: { take: 5 },
            payments: { take: 5 }
          }
        },
        vehicleAssignments: {
          orderBy: { handoverDate: 'desc' }
        }
      }
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, vehicle });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error loading vehicle' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    const allowedFields = [
      'make', 'model', 'year', 'category', 'transmission', 'fuelType', 'seats',
      'registrationNumber', 'vin', 'color', 'mileage', 'programType', 'ownerType',
      'ownerName', 'ownerPhone', 'ownerEmail', 'ownerSharePct', 'workPayPrice',
      'workPayDeposit', 'workPayWeekly', 'workPayWeeks', 'dailySalesRate',
      'dailySalesDeposit', 'dailySalesWeeklyTarget', 'workingDaysPerWeek',
      'insuranceExpiry', 'roadworthyExpiry', 'trackerInstalled', 'trackerDeviceId',
      'imageUrl', 'description', 'availability', 'featured'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (['year', 'seats', 'mileage', 'workPayWeeks', 'workingDaysPerWeek'].includes(field)) {
          updateData[field] = body[field] !== null && body[field] !== '' ? Number(body[field]) : null;
        } else if (['workPayPrice', 'workPayDeposit', 'workPayWeekly', 'dailySalesRate', 'dailySalesDeposit', 'dailySalesWeeklyTarget', 'ownerSharePct'].includes(field)) {
          updateData[field] = body[field] !== null && body[field] !== '' ? Number(body[field]) : null;
        } else if (['insuranceExpiry', 'roadworthyExpiry'].includes(field)) {
          updateData[field] = body[field] ? new Date(body[field]) : null;
        } else if (field === 'trackerInstalled' || field === 'featured') {
          updateData[field] = Boolean(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    if (updateData.workPayPrice !== undefined) {
      updateData.price = updateData.workPayPrice ? Math.round(Number(updateData.workPayPrice)) : 0;
    }
    if (updateData.dailySalesRate !== undefined) {
      updateData.dailyRate = updateData.dailySalesRate ? Math.round(Number(updateData.dailySalesRate)) : 0;
    }

    const updated = await (db.vehicle as any).update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, vehicle: updated });
  } catch (err: any) {
    console.error('Update vehicle error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update vehicle' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    // Check if vehicle is bound to any active agreements
    const activeAgreement = await (db.workPayAgreement as any).findFirst({
      where: {
        vehicleId: id,
        status: { in: ['ACTIVE', 'IN_ARREARS', 'PENDING_SIGNATURE'] }
      }
    });

    if (activeAgreement) {
      return NextResponse.json(
        { error: 'Cannot delete vehicle currently bound to an active or pending agreement. Retire or reassign it instead.' },
        { status: 400 }
      );
    }

    // Set to RETIRED instead of hard deleting if history exists
    await (db.vehicle as any).update({
      where: { id },
      data: { availability: 'RETIRED' }
    });

    return NextResponse.json({ success: true, message: 'Vehicle retired successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to retire vehicle' }, { status: 500 });
  }
}
