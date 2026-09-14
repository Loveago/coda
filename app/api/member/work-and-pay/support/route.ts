import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import { generateTicketNumber } from '@/lib/work-pay';

export async function GET() {
  const portal = await getPortalMember();
  if (!portal) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tickets = await (db as any).workPaySupportTicket.findMany({
      where: { memberId: portal.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, tickets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const portal = await getPortalMember();
  if (!portal) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { category, subject, message, priority, agreementId } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 });
    }

    const ticketNumber = generateTicketNumber();

    const ticket = await (db as any).workPaySupportTicket.create({
      data: {
        ticketNumber,
        memberId: portal.id,
        agreementId: agreementId || null,
        category: category || 'GENERAL',
        subject,
        message,
        priority: priority || 'NORMAL',
        status: 'OPEN'
      }
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (err: any) {
    console.error('Support ticket error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit ticket.' }, { status: 500 });
  }
}
