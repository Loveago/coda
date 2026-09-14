import { db } from '@/lib/db';
import crypto from 'crypto';

export interface SampleVehicle {
  name: string;
  year: string;
  category: string;
  engine: string;
  fuelEconomy: string;
  totalPrice: number;
  minDeposit: number;
  defaultDurationWeeks: number;
  recommendedFor: string;
}

export const SAMPLE_VEHICLES: SampleVehicle[] = [
  {
    name: 'Toyota Vitz (Echo / Yaris Hatch)',
    year: '2016 - 2019',
    category: 'Compact Hatchback',
    engine: '1.0L - 1.3L Petrol',
    fuelEconomy: '18 - 21 km/L',
    totalPrice: 110000,
    minDeposit: 5000,
    defaultDurationWeeks: 104,
    recommendedFor: 'Bolt & Uber Eco / City commuting'
  },
  {
    name: 'Toyota Yaris Sedan / Belta',
    year: '2016 - 2020',
    category: 'Sedan',
    engine: '1.3L - 1.5L Petrol',
    fuelEconomy: '16 - 19 km/L',
    totalPrice: 125000,
    minDeposit: 6000,
    defaultDurationWeeks: 104,
    recommendedFor: 'Bolt Comfort, UberX, Airport runs'
  },
  {
    name: 'Hyundai i10 Grand',
    year: '2017 - 2021',
    category: 'Compact Hatchback',
    engine: '1.2L Petrol',
    fuelEconomy: '17 - 20 km/L',
    totalPrice: 105000,
    minDeposit: 5000,
    defaultDurationWeeks: 104,
    recommendedFor: 'High fuel efficiency ride-hailing'
  },
  {
    name: 'Suzuki Swift Dzire',
    year: '2018 - 2022',
    category: 'Compact Sedan',
    engine: '1.2L Petrol',
    fuelEconomy: '19 - 22 km/L',
    totalPrice: 120000,
    minDeposit: 6000,
    defaultDurationWeeks: 104,
    recommendedFor: 'Low maintenance daily commercial driving'
  },
  {
    name: 'Toyota Corolla (Altis / Axio)',
    year: '2015 - 2019',
    category: 'Executive Sedan',
    engine: '1.5L - 1.8L Petrol',
    fuelEconomy: '14 - 17 km/L',
    totalPrice: 145000,
    minDeposit: 8000,
    defaultDurationWeeks: 104,
    recommendedFor: 'Corporate car service & premium ride-hailing'
  }
];

export interface WorkPayCalculation {
  totalPrice: number;
  depositAmount: number;
  durationWeeks: number;
  financedAmount: number;
  weeklyPayment: number;
  monthlyEstimate: number;
}

export function calculateWorkPayTerms(
  totalPrice: number,
  durationWeeks: number = 104,
  depositAmount: number = 5000
): WorkPayCalculation {
  const financedAmount = Math.max(0, totalPrice - depositAmount);
  const weeklyPayment = durationWeeks > 0 ? Math.ceil(financedAmount / durationWeeks) : 0;
  const monthlyEstimate = Math.round(weeklyPayment * 4.33);

  return {
    totalPrice,
    depositAmount,
    durationWeeks,
    financedAmount,
    weeklyPayment,
    monthlyEstimate
  };
}

export function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `MTA-WPA-${year}-${random}`;
}

export function generateAgreementNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MTA-WP-${year}-${random}`;
}

export function generateTicketNumber(): string {
  const random = Math.floor(10000 + Math.random() * 90000);
  return `MTA-TK-${random}`;
}

export function generateTransferCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MTA-TC-${year}-${random}`;
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `REC-WP-${timestamp}-${rand}`;
}

/**
 * Auto-generates the complete weekly installment amortization schedule for a contract.
 */
export function buildAmortizationSchedule(
  startDate: Date,
  durationWeeks: number,
  weeklyAmount: number,
  totalPrice: number,
  depositPaid: number
) {
  const schedule = [];
  const financed = Math.max(0, totalPrice - depositPaid);
  const targetPerWeek = weeklyAmount > 0
    ? weeklyAmount
    : (durationWeeks > 0 ? Math.round((financed / durationWeeks) * 100) / 100 : 0);

  for (let week = 1; week <= durationWeeks; week++) {
    const dueDate = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
    const amount = targetPerWeek;

    schedule.push({
      weekNumber: week,
      dueDate,
      targetAmount: amount,
      principalPortion: amount,
      feePortion: 0
    });
  }

  return schedule;
}

/**
 * Allocates a payment against an agreement's installments from oldest unpaid to newest.
 * Also updates agreement remaining balance and status.
 */
export async function allocatePaymentToInstallments(
  agreementId: string,
  paymentId: string,
  amount: number // in GHS
) {
  return await db.$transaction(async (tx) => {
    // 1. Get unpaid or partially paid installments ordered by weekNumber
    const installments = await (tx as any).workPayInstallment.findMany({
      where: {
        agreementId,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
      },
      orderBy: { weekNumber: 'asc' }
    });

    let remainingToAllocate = amount;
    const allocations = [];

    for (const inst of installments) {
      if (remainingToAllocate <= 0) break;

      const target = Number(inst.targetAmount);
      const alreadyPaid = Number(inst.amountPaid || 0);
      const needed = Math.max(0, target - alreadyPaid);

      if (needed <= 0) continue;

      const allocatedForThis = Math.min(remainingToAllocate, needed);
      remainingToAllocate -= allocatedForThis;

      const newPaid = alreadyPaid + allocatedForThis;
      const isFullyPaid = newPaid >= target;

      await (tx as any).workPayInstallment.update({
        where: { id: inst.id },
        data: {
          amountPaid: newPaid,
          status: isFullyPaid ? 'PAID' : 'PARTIAL',
          paidAt: isFullyPaid ? new Date() : inst.paidAt
        }
      });

      const alloc = await (tx as any).workPayPaymentAllocation.create({
        data: {
          paymentId,
          installmentId: inst.id,
          amount: allocatedForThis,
          principalPortion: allocatedForThis,
          feePortion: 0
        }
      });
      allocations.push(alloc);
    }

    // 2. Update Agreement financials
    const agreement = await (tx as any).workPayAgreement.findUnique({
      where: { id: agreementId }
    });

    if (agreement) {
      const currentTotalPaid = Number(agreement.totalPaid || 0);
      const newTotalPaid = currentTotalPaid + amount;
      const totalPrice = Number(agreement.totalPrice);
      const newRemainingBalance = Math.max(0, totalPrice - Number(agreement.depositPaid || 0) - newTotalPaid);

      // Check if any overdue installments remain
      const remainingOverdue = await (tx as any).workPayInstallment.count({
        where: {
          agreementId,
          status: 'OVERDUE'
        }
      });

      let nextStatus = agreement.status;
      if (newRemainingBalance <= 0) {
        nextStatus = 'COMPLETED';
      } else if (remainingOverdue === 0 && agreement.status === 'IN_ARREARS') {
        nextStatus = 'ACTIVE';
      }

      await (tx as any).workPayAgreement.update({
        where: { id: agreementId },
        data: {
          totalPaid: newTotalPaid,
          remainingBalance: newRemainingBalance,
          status: nextStatus,
          actualCompletionDate: nextStatus === 'COMPLETED' ? new Date() : agreement.actualCompletionDate
        }
      });

      // If program completed, auto-create ownership transfer record if not present
      if (nextStatus === 'COMPLETED') {
        const existingTransfer = await (tx as any).workPayOwnershipTransfer.findUnique({
          where: { agreementId }
        });
        if (!existingTransfer) {
          await (tx as any).workPayOwnershipTransfer.create({
            data: {
              agreementId,
              transferCertificateNumber: generateTransferCertificateNumber(),
              finalPayoffVerified: true,
              payoffVerifiedAt: new Date(),
              payoffVerifiedBy: 'SYSTEM_AUTOMATION',
              transferClearance: true,
              dvlaPaperworkStatus: 'PAPERS_SUBMITTED'
            }
          });
        }
      }
    }

    return allocations;
  });
}

/**
 * Re-evaluates arrears for an agreement, marking delinquent installments as OVERDUE
 * and updating the agreement status to IN_ARREARS if grace period has lapsed.
 */
export async function updateAgreementArrearsStatus(agreementId: string) {
  const agreement = await (txOrDb() as any).workPayAgreement.findUnique({
    where: { id: agreementId }
  });
  if (!agreement || ['COMPLETED', 'CANCELLED', 'OWNERSHIP_TRANSFERRED'].includes(agreement.status)) {
    return;
  }

  const now = new Date();
  const graceDays = agreement.gracePeriodDays ?? 3;
  const graceThreshold = new Date(now.getTime() - graceDays * 24 * 60 * 60 * 1000);

  // Update pending/partial installments whose due date has passed grace threshold to OVERDUE
  await (txOrDb() as any).workPayInstallment.updateMany({
    where: {
      agreementId,
      status: { in: ['PENDING', 'PARTIAL'] },
      dueDate: { lt: graceThreshold }
    },
    data: { status: 'OVERDUE' }
  });

  // Count overdue installments
  const overdueCount = await (txOrDb() as any).workPayInstallment.count({
    where: {
      agreementId,
      status: 'OVERDUE'
    }
  });

  if (overdueCount > 0 && agreement.status === 'ACTIVE') {
    await (txOrDb() as any).workPayAgreement.update({
      where: { id: agreementId },
      data: { status: 'IN_ARREARS' }
    });
  } else if (overdueCount === 0 && agreement.status === 'IN_ARREARS') {
    await (txOrDb() as any).workPayAgreement.update({
      where: { id: agreementId },
      data: { status: 'ACTIVE' }
    });
  }
}

function txOrDb() {
  return db;
}
