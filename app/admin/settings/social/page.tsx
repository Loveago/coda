import Link from 'next/link';
import SocialLinksForm from '@/components/SocialLinksForm';

export const dynamic = 'force-dynamic';

export default function AdminSocialSettings() {
  return (
    <main>
      <div className="admin-page-head">
        <div>
          <Link href="/admin/settings" className="admin-back">← BACK TO SETTINGS</Link>
          <h1>Social links</h1>
        </div>
      </div>
      <SocialLinksForm />
    </main>
  );
}
