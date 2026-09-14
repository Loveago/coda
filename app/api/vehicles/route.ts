import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEFAULT_WORK_PAY_VEHICLES = [
  {
    make: 'Toyota',
    model: 'Vitz',
    year: 2019,
    category: 'Compact Hatchback',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    price: 110000,
    dailyRate: 250,
    registrationNumber: 'GW-3412-21',
    vin: 'JTDKB20U901238491',
    color: 'Silver',
    mileage: 64200,
    programType: 'BOTH',
    ownerType: 'AGENCY',
    workPayPrice: 110000,
    workPayDeposit: 5000,
    workPayWeekly: 800,
    workPayWeeks: 104,
    dailySalesRate: 150,
    dailySalesDeposit: 2000,
    dailySalesWeeklyTarget: 900,
    workingDaysPerWeek: 6,
    trackerInstalled: true,
    description: 'Ultra-fuel-efficient city hatchback, highly sought-after for Bolt, Uber Eco, and daily commuting in Accra and Kumasi.',
    availability: 'AVAILABLE',
    featured: true
  },
  {
    make: 'Toyota',
    model: 'Yaris',
    year: 2020,
    category: 'Compact Sedan',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    price: 125000,
    dailyRate: 280,
    registrationNumber: 'GN-5820-22',
    vin: 'JTDBT923481239120',
    color: 'White',
    mileage: 51300,
    programType: 'WORK_PAY',
    ownerType: 'AGENCY',
    workPayPrice: 125000,
    workPayDeposit: 6000,
    workPayWeekly: 850,
    workPayWeeks: 104,
    dailySalesRate: 170,
    dailySalesDeposit: 2500,
    dailySalesWeeklyTarget: 1020,
    workingDaysPerWeek: 6,
    trackerInstalled: true,
    description: 'Reliable and comfortable compact sedan ideal for Bolt and Uber Premier drivers, with low maintenance costs.',
    availability: 'AVAILABLE',
    featured: true
  },
  {
    make: 'Hyundai',
    model: 'Grand i10',
    year: 2021,
    category: 'Hatchback',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    price: 105000,
    dailyRate: 240,
    registrationNumber: 'GR-8190-23',
    vin: 'KMHD141BT91283019',
    color: 'Grey',
    mileage: 42000,
    programType: 'DAILY_SALES',
    ownerType: 'FLEET_INVESTOR',
    ownerName: 'Kwesi Mensah',
    ownerPhone: '+233 24 555 0192',
    ownerSharePct: 85.00,
    dailySalesRate: 140,
    dailySalesDeposit: 1800,
    dailySalesWeeklyTarget: 840,
    workingDaysPerWeek: 6,
    trackerInstalled: true,
    description: 'Economic city runabout dedicated for daily sales remittance. Fuel-sipping engine with prompt weekly owner payouts.',
    availability: 'AVAILABLE',
    featured: true
  },
  {
    make: 'Suzuki',
    model: 'Swift',
    year: 2021,
    category: 'Hatchback',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    price: 120000,
    dailyRate: 260,
    registrationNumber: 'GE-9021-22',
    vin: 'JS2ZA11S918239019',
    color: 'Blue',
    mileage: 48900,
    programType: 'BOTH',
    ownerType: 'AGENCY',
    workPayPrice: 120000,
    workPayDeposit: 6000,
    workPayWeekly: 820,
    workPayWeeks: 104,
    dailySalesRate: 160,
    dailySalesDeposit: 2000,
    dailySalesWeeklyTarget: 960,
    workingDaysPerWeek: 6,
    trackerInstalled: true,
    description: 'Popular ride-hailing choice known for unbeatable fuel mileage, air conditioning efficiency, and agility.',
    availability: 'AVAILABLE',
    featured: false
  },
  {
    make: 'Toyota',
    model: 'Corolla',
    year: 2018,
    category: 'Sedan',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    price: 145000,
    dailyRate: 320,
    registrationNumber: 'GT-2391-20',
    vin: '2T1BURHE918290124',
    color: 'Black',
    mileage: 82400,
    programType: 'WORK_PAY',
    ownerType: 'AGENCY',
    workPayPrice: 145000,
    workPayDeposit: 8000,
    workPayWeekly: 950,
    workPayWeeks: 104,
    dailySalesRate: 200,
    dailySalesDeposit: 3000,
    dailySalesWeeklyTarget: 1200,
    workingDaysPerWeek: 6,
    trackerInstalled: true,
    description: 'The standard of commercial reliability across Ghana. Spacious cabin, high resale value, and widely available parts.',
    availability: 'AVAILABLE',
    featured: false
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programType = searchParams.get('programType');
    const availableOnly = searchParams.get('availableOnly') === 'true';

    const where: any = {
      availability: { not: 'SOLD' }
    };

    if (availableOnly) {
      where.availability = 'AVAILABLE';
    }

    if (programType && programType !== 'ALL') {
      where.programType = {
        in: [programType, 'BOTH']
      };
    }

    let vehicles = await db.vehicle.findMany({
      where,
      include: {
        images: { orderBy: { position: 'asc' }, take: 1 }
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }]
    });

    // Auto-seed standard fleet vehicles if none are in the database
    if (vehicles.length === 0 && !programType) {
      for (const v of DEFAULT_WORK_PAY_VEHICLES) {
        await (db.vehicle as any).create({
          data: v
        });
      }

      vehicles = await db.vehicle.findMany({
        where,
        include: {
          images: { orderBy: { position: 'asc' }, take: 1 }
        },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }]
      });
    }

    return NextResponse.json({ success: true, vehicles });
  } catch (err: any) {
    console.error('Failed to fetch vehicles:', err);
    return NextResponse.json({ error: err.message || 'Failed to load vehicles' }, { status: 500 });
  }
}
