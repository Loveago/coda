import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, Clock3, ReceiptText, Wallet, XCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import { formatGhs, getFees } from '@/lib/fees';
import { paymentTypeLabel } from '@/lib/work-applications';

export const dynamic = 'force-dynamic';

const mediumDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

const FILTERS = ['SUCCESSFUL', 'PENDING', 'FAILED'] as const;

function statusBadgeClass(status: string): string {
  if (status === 'SUCCESSFUL') return 'badge badge-PUBLISHED';
  if (status === 'PENDING') return 'badge badge-PENDING';
  return 'badge badge-REJECTED';
}

export default async function MemberPayments({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');

  const { status } = await searchParams;
  const filter = FILTERS.find((value) => value === status) ?? null;

  const [payments, fees] = await Promise.all([
    db.payment.findMany({ where: { memberId: portal.id }, orderBy: { createdAt: 'desc' } }),
    getFees()
  ]);

  const visible = filter ? payments.filter((payment) => payment.status === filter) : payments;
  const successful = payments.filter((payment) => payment.status === 'SUCCESSFUL');
  const totalPaid = successful.reduce((sum, payment) => sum + payment.amount, 0);
  const lastPayment = successful[0];

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ margin: 0 }}>MEMBER PORTAL</p>
          <h1>Payments</h1>
        </div>
        <Link href="/member/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <Wallet size={15} /> PAY DUES · {formatGhs(fees.annualDuesAmount)}
        </Link>
      </div>

      <section className="paysum" aria-label="Payment summary">
        <div className="paysum-tile">
          <CheckCircle2 size={22} />
          <div><strong>{formatGhs(totalPaid)}</strong><span>Total paid</span></div>
        </div>
        <div className="paysum-tile">
          <ReceiptText size={22} />
          <div><strong>{payments.length}</strong><span>Transaction{payments.length === 1 ? '' : 's'}</span></div>
        </div>
        <div className="paysum-tile">
          <Clock3 size={22} />
          <div><strong>{lastPayment ? mediumDate.format(lastPayment.paidAt ?? lastPayment.createdAt) : '—'}</strong><span>Last payment</span></div>
        </div>
      </section>

      <div className="payfilters" role="navigation" aria-label="Filter payments">
        <Link href="/member/payments" className={`payfilter${filter === null ? ' on' : ''}`}>ALL</Link>
        {FILTERS.map((value) => (
          <Link
            key={value}
            href={`/member/payments?status=${value}`}
            className={`payfilter${filter === value ? ' on' : ''}`}
          >
            {value === 'FAILED' ? (
              <><XCircle size={11} style={{ verticalAlign: -1.5 }} /> FAILED</>
            ) : value === 'PENDING' ? (
              'PENDING'
            ) : (
              'SUCCESSFUL'
            )}
          </Link>
        ))}
      </div>

      <section className="paylist">
        {visible.length === 0 ? (
          <p className="payrow-empty">
            {payments.length === 0
              ? 'No payments yet — your receipts will appear here after your first transaction.'
              : `No ${filter?.toLowerCase()} payments found.`}
          </p>
        ) : (
          visible.map((payment) => {
            const tone = payment.status === 'SUCCESSFUL' ? 'successful' : payment.status === 'PENDING' ? 'pending' : 'failed';
            const Icon = payment.status === 'SUCCESSFUL' ? CheckCircle2 : payment.status === 'PENDING' ? Clock3 : XCircle;
            return (
              <Link key={payment.id} href={`/member/payments/${payment.id}`} className="payrow">
                <span className={`payrow-icon ${tone}`}><Icon size={19} /></span>
                <span className="payrow-main">
                  <strong>{paymentTypeLabel(payment.type)}</strong>
                  <small>Ref {payment.reference}</small>
                </span>
                <span className="payrow-side">
                  <strong>{formatGhs(payment.amount)}</strong>
                  <span className={statusBadgeClass(payment.status)}>{payment.status}</span>
                </span>
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
