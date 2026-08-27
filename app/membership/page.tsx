import type { Metadata } from 'next';
import { announcementKey, getSiteSettings } from '@/lib/settings';
import { getFees } from '@/lib/fees';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import MembershipForm from '@/components/MembershipForm';
import '../globals.css';

export const metadata: Metadata = { title: 'Membership', description: 'Join GACODA — the Greater Accra Concerned Online Drivers Association.' };

const faqs = [
  ['Who can join GACODA?', 'Any online driver (Bolt, Uber, Yango, or similar platforms) operating within the Greater Accra Region who shares our commitment to professionalism and road safety.'],
  ['How much does membership cost?', 'Membership details and any applicable dues are communicated during the review of your application. Reach out through the contact page for current information.'],
  ['How long does approval take?', 'Most applications are reviewed within a few working days. You can track your application anytime on the Check Application Status page using your phone number or email.'],
  ['What happens after approval?', 'Approved members receive updates about meetings, training, welfare programmes and advocacy campaigns, and gain a voice in the association\u2019s decisions.']
] as const;

export default async function Membership() {
  const [site, fees] = await Promise.all([getSiteSettings(), getFees()]);
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
            <p className="kicker">JOIN THE MOVEMENT</p>
            <h1>Become a GACODA Member</h1>
            <p>Connect with thousands of online drivers shaping a stronger, safer future. Fill in the form below and our membership team will get in touch.</p>
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
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} />
    </>
  );
}
