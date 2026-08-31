import Link from 'next/link';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Banknote, CalendarDays, CircleDollarSign, Percent, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { db } from '@/lib/db';
import { formatGhs } from '@/lib/fees';
import { getFinanceAnalytics } from '@/lib/finance';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

function Sparkline({ months }: { months: { total: number; label: string }[] }) {
  const max = Math.max(...months.map((m) => m.total), 1);
  const width = 720;
  const height = 220;
  const pad = { top: 18, right: 8, bottom: 30, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const step = innerW / months.length;
  const barW = Math.min(step * 0.52, 34);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="fin-chart" role="img" aria-label="Monthly collected revenue">
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={pad.left} x2={width - pad.right} y1={pad.top + innerH * (1 - t)} y2={pad.top + innerH * (1 - t)} stroke="#eef2f9" strokeWidth="1" />
      ))}
      {months.map((m, i) => {
        const h = (m.total / max) * innerH;
        const x = pad.left + i * step + (step - barW) / 2;
        const y = pad.top + innerH - h;
        return (
          <g key={m.label + i}>
            <rect x={x} y={y} width={barW} height={Math.max(h, m.total > 0 ? 3 : 0)} rx="5" fill="url(#finBar)">
              <title>{`${m.label}: ${formatGhs(m.total)}`}</title>
            </rect>
            {m.total > 0 && <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="fin-bar-value">{(m.total / 100).toLocaleString('en-GH', { maximumFractionDigits: 0 })}</text>}
            <text x={x + barW / 2} y={height - 10} textAnchor="middle" className="fin-bar-label">{m.label}</text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="finBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#C65300" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Donut({ registration, dues, applications }: { registration: number; dues: number; applications: number }) {
  const total = registration + dues + applications;
  const r = 54;
  const c = 2 * Math.PI * r;
  const segments = [
    { label: 'registration', value: registration, color: '#C65300' },
    { label: 'dues', value: dues, color: '#FF6B00' },
    { label: 'application fees', value: applications, color: '#1A1A1A' }
  ];
  let offset = 0;
  const lead = segments.reduce((best, segment) => (segment.value > best.value ? segment : best), segments[0]);
  return (
    <div className="fin-donut-wrap">
      <svg viewBox="0 0 140 140" className="fin-donut" role="img" aria-label="Revenue mix">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#eef2f9" strokeWidth="18" />
        {total > 0 && segments.map((segment) => {
          const share = segment.value / total;
          const el = share > 0 ? (
            <circle key={segment.label} cx="70" cy="70" r={r} fill="none" stroke={segment.color} strokeWidth="18"
              strokeDasharray={`${c * share} ${c}`} strokeDashoffset={-c * offset} transform="rotate(-90 70 70)" strokeLinecap="round" />
          ) : null;
          offset += share;
          return el;
        })}
        <text x="70" y="66" textAnchor="middle" className="fin-donut-total">{total > 0 ? `${Math.round((lead.value / total) * 100)}%` : '—'}</text>
        <text x="70" y="82" textAnchor="middle" className="fin-donut-sub">{lead.label}</text>
      </svg>
      <div className="fin-legend">
        <span><i style={{ background: '#C65300' }} /> Registration fees <strong>{formatGhs(registration)}</strong></span>
        <span><i style={{ background: '#FF6B00' }} /> Annual dues <strong>{formatGhs(dues)}</strong></span>
        <span><i style={{ background: '#1A1A1A' }} /> Application fees <strong>{formatGhs(applications)}</strong></span>
      </div>
    </div>
  );
}

export default async function AdminFinance() {
  const admin = await requireAdmin();
  if (!admin) redirect('/admin/login');

  const [data, feeHistory] = await Promise.all([
    getFinanceAnalytics(12),
    db.feeSettingHistory.findMany({ orderBy: { createdAt: 'desc' }, take: 6 })
  ]);

  const kpis = [
    ['Total collected', formatGhs(data.totalRevenue), `${data.transactionCount} successful transactions`, Banknote],
    ['This month', formatGhs(data.thisMonthRevenue), data.monthGrowthPct === null ? 'no comparison yet' : `${data.monthGrowthPct >= 0 ? '+' : ''}${data.monthGrowthPct.toFixed(1)}% vs last month`, data.monthGrowthPct !== null && data.monthGrowthPct < 0 ? ArrowDownRight : ArrowUpRight],
    ['Today', formatGhs(data.todayRevenue), 'collected since midnight', CalendarDays],
    ['Pending', formatGhs(data.pendingAmount), `${data.pendingCount} awaiting completion`, AlertTriangle],
    ['Success rate', `${data.successRate.toFixed(1)}%`, `${data.failedCount} failed`, Percent],
    ['Average payment', formatGhs(data.averageTransaction), 'per successful transaction', CircleDollarSign]
  ] as const;

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ margin: 0 }}>FINANCE</p>
          <h1>Financial Analytics</h1>
        </div>
        <Link className="btn btn-ghost" href="/admin/payments"><Receipt size={15} /> ALL PAYMENTS</Link>
      </div>

      <div className="admin-dashboard-cards cards-6">
        {kpis.map(([label, value, note, Icon]) => (
          <div className="admin-stat-card" key={label}>
            <span className="admin-stat-icon"><Icon size={19} /></span>
            <strong style={{ fontSize: label === 'Total collected' || label === 'This month' ? 22 : 26 }}>{value}</strong>
            <span>{label}</span>
            <small className="admin-stat-note">{note}</small>
          </div>
        ))}
      </div>

      <div className="fin-grid">
        <section className="admin-panel">
          <div className="fin-panel-head">
            <h2>Monthly collections</h2>
            <span className="fin-chip"><Wallet size={13} /> last 12 months</span>
          </div>
          {data.totalRevenue === 0 ? (
            <p className="admin-note">No successful payments recorded yet. Revenue charts will appear as dues and registration fees come in.</p>
          ) : (
            <Sparkline months={data.months} />
          )}
        </section>

        <section className="admin-panel">
          <div className="fin-panel-head"><h2>Revenue mix</h2></div>
          <Donut registration={data.registrationRevenue} dues={data.duesRevenue} applications={data.applicationRevenue} />
          <div className="fin-mix-stats">
            <div><small>Refunded</small><strong>{formatGhs(data.refundedAmount)}</strong></div>
            <div><small>Failed</small><strong>{data.failedCount}</strong></div>
            <div><small>Pending</small><strong>{data.pendingCount}</strong></div>
          </div>
        </section>
      </div>

      <div className="fin-grid">
        <section className="admin-panel" style={{ overflowX: 'auto' }}>
          <div className="fin-panel-head"><h2>Top contributing members</h2></div>
          {data.topPayers.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>No payments recorded yet.</p>
          ) : (
            <table className="admin-table card-table">
              <thead><tr><th>#</th><th>Member</th><th>Payments</th><th>Total paid</th></tr></thead>
              <tbody>
                {data.topPayers.map((payer, i) => (
                  <tr key={payer.memberId}>
                    <td data-label="Rank"><span className={`fin-rank${i === 0 ? ' first' : ''}`}>{i + 1}</span></td>
                    <td data-label="Member"><strong>{payer.name}</strong><br /><small>{payer.memberNumber}</small></td>
                    <td data-label="Payments">{payer.payments}</td>
                    <td data-label="Total paid"><strong>{formatGhs(payer.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="admin-panel">
          <div className="fin-panel-head"><h2>Fee changes</h2><TrendingUp size={17} style={{ color: 'var(--blue)' }} /></div>
          {feeHistory.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>No fee adjustments recorded yet.</p>
          ) : (
            <div className="activity-list">
              {feeHistory.map((entry) => (
                <div className="activity-item" key={entry.id}>
                  <span className="activity-dot" />
                  <span>
                    <strong>{entry.feeKey === 'annual_dues' ? 'Annual dues' : entry.feeKey === 'work_application_fee' ? 'Work application fee' : 'Registration fee'}</strong>{' '}
                    {entry.previousAmount !== null && entry.previousAmount !== entry.newAmount
                      ? `${formatGhs(entry.previousAmount)} → ${formatGhs(entry.newAmount)}`
                      : `set to ${formatGhs(entry.newAmount)}`}
                    {!entry.enabled && ' (disabled)'}
                    <br /><small style={{ color: 'var(--muted)' }}>by {entry.changedBy}</small>
                  </span>
                  <time>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(entry.createdAt)}</time>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="admin-panel" style={{ marginTop: 22, overflowX: 'auto' }}>
        <div className="fin-panel-head"><h2>Latest transactions</h2><Link href="/admin/payments" className="admin-link" style={{ fontSize: 12 }}>VIEW ALL →</Link></div>
        {data.recent.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No transactions yet.</p>
        ) : (
          <table className="admin-table card-table">
            <thead><tr><th>Date</th><th>Member</th><th>Type</th><th>Amount</th><th>Status</th><th>Reference</th></tr></thead>
            <tbody>
              {data.recent.map((p) => (
                <tr key={p.id}>
                  <td data-label="Date">{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(p.date)}</td>
                  <td data-label="Member"><strong>{p.memberName}</strong><br /><small>{p.memberNumber}</small></td>
                  <td data-label="Type">{p.type === 'ANNUAL_DUES' ? 'Annual dues' : p.type === 'WORK_APPLICATION_FEE' ? 'Application fee' : 'Registration fee'}</td>
                  <td data-label="Amount"><strong>{formatGhs(p.amount)}</strong></td>
                  <td data-label="Status"><span className={`badge badge-${p.status === 'SUCCESSFUL' ? 'PUBLISHED' : p.status === 'PENDING' ? 'PENDING' : p.status === 'REFUNDED' ? 'ARCHIVED' : 'REJECTED'}`}>{p.status}</span></td>
                  <td data-label="Reference"><small>{p.reference}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
