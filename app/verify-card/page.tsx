import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { computeMembershipStatus } from '@/lib/membership';
import { verifyCardCode } from '@/lib/card-verify';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { announcementKey, getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verify Membership Card',
  description: 'Verify the authenticity of a GACODA membership card.'
};

const mediumDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

type Outcome = {
  tone: 'ok' | 'warn' | 'bad';
  heading: string;
  message: string;
};

export default async function VerifyCardPage({ searchParams }: { searchParams: Promise<{ number?: string; code?: string }> }) {
  const site = await getSiteSettings();
  const { number, code } = await searchParams;

  let outcome: Outcome;
  let member: { firstName: string; lastName: string; memberNumber: string; photoUrl: string | null; membershipEndDate: Date | null; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' } | null = null;

  if (!number || !code) {
    outcome = { tone: 'bad', heading: 'Incomplete verification link', message: 'This link is missing its verification details. Please scan the QR code on the membership card again.' };
  } else {
    const found = await db.member.findUnique({
      where: { memberNumber: number },
      select: { firstName: true, lastName: true, memberNumber: true, photoUrl: true, membershipEndDate: true, status: true }
    });
    if (!found || !verifyCardCode(number, code)) {
      outcome = { tone: 'bad', heading: 'Card could not be verified', message: 'We could not confirm this card in our records. It may be forged or damaged — please contact the association.' };
    } else {
      member = found;
      const computed = computeMembershipStatus(found);
      if (computed === 'ACTIVE') {
        outcome = { tone: 'ok', heading: 'Valid membership', message: 'This card belongs to an active GACODA member in good standing.' };
      } else if (computed === 'DUE') {
        outcome = found.membershipEndDate
          ? { tone: 'warn', heading: 'Renewal due', message: 'The member is recognised, but annual dues are due for renewal.' }
          : { tone: 'warn', heading: 'Dues not yet paid', message: 'This membership is approved, but the annual dues have not been paid yet, so the card is not fully active.' };
      } else if (computed === 'OVERDUE') {
        outcome = { tone: 'warn', heading: 'Membership expired', message: 'This member is recognised, but their membership has expired.' };
      } else {
        outcome = { tone: 'bad', heading: 'Card not active', message: 'This membership is not currently active. Please contact the association for details.' };
      }
    }
  }

  return (
    <>
      <SiteHeader
        phone={site.contact_phone}
        email={site.contact_email}
        announcement={site.announcement_enabled === 'true' && site.announcement_text ? { text: site.announcement_text, key: announcementKey(site.announcement_text) } : null}
      />
      <main>
        <section className="page-hero">
          <div className="container">
            <p className="kicker">VERIFICATION</p>
            <h1>Membership Card Check</h1>
            <p>Confirm that a GACODA membership card is genuine and currently valid.</p>
          </div>
        </section>
        <section className="container page-body">
          <div className={`vres ${outcome.tone}`}>
            <span className="vres-icon">
              {outcome.tone === 'ok' ? <CheckCircle2 size={30} /> : outcome.tone === 'warn' ? <AlertTriangle size={30} /> : <XCircle size={30} />}
            </span>
            <h1>{outcome.heading}</h1>
            <p>{outcome.message}</p>

            {member && (
              <>
                <div className="vres-id">
                  {member.photoUrl
                    ? <img src={member.photoUrl} alt="" />
                    : <span className="vres-avatar">{member.firstName[0]}{member.lastName[0]}</span>}
                  <div>
                    <strong>{member.firstName} {member.lastName}</strong>
                    <small>{member.memberNumber}</small>
                  </div>
                </div>
                <div className="vres-meta">
                  <div><small>Status</small><strong>{computeMembershipStatus(member)}</strong></div>
                  <div><small>Valid until</small><strong>{member.membershipEndDate ? mediumDate.format(member.membershipEndDate) : '—'}</strong></div>
                </div>
              </>
            )}

            <p style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--muted)' }}>
              <ShieldCheck size={14} /> Signed verification · tamper-proof
            </p>
          </div>
          <p style={{ textAlign: 'center', marginTop: 18 }}>
            <Link href="/" className="admin-link">← BACK TO GACODA.ORG</Link>
          </p>
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} />
    </>
  );
}
