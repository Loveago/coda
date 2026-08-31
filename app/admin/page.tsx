import Link from 'next/link';
import '../globals.css';
import { db } from '@/lib/db';
import { APPLICATION_FILTER } from '@/lib/membership';
import { WORK_APPLICATION_FILTER } from '@/lib/work-applications';
import { formatGhs } from '@/lib/fees';
import {
  Briefcase, CarFront, Inbox, TrendingDown, TrendingUp, Users, Wallet
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(date: Date) {
  const mins = Math.round((Date.now() - date.getTime()) / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(date);
}

function pctChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export default async function Admin() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    members, newMembersThisMonth, newMembersPrevMonth,
    applications, newAppsThisMonth, newAppsPrevMonth,
    revenueThisMonth, revenuePrevMonth, revenueSeries, revenueByType,
    vehicles, newVehiclesThisMonth, newVehiclesPrevMonth,
    workApplications, newWorkAppsThisMonth,
    recentApps, recentPayments, latestMessages, recentWorkApps
  ] = await Promise.all([
    db.member.count({ where: { status: 'APPROVED' } }),
    db.member.count({ where: { status: 'APPROVED', createdAt: { gte: monthStart } } }),
    db.member.count({ where: { status: 'APPROVED', createdAt: { gte: prevMonthStart, lt: monthStart } } }),
    db.member.count({ where: APPLICATION_FILTER }),
    db.member.count({ where: { ...APPLICATION_FILTER, createdAt: { gte: monthStart } } }),
    db.member.count({ where: { ...APPLICATION_FILTER, createdAt: { gte: prevMonthStart, lt: monthStart } } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: 'SUCCESSFUL', paidAt: { gte: monthStart } } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: 'SUCCESSFUL', paidAt: { gte: prevMonthStart, lt: monthStart } } }),
    db.payment.findMany({
      where: { status: 'SUCCESSFUL', paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true }
    }),
    db.payment.groupBy({ by: ['type'], _sum: { amount: true }, where: { status: 'SUCCESSFUL' } }),
    db.vehicle.count({ where: { availability: { not: 'SOLD' } } }),
    db.vehicle.count({ where: { createdAt: { gte: monthStart } } }),
    db.vehicle.count({ where: { createdAt: { gte: prevMonthStart, lt: monthStart } } }),
    db.workApplication.count({ where: WORK_APPLICATION_FILTER }),
    db.workApplication.count({ where: { ...WORK_APPLICATION_FILTER, createdAt: { gte: monthStart } } }),
    db.member.findMany({ where: APPLICATION_FILTER, select: { id: true, firstName: true, lastName: true, platform: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
    db.payment.findMany({ where: { status: 'SUCCESSFUL' }, select: { id: true, type: true, amount: true, createdAt: true, member: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 5 }),
    db.contactMessage.findMany({ select: { id: true, name: true, subject: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
    db.workApplication.findMany({ where: WORK_APPLICATION_FILTER, select: { id: true, position: true, status: true, createdAt: true, member: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 5 })
  ]);

  const revThis = revenueThisMonth._sum.amount ?? 0;
  const revPrev = revenuePrevMonth._sum.amount ?? 0;

  // Monthly revenue series (last 6 months)
  const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'short' });
  const buckets: { label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const total = revenueSeries
      .filter((p) => p.paidAt && p.paidAt >= start && p.paidAt < end)
      .reduce((sum, p) => sum + p.amount, 0);
    buckets.push({ label: monthFormatter.format(start), total });
  }
  const maxBucket = Math.max(1, ...buckets.map((b) => b.total));

  // Line chart geometry
  const chartW = 560;
  const chartH = 210;
  const padX = 34;
  const padY = 18;
  const points = buckets.map((bucket, index) => {
    const x = padX + (index * (chartW - padX * 2)) / (buckets.length - 1);
    const y = chartH - padY - ((chartH - padY * 2) * bucket.total) / maxBucket;
    return { ...bucket, x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${chartH - padY} L${points[0].x.toFixed(1)},${chartH - padY} Z`;
  const peak = points.reduce((best, p) => (p.total > best.total ? p : best), points[0]);

  // Donut geometry
  const duesTotal = revenueByType.find((r) => r.type === 'ANNUAL_DUES')?._sum.amount ?? 0;
  const regTotal = revenueByType.find((r) => r.type === 'REGISTRATION_FEE')?._sum.amount ?? 0;
  const otherTotal = Math.max(0, (duesTotal + regTotal > 0 ? 0 : 0));
  const donutTotal = Math.max(1, duesTotal + regTotal + otherTotal);
  const donutSegments = [
    { label: 'Annual Dues', value: duesTotal, color: '#FF6B00' },
    { label: 'Registration Fee', value: regTotal, color: '#1A1A1A' },
    { label: 'Other', value: otherTotal, color: '#C65300' }
  ];
  const circumference = 2 * Math.PI * 54;
  let donutOffset = 0;

  const cards = [
    { label: 'Total Members', value: members.toLocaleString(), sub: `+${newMembersThisMonth} this month`, Icon: Users, tone: 'blue', trend: pctChange(newMembersThisMonth, newMembersPrevMonth) },
    { label: 'Pending Applications', value: applications.toLocaleString(), sub: `+${newAppsThisMonth} this month`, Icon: Inbox, tone: 'amber', trend: pctChange(newAppsThisMonth, newAppsPrevMonth) },
    { label: 'Work Applications', value: workApplications.toLocaleString(), sub: `+${newWorkAppsThisMonth} this month`, Icon: Briefcase, tone: 'green', trend: pctChange(newWorkAppsThisMonth, 0) },
    { label: 'Monthly Revenue', value: formatGhs(revThis), sub: 'This month', Icon: Wallet, tone: 'green', trend: pctChange(revThis, revPrev) },
    { label: 'Total Vehicles', value: vehicles.toLocaleString(), sub: `+${newVehiclesThisMonth} this month`, Icon: CarFront, tone: 'red', trend: pctChange(newVehiclesThisMonth, newVehiclesPrevMonth) }
  ] as const;

  return (
    <main>
      <div className="admin-head">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening with your platform.</p>
        </div>
        <select className="admin-range" defaultValue="month" aria-label="Reporting period">
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="astats astats-5">
        {cards.map(({ label, value, sub, Icon, tone, trend }) => (
          <div className="astat" key={label}>
            <div className="astat-top">
              <span className={`astat-icon tone-${tone}`}><Icon size={20} /></span>
              <span className={`astat-trend ${trend >= 0 ? 'up' : 'down'}`}>
                {trend >= 0 ? <TrendingUp size={11} style={{ verticalAlign: -1, marginRight: 3 }} /> : <TrendingDown size={11} style={{ verticalAlign: -1, marginRight: 3 }} />}
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            </div>
            <strong>{value}</strong>
            <span>{label}</span>
            <small>{sub}</small>
          </div>
        ))}
      </div>

      <div className="admin-charts">
        <div className="admin-panel">
          <div className="chart-head">
            <h2>Revenue Overview</h2>
            <span className="chart-badge">{formatGhs(peak.total)} peak</span>
          </div>
          <svg className="line-chart" viewBox={`0 0 ${chartW} ${chartH}`} role="img" aria-label="Monthly revenue over the last six months">
            <defs>
              <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B00" stopOpacity=".22" />
                <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75, 1].map((fraction) => (
              <line key={fraction} className="line-grid" x1={padX} x2={chartW - padX} y1={chartH - padY - (chartH - padY * 2) * fraction} y2={chartH - padY - (chartH - padY * 2) * fraction} />
            ))}
            <path className="line-area" d={areaPath} />
            <path className="line-path" d={linePath} />
            {points.map((p) => (
              <circle key={p.label} className="line-dot" cx={p.x} cy={p.y} r="4" />
            ))}
            {points.map((p) => (
              <text key={`label-${p.label}`} className="line-label" x={p.x} y={chartH - 2} textAnchor="middle">{p.label}</text>
            ))}
          </svg>
        </div>
        <div className="admin-panel">
          <div className="chart-head"><h2>Revenue by Type</h2></div>
          <div className="donut-wrap">
            <svg className="donut-svg" viewBox="0 0 140 140" role="img" aria-label="Revenue split by payment type">
              <circle cx="70" cy="70" r="54" fill="none" stroke="#F1F1F1" strokeWidth="18" />
              {donutSegments.map((segment) => {
                const share = segment.value / donutTotal;
                const dash = `${(share * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
                const el = (
                  <circle
                    key={segment.label}
                    cx="70" cy="70" r="54" fill="none"
                    stroke={segment.color} strokeWidth="18"
                    strokeDasharray={dash}
                    strokeDashoffset={(-donutOffset * circumference).toFixed(2)}
                    transform="rotate(-90 70 70)"
                  />
                );
                donutOffset += share;
                return el;
              })}
              <text x="70" y="66" textAnchor="middle" className="fin-donut-total">{formatGhs(duesTotal + regTotal + otherTotal)}</text>
              <text x="70" y="82" textAnchor="middle" className="fin-donut-sub">TOTAL COLLECTED</text>
            </svg>
            <div className="donut-legend">
              {donutSegments.map((segment) => (
                <span key={segment.label}>
                  <i style={{ background: segment.color }} /> {segment.label}
                  <strong>{Math.round((segment.value / donutTotal) * 100)}%</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-recent">
        <div className="admin-panel">
          <h2>Recent Applications <Link href="/admin/applications">View all applications</Link></h2>
          <div className="rlist">
            {recentApps.length === 0 ? <p className="admin-note">No pending applications right now.</p> : recentApps.map((app) => (
              <div className="ritem" key={app.id}>
                <span className="ravatar">{initials(`${app.firstName} ${app.lastName}`)}</span>
                <span className="rmain">
                  <strong>{app.firstName} {app.lastName}</strong>
                  <small>{app.platform || 'Driver'}</small>
                </span>
                <span className="rside"><span className="badge badge-PENDING">Pending</span></span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-panel">
          <h2>Recent Payments <Link href="/admin/payments">View all payments</Link></h2>
          <div className="rlist">
            {recentPayments.length === 0 ? <p className="admin-note">No successful payments yet.</p> : recentPayments.map((payment) => (
              <div className="ritem" key={payment.id}>
                <span className="ravatar tone-green">{initials(`${payment.member.firstName} ${payment.member.lastName}`)}</span>
                <span className="rmain">
                  <strong>{payment.type === 'ANNUAL_DUES' ? 'Annual Dues' : 'Registration'}</strong>
                  <small>{payment.member.firstName} {payment.member.lastName}</small>
                </span>
                <span className="rside">
                  <strong>{formatGhs(payment.amount)}</strong>
                  <small>Paid · {timeAgo(payment.createdAt)}</small>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-panel">
          <h2>Recent Work Applications <Link href="/admin/work-applications">View all</Link></h2>
          <div className="rlist">
            {recentWorkApps.length === 0 ? <p className="admin-note">No submitted work applications yet.</p> : recentWorkApps.map((app) => (
              <div className="ritem" key={app.id}>
                <span className="ravatar tone-green">{initials(`${app.member.firstName} ${app.member.lastName}`)}</span>
                <span className="rmain">
                  <strong>{app.position}</strong>
                  <small>{app.member.firstName} {app.member.lastName}</small>
                </span>
                <span className="rside"><span className={`badge ${app.status === 'HIRED' ? 'badge-active' : app.status === 'REJECTED' ? 'badge-REJECTED' : 'badge-PENDING'}`}>{app.status}</span></span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-panel">
          <h2>Latest Messages <Link href="/admin/messages">View all</Link></h2>
          <div className="rlist">
            {latestMessages.length === 0 ? <p className="admin-note">Inbox is empty.</p> : latestMessages.map((message) => (
              <div className="ritem" key={message.id}>
                <span className="ravatar">{initials(message.name)}</span>
                <span className="rmain">
                  <strong>{message.name}</strong>
                  <small>{message.subject}</small>
                </span>
                <span className="rside"><small>{timeAgo(message.createdAt)}</small></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
