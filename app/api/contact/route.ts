import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactSchema } from '@/lib/validation';
import { rateLimit, requestAddress } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`contact:${requestAddress(request)}`);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    const parsed = contactSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a valid message.' }, { status: 400 });
    }

    const message = await db.contactMessage.create({ data: parsed.data });
    return NextResponse.json({ success: true, id: message.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to send your message right now.' }, { status: 500 });
  }
}
