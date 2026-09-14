import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [maintenance, reports, agreements] = await Promise.all([
      (db as any).workPayMaintenanceRecord.findMany({
        orderBy: { serviceDate: 'desc' },
        include: {
          agreement: {
            include: {
              vehicle: true
            }
          }
        }
      }),
      (db as any).workPayVehicleConditionReport.findMany({
        orderBy: { inspectionDate: 'desc' },
        include: {
          agreement: {
            include: {
              vehicle: true
            }
          }
        }
      }),
      (db as any).workPayAgreement.findMany({
        where: { status: { in: ['ACTIVE', 'IN_ARREARS'] } },
        select: { id: true, agreementNumber: true, driverName: true, vehicle: { select: { make: true, model: true } } }
      })
    ]);

    return NextResponse.json({ success: true, maintenance, reports, agreements });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { agreementId, serviceType, cost, paidBy, serviceCenter, notes, mileage } = body;

    const record = await (db as any).workPayMaintenanceRecord.create({
      data: {
        agreementId,
        serviceType: serviceType || 'OIL_CHANGE',
        serviceDate: new Date(),
        cost: Number(cost || 0),
        paidBy: paidBy || 'AGENCY',
        serviceCenter: serviceCenter || null,
        notes: notes || null,
        mileage: mileage ? Number(mileage) : null,
        status: 'COMPLETED'
      }
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save maintenance record.' }, { status: 500 });
  }
}
