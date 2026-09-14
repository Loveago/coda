import type { Metadata } from 'next';
import AdminWorkPaySubnav from '@/components/AdminWorkPaySubnav';
import AdminWorkPayArrearsManager from '@/components/AdminWorkPayArrearsManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Arrears Monitor | Work & Pay | Mr Truth Agency Admin'
};

export default function AdminWorkPayArrearsPage() {
  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ color: 'var(--blue)' }}>RISK MITIGATION &amp; RECOVERY</p>
          <h1>Arrears &amp; Delinquency Monitor</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Track overdue vehicle installments past contractual grace periods, initiate recovery contacts, and manage payment restructuring.
          </p>
        </div>
      </div>

      <AdminWorkPaySubnav />

      <AdminWorkPayArrearsManager />
    </main>
  );
}
