import type { Metadata } from 'next';
import AdminWorkPaySubnav from '@/components/AdminWorkPaySubnav';
import AdminWorkPayAgreementsManager from '@/components/AdminWorkPayAgreementsManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Work & Pay Agreements | Mr Truth Agency Admin'
};

export default async function AdminWorkPayAgreementsPage({
  searchParams
}: {
  searchParams?: Promise<{ create?: string; applicantId?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const shouldCreate = params.create === 'true';

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ color: 'var(--blue)' }}>CONTRACTS &amp; FINANCING SCHEDULES</p>
          <h1>Vehicle Ownership Agreements</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Execute active driver ownership contracts, auto-generate weekly installment amortization tables, and oversee legal agreement lifecycles.
          </p>
        </div>
      </div>

      <AdminWorkPaySubnav />

      <AdminWorkPayAgreementsManager initialCreate={shouldCreate} applicantId={params.applicantId} />
    </main>
  );
}
