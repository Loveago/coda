import type { Metadata } from 'next';
import Link from 'next/link';
import AdminWorkPaySubnav from '@/components/AdminWorkPaySubnav';
import AdminWorkPayApplicationsManager from '@/components/AdminWorkPayApplicationsManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Driver Applications | Work & Pay | Mr Truth Agency Admin'
};

export default function AdminWorkPayApplicationsPage() {
  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ color: 'var(--blue)' }}>WORK &amp; PAY RECRUITMENT PIPELINE</p>
          <h1>Driver Applications &amp; Vetting</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Review incoming driver ownership applications, evaluate commercial experience, schedule interviews, and approve candidates for contracts.
          </p>
        </div>
      </div>

      <AdminWorkPaySubnav />

      <AdminWorkPayApplicationsManager />
    </main>
  );
}
