import type { Prisma } from '@prisma/client';

/**
 * A work application only reaches the recruiters' queue once its application
 * fee requirement is settled — either paid, or disabled by the admin
 * (NOT_REQUIRED). Until then the member sees a "complete your payment" state
 * and admins never see the record. This mirrors APPLICATION_FILTER for
 * membership applications.
 */
export const WORK_APPLICATION_FILTER: Prisma.WorkApplicationWhereInput = {
  paymentState: { in: ['PAID', 'NOT_REQUIRED'] }
};

export const WORK_APPLICATION_STATUSES = ['NEW', 'REVIEWING', 'INTERVIEW', 'HIRED', 'REJECTED'] as const;
export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CASUAL'] as const;

export const workApplicationSelect = {
  id: true, position: true, employmentType: true, region: true, licenceClass: true,
  licenceNumber: true, licenceExpiry: true, experienceYears: true, platforms: true,
  cvUrl: true, coverNote: true, paymentState: true, status: true, internalNotes: true,
  reviewedAt: true, createdAt: true,
  member: { select: { firstName: true, lastName: true, memberNumber: true, phone: true, email: true, photoUrl: true } }
} as const;

export function paymentTypeLabel(type: string): string {
  if (type === 'ANNUAL_DUES') return 'Annual membership dues';
  if (type === 'WORK_APPLICATION_FEE') return 'Work application fee';
  return 'Registration fee';
}
