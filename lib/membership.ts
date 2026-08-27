import type { Member } from '@prisma/client';

export type ComputedMembershipStatus = 'ACTIVE' | 'DUE' | 'OVERDUE' | 'SUSPENDED' | 'PENDING' | 'REJECTED';

export const RENEWAL_WINDOW_DAYS = 30;

export function computeMembershipStatus(member: Pick<Member, 'status' | 'membershipEndDate'>): ComputedMembershipStatus {
  if (member.status === 'SUSPENDED') return 'SUSPENDED';
  if (member.status === 'PENDING') return 'PENDING';
  if (member.status === 'REJECTED') return 'REJECTED';
  if (!member.membershipEndDate) return 'DUE';
  const now = Date.now();
  const end = member.membershipEndDate.getTime();
  if (end < now) return 'OVERDUE';
  const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (daysRemaining <= RENEWAL_WINDOW_DAYS) return 'DUE';
  return 'ACTIVE';
}

export function nextMembershipPeriod(currentEnd: Date | null): { start: Date; end: Date } {
  const now = new Date();
  const base = currentEnd && currentEnd.getTime() > now.getTime() ? new Date(currentEnd) : now;
  const start = base;
  const end = new Date(base);
  end.setFullYear(end.getFullYear() + 1);
  return { start, end };
}

export function generateMemberNumber(sequence: number) {
  return `GACODA-${String(sequence).padStart(6, '0')}`;
}

export async function nextMemberNumber() {
  const count = await (await import('@/lib/db')).db.member.count();
  return generateMemberNumber(count + 1);
}
