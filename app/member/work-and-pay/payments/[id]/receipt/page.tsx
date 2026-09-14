import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Download, Printer, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import PrintReceiptButton from '@/components/PrintReceiptButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payment Receipt | Mr Truth Agency'
};

const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short' });

export default async function PaymentReceiptPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');

  const resolvedParams = await params;
  const payment = await (db as any).workPayPayment.findUnique({
    where: { id: resolvedParams.id },
    include: {
      agreement: {
        include: {
          vehicle: true,
          member: true
        }
      },
      allocations: {
        include: {
          installment: true
        }
      }
    }
  });

  if (!payment) notFound();

  const agreement = payment.agreement;
  const vehicle = agreement?.vehicle;

  return (
    <main className="mdash" style={{ maxWidth: 740, margin: '0 auto', padding: '24px 16px' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Link
          href="/member/work-and-pay/payments"
          className="btn btn-ghost"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <ArrowLeft size={15} /> BACK TO PAYMENTS
        </Link>
        <PrintReceiptButton />
      </div>

      <div
        className="receipt-card"
        style={{
          background: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: 12,
          padding: 36,
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          color: '#0f172a'
        }}
      >
        {/* Receipt Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: 20, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <img src="/logo-mark.png" alt="" width={36} height={36} />
              <div>
                <strong style={{ fontSize: 18, letterSpacing: '1px' }}>MR TRUTH AGENCY</strong>
                <small style={{ display: 'block', fontSize: 10, color: '#64748b' }}>OFFICIAL PAYMENT RECEIPT</small>
              </div>
            </div>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>Accra, Ghana · info@mrtruthagency.com</p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '.5px' }}>RECEIPT #</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#2563eb' }}>
              {payment.receiptNumber || payment.reference}
            </div>
            <small style={{ color: '#64748b', fontSize: 11 }}>
              {dateFormatter.format(new Date(payment.paymentDate))}
            </small>
          </div>
        </div>

        {/* Transaction Summary */}
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>AMOUNT RECEIVED</span>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#059669', margin: '2px 0' }}>
              GHS {Number(payment.amount).toFixed(2)}
            </div>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Payment Method: <strong>{payment.channelDetails || payment.paymentMethod.replace(/_/g, ' ')}</strong>
            </span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ecfdf5', color: '#047857', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            <CheckCircle2 size={16} />
            <span>PAYMENT VERIFIED</span>
          </div>
        </div>

        {/* Party Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, fontSize: 13, marginBottom: 24 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
              DRIVER / MEMBER
            </span>
            <strong>{agreement?.driverName || portal.firstName + ' ' + portal.lastName}</strong>
            <p style={{ margin: '2px 0', color: '#64748b' }}>Member Number: {agreement?.member?.memberNumber || portal.memberNumber}</p>
            <p style={{ margin: 0, color: '#64748b' }}>Phone: {agreement?.driverPhone || portal.phone}</p>
          </div>

          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
              WORK &amp; PAY CONTRACT
            </span>
            <strong>Contract #{agreement?.agreementNumber}</strong>
            <p style={{ margin: '2px 0', color: '#64748b' }}>
              Vehicle: {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Assigned Fleet Vehicle'}
            </p>
            <p style={{ margin: 0, color: '#64748b' }}>Chassis / VIN: {vehicle?.id ? vehicle.id.slice(0, 16) : 'VERIFIED'}</p>
          </div>
        </div>

        {/* Allocations Table */}
        {payment.allocations && payment.allocations.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8 }}>
              ALLOCATION BREAKDOWN
            </span>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>DESCRIPTION</th>
                  <th style={{ padding: '8px 12px' }}>PRINCIPAL PORTION</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>ALLOCATED</th>
                </tr>
              </thead>
              <tbody>
                {payment.allocations.map((a: any) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px' }}>
                      Installment Week #{a.installment?.weekNumber} (Due: {a.installment?.dueDate ? new Date(a.installment.dueDate).toLocaleDateString('en-GB') : '—'})
                    </td>
                    <td style={{ padding: '10px 12px' }}>GHS {Number(a.principalPortion).toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                      GHS {Number(a.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Verification Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={16} style={{ color: '#059669' }} />
            <span>Digital receipt generated by Mr Truth Agency Work &amp; Pay platform</span>
          </div>
          <div>Reference: {payment.paystackReference || payment.reference}</div>
        </div>
      </div>
    </main>
  );
}
