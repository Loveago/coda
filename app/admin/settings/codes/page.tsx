import type { Metadata } from 'next';
import Link from 'next/link';
import RegistrationCodesManager from '@/components/RegistrationCodesManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Registration Codes | Mr Truth Agency Admin'
};

export default function AdminRegistrationCodesPage() {
  return (
    <main>
      <div className="admin-page-head">
        <div>
          <Link href="/admin/settings" className="admin-back">← BACK TO SETTINGS</Link>
          <p className="kicker" style={{ color: 'var(--blue)', marginTop: 4 }}>INVITATIONS &amp; ACCESS</p>
          <h1>Registration Codes</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Generate and manage access codes required for new member sign-ups. Codes can be single-use, multi-use, or unlimited.
          </p>
        </div>
      </div>
      <RegistrationCodesManager />
    </main>
  );
}
