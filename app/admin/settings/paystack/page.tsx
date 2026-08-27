import Link from 'next/link';
import PaystackSettingsForm from '@/components/PaystackSettingsForm';

export const dynamic = 'force-dynamic';

export default function AdminPaystackSettings() {
  return (
    <main>
      <div className="admin-page-head">
        <div>
          <Link href="/admin/settings" className="admin-back">← BACK TO SETTINGS</Link>
          <h1>Paystack keys</h1>
        </div>
      </div>
      <PaystackSettingsForm />
    </main>
  );
}
