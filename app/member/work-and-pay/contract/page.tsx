import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import MemberWorkPaySubnav from '@/components/MemberWorkPaySubnav';
import LegalAgreementDocument from '@/components/LegalAgreementDocument';
import { FileText, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Work & Pay Legal Contract | Mr Truth Member Portal'
};

export default async function MemberAgreementContractPage() {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');

  const agreement = await (db as any).workPayAgreement.findFirst({
    where: {
      OR: [
        { memberId: portal.id },
        { driverEmail: portal.email },
        { driverPhone: portal.phone }
      ]
    },
    include: {
      vehicle: true,
      member: true,
      application: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main className="mdash">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Official Legal Agreement</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
          View, digitally sign, and download your official Ghanaian Commercial Vehicle Agreement.
        </p>
      </div>

      <MemberWorkPaySubnav />

      {!agreement ? (
        <div className="panel" style={{ padding: 36, textAlign: 'center' }}>
          <FileText size={48} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>No Active Agreement Found</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 440, margin: '6px auto 20px' }}>
            You do not currently have an active or pending Work &amp; Pay or Daily Sales agreement linked to your account.
          </p>
          <Link href="/work-and-pay/apply" className="btn btn-primary">
            APPLY FOR WORK &amp; PAY
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <LegalAgreementDocument agreement={agreement} isMember={true} />
        </div>
      )}
    </main>
  );
}
