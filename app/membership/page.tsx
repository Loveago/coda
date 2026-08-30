import type { Metadata } from 'next';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import { getFees } from '@/lib/fees';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import MembershipForm from '@/components/MembershipForm';
import '../globals.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mr Truth Fan Club', description: 'Join the Mr Truth Fan Club community and connect with the wider Mr Truth Agency ecosystem.' };

const faqs = [
  ['Who can join the Mr Truth Fan Club?', 'People connected to the Mr Truth Agency ecosystem who want to join its growing community layer.'],
  ['How much does membership cost?', 'The registration fee and annual dues are configurable by the agency. Current amounts are shown during registration.'],
  ['How long does approval take?', 'Most applications are reviewed within a few working days. You can track your application anytime on the Check Application Status page using your phone number or email.'],
  ['What happens after approval?', 'Approved members receive updates about community events, training, mobility opportunities and Fan Club programmes, and gain a direct connection to the Mr Truth ecosystem.']
] as const;

export default async function Membership() {
  const [site, fees] = await Promise.all([getSiteSettings(), getFees()]);
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
            <p className="kicker">MR TRUTH FAN CLUB</p>
            <h1>Find your place in the movement.</h1>
            <p>Join the community layer of Mr Truth Agency. Create your member profile, complete the review process and unlock a direct connection to the ecosystem.</p>
          </div>
        </section>
        <section className="container page-body">
          <Reveal>
            <MembershipForm registrationFeeEnabled={fees.registrationFeeEnabled} registrationFeeAmount={fees.registrationFeeAmount} />
          </Reveal>
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
