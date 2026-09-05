import type { Metadata } from 'next';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import MembershipForm from '@/components/MembershipForm';
import '../globals.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Join Mr Truth Agency | Free Membership', description: 'Join Mr Truth Agency free — no registration fee, no annual dues. Get your member ID, job access, ID card and more.' };

const benefits = [
  'Free for life — no registration fee, no annual dues',
  'Apply for jobs across every industry the agency recruits for',
  'Digital member ID card you can share and verify instantly',
  'Member-only updates, events, offers and partner discounts'
] as const;

const faqs = [
  ['Who can join Mr Truth Agency?', 'Anyone connected to the Mr Truth ecosystem — drivers, job seekers, property owners, travellers and supporters of the agency. Membership is open and free.'],
  ['How much does membership cost?', 'Nothing. Membership is completely free — there is no registration fee and no annual dues. We removed all fees to keep the agency open to everyone.'],
  ['How long does approval take?', 'Most applications are reviewed within a few working days. You can track your application anytime on the Check Application Status page using your phone number or email.'],
  ['What happens after approval?', 'Approved members get instant access to the member portal, a digital ID card, the job board and member-only updates, events and offers — all at no cost.']
] as const;

export default async function Membership() {
  const site = await getSiteSettings();
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
            <h1>Join the agency. It&rsquo;s free.</h1>
            <p>Create your member profile, complete the review process and unlock job applications, a digital ID card and a direct connection to the Mr Truth ecosystem — with no fees, ever.</p>
          </div>
        </section>
        <section className="container page-body">
          <Reveal>
            <MembershipForm />
          </Reveal>
          <div className="fanclub-banner" style={{ marginTop: 26 }}>
            <div className="fanclub-copy" style={{ maxWidth: 'none' }}>
              <p className="kicker">WHY JOIN FREE?</p>
              <h2>Everything included. <em>Nothing to pay.</em></h2>
              <div className="fanclub-perks">
                {benefits.map((benefit) => (
                  <span key={benefit}>✓ {benefit}</span>
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
