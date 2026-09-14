import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const programType = searchParams.get('programType');
    const availability = searchParams.get('availability');
    const search = searchParams.get('search');

    const where: any = {};

    if (programType && programType !== 'ALL') {
      where.programType = { in: [programType, 'BOTH'] };
    }

    if (availability && availability !== 'ALL') {
      where.availability = availability;
    }

    if (search) {
      where.OR = [
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const vehicles = await (db.vehicle as any).findMany({
      where,
      include: {
        images: { orderBy: { position: 'asc' } },
        workPayAgreements: {
          select: {
            id: true,
            agreementNumber: true,
            driverName: true,
            status: true,
            startDate: true
          }
        },
        _count: {
          select: {
            workPayApplications: true,
            workPayAgreements: true
          }
        }
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }]
    });

    return NextResponse.json({ success: true, vehicles });
  } catch (err: any) {
    console.error('Fleet fetch error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch fleet' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();

    const {
      make,
      model,
      year,
      category,
      transmission,
      fuelType,
      seats,
      registrationNumber,
      vin,
      color,
      mileage,
      programType,
      ownerType,
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerSharePct,
      workPayPrice,
      workPayDeposit,
      workPayWeekly,
      workPayWeeks,
      dailySalesRate,
      dailySalesDeposit,
      dailySalesWeeklyTarget,
      workingDaysPerWeek,
      insuranceExpiry,
      roadworthyExpiry,
      trackerInstalled,
      trackerDeviceId,
      imageUrl,
      description,
      availability
    } = body;

    if (!make || !model || !year || !category) {
      return NextResponse.json(
        { error: 'Make, model, year, and category are required.' },
        { status: 400 }
      );
    }

    const vehicle = await (db.vehicle as any).create({
      data: {
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        category: category.trim(),
        transmission: transmission || 'Automatic',
        fuelType: fuelType || 'Petrol',
        seats: seats ? Number(seats) : 5,
        registrationNumber: registrationNumber ? registrationNumber.trim().toUpperCase() : null,
        vin: vin ? vin.trim().toUpperCase() : null,
        color: color ? color.trim() : null,
        mileage: mileage ? Number(mileage) : null,
        programType: programType || 'WORK_PAY',
        ownerType: ownerType || 'AGENCY',
        ownerName: ownerName ? ownerName.trim() : null,
        ownerPhone: ownerPhone ? ownerPhone.trim() : null,
        ownerEmail: ownerEmail ? ownerEmail.trim() : null,
        ownerSharePct: ownerSharePct ? Number(ownerSharePct) : null,
        workPayPrice: workPayPrice ? Number(workPayPrice) : null,
        workPayDeposit: workPayDeposit ? Number(workPayDeposit) : null,
        workPayWeekly: workPayWeekly ? Number(workPayWeekly) : null,
        workPayWeeks: workPayWeeks ? Number(workPayWeeks) : 104,
        dailySalesRate: dailySalesRate ? Number(dailySalesRate) : null,
        dailySalesDeposit: dailySalesDeposit ? Number(dailySalesDeposit) : null,
        dailySalesWeeklyTarget: dailySalesWeeklyTarget ? Number(dailySalesWeeklyTarget) : null,
        workingDaysPerWeek: workingDaysPerWeek ? Number(workingDaysPerWeek) : 6,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        roadworthyExpiry: roadworthyExpiry ? new Date(roadworthyExpiry) : null,
        trackerInstalled: Boolean(trackerInstalled),
        trackerDeviceId: trackerDeviceId ? trackerDeviceId.trim() : null,
        imageUrl: imageUrl ? imageUrl.trim() : null,
        description: description ? description.trim() : null,
        availability: availability || 'AVAILABLE',
        price: workPayPrice ? Math.round(Number(workPayPrice)) : 0,
        dailyRate: dailySalesRate ? Math.round(Number(dailySalesRate)) : 0,
        images: imageUrl
          ? {
              create: [
                {
                  url: imageUrl.trim(),
                  altText: `${year} ${make} ${model}`,
                  position: 0
                }
              ]
            }
          : undefined
      }
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (err: any) {
    console.error('Create fleet error:', err);
    return NextResponse.json({ error: err.message || 'Failed to add vehicle' }, { status: 500 });
  }
}
