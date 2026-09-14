import { NextResponse } from 'next/server';
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
    description: 'Ultra-fuel-efficient city hatchback, highly sought-after for ride-hailing and daily commuting in Accra and Kumasi.',
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
    description: 'Economic city runabout with modern safety features and proven durability on Ghanaian roads.',
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
    description: 'The standard of commercial reliability across Ghana. Spacious cabin, high resale value, and widely available parts.',
    availability: 'AVAILABLE',
    featured: false
  }
];

export async function GET() {
  try {
    let vehicles = await db.vehicle.findMany({
      where: { availability: { not: 'SOLD' } },
      include: {
        images: { orderBy: { position: 'asc' }, take: 1 }
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }]
    });

    // Auto-seed standard fleet vehicles if none are in the database
    if (vehicles.length === 0) {
      for (const v of DEFAULT_WORK_PAY_VEHICLES) {
        await db.vehicle.create({
          data: v
        });
      }

      vehicles = await db.vehicle.findMany({
        where: { availability: { not: 'SOLD' } },
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
