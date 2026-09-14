import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  History,
  Info
} from 'lucide-react';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import MemberWorkPaySubnav from '@/components/MemberWorkPaySubnav';
import WorkPayPaymentButton from '@/components/WorkPayPaymentButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payments & Installments | Work & Pay | Mr Truth Member Portal'
};

const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

export default async function MemberWorkPayPaymentsPage() {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');

  const agreement = await (db as any).workPayAgreement.findFirst({
    where: {
      OR: [
        { memberId: portal.id },
        { driverEmail: portal.email }
      ]
    },
    include: {
      vehicle: true,
      installments: { orderBy: { weekNumber: 'asc' } },
      payments: { orderBy: { paymentDate: 'desc' } }
    }
  });

  if (!agreement) {
    redirect('/member/work-and-pay');
  }

  const installments = agreement.installments || [];
  const payments = agreement.payments || [];

  const paidCount = installments.filter((i: any) => i.status === 'PAID').length;
  const overdueCount = installments.filter((i: any) => i.status === 'OVERDUE').length;
  const pendingCount = installments.filter((i: any) => i.status === 'PENDING' || i.status === 'PARTIAL').length;

  const weeklyAmount = Number(agreement.weeklyPayment);
  const totalPaid = Number(agreement.totalPaid || 0);
  const remainingBalance = Number(agreement.remainingBalance || 0);

  return (
    <main className="mdash">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Installments &amp; Payments</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
            Contract {agreement.agreementNumber} · Weekly Remittance: GHS {weeklyAmount.toLocaleString()}
          </p>
        </div>
        <WorkPayPaymentButton agreementId={agreement.id} weeklyAmount={weeklyAmount} label="MAKE REMITTANCE" />
      </div>

      <MemberWorkPaySubnav />

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="panel" style={{ padding: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>TOTAL REMITTED</span>
          <strong style={{ fontSize: 20, color: '#059669' }}>GHS {totalPaid.toLocaleString()}</strong>
          <small style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginTop: 2 }}>Paid to vehicle target</small>
        </div>
        <div className="panel" style={{ padding: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>REMAINING PRINCIPAL</span>
          <strong style={{ fontSize: 20, color: '#2563eb' }}>GHS {remainingBalance.toLocaleString()}</strong>
          <small style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginTop: 2 }}>Balance to complete ownership</small>
        </div>
        <div className="panel" style={{ padding: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>PAID INSTALLMENTS</span>
          <strong style={{ fontSize: 20, color: '#1e293b' }}>{paidCount} of {installments.length}</strong>
          <small style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginTop: 2 }}>Completed weeks</small>
        </div>
        <div className="panel" style={{ padding: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>ARREARS / OVERDUE</span>
          <strong style={{ fontSize: 20, color: overdueCount > 0 ? '#dc2626' : '#10b981' }}>
            {overdueCount} {overdueCount === 1 ? 'Week' : 'Weeks'}
          </strong>
          <small style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginTop: 2 }}>
            {overdueCount > 0 ? 'Action required' : 'In good standing'}
          </small>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="panel" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} style={{ color: 'var(--blue)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Payment Transactions Ledger</h2>
          </div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{payments.length} Transactions</span>
        </div>

        {payments.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            No payment records found. Use the &quot;Make Remittance&quot; button above to submit your first installment.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>REFERENCE</th>
                  <th>PAYMENT METHOD</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>RECEIPT</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td>{dateFormatter.format(new Date(p.paymentDate))}</td>
                    <td>
                      <code style={{ fontSize: 11 }}>{p.reference}</code>
                    </td>
                    <td>{p.channelDetails || p.paymentMethod.replace(/_/g, ' ')}</td>
                    <td>
                      <strong>GHS {Number(p.amount).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span className="pill good" style={{ fontSize: 10, padding: '2px 8px' }}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/member/work-and-pay/payments/${p.id}/receipt`}
                        className="btn btn-ghost"
                        style={{ fontSize: 11, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Download size={12} /> View Receipt
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Weekly Installment Schedule */}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} style={{ color: 'var(--blue)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Weekly Installment Amortization Schedule</h2>
          </div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{installments.length} Scheduled Weeks</span>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', fontSize: 12 }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                <th>WEEK #</th>
                <th>DUE DATE</th>
                <th>TARGET AMOUNT</th>
                <th>AMOUNT PAID</th>
                <th>PAID DATE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((i: any) => {
                const isPaid = i.status === 'PAID';
                const isOver = i.status === 'OVERDUE';
                const isPart = i.status === 'PARTIAL';

                return (
                  <tr key={i.id} style={{ background: isOver ? '#fff5f5' : undefined }}>
                    <td>
                      <strong>Week {i.weekNumber}</strong>
                    </td>
                    <td>{dateFormatter.format(new Date(i.dueDate))}</td>
                    <td>GHS {Number(i.targetAmount).toFixed(2)}</td>
                    <td style={{ color: isPaid ? '#059669' : undefined }}>
                      GHS {Number(i.amountPaid || 0).toFixed(2)}
                    </td>
                    <td>{i.paidAt ? dateFormatter.format(new Date(i.paidAt)) : '—'}</td>
                    <td>
                      <span className={`pill ${isPaid ? 'good' : isOver ? 'bad' : isPart ? 'tone-warn' : 'muted'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                        {i.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
