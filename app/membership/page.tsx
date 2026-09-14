import type { Metadata } from 'next';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import { getFeeSettings } from '@/lib/fees';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import MembershipForm from '@/components/MembershipForm';
import '../globals.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const feeSettings = await getFeeSettings();
  const title = feeSettings.registration.enabled
    ? `Join Mr Truth Agency | GHS ${(feeSettings.registration.amount / 100).toFixed(2)} Membership`
    : 'Join Mr Truth Agency | Free Membership';

  return {
    title,
    description: feeSettings.registration.enabled
      ? `Join Mr Truth Agency. One-time GHS ${(feeSettings.registration.amount / 100).toFixed(2)} registration fee. Get your digital member ID, job access, driver support and agency privileges.`
      : 'Join Mr Truth Agency free — no registration fee, no annual dues. Get your member ID, job access, ID card and more.'
  };
}

export default async function Membership() {
  const [site, feeSettings] = await Promise.all([
    getSiteSettings(),
    getFeeSettings()
  ]);

  const regFee = feeSettings.registration;
  const duesFee = feeSettings.annualDues;
  const regFeeGhs = (regFee.amount / 100).toFixed(2);
  const duesFeeGhs = (duesFee.amount / 100).toFixed(2);

  const perks = regFee.enabled ? [
    `Low one-time registration fee (GHS ${regFeeGhs})`,
    'Apply for jobs across every industry the agency recruits for',
    'Digital member ID card you can share and verify instantly',
    'Member-only updates, events, offers and partner discounts',
    'Priority access to the Ghana Work & Pay Vehicle Ownership Program'
  ] : [
    'Free for life — no registration fee, no annual dues',
    'Apply for jobs across every industry the agency recruits for',
    'Digital member ID card you can share and verify instantly',
    'Member-only updates, events, offers and partner discounts',
    'Priority access to the Ghana Work & Pay Vehicle Ownership Program'
  ];

  const faqs = [
    ['Who can join Mr Truth Agency?', 'Anyone connected to the Mr Truth ecosystem — drivers, job seekers, property owners, travellers and supporters of the agency. Membership is open and accessible.'],
    ['How much does membership cost?', regFee.enabled
      ? `Membership requires a one-time registration fee of GHS ${regFeeGhs}. ${duesFee.enabled ? `Annual membership dues are GHS ${duesFeeGhs} / year to keep your account active in good standing.` : 'Annual dues are currently waived by agency policy.'}`
      : 'Nothing. Membership is completely free — there is no registration fee and no annual dues.'],
    ['What payment methods are supported?', 'All registration and dues payments are processed securely through Paystack. You can pay with MTN Mobile Money, Telecel Cash, AT Money, or Visa/Mastercard debit and credit cards.'],
    ['How long does approval take?', 'Most applications are processed within 24 to 48 hours. If a registration fee is enabled, complete the secure Paystack checkout to immediately activate your account.'],
    ['What benefits do members receive?', 'Members receive an official digital ID card with QR verification, access to driver recruitment and job opportunities, eligibility for the Work & Pay vehicle ownership program, and exclusive partner discounts.']
  ] as const;

  return (
    <>
      <SiteHeader
        phone={site.contact_phone}
        email={site.contact_email}
        announcement={site.announcement_enabled === 'true' && site.announcement_text ? { text: site.announcement_text, key: announcementKey(site.announcement_text) } : null}
        socials={socialLinks(site)}
      />
      <main>
        <section className="page-hero">
          <div className="container">
            <p className="kicker">MR TRUTH AGENCY · MEMBERSHIP</p>
            <h1>{regFee.enabled ? 'Join the Mr Truth Agency Community.' : 'Join the agency. It’s free.'}</h1>
            <p>
              {regFee.enabled
                ? `Create your member profile, pay the GHS ${regFeeGhs} registration fee via Paystack, and unlock job applications, digital ID card, and priority access to our Work & Pay vehicle financing program.`
                : 'Create your member profile, complete the review process and unlock job applications, a digital ID card and a direct connection to the Mr Truth ecosystem — with no fees, ever.'}
            </p>
          </div>
        </section>

        <section className="container page-body">
          <Reveal>
            <MembershipForm registrationFee={regFee} />
          </Reveal>

          <div className="fanclub-banner" style={{ marginTop: 26 }}>
            <div className="fanclub-copy" style={{ maxWidth: 'none' }}>
              <p className="kicker">{regFee.enabled ? 'MEMBERSHIP VALUE' : 'WHY JOIN FREE?'}</p>
              <h2>
                {regFee.enabled ? (
                  <>Transparent Pricing. <em>Unmatched Agency Support.</em></>
                ) : (
                  <>Everything included. <em>Nothing to pay.</em></>
                )}
              </h2>
              <div className="fanclub-perks">
                {perks.map((perk) => (
                  <span key={perk}>✓ {perk}</span>
                ))}
              </div>
            </div>
          </div>

          <section style={{ marginTop: 60 }}>
            <Reveal><p className="section-label">FREQUENTLY ASKED QUESTIONS</p></Reveal>
            <Reveal delay={80}>
              <div className="faq">
                {faqs.map(([question, answer]) => (
                  <details key={question}>
                    <summary>{question}</summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </section>
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
