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
  const all = await db.member.findMany({ select: { memberNumber: true } });
  let maxSeq = 0;
  for (const m of all) {
    const match = /(\d+)\s*$/.exec(m.memberNumber);
    if (match) {
      const num = Number(match[1]);
      if (num > maxSeq) maxSeq = num;
    }
  }
  let candidateSeq = maxSeq + 1;
  while (true) {
    const candidate = generateMemberNumber(candidateSeq);
    const inDb = await db.member.findUnique({ where: { memberNumber: candidate } });
    if (!inDb) return candidate;
    candidateSeq++;
  }
}
