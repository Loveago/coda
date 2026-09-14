import { db } from '@/lib/db';
import { verifyPaystackPayment } from '@/lib/paystack';
import { allocatePaymentToInstallments, updateAgreementArrearsStatus } from '@/lib/work-pay';

export interface ProcessPaymentResult {
  success: boolean;
  alreadyProcessed?: boolean;
  type?: string;
  memberId?: string;
  agreementId?: string;
  paymentId?: string;
  error?: string;
}

/**
 * Idempotently process a Paystack payment reference.
 * Handles Membership Registration Fee, Annual Dues, and Work & Pay weekly installments/deposits.
 */
export async function processVerifiedPayment(reference: string): Promise<ProcessPaymentResult> {
  try {
    // 1. Check if reference already processed in Payment table
    const existingMemberPayment = await db.payment.findUnique({
      where: { reference },
      include: { member: true }
    });

    if (existingMemberPayment && existingMemberPayment.status === 'SUCCESSFUL') {
      return {
        success: true,
        alreadyProcessed: true,
        type: existingMemberPayment.type,
        memberId: existingMemberPayment.memberId,
        paymentId: existingMemberPayment.id
      };
    }

    // Check if reference already processed in WorkPayPayment table
    const existingWpPayment = await (db as any).workPayPayment.findUnique({
      where: { reference }
    });

    if (existingWpPayment && existingWpPayment.status === 'SUCCESSFUL') {
      return {
        success: true,
        alreadyProcessed: true,
        type: 'WORK_PAY_INSTALLMENT',
        agreementId: existingWpPayment.agreementId,
        paymentId: existingWpPayment.id
      };
    }

    // 2. Query Paystack to verify actual payment on Paystack's ledger
    const verification = await verifyPaystackPayment(reference);
    if (!verification.status || verification.data.status !== 'success') {
      return {
        success: false,
        error: verification.message || 'Payment not verified as successful by provider.'
      };
    }

    const { amount, paid_at, channel, metadata, authorization, id: txnId } = verification.data;
    const paidDate = paid_at ? new Date(paid_at) : new Date();
    let paymentType = metadata?.paymentType || existingMemberPayment?.type;
    if (!paymentType && existingWpPayment) {
      paymentType = reference.includes('-WP-DEP-') ? 'WORK_PAY_DEPOSIT' : 'WORK_PAY_INSTALLMENT';
    } else if (!paymentType) {
      if (reference.includes('-WP-DEP-')) paymentType = 'WORK_PAY_DEPOSIT';
      else if (reference.includes('-WP-PAY-')) paymentType = 'WORK_PAY_INSTALLMENT';
      else if (reference.includes('-DUES-')) paymentType = 'ANNUAL_DUES';
      else paymentType = 'REGISTRATION_FEE';
    }

    // 3. Handle Membership Registration Fee
    if (paymentType === 'REGISTRATION_FEE') {
      const memberId = metadata?.memberId || existingMemberPayment?.memberId;
      if (!memberId) return { success: false, error: 'No member associated with registration payment.' };

      await db.$transaction(async (tx) => {
        // Upsert payment record
        if (existingMemberPayment) {
          await tx.payment.update({
            where: { id: existingMemberPayment.id },
            data: {
              status: 'SUCCESSFUL',
              paidAt: paidDate,
              providerTransactionId: String(txnId)
            }
          });
        } else {
          await tx.payment.create({
            data: {
              memberId,
              type: 'REGISTRATION_FEE',
              amount,
              currency: 'GHS',
              reference,
              status: 'SUCCESSFUL',
              paidAt: paidDate,
              providerTransactionId: String(txnId),
              metadata
            }
          });
        }

        // Activate member
        const oneYearFromNow = new Date(paidDate.getTime() + 365 * 24 * 60 * 60 * 1000);
        await tx.member.update({
          where: { id: memberId },
          data: {
            registrationPayment: 'PAID',
            status: 'APPROVED',
            membershipStartDate: paidDate,
            membershipEndDate: oneYearFromNow
          }
        });
      });

      return { success: true, type: 'REGISTRATION_FEE', memberId };
    }

    // 4. Handle Annual Membership Dues
    if (paymentType === 'ANNUAL_DUES') {
      const memberId = metadata?.memberId || existingMemberPayment?.memberId;
      if (!memberId) return { success: false, error: 'No member associated with dues payment.' };

      const member = await db.member.findUnique({ where: { id: memberId } });
      if (!member) return { success: false, error: 'Member not found.' };

      let nextEndDate: Date;
      if (member.membershipEndDate && member.membershipEndDate > paidDate) {
        nextEndDate = new Date(member.membershipEndDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      } else {
        nextEndDate = new Date(paidDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      }

      await db.$transaction(async (tx) => {
        if (existingMemberPayment) {
          await tx.payment.update({
            where: { id: existingMemberPayment.id },
            data: {
              status: 'SUCCESSFUL',
              paidAt: paidDate,
              providerTransactionId: String(txnId)
            }
          });
        } else {
          await tx.payment.create({
            data: {
              memberId,
              type: 'ANNUAL_DUES',
              amount,
              currency: 'GHS',
              reference,
              status: 'SUCCESSFUL',
              paidAt: paidDate,
              providerTransactionId: String(txnId),
              metadata
            }
          });
        }

        await tx.member.update({
          where: { id: memberId },
          data: {
            membershipEndDate: nextEndDate,
            status: 'APPROVED'
          }
        });
      });

      return { success: true, type: 'ANNUAL_DUES', memberId };
    }

    // 5. Handle Work & Pay Weekly Installment
    if (paymentType === 'WORK_PAY_INSTALLMENT') {
      const agreementId = metadata?.agreementId || existingWpPayment?.agreementId;
      if (!agreementId) return { success: false, error: 'No agreement associated with Work & Pay payment.' };

      const ghsAmount = amount / 100; // Pesewas to GHS
      const channelLabel = authorization?.mobile_money_provider || (channel === 'card' ? 'Paystack Card' : 'Mobile Money');

      let paymentRecord = existingWpPayment;
      if (existingWpPayment) {
        paymentRecord = await (db as any).workPayPayment.update({
          where: { id: existingWpPayment.id },
          data: {
            status: 'SUCCESSFUL',
            amount: ghsAmount,
            paymentDate: paidDate,
            paymentMethod: channel === 'card' ? 'PAYSTACK_CARD' : 'PAYSTACK_MOMO',
            paystackReference: reference,
            paystackTransactionId: String(txnId),
            channelDetails: channelLabel,
            notes: `Online Paystack payment (${channelLabel})`
          }
        });
      } else {
        paymentRecord = await (db as any).workPayPayment.create({
          data: {
            reference,
            agreementId,
            amount: ghsAmount,
            paymentDate: paidDate,
            paymentMethod: channel === 'card' ? 'PAYSTACK_CARD' : 'PAYSTACK_MOMO',
            paystackReference: reference,
            paystackTransactionId: String(txnId),
            channelDetails: channelLabel,
            status: 'SUCCESSFUL',
            notes: `Online Paystack payment (${channelLabel})`
          }
        });
      }

      // Allocate payment to installments and update balances
      await allocatePaymentToInstallments(agreementId, paymentRecord.id, ghsAmount);
      await updateAgreementArrearsStatus(agreementId);

      return {
        success: true,
        type: 'WORK_PAY_INSTALLMENT',
        agreementId,
        paymentId: paymentRecord.id
      };
    }

    // 6. Handle Work & Pay Security Deposit
    if (paymentType === 'WORK_PAY_DEPOSIT') {
      const agreementId = metadata?.agreementId || existingWpPayment?.agreementId;
      if (!agreementId) return { success: false, error: 'No agreement ID provided for deposit.' };

      const ghsAmount = amount / 100;
      const channelLabel = authorization?.mobile_money_provider || (channel === 'card' ? 'Paystack Card' : 'Mobile Money');

      let depositPayment = existingWpPayment;
      if (existingWpPayment) {
        depositPayment = await (db as any).workPayPayment.update({
          where: { id: existingWpPayment.id },
          data: {
            status: 'SUCCESSFUL',
            amount: ghsAmount,
            paymentDate: paidDate,
            paymentMethod: channel === 'card' ? 'PAYSTACK_CARD' : 'PAYSTACK_MOMO',
            paystackReference: reference,
            paystackTransactionId: String(txnId),
            channelDetails: channelLabel,
            notes: `Security deposit payment (${channelLabel})`
          }
        });
      } else {
        depositPayment = await (db as any).workPayPayment.create({
          data: {
            reference,
            agreementId,
            amount: ghsAmount,
            paymentDate: paidDate,
            paymentMethod: channel === 'card' ? 'PAYSTACK_CARD' : 'PAYSTACK_MOMO',
            paystackReference: reference,
            paystackTransactionId: String(txnId),
            channelDetails: channelLabel,
            status: 'SUCCESSFUL',
            notes: `Security deposit payment (${channelLabel})`
          }
        });
      }

      // Update agreement deposit balance and remaining balance
      const agreement = await (db as any).workPayAgreement.findUnique({ where: { id: agreementId } });
      if (agreement) {
        const currentDeposit = Number(agreement.depositPaid || 0);
        const newDeposit = currentDeposit + ghsAmount;
        const newRemaining = Math.max(0, Number(agreement.totalPrice) - newDeposit - Number(agreement.totalPaid || 0));

        await (db as any).workPayAgreement.update({
          where: { id: agreementId },
          data: {
            depositPaid: newDeposit,
            remainingBalance: newRemaining,
            status: agreement.status === 'PENDING_SIGNATURE' ? 'ACTIVE' : agreement.status
          }
        });

        // Record in WorkPaySecurityDeposit
        await (db as any).workPaySecurityDeposit.upsert({
          where: { id: `deposit-${agreementId}` },
          create: {
            id: `deposit-${agreementId}`,
            agreementId,
            targetAmount: Number(agreement.depositRequired),
            amountPaid: newDeposit,
            balance: newDeposit,
            status: newDeposit >= Number(agreement.depositRequired) ? 'HELD' : 'PENDING'
          },
          update: {
            amountPaid: newDeposit,
            balance: newDeposit,
            status: newDeposit >= Number(agreement.depositRequired) ? 'HELD' : 'PENDING'
          }
        });
      }

      return {
        success: true,
        type: 'WORK_PAY_DEPOSIT',
        agreementId,
        paymentId: depositPayment.id
      };
    }

    return { success: false, error: `Unsupported payment type: ${paymentType}` };
  } catch (err: any) {
    console.error('Error processing payment reference:', err);
    return { success: false, error: err.message || 'Payment processing failed.' };
  }
}
