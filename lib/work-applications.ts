import type { Prisma } from '@prisma/client';

/**
 * Job applications are free for members — the old application-fee gate was
 * retired when Mr Truth Agency moved to a no-fee model. Every submitted
 * application goes straight to the recruiters' queue.
 */
export const WORK_APPLICATION_FILTER: Prisma.WorkApplicationWhereInput = {};

export const WORK_APPLICATION_STATUSES = ['NEW', 'REVIEWING', 'INTERVIEW', 'HIRED', 'REJECTED'] as const;
export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CASUAL'] as const;

/**
 * The agency's own core hiring tracks. Public pages show exactly these
 * postings, whatever else may exist in the database.
 */
export const CORE_TRACK_SLUGS = ['work-and-pay', 'daily-sales'] as const;

/**
 * General recruitment: the agency also helps employers and job-seekers across
 * every industry. Members can apply for any open role from the job board, or
 * request a role that is not listed.
 */
export const JOB_CATEGORIES = [
  'Driving & Logistics',
  'Sales & Marketing',
  'Customer Service',
  'Admin & Office',
  'Skilled Trades',
  'Hospitality & Tourism',
  'Healthcare & Caregiving',
  'Construction & Labour',
  'Tech & Digital',
  'Education & Training',
  'Property & Facilities',
  'Other'
] as const;

export const workApplicationSelect = {
  id: true, position: true, employmentType: true, contactPhone: true, region: true, licenceClass: true,
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
