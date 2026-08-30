import Link from 'next/link';
import { redirect } from 'next/navigation';
import { IdCard as IdCardIcon, Info } from 'lucide-react';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import { computeMembershipStatus } from '@/lib/membership';
import { cardSignature } from '@/lib/card-verify';
import { encodeQr } from '@/lib/qr';
import MemberCard from '@/components/MemberCard';

export const dynamic = 'force-dynamic';

const mediumDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export default async function IdCard() {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');
  if (portal.status !== 'APPROVED') redirect('/member/profile');

  const member = await db.member.findUnique({ where: { id: portal.id } });
  if (!member) redirect('/login');

  const computed = computeMembershipStatus(member);
  const cardStatus = computed === 'ACTIVE' ? 'ACTIVE' : computed === 'DUE' ? 'DUE' : computed === 'OVERDUE' ? 'OVERDUE' : 'SUSPENDED';

  const signature = cardSignature(member.memberNumber);
  const verifyUrl = `${siteUrl()}/verify-card?number=${encodeURIComponent(member.memberNumber)}&code=${signature}`;
  const qr = encodeQr(verifyUrl, 'M');

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ margin: 0 }}>MEMBER PORTAL</p>
          <h1>Digital ID card</h1>
        </div>
      </div>

      <MemberCard
        memberNumber={member.memberNumber}
        fullName={`${member.firstName} ${member.lastName}`}
        photoUrl={member.photoUrl ?? null}
        platform={member.platform}
        status={cardStatus}
        validUntil={member.membershipEndDate ? mediumDate.format(member.membershipEndDate) : '—'}
        memberSince={mediumDate.format(member.createdAt)}
        qr={qr}
        verifyUrl={verifyUrl}
      />

      {cardStatus !== 'ACTIVE' && (
        <p className="admin-note no-print" style={{ maxWidth: 420, marginTop: 18 }}>
          {member.membershipEndDate
            ? <>This card is not currently valid. <Link href="/member/dashboard" className="admin-link">Renew your annual dues</Link> to reactivate it instantly.</>
            : <>Your annual dues are still unpaid, so this card is not yet active. <Link href="/member/dashboard" className="admin-link">Pay your membership dues</Link> to activate it instantly.</>}
        </p>
      )}

      <div className="admin-note no-print" style={{ maxWidth: 420, marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Anyone can confirm your card by scanning the QR code on the back — it opens a signed,
          tamper-proof verification page on the Mr Truth Agency website. Your personal details are never exposed.
        </span>
      </div>

      <p className="no-print" style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <IdCardIcon size={13} /> Printing produces a credit-card sized pass you can keep in your wallet.
      </p>
    </main>
  );
}
