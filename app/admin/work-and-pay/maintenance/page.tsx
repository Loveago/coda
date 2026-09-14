import type { Metadata } from 'next';
import AdminWorkPaySubnav from '@/components/AdminWorkPaySubnav';
import AdminWorkPayMaintenanceManager from '@/components/AdminWorkPayMaintenanceManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Fleet Maintenance & Servicing | Work & Pay | Mr Truth Agency Admin'
};

export default function AdminWorkPayMaintenancePage() {
  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ color: 'var(--blue)' }}>FLEET INTEGRITY &amp; LOGISTICS</p>
          <h1>Maintenance &amp; Service Logs</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Maintain fleet roadworthiness, review quarterly inspection checklists, track mechanical servicing, and monitor vehicle warranties.
          </p>
        </div>
      </div>

      <AdminWorkPaySubnav />

      <AdminWorkPayMaintenanceManager />
    </main>
  );
}
