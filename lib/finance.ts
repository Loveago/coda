import { db } from '@/lib/db';

export type MonthPoint = {
  key: string;
  label: string;
  registration: number;
  dues: number;
  applications: number;
  total: number;
  count: number;
};

export type TopPayer = {
  memberId: string;
  name: string;
  memberNumber: string;
  total: number;
  payments: number;
};

export type FinanceAnalytics = {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  monthGrowthPct: number | null;
  todayRevenue: number;
  registrationRevenue: number;
  duesRevenue: number;
  applicationRevenue: number;
  transactionCount: number;
  successRate: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
  refundedAmount: number;
  averageTransaction: number;
  months: MonthPoint[];
  topPayers: TopPayer[];
  recent: {
    id: string;
    reference: string;
    memberName: string;
    memberNumber: string;
    type: string;
    amount: number;
    status: string;
    date: Date;
  }[];
};

/**
 * Aggregates the full payment ledger into analytics. Amounts are pesewas
 * (GHS * 100), matching the Payment model. The ledger is small (membership
 * fees), so grouping happens in JS to stay dialect-agnostic.
 */
export async function getFinanceAnalytics(monthsBack = 12): Promise<FinanceAnalytics> {
  const [successful, allGrouped, recent] = await Promise.all([
    db.payment.findMany({
      where: { status: 'SUCCESSFUL' },
      select: { id: true, memberId: true, type: true, amount: true, paidAt: true, createdAt: true, member: { select: { firstName: true, lastName: true, memberNumber: true } } }
    }),
    db.payment.groupBy({ by: ['status'], _count: { _all: true }, _sum: { amount: true } }),
    db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, reference: true, type: true, amount: true, status: true, createdAt: true, member: { select: { firstName: true, lastName: true, memberNumber: true } } }
    })
  ]);

  const now = new Date();
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const effectiveDate = (p: { paidAt: Date | null; createdAt: Date }) => p.paidAt ?? p.createdAt;

  // --- Monthly series (last `monthsBack` calendar months, oldest first) ---
  const series: MonthPoint[] = [];
  const seriesIndex = new Map<string, MonthPoint>();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const point: MonthPoint = {
      key: monthKey(d),
      label: new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d),
      registration: 0,
      dues: 0,
      applications: 0,
      total: 0,
      count: 0
    };
    series.push(point);
    seriesIndex.set(point.key, point);
  }

  let totalRevenue = 0;
  let registrationRevenue = 0;
  let duesRevenue = 0;
  let applicationRevenue = 0;
  let todayRevenue = 0;
  const payerMap = new Map<string, TopPayer>();
  const todayKey = now.toDateString();

  for (const p of successful) {
    const when = effectiveDate(p);
    totalRevenue += p.amount;
    if (p.type === 'REGISTRATION_FEE') registrationRevenue += p.amount;
    else if (p.type === 'WORK_APPLICATION_FEE') applicationRevenue += p.amount;
    else duesRevenue += p.amount;
    if (when.toDateString() === todayKey) todayRevenue += p.amount;

    const point = seriesIndex.get(monthKey(when));
    if (point) {
      point.total += p.amount;
      point.count += 1;
      if (p.type === 'REGISTRATION_FEE') point.registration += p.amount;
      else if (p.type === 'WORK_APPLICATION_FEE') point.applications += p.amount;
      else point.dues += p.amount;
    }

    const payer = payerMap.get(p.memberId) ?? {
      memberId: p.memberId,
      name: `${p.member.firstName} ${p.member.lastName}`,
      memberNumber: p.member.memberNumber,
      total: 0,
      payments: 0
    };
    payer.total += p.amount;
    payer.payments += 1;
    payerMap.set(p.memberId, payer);
  }

  const thisMonth = series[series.length - 1]?.total ?? 0;
  const lastMonth = series[series.length - 2]?.total ?? 0;
  const monthGrowthPct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : thisMonth > 0 ? 100 : null;

  const statusRow = (status: string) => allGrouped.find((row) => row.status === status);
  const successCount = statusRow('SUCCESSFUL')?._count._all ?? 0;
  const totalCount = allGrouped.reduce((sum, row) => sum + row._count._all, 0);

  return {
    totalRevenue,
    thisMonthRevenue: thisMonth,
    lastMonthRevenue: lastMonth,
    monthGrowthPct,
    todayRevenue,
    registrationRevenue,
    duesRevenue,
    applicationRevenue,
    transactionCount: successCount,
    successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
    pendingCount: statusRow('PENDING')?._count._all ?? 0,
    pendingAmount: statusRow('PENDING')?._sum.amount ?? 0,
    failedCount: statusRow('FAILED')?._count._all ?? 0,
    refundedAmount: statusRow('REFUNDED')?._sum.amount ?? 0,
    averageTransaction: successCount > 0 ? Math.round(totalRevenue / successCount) : 0,
    months: series,
    topPayers: [...payerMap.values()].sort((a, b) => b.total - a.total).slice(0, 5),
    recent: recent.map((p) => ({
      id: p.id,
      reference: p.reference,
      memberName: `${p.member.firstName} ${p.member.lastName}`,
      memberNumber: p.member.memberNumber,
      type: p.type,
      amount: p.amount,
      status: p.status,
      date: p.createdAt
    }))
  };
}
