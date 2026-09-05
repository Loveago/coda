export type DuesState = 'PAID' | 'DUE_SOON' | 'EXPIRED' | 'UNPAID';

/**
 * Membership is free and lifetime, so every approved member is always in good
 * standing. The legacy dues states remain in the type so historical records
 * (membership periods recorded before fees were retired) still render.
 */
export function duesState(_end: Date | null): DuesState {
  return 'PAID';
}

export type AdminMemberRow = {
  id: string;
  memberNumber: string;
  name: string;
  email: string;
  phone: string;
  ghanaCardNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  location: string | null;
  platform: string | null;
  yearsExperience: number | null;
  vehicleInfo: string | null;
  vehicleRegistration: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelationship: string | null;
  emergency2Name: string | null;
  emergency2Phone: string | null;
  emergency2Relationship: string | null;
  status: string;
  emailVerified: boolean;
  registrationPayment: string;
  membershipStartDate: string | null;
  membershipEndDate: string | null;
  internalNotes: string | null;
  dues: DuesState;
  totalPaid: number;
  lastPaidAt: string | null;
  joined: string;
};

type SourceMember = {
  id: string; memberNumber: string; firstName: string; lastName: string; email: string; phone: string;
  ghanaCardNumber: string | null; dateOfBirth: Date | null; gender: string | null; location: string | null;
  platform: string | null; yearsExperience: number | null; vehicleInfo: string | null; vehicleRegistration: string | null;
  emergencyName: string | null; emergencyPhone: string | null; emergencyRelationship: string | null;
  emergency2Name: string | null; emergency2Phone: string | null; emergency2Relationship: string | null;
  status: string; emailVerified: boolean; registrationPayment: string;
  membershipStartDate: Date | null; membershipEndDate: Date | null; internalNotes: string | null;
  createdAt: Date;
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
      ghanaCardNumber: member.ghanaCardNumber,
      dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString() : null,
      gender: member.gender,
      location: member.location,
      platform: member.platform,
      yearsExperience: member.yearsExperience,
      vehicleInfo: member.vehicleInfo,
      vehicleRegistration: member.vehicleRegistration,
      emergencyName: member.emergencyName,
      emergencyPhone: member.emergencyPhone,
      emergencyRelationship: member.emergencyRelationship,
      emergency2Name: member.emergency2Name,
      emergency2Phone: member.emergency2Phone,
      emergency2Relationship: member.emergency2Relationship,
      status: member.status,
      emailVerified: member.emailVerified,
      registrationPayment: member.registrationPayment,
      membershipStartDate: member.membershipStartDate ? member.membershipStartDate.toISOString() : null,
      membershipEndDate: member.membershipEndDate ? member.membershipEndDate.toISOString() : null,
      internalNotes: member.internalNotes,
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
  ghanaCardNumber: true, dateOfBirth: true, gender: true, location: true,
  platform: true, yearsExperience: true, vehicleInfo: true, vehicleRegistration: true,
  emergencyName: true, emergencyPhone: true, emergencyRelationship: true,
  emergency2Name: true, emergency2Phone: true, emergency2Relationship: true,
  status: true, emailVerified: true, registrationPayment: true,
  membershipStartDate: true, membershipEndDate: true, internalNotes: true, createdAt: true,
  payments: { where: { status: 'SUCCESSFUL' as const }, select: { amount: true, paidAt: true, createdAt: true } }
} as const;
