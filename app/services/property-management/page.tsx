import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, CheckCircle2, ClipboardList, FileCheck, Handshake, KeyRound, ShieldCheck, Users, Wrench } from 'lucide-react';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Property Management',
  description: 'Full-service property management from Mr Truth Agency — tenant sourcing, rent collection, maintenance and reporting for landlords across Accra and Ghana.'
};
export const dynamic = 'force-dynamic';

const services = [
  { title: 'Tenant Sourcing & Vetting', description: 'We market your property, screen applicants and place reliable tenants who pay on time.', icon: Users },
  { title: 'Rent Collection', description: 'Monthly rent chasing, receipts and reconciliation handled for you — on time, every time.', icon: Handshake },
  { title: 'Maintenance Coordination', description: 'Vetted contractors for repairs, servicing and emergency call-outs, with quality checks.', icon: Wrench },
  { title: 'Property Inspections', description: 'Regular condition reports, move-in/move-out checks and damage documentation.', icon: ClipboardList },
  { title: 'Lease Management', description: 'Drafting, renewals, renewals and compliance handled by professionals.', icon: FileCheck },
  { title: 'Owner Reporting', description: 'A clear monthly statement of income, expenses and property performance.', icon: CalendarCheck }
] as const;

const whyUs = [
  'Landlords keep full ownership — we manage the day-to-day',
  'Transparent reporting and zero hidden charges',
  'Vetted contractors and supervised workmanship',
  'Rent protected with disciplined collection and follow-up',
  'Serving Accra and surrounding areas'
];

export default async function PropertyManagementPage() {
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
            <p className="kicker">MR TRUTH AGENCY · PROPERTY</p>
            <h1>Your property, managed with care.</h1>
            <p>From tenant sourcing to rent collection and maintenance, we run the day-to-day so you enjoy the returns. Hands-on, transparent property management for homes, apartments and commercial spaces.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
              <Link href="/contact?subject=property-management" className="btn btn-primary">TALK TO OUR TEAM <ArrowRight size={15} /></Link>
              <Link href="/property-rentals" className="btn btn-outline">BROWSE RENTALS</Link>
            </div>
          </div>
        </section>
        <section className="container page-body">
          <div className="services-grid">
            {services.map(({ title, description, icon: Icon }) => (
              <article className="service-card" key={title}>
                <Icon size={24} color="var(--accent)" />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <div className="split" style={{ marginTop: 26 }}>
            <article className="panel">
              <p className="section-label">WHY CHOOSE US</p>
              <h2>Peace of mind, delivered monthly.</h2>
              {whyUs.map((item) => (
                <p key={item} className="form-note"><CheckCircle2 size={15} color="var(--accent)" style={{ verticalAlign: -3, marginRight: 7 }} />{item}</p>
              ))}
            </article>
            <article className="panel">
              <p className="section-label">HOW IT WORKS</p>
              <h2>Three simple steps.</h2>
              {['Tell us about your property — we assess it and agree a management plan.', 'We onboard your property and start sourcing quality tenants.', 'Rent comes in, maintenance is handled, and you get a clear monthly report.'].map((item, index) => (
                <p key={item} className="form-note"><strong>{`0${index + 1}`}</strong> · {item}</p>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
                <KeyRound size={20} color="var(--accent)" />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Landlords keep ownership — we handle everything else.</span>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
