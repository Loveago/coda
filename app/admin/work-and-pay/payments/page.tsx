import type { Metadata } from 'next';
import AdminWorkPaySubnav from '@/components/AdminWorkPaySubnav';
import AdminWorkPayPaymentsManager from '@/components/AdminWorkPayPaymentsManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payment Ledger | Work & Pay | Mr Truth Agency Admin'
};

export default async function AdminWorkPayPaymentsPage({
  searchParams
}: {
  searchParams?: Promise<{ record?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const shouldRecord = params.record === 'true';

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ color: 'var(--blue)' }}>FINANCIAL INTEGRITY &amp; REVENUE LEDGER</p>
          <h1>Work &amp; Pay Payment Ledger</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Unified transaction ledger for online Paystack MoMo/card remittances and verified offline cash/bank deposits.
          </p>
        </div>
      </div>

      <AdminWorkPaySubnav />

      <AdminWorkPayPaymentsManager initialRecord={shouldRecord} />
    </main>
  );
}
