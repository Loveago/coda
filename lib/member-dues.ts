import { RENEWAL_WINDOW_DAYS } from '@/lib/membership';

export type DuesState = 'PAID' | 'DUE_SOON' | 'EXPIRED' | 'UNPAID';

/**
 * Annual-dues state derived purely from the membership period. A member with no
 * period at all has simply never paid dues (approval alone never grants one).
 */
export function duesState(end: Date | null): DuesState {
  if (!end) return 'UNPAID';
  const now = Date.now();
  if (end.getTime() < now) return 'EXPIRED';
  if (end.getTime() - now <= RENEWAL_WINDOW_DAYS * 86_400_000) return 'DUE_SOON';
  return 'PAID';
}

export type AdminMemberRow = {
  id: string;
  memberNumber: string;
  name: string;
  email: string;
  phone: string;
  platform: string | null;
  status: string;
  emailVerified: boolean;
  registrationPayment: string;
  membershipEndDate: string | null;
  dues: DuesState;
  totalPaid: number;
  lastPaidAt: string | null;
  joined: string;
};

type SourceMember = {
  id: string; memberNumber: string; firstName: string; lastName: string; email: string; phone: string;
  platform: string | null; status: string; emailVerified: boolean; registrationPayment: string;
  membershipEndDate: Date | null; createdAt: Date;
  payments: Array<{ amount: number; paidAt: Date | null; createdAt: Date }>;
};

/** Enrich members (with their successful payments) into admin table rows. */
export function buildMemberRows(members: SourceMember[]): AdminMemberRow[] {
  return members.map((member) => {
    const totalPaid = member.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const lastPaidAt = member.payments.reduce<Date | null>((latest, payment) => {
      const at = payment.paidAt ?? payment.createdAt;
      return !latest || at > latest ? at : latest;
    }, null);
    return {
      id: member.id,
      memberNumber: member.memberNumber,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      phone: member.phone,
      platform: member.platform,
      status: member.status,
      emailVerified: member.emailVerified,
      registrationPayment: member.registrationPayment,
      membershipEndDate: member.membershipEndDate ? member.membershipEndDate.toISOString() : null,
      dues: duesState(member.membershipEndDate),
      totalPaid,
      lastPaidAt: lastPaidAt ? lastPaidAt.toISOString() : null,
      joined: member.createdAt.toISOString()
    };
  });
}

export const OWING_STATES: DuesState[] = ['UNPAID', 'EXPIRED', 'DUE_SOON'];

export const memberRowSelect = {
  id: true, memberNumber: true, firstName: true, lastName: true, email: true, phone: true,
  platform: true, status: true, emailVerified: true, registrationPayment: true,
  membershipEndDate: true, createdAt: true,
  payments: { where: { status: 'SUCCESSFUL' as const }, select: { amount: true, paidAt: true, createdAt: true } }
} as const;
