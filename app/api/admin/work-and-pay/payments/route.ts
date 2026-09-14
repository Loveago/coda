import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import { allocatePaymentToInstallments, generateReceiptNumber, updateAgreementArrearsStatus } from '@/lib/work-pay';

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const method = searchParams.get('method');

  try {
    const payments = await (db as any).workPayPayment.findMany({
      where: method && method !== 'ALL' ? { paymentMethod: method } : undefined,
      orderBy: { paymentDate: 'desc' },
      include: {
        agreement: {
          include: {
            vehicle: true,
            member: { select: { memberNumber: true } }
          }
        }
      }
    });

    return NextResponse.json({ success: true, payments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { agreementId, amount, paymentMethod, receiptNumber, notes } = body;

    if (!agreementId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid agreement ID and amount required.' }, { status: 400 });
    }

    const numAmount = Number(amount);
    const resolvedReceipt = receiptNumber || generateReceiptNumber();
    const ref = `OFFLINE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newPayment = await (db as any).workPayPayment.create({
      data: {
        reference: ref,
        agreementId,
        amount: numAmount,
        paymentDate: new Date(),
        paymentMethod: paymentMethod || 'CASH_OFFLINE',
        channelDetails: paymentMethod === 'BANK_TRANSFER' ? 'Bank Deposit / Wire' : 'Cash (Office Walk-in)',
        verifiedBy: admin.name || admin.email,
        receiptNumber: resolvedReceipt,
        notes: notes || 'Manual offline payment recorded by admin',
        status: 'SUCCESSFUL'
      }
    });

    // Allocate payment to installments and update balances
    await allocatePaymentToInstallments(agreementId, newPayment.id, numAmount);
    await updateAgreementArrearsStatus(agreementId);

    // Write audit log
    await (db as any).workPayAuditLog.create({
      data: {
        agreementId,
        userId: admin.id,
        action: 'PAYMENT_RECORDED',
        details: `Manual offline payment of GHS ${numAmount} recorded with receipt ${resolvedReceipt} by ${admin.name}`
      }
    });

    return NextResponse.json({ success: true, payment: newPayment }, { status: 201 });
  } catch (err: any) {
    console.error('Record payment error:', err);
    return NextResponse.json({ error: err.message || 'Failed to record payment.' }, { status: 500 });
  }
}
