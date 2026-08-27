import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getPortalMember } from '@/lib/members-auth';
import SimulateActions from '@/components/SimulateActions';

export const dynamic = 'force-dynamic';

export default async function SimulatePayment({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');
  const reference = (await searchParams).reference || '';

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ margin: 0 }}>DEVELOPMENT MODE</p>
          <h1>Simulated Paystack checkout</h1>
        </div>
      </div>
      <div className="admin-panel" style={{ maxWidth: 640 }}>
        <p className="admin-note">
          PAYSTACK_SECRET_KEY is not configured, so this built-in simulator replaces the hosted Paystack page.
          Choosing <strong>SUCCESS</strong> runs the exact same server-side verification and membership-renewal path a
          real Paystack webhook would trigger. Add your Paystack keys to disable the simulator automatically.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>Reference: <small>{reference || '—'}</small></p>
        <Suspense fallback={null}><SimulateActions reference={reference} /></Suspense>
      </div>
    </main>
  );
}
