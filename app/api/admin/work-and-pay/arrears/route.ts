import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const overdueInstallments = await (db as any).workPayInstallment.findMany({
      where: { status: 'OVERDUE' },
      include: {
        agreement: {
          include: {
            vehicle: true,
            member: { select: { phone: true, email: true } }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Group installments by agreement
    const map = new Map<string, any>();
    const now = new Date();

    for (const inst of overdueInstallments) {
      const ag = inst.agreement;
      if (!ag) continue;

      if (!map.has(ag.id)) {
        map.set(ag.id, {
          agreementId: ag.id,
          agreementNumber: ag.agreementNumber,
          driverName: ag.driverName,
          driverPhone: ag.driverPhone,
          driverEmail: ag.driverEmail,
          vehicle: ag.vehicle,
          weeklyPayment: Number(ag.weeklyPayment),
          status: ag.status,
          overdueInstallments: [],
          totalOverdueAmount: 0,
          maxDaysDelinquent: 0
        });
      }

      const entry = map.get(ag.id);
      const target = Number(inst.targetAmount);
      const paid = Number(inst.amountPaid || 0);
      const owing = Math.max(0, target - paid);
      const days = Math.max(0, Math.floor((now.getTime() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24)));

      entry.totalOverdueAmount += owing;
      if (days > entry.maxDaysDelinquent) entry.maxDaysDelinquent = days;

      entry.overdueInstallments.push({
        id: inst.id,
        weekNumber: inst.weekNumber,
        dueDate: inst.dueDate,
        owing,
        daysDelinquent: days
      });
    }

    const delinquentAccounts = Array.from(map.values()).sort((a, b) => b.maxDaysDelinquent - a.maxDaysDelinquent);

    return NextResponse.json({ success: true, accounts: delinquentAccounts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
