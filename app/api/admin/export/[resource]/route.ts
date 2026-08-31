import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { APPLICATION_FILTER } from '@/lib/membership';
import { WORK_APPLICATION_FILTER } from '@/lib/work-applications';

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
}

export async function GET(_request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });
  const resource = (await params).resource;

  // Only non-sensitive columns are ever exported (never passwordHash etc.).
  const memberExportSelect = {
    memberNumber: true, firstName: true, lastName: true, email: true, phone: true,
    platform: true, vehicleInfo: true, vehicleRegistration: true, location: true,
    status: true, registrationPayment: true, emailVerified: true,
    membershipStartDate: true, membershipEndDate: true, createdAt: true
  } as const;

  let rows: Record<string, unknown>[] = [];
  if (resource === 'applications') rows = await db.member.findMany({ where: APPLICATION_FILTER, select: memberExportSelect, orderBy: { createdAt: 'desc' } });
  else if (resource === 'members') rows = await db.member.findMany({ where: { status: { in: ['APPROVED', 'SUSPENDED'] } }, select: memberExportSelect, orderBy: { createdAt: 'desc' } });
  else if (resource === 'subscribers') rows = await db.newsletterSubscriber.findMany({ select: { email: true, active: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
  else if (resource === 'messages') rows = await db.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  else if (resource === 'work-applications') rows = await db.workApplication.findMany({
    where: WORK_APPLICATION_FILTER,
    select: {
      position: true, employmentType: true, region: true, licenceClass: true, licenceNumber: true,
      experienceYears: true, platforms: true, status: true, paymentState: true, createdAt: true,
      member: { select: { memberNumber: true, firstName: true, lastName: true, phone: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  }).then((apps) => apps.map((app) => ({
    memberNumber: app.member.memberNumber,
    firstName: app.member.firstName,
    lastName: app.member.lastName,
    phone: app.member.phone,
    email: app.member.email,
    position: app.position,
    employmentType: app.employmentType,
    region: app.region ?? '',
    licenceClass: app.licenceClass ?? '',
    licenceNumber: app.licenceNumber ?? '',
    experienceYears: app.experienceYears ?? '',
    platforms: app.platforms ?? '',
    status: app.status,
    paymentState: app.paymentState,
    submittedAt: app.createdAt.toISOString()
  })));
  else if (resource === 'recruitment') rows = await db.driverApplication.findMany({
    select: { fullName: true, email: true, phone: true, experience: true, status: true, createdAt: true, opportunity: { select: { title: true } } },
    orderBy: { createdAt: 'desc' }
  }).then((apps) => apps.map((app) => ({
    fullName: app.fullName, email: app.email, phone: app.phone,
    opportunity: app.opportunity?.title ?? '', experience: app.experience ?? '',
    status: app.status, createdAt: app.createdAt.toISOString()
  })));
  else return NextResponse.json({ error: 'Export is not available for this resource.' }, { status: 404 });

  const csv = toCsv(rows);
  const filename = `mr-truth-${resource}-${new Date().toISOString().slice(0, 10)}.csv`;
  await db.auditLog.create({ data: { userId: user.id, action: 'EXPORT', entity: resource, metadata: { count: rows.length } } });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}
