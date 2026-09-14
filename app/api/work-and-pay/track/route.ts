import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({ error: 'Search query required.' }, { status: 400 });
  }

  try {
    const application = await (db as any).workPayApplication.findFirst({
      where: {
        OR: [
          { applicationNumber: { equals: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { equals: q, mode: 'insensitive' } },
          { ghanaCardNumber: { equals: q, mode: 'insensitive' } }
        ]
      },
      select: {
        applicationNumber: true,
        fullName: true,
        preferredVehicleType: true,
        operatingRegion: true,
        status: true,
        interviewDate: true,
        interviewNotes: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'No Work & Pay application found matching this reference or contact.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, application });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lookup failed.' }, { status: 500 });
  }
}
