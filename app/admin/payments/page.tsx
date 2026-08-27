import Link from 'next/link';
import { db } from '@/lib/db';
import { formatGhs } from '@/lib/fees';

export const dynamic = 'force-dynamic';

export default async function AdminPayments() {
  const [payments, successful, failed, pending, registrationRevenue, duesRevenue] = await Promise.all([
    db.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { member: { select: { firstName: true, lastName: true, memberNumber: true } } } }),
    db.payment.count({ where: { status: 'SUCCESSFUL' } }),
    db.payment.count({ where: { status: 'FAILED' } }),
    db.payment.count({ where: { status: 'PENDING' } }),
    db.payment.aggregate({ where: { status: 'SUCCESSFUL', type: 'REGISTRATION_FEE' }, _sum: { amount: true } }),
    db.payment.aggregate({ where: { status: 'SUCCESSFUL', type: 'ANNUAL_DUES' }, _sum: { amount: true } })
  ]);

  const total = (registrationRevenue._sum.amount || 0) + (duesRevenue._sum.amount || 0);

  const cards = [
    ['Total revenue', formatGhs(total)],
    ['Registration fees', formatGhs(registrationRevenue._sum.amount || 0)],
    ['Annual dues', formatGhs(duesRevenue._sum.amount || 0)],
    ['Successful', String(successful)],
    ['Failed', String(failed)],
    ['Pending', String(pending)]
  ] as const;

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ margin: 0 }}>FINANCE</p>
          <h1>Payments</h1>
        </div>
      </div>

      <div className="admin-dashboard-cards" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {cards.map(([label, value]) => (
          <div className="admin-stat-card" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="admin-panel" style={{ marginTop: 24, overflowX: 'auto' }}>
        <h2>Recent transactions</h2>
        {payments.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No transactions yet.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Date</th><th>Member</th><th>Type</th><th>Amount</th><th>Status</th><th>Reference</th></tr></thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(payment.createdAt)}</td>
                  <td><strong>{payment.member.firstName} {payment.member.lastName}</strong><br /><small>{payment.member.memberNumber}</small></td>
                  <td>{payment.type === 'ANNUAL_DUES' ? 'Annual dues' : 'Registration fee'}</td>
                  <td><strong>{formatGhs(payment.amount)}</strong></td>
                  <td><span className={`badge badge-${payment.status === 'SUCCESSFUL' ? 'PUBLISHED' : payment.status === 'PENDING' ? 'PENDING' : 'REJECTED'}`}>{payment.status}</span></td>
                  <td><small>{payment.reference}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
