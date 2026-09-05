import type { Member, Prisma } from '@prisma/client';

/**
 * Membership is free and lifetime: an approved member is always in good
 * standing. The legacy DUE/OVERDUE states are kept in the type only so old
 * receipts and verification pages render sensibly for historical data.
 */
export type ComputedMembershipStatus = 'ACTIVE' | 'DUE' | 'OVERDUE' | 'SUSPENDED' | 'PENDING' | 'REJECTED';

/**
 * Applications reach the admin panel as soon as they are submitted — there is
 * no registration fee gate any more.
 */
export const APPLICATION_FILTER: Prisma.MemberWhereInput = {
  status: 'PENDING'
};

export function computeMembershipStatus(member: Pick<Member, 'status'>): ComputedMembershipStatus {
  if (member.status === 'SUSPENDED') return 'SUSPENDED';
  if (member.status === 'PENDING') return 'PENDING';
  if (member.status === 'REJECTED') return 'REJECTED';
  // Free membership: approved members never expire.
  return 'ACTIVE';
}

export function generateMemberNumber(sequence: number) {
  return `MRTA-${String(sequence).padStart(6, '0')}`;
}

export async function nextMemberNumber() {
  const { db } = await import('@/lib/db');
  // Derive from the highest existing sequence rather than the row count: after
  // a member is deleted (or a draft is reclaimed during re-registration) the
  // count can point back at a number that is still taken, causing a unique
  // collision. Member numbers are fixed-width, so ordering desc is numeric.
  const last = await db.member.findFirst({ orderBy: { memberNumber: 'desc' }, select: { memberNumber: true } });
  const match = last ? /(\d+)\s*$/.exec(last.memberNumber) : null;
  const sequence = match ? Number(match[1]) + 1 : (await db.member.count()) + 1;
  return generateMemberNumber(sequence);
}
