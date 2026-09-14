import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const agreements = await (db as any).workPayAgreement.findMany({
      select: {
        id: true,
        agreementNumber: true,
        driverName: true,
        driverPhone: true,
        totalPrice: true,
        depositRequired: true,
        depositPaid: true,
        status: true,
        vehicle: { select: { make: true, model: true } },
        securityDeposits: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, agreements });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { agreementId, action, amount, reason } = body;

    const agreement = await (db as any).workPayAgreement.findUnique({
      where: { id: agreementId }
    });
    if (!agreement) return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 });

    const numAmount = Number(amount);
    const depositRecord = await (db as any).workPaySecurityDeposit.upsert({
      where: { id: `deposit-${agreementId}` },
      create: {
        id: `deposit-${agreementId}`,
        agreementId,
        targetAmount: Number(agreement.depositRequired),
        amountPaid: Number(agreement.depositPaid || 0),
        balance: Number(agreement.depositPaid || 0),
        status: 'HELD'
      },
      update: {}
    });

    if (action === 'DEDUCT') {
      const newDeductions = Number(depositRecord.deductions || 0) + numAmount;
      const newBalance = Math.max(0, Number(depositRecord.balance) - numAmount);

      await (db as any).workPaySecurityDeposit.update({
        where: { id: depositRecord.id },
        data: {
          deductions: newDeductions,
          balance: newBalance,
          deductionReason: reason || 'Deduction for damages / arrears',
          status: newBalance <= 0 ? 'FULLY_DEDUCTED' : 'PARTIALLY_DEDUCTED'
        }
      });

      await (db as any).workPayAuditLog.create({
        data: {
          agreementId,
          userId: admin.id,
          action: 'DEPOSIT_DEDUCTION',
          details: `Security deposit deduction of GHS ${numAmount} recorded by ${admin.name}. Reason: ${reason}`
        }
      });
    } else if (action === 'REFUND') {
      await (db as any).workPaySecurityDeposit.update({
        where: { id: depositRecord.id },
        data: {
          refundAmount: numAmount,
          refundDate: new Date(),
          balance: 0,
          status: 'REFUNDED'
        }
      });

      await (db as any).workPayAuditLog.create({
        data: {
          agreementId,
          userId: admin.id,
          action: 'DEPOSIT_REFUND',
          details: `Security deposit refund of GHS ${numAmount} processed by ${admin.name}.`
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Operation failed.' }, { status: 500 });
  }
}
