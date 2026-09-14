import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import MemberWorkPaySubnav from '@/components/MemberWorkPaySubnav';
import MemberSupportManager from '@/components/MemberSupportManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Driver Support Desk | Work & Pay | Mr Truth Member Portal'
};

export default async function MemberWorkPaySupportPage() {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');

  const agreement = await (db as any).workPayAgreement.findFirst({
    where: {
      OR: [
        { memberId: portal.id },
        { driverEmail: portal.email }
      ]
    }
  });

  return (
    <main className="mdash">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Work &amp; Pay Support</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
          Dedicated driver assistance for breakdown emergencies, payment inquiries, and documentation.
        </p>
      </div>

      <MemberWorkPaySubnav />

      <MemberSupportManager agreementId={agreement?.id} />
    </main>
  );
}
