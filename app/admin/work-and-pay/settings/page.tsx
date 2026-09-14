import type { Metadata } from 'next';
import AdminWorkPaySubnav from '@/components/AdminWorkPaySubnav';
import AdminWorkPaySettingsManager from '@/components/AdminWorkPaySettingsManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Work & Pay Settings | Mr Truth Agency Admin'
};

export default function AdminWorkPaySettingsPage() {
  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ color: 'var(--blue)' }}>PROGRAM DEFAULTS &amp; FINANCIAL RULES</p>
          <h1>Work &amp; Pay Settings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Configure default amortization terms, security deposit percentages, grace periods, penalty fees, and payment processing policies.
          </p>
        </div>
      </div>

      <AdminWorkPaySubnav />

      <AdminWorkPaySettingsManager />
    </main>
  );
}
