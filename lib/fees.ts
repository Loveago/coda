import { db } from '@/lib/db';

export interface FeeSettingItem {
  key: string;
  amount: number; // in pesewas (GHS * 100)
  enabled: boolean;
  currency: string;
  gracePeriodDays: number;
  updatedAt?: Date;
}

export interface FeeSettingsState {
  registration: FeeSettingItem;
  annualDues: FeeSettingItem;
}

export const DEFAULT_FEES: FeeSettingsState = {
  registration: {
    key: 'REGISTRATION_FEE',
    amount: 2000, // GHS 20.00 in pesewas
    enabled: true,
    currency: 'GHS',
    gracePeriodDays: 0
  },
  annualDues: {
    key: 'ANNUAL_DUES',
    amount: 20000, // GHS 200.00 in pesewas
    enabled: true,
    currency: 'GHS',
    gracePeriodDays: 30
  }
};

/**
 * Format pesewas or GHS amount into standard Ghana Cedis string.
 */
export function formatGhs(pesewasOrAmount: number | string | { toString: () => string }): string {
  let num: number;
  if (typeof pesewasOrAmount === 'number') {
    num = pesewasOrAmount;
  } else if (typeof pesewasOrAmount === 'string') {
    num = parseFloat(pesewasOrAmount);
  } else if (pesewasOrAmount && typeof pesewasOrAmount.toString === 'function') {
    num = parseFloat(pesewasOrAmount.toString());
  } else {
    num = 0;
  }

  // If amount is >= 1000 and has no decimals, it's pesewas; otherwise treat as pesewas if passed to this helper
  const ghs = num / 100;
  return `GHS ${ghs.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatGhsDirect(ghsAmount: number | string | { toString: () => string }): string {
  let num = 0;
  if (typeof ghsAmount === 'number') num = ghsAmount;
  else if (typeof ghsAmount === 'string') num = parseFloat(ghsAmount) || 0;
  else if (ghsAmount && typeof ghsAmount.toString === 'function') num = parseFloat(ghsAmount.toString()) || 0;
  return `GHS ${num.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Fetch all configurable fee settings from the database.
 * Falls back to default values if records are missing.
 */
export async function getFeeSettings(): Promise<FeeSettingsState> {
  try {
    const records = await db.feeSetting.findMany({
      where: { key: { in: ['REGISTRATION_FEE', 'ANNUAL_DUES'] } }
    });

    const regRecord = records.find((r) => r.key === 'REGISTRATION_FEE');
    const duesRecord = records.find((r) => r.key === 'ANNUAL_DUES');

    return {
      registration: regRecord ? {
        key: regRecord.key,
        amount: regRecord.amount,
        enabled: regRecord.enabled,
        currency: (regRecord as any).currency || 'GHS',
        gracePeriodDays: (regRecord as any).gracePeriodDays ?? 0,
        updatedAt: regRecord.updatedAt
      } : DEFAULT_FEES.registration,
      annualDues: duesRecord ? {
        key: duesRecord.key,
        amount: duesRecord.amount,
        enabled: duesRecord.enabled,
        currency: (duesRecord as any).currency || 'GHS',
        gracePeriodDays: (duesRecord as any).gracePeriodDays ?? 30,
        updatedAt: duesRecord.updatedAt
      } : DEFAULT_FEES.annualDues
    };
  } catch (error) {
    console.error('Failed to get fee settings:', error);
    return DEFAULT_FEES;
  }
}

/**
 * Update a fee setting, creating a versioned FeeSettingHistory audit trail.
 * Changing fees NEVER modifies historical payment records.
 */
export async function updateFeeSetting(
  key: 'REGISTRATION_FEE' | 'ANNUAL_DUES',
  data: {
    amount: number; // pesewas
    enabled: boolean;
    gracePeriodDays?: number;
    currency?: string;
  },
  changedBy: string,
  note?: string
) {
  const current = await db.feeSetting.findUnique({ where: { key } });
  const previousAmount = current ? current.amount : null;

  return await db.$transaction(async (tx) => {
    const updated = await tx.feeSetting.upsert({
      where: { key },
      create: {
        key,
        amount: data.amount,
        enabled: data.enabled,
        currency: data.currency || 'GHS',
        gracePeriodDays: data.gracePeriodDays ?? (key === 'ANNUAL_DUES' ? 30 : 0)
      } as any,
      update: {
        amount: data.amount,
        enabled: data.enabled,
        currency: data.currency || 'GHS',
        gracePeriodDays: data.gracePeriodDays ?? (key === 'ANNUAL_DUES' ? 30 : 0)
      } as any
    });

    await tx.feeSettingHistory.create({
      data: {
        feeKey: key,
        previousAmount,
        newAmount: data.amount,
        enabled: data.enabled,
        currency: data.currency || 'GHS',
        gracePeriodDays: data.gracePeriodDays ?? (key === 'ANNUAL_DUES' ? 30 : 0),
        changedBy,
        note: note || `Fee setting ${key} updated`
      } as any
    });

    return updated;
  });
}

export async function getFeeSettingHistory(key?: string) {
  try {
    return await db.feeSettingHistory.findMany({
      where: key ? { feeKey: key } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  } catch (err) {
    console.error('Failed to fetch fee history:', err);
    return [];
  }
}

export type DuesStatusType = 'WAIVED' | 'CURRENT' | 'DUE_SOON' | 'OVERDUE';

export interface DuesStatusInfo {
  state: DuesStatusType;
  label: string;
  message: string;
  badgeClass: string;
  dueDate: Date | null;
  daysRemaining: number | null;
  isGracePeriod: boolean;
  canPay: boolean;
  amount: number;
}

/**
 * Calculates a member's annual dues status according to admin settings and membership expiry.
 */
export function calculateAnnualDuesStatus(
  membershipEndDate: Date | null,
  membershipStartDate: Date | null,
  duesSetting: FeeSettingItem
): DuesStatusInfo {
  // When annual dues are disabled by admin, all dues are waived
  if (!duesSetting.enabled) {
    return {
      state: 'WAIVED',
      label: 'WAIVED',
      message: 'Annual membership dues are currently waived by agency policy.',
      badgeClass: 'good',
      dueDate: null,
      daysRemaining: null,
      isGracePeriod: false,
      canPay: false,
      amount: duesSetting.amount
    };
  }

  const now = new Date();
  // Determine effective due date (either recorded end date or 1 year after start date)
  let effectiveDueDate = membershipEndDate;
  if (!effectiveDueDate && membershipStartDate) {
    effectiveDueDate = new Date(membershipStartDate.getTime() + 365 * 24 * 60 * 60 * 1000);
  }

  if (!effectiveDueDate) {
    return {
      state: 'OVERDUE',
      label: 'OVERDUE',
      message: 'Annual dues are required to maintain active membership in good standing.',
      badgeClass: 'danger',
      dueDate: null,
      daysRemaining: 0,
      isGracePeriod: false,
      canPay: true,
      amount: duesSetting.amount
    };
  }

  const diffMs = effectiveDueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const graceDays = duesSetting.gracePeriodDays ?? 30;

  const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });
  const formattedDate = dateFormatter.format(effectiveDueDate);

  if (diffDays > 30) {
    return {
      state: 'CURRENT',
      label: 'CURRENT',
      message: `Membership dues in good standing. Next due: ${formattedDate}.`,
      badgeClass: 'good',
      dueDate: effectiveDueDate,
      daysRemaining: diffDays,
      isGracePeriod: false,
      canPay: false,
      amount: duesSetting.amount
    };
  }

  if (diffDays >= 0) {
    return {
      state: 'DUE_SOON',
      label: 'DUE SOON',
      message: `Annual dues are due in ${diffDays} day${diffDays === 1 ? '' : 's'} (${formattedDate}).`,
      badgeClass: 'warn',
      dueDate: effectiveDueDate,
      daysRemaining: diffDays,
      isGracePeriod: false,
      canPay: true,
      amount: duesSetting.amount
    };
  }

  // Due date has passed: check grace period
  const overdueDays = Math.abs(diffDays);
  if (overdueDays <= graceDays) {
    const remainingGrace = graceDays - overdueDays;
    return {
      state: 'DUE_SOON',
      label: 'GRACE PERIOD',
      message: `Annual dues were due on ${formattedDate}. Grace period active (${remainingGrace} day${remainingGrace === 1 ? '' : 's'} left).`,
      badgeClass: 'warn',
      dueDate: effectiveDueDate,
      daysRemaining: -overdueDays,
      isGracePeriod: true,
      canPay: true,
      amount: duesSetting.amount
    };
  }

  return {
    state: 'OVERDUE',
    label: 'OVERDUE',
    message: `Annual dues are overdue since ${formattedDate} (${overdueDays} days ago). Please pay to restore active status.`,
    badgeClass: 'danger',
    dueDate: effectiveDueDate,
    daysRemaining: -overdueDays,
    isGracePeriod: false,
    canPay: true,
    amount: duesSetting.amount
  };
}
