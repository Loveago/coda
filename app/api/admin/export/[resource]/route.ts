import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { APPLICATION_FILTER } from '@/lib/membership';

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

  let rows: Record<string, unknown>[] = [];
  if (resource === 'applications') rows = await db.member.findMany({ where: APPLICATION_FILTER, orderBy: { createdAt: 'desc' } });
  else if (resource === 'members') rows = await db.member.findMany({ where: { status: { in: ['APPROVED', 'SUSPENDED'] } }, orderBy: { createdAt: 'desc' } });
  else if (resource === 'subscribers') rows = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
  else if (resource === 'messages') rows = await db.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  else return NextResponse.json({ error: 'Export is not available for this resource.' }, { status: 404 });

  const csv = toCsv(rows);
  const filename = `gacoda-${resource}-${new Date().toISOString().slice(0, 10)}.csv`;
  await db.auditLog.create({ data: { userId: user.id, action: 'EXPORT', entity: resource, metadata: { count: rows.length } } });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}
