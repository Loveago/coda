import type { Metadata } from 'next';
import AdminWorkPaySubnav from '@/components/AdminWorkPaySubnav';
import AdminWorkPayDepositsManager from '@/components/AdminWorkPayDepositsManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Security Deposits | Work & Pay | Mr Truth Agency Admin'
};

export default function AdminWorkPayDepositsPage() {
  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ color: 'var(--blue)' }}>ESCROW &amp; COLLATERAL OVERSIGHT</p>
          <h1>Security Deposits Ledger</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Manage driver security deposits held in escrow, log repair or arrears deductions, and process completion refunds.
          </p>
        </div>
      </div>

      <AdminWorkPaySubnav />

      <AdminWorkPayDepositsManager />
    </main>
  );
}
