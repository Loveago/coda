import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getFeeSettings } from '@/lib/fees';
import { generatePaymentReference, initializePaystackPayment } from '@/lib/paystack';
import { getPortalMember } from '@/lib/members-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentType, memberId, agreementId, amount, customReference, callbackUrl } = body;

    const portal = await getPortalMember();
    const effectiveMemberId = memberId || portal?.id;

    const feeSettings = await getFeeSettings();
    const origin = new URL(request.url).origin;

    let targetAmountInPesewas = 0;
    let customerEmail = portal?.email || 'driver@mrtruthagency.com';
    let metadata: Record<string, any> = { paymentType };

    if (paymentType === 'REGISTRATION_FEE') {
      if (!feeSettings.registration.enabled) {
        return NextResponse.json({ error: 'Registration fee is currently disabled (free).' }, { status: 400 });
      }
      targetAmountInPesewas = feeSettings.registration.amount;
      metadata.memberId = effectiveMemberId;

      if (effectiveMemberId) {
        const member = await db.member.findUnique({ where: { id: effectiveMemberId } });
        if (member) customerEmail = member.email;
      }
    } else if (paymentType === 'ANNUAL_DUES') {
      if (!feeSettings.annualDues.enabled) {
        return NextResponse.json({ error: 'Annual dues are currently disabled (waived).' }, { status: 400 });
      }
      targetAmountInPesewas = feeSettings.annualDues.amount;
      metadata.memberId = effectiveMemberId;

      if (!effectiveMemberId) {
        return NextResponse.json({ error: 'Member login required to pay annual dues.' }, { status: 401 });
      }
      const member = await db.member.findUnique({ where: { id: effectiveMemberId } });
      if (!member) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
      customerEmail = member.email;
    } else if (paymentType === 'WORK_PAY_INSTALLMENT') {
      if (!agreementId) {
        return NextResponse.json({ error: 'Agreement ID is required for Work & Pay payments.' }, { status: 400 });
      }
      const agreement = await (db as any).workPayAgreement.findUnique({
        where: { id: agreementId }
      });
      if (!agreement) return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 });

      // Amount passed in GHS or default to weekly payment
      const ghsAmount = amount ? Number(amount) : Number(agreement.weeklyPayment);
      targetAmountInPesewas = Math.round(ghsAmount * 100);
      customerEmail = agreement.driverEmail || portal?.email || 'driver@mrtruthagency.com';
      metadata.agreementId = agreementId;
      metadata.agreementNumber = agreement.agreementNumber;
      metadata.driverName = agreement.driverName;
    } else if (paymentType === 'WORK_PAY_DEPOSIT') {
      if (!agreementId) {
        return NextResponse.json({ error: 'Agreement ID is required for deposit payment.' }, { status: 400 });
      }
      const agreement = await (db as any).workPayAgreement.findUnique({
        where: { id: agreementId }
      });
      if (!agreement) return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 });

      const ghsAmount = amount ? Number(amount) : Number(agreement.depositRequired);
      targetAmountInPesewas = Math.round(ghsAmount * 100);
      customerEmail = agreement.driverEmail || portal?.email || 'driver@mrtruthagency.com';
      metadata.agreementId = agreementId;
    } else {
      return NextResponse.json({ error: 'Invalid payment type.' }, { status: 400 });
    }

    const reference = customReference || generatePaymentReference(
      paymentType === 'REGISTRATION_FEE' ? 'REG' :
      paymentType === 'ANNUAL_DUES' ? 'DUES' :
      paymentType === 'WORK_PAY_INSTALLMENT' ? 'WP-PAY' : 'WP-DEP'
    );

    // If it's a member payment, track in Payment table
    if (effectiveMemberId && (paymentType === 'REGISTRATION_FEE' || paymentType === 'ANNUAL_DUES')) {
      await db.payment.create({
        data: {
          memberId: effectiveMemberId,
          type: paymentType as any,
          amount: targetAmountInPesewas,
          currency: 'GHS',
          reference,
          status: 'PENDING',
          metadata
        }
      });
    }

    // If it's a Work & Pay payment, track pending record in WorkPayPayment table
    if (paymentType === 'WORK_PAY_INSTALLMENT' || paymentType === 'WORK_PAY_DEPOSIT') {
      const ghsAmount = targetAmountInPesewas / 100;
      await (db as any).workPayPayment.create({
        data: {
          reference,
          agreementId,
          amount: ghsAmount,
          paymentMethod: 'PAYSTACK_MOMO',
          status: 'PENDING',
          paystackReference: reference,
          notes: paymentType === 'WORK_PAY_DEPOSIT' ? 'Security deposit checkout' : 'Weekly installment checkout'
        }
      });
    }

    const resolvedCallback = callbackUrl || `${origin}/api/payments/paystack/verify`;

    const paystackRes = await initializePaystackPayment({
      email: customerEmail,
      amountInPesewas: targetAmountInPesewas,
      reference,
      callbackUrl: resolvedCallback,
      metadata
    });

    return NextResponse.json({
      success: true,
      authorization_url: paystackRes.authorization_url,
      reference: paystackRes.reference
    });
  } catch (error: any) {
    console.error('Payment init route error:', error);
    return NextResponse.json({ error: error.message || 'Payment initialization failed.' }, { status: 500 });
  }
}
