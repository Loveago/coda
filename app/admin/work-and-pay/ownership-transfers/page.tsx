import type { Metadata } from 'next';
import AdminWorkPaySubnav from '@/components/AdminWorkPaySubnav';
import AdminWorkPayTransfersManager from '@/components/AdminWorkPayTransfersManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'DVLA Ownership Transfers | Work & Pay | Mr Truth Agency Admin'
};

export default function AdminWorkPayTransfersPage() {
  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ color: 'var(--blue)' }}>LEGAL TITLING &amp; DVLA HANDOVER</p>
          <h1>DVLA Ownership Transfers</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Process final contract payoffs, verify title clearances, track official DVLA Form C transfer paperwork, and issue completion certificates.
          </p>
        </div>
      </div>

      <AdminWorkPaySubnav />

      <AdminWorkPayTransfersManager />
    </main>
  );
}
