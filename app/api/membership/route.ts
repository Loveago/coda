import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { membershipSchema } from '@/lib/validation';
import { rateLimit, requestAddress } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`membership:${requestAddress(request)}`, 3);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    const formData = await request.formData();
    const parsed = membershipSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please complete the required fields.' }, { status: 400 });
    }

    const application = await db.membershipApplication.create({
      data: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        platform: parsed.data.platform || null,
        vehicleInfo: parsed.data.vehicleInfo || null,
        region: parsed.data.region || null,
        additionalInfo: parsed.data.additionalInfo || null,
        consent: true
      }
    });

    return NextResponse.json({ success: true, id: application.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to submit your application right now.' }, { status: 500 });
  }
}
