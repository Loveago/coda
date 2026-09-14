import type { Metadata } from 'next';
import Link from 'next/link';
import MembershipFeeSettingsManager from '@/components/MembershipFeeSettingsManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Membership Fee Settings | Mr Truth Agency Admin'
};

export default function AdminMembershipSettingsPage() {
  return (
    <main>
      <div className="admin-page-head">
        <div>
          <Link href="/admin/settings" className="admin-back">← BACK TO SETTINGS</Link>
          <p className="kicker" style={{ color: 'var(--blue)', marginTop: 4 }}>FAN CLUB &amp; MEMBERSHIP CONFIGURATION</p>
          <h1>Membership Fee Settings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Configure registration fee and annual dues rules, amounts, grace periods, and review immutable version history.
          </p>
        </div>
      </div>
      <MembershipFeeSettingsManager />
    </main>
  );
}
