import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import { formatGhs } from '@/lib/fees';
import { paymentTypeLabel } from '@/lib/work-applications';
import ReceiptActions from '@/components/ReceiptActions';

export const dynamic = 'force-dynamic';

export default async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');

  const payment = await db.payment.findUnique({ where: { id: (await params).id }, include: { member: true } });
  if (!payment || payment.memberId !== portal.id) notFound();

  return (
    <main>
      <div className="admin-page-head no-print">
        <div>
          <p className="kicker" style={{ margin: 0 }}>MEMBER PORTAL</p>
          <h1>Payment receipt</h1>
        </div>
        <ReceiptActions />
      </div>

      <div className="receipt" id="receipt">
        <div className="receipt-head">
          <div className="brand brand-invert">
            <img src="/logo-mark.png" alt="Mr Truth Agency logo" className="brand-logo" width={51} height={51} />
            <div><div className="brand-name">MR TRUTH</div><small className="brand-sub">FAN CLUB · MEMBER COMMUNITY</small></div>
          </div>
          <span className={`badge badge-${payment.status === 'SUCCESSFUL' ? 'PUBLISHED' : payment.status === 'PENDING' ? 'PENDING' : 'REJECTED'}`}>{payment.status}</span>
        </div>
        <p className="receipt-title">OFFICIAL PAYMENT RECEIPT</p>
        <table className="admin-table">
          <tbody>
            <tr><td>Member name</td><td><strong>{payment.member.firstName} {payment.member.lastName}</strong></td></tr>
            <tr><td>Member ID</td><td>{payment.member.memberNumber}</td></tr>
            <tr><td>Payment type</td><td>{paymentTypeLabel(payment.type)}</td></tr>
            <tr><td>Amount</td><td><strong style={{ fontSize: 16 }}>{formatGhs(payment.amount)}</strong> ({payment.currency})</td></tr>
            <tr><td>Payment date</td><td>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short' }).format(payment.paidAt || payment.createdAt)}</td></tr>
            <tr><td>Paystack reference</td><td><small>{payment.reference}</small></td></tr>
            <tr><td>Provider transaction ID</td><td><small>{payment.providerTransactionId || '—'}</small></td></tr>
          </tbody>
        </table>
        <p style={{ color: '#8b9bb5', fontSize: 10.5, marginTop: 18 }}>
          This receipt was generated electronically by the Mr Truth Fan Club membership platform and is valid without signature.
        </p>
      </div>
    </main>
  );
}
