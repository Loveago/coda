import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const app = await (db as any).workPayApplication.findUnique({
      where: { id },
      include: {
        member: true,
        agreements: true,
        documents: true
      }
    });

    if (!app) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    return NextResponse.json({ success: true, application: app });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const { status, interviewScore, interviewDate, interviewNotes, internalNotes, rejectionReason } = body;

    const updated = await (db as any).workPayApplication.update({
      where: { id },
      data: {
        status: status || undefined,
        interviewScore: interviewScore !== undefined ? Number(interviewScore) : undefined,
        interviewDate: interviewDate ? new Date(interviewDate) : undefined,
        interviewNotes: interviewNotes !== undefined ? interviewNotes : undefined,
        internalNotes: internalNotes !== undefined ? internalNotes : undefined,
        rejectionReason: rejectionReason !== undefined ? rejectionReason : undefined
      }
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update application.' }, { status: 500 });
  }
}
