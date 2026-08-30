import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit, requestAddress } from '@/lib/rate-limit';

const rentalInquirySchema = z.object({
  vehicleId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(160),
  phone: z.string().trim().min(7).max(30).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  notes: z.string().trim().max(2000).optional()
}).superRefine((data, ctx) => {
  if (data.endDate <= data.startDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date must be after start date.' });
});

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`rental:${requestAddress(request)}`);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    const parsed = rentalInquirySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Please provide valid rental details.' }, { status: 400 });
    if (parsed.data.vehicleId) {
      const vehicle = await db.vehicle.findUnique({ where: { id: parsed.data.vehicleId } });
      if (!vehicle || vehicle.availability !== 'AVAILABLE') return NextResponse.json({ error: 'That vehicle is not currently available.' }, { status: 409 });
    }
    const inquiry = await db.rentalInquiry.create({ data: parsed.data });
    return NextResponse.json({ success: true, id: inquiry.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to submit rental request right now.' }, { status: 500 });
  }
}
