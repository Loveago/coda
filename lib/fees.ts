import { db } from '@/lib/db';

export type FeeKey = 'registration_fee' | 'annual_dues';

export type Fees = {
  registrationFeeAmount: number;
  registrationFeeEnabled: boolean;
  annualDuesAmount: number;
};

// Amounts are stored in pesewas (GHS * 100) — never floating point.
const DEFAULTS: Record<FeeKey, { amount: number; enabled: boolean }> = {
  registration_fee: { amount: 2000, enabled: true },
  annual_dues: { amount: 20000, enabled: true }
};

export async function getFees(): Promise<Fees> {
  const rows = await db.feeSetting.findMany();
  const map = Object.fromEntries(rows.map((row) => [row.key, row]));
  return {
    registrationFeeAmount: map.registration_fee?.amount ?? DEFAULTS.registration_fee.amount,
    registrationFeeEnabled: map.registration_fee?.enabled ?? DEFAULTS.registration_fee.enabled,
    annualDuesAmount: map.annual_dues?.amount ?? DEFAULTS.annual_dues.amount
  };
}

export function formatGhs(pesewas: number) {
  return `GHS ${(pesewas / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function setFee(
  key: FeeKey,
  amount: number,
  enabled: boolean,
  changedBy: string,
  note?: string
) {
  const previous = await db.feeSetting.findUnique({ where: { key } });
  const setting = await db.feeSetting.upsert({
    where: { key },
    update: { amount, enabled },
    create: { key, amount, enabled }
  });
  await db.feeSettingHistory.create({
    data: {
      feeKey: key,
      previousAmount: previous?.amount ?? null,
      newAmount: amount,
      enabled,
      changedBy,
      note
    }
  });
  return setting;
}
