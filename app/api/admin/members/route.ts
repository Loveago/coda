import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { buildMemberRows, memberRowSelect, OWING_STATES, type AdminMemberRow } from '@/lib/member-dues';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/members
 *   ?q=       search across name / email / phone / member number / plate
 *   &dues=    all | paid | owing | unpaid | expired | due
 *   &status=  all | APPROVED | SUSPENDED
 *   &sort=    newest | oldest | name | expiry | paid
 *
 * Returns rows plus counts for the summary tiles. Counts respect the search +
 * status filters so the tiles always describe the visible cohort.
 */
export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
  const dues = url.searchParams.get('dues') ?? 'all';
  const status = url.searchParams.get('status') ?? 'all';
  const sort = url.searchParams.get('sort') ?? 'newest';

  const where: Record<string, unknown> = {
    status: status === 'APPROVED' || status === 'SUSPENDED' ? status : { in: ['APPROVED', 'SUSPENDED'] }
  };
  if (q) {
    Object.assign(where, {
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { memberNumber: { contains: q, mode: 'insensitive' } },
        { vehicleRegistration: { contains: q, mode: 'insensitive' } }
      ]
    });
  }

  const members = await db.member.findMany({ where, select: memberRowSelect, orderBy: { createdAt: 'desc' } });
  const rows = buildMemberRows(members);

  const counts = {
    all: rows.length,
    paid: rows.filter((row) => row.dues === 'PAID').length,
    owing: rows.filter((row) => OWING_STATES.includes(row.dues)).length,
    unpaid: rows.filter((row) => row.dues === 'UNPAID').length,
    expired: rows.filter((row) => row.dues === 'EXPIRED').length,
    due: rows.filter((row) => row.dues === 'DUE_SOON').length
  };

  let filtered = rows;
  if (dues === 'paid') filtered = rows.filter((row) => row.dues === 'PAID');
  else if (dues === 'owing') filtered = rows.filter((row) => OWING_STATES.includes(row.dues));
  else if (dues === 'unpaid') filtered = rows.filter((row) => row.dues === 'UNPAID');
  else if (dues === 'expired') filtered = rows.filter((row) => row.dues === 'EXPIRED');
  else if (dues === 'due') filtered = rows.filter((row) => row.dues === 'DUE_SOON');

  const bySort: Record<string, (a: AdminMemberRow, b: AdminMemberRow) => number> = {
    newest: (a, b) => b.joined.localeCompare(a.joined),
    oldest: (a, b) => a.joined.localeCompare(b.joined),
    name: (a, b) => a.name.localeCompare(b.name),
    expiry: (a, b) => (a.membershipEndDate ?? '9999').localeCompare(b.membershipEndDate ?? '9999'),
    paid: (a, b) => b.totalPaid - a.totalPaid
  };
  filtered = [...filtered].sort(bySort[sort] ?? bySort.newest);

  return NextResponse.json({ rows: filtered, counts });
}
