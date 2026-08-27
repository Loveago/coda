import Link from 'next/link';
import FeeSettingsForm from '@/components/FeeSettingsForm';

export const dynamic = 'force-dynamic';

export default function AdminFees() {
  return (
    <main>
      <div className="admin-page-head">
        <div>
          <Link href="/admin/settings" className="admin-back">← BACK TO SETTINGS</Link>
          <h1>Membership fees</h1>
        </div>
      </div>
      <FeeSettingsForm />
    </main>
  );
}
