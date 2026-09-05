import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, Home, KeyRound, MapPin, ShieldCheck, Sofa, Sparkles, Users } from 'lucide-react';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Property Rentals',
  description: 'Find homes, apartments, offices and commercial spaces to rent through Mr Truth Agency — trusted property rental service across Accra and Ghana.'
};
export const dynamic = 'force-dynamic';

const offerings = [
  { title: 'Residential Homes & Apartments', description: 'Long and short-stay homes for families and professionals — fully vetted and ready to move in.', icon: Home },
  { title: 'Office & Commercial Spaces', description: 'Offices, shops and warehouses for businesses of every size, with flexible terms.', icon: Building2 },
  { title: 'Serviced & Executive Lets', description: 'Furnished apartments for executives, relocations and longer stays — plug in and live.', icon: Sofa },
  { title: 'Short Stays & Corporate Housing', description: 'Clean, secure accommodation for work trips, projects and temporary relocations.', icon: ShieldCheck },
  { title: 'Furnished & Unfurnished', description: 'Whatever you need — fully furnished, part-furnished or empty shells at fair rates.', icon: KeyRound },
  { title: 'Guaranteed Legit Listings', description: 'Every listing is verified in person so what you see is what you get — no scams.', icon: CheckCircle2 }
] as const;

const whyUs = [
  'Every property inspected and verified by our team',
  'Transparent rent, deposits and tenancy terms',
  'Fast viewings — we schedule around you',
  'Ongoing support during your tenancy',
  'Landlords and tenants matched properly'
];

export default async function PropertyRentalsPage() {
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
            <p className="kicker">MR TRUTH AGENCY · PROPERTY RENTALS</p>
            <h1>Find a place you&rsquo;ll love.</h1>
            <p>Verified homes, apartments and commercial spaces to rent — with honest terms, fair pricing and support before, during and after your tenancy.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
              <Link href="/contact?subject=property-rental" className="btn btn-primary">FIND A PLACE <ArrowRight size={15} /></Link>
              <Link href="/services/property-management" className="btn btn-outline">I&rsquo;M A LANDLORD</Link>
            </div>
          </div>
        </section>
        <section className="container page-body">
          <div className="services-grid">
            {offerings.map(({ title, description, icon: Icon }) => (
              <article className="service-card" key={title}>
                <Icon size={24} color="var(--accent)" />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <div className="split" style={{ marginTop: 26 }}>
            <article className="panel">
              <p className="section-label">WHY RENT WITH US</p>
              <h2>Renting without the worry.</h2>
              {whyUs.map((item) => (
                <p key={item} className="form-note"><CheckCircle2 size={15} color="var(--accent)" style={{ verticalAlign: -3, marginRight: 7 }} />{item}</p>
              ))}
            </article>
            <article className="panel">
              <p className="section-label">HOW IT WORKS</p>
              <h2>Three simple steps.</h2>
              {['Tell us what you need — budget, area, size and dates.', 'We shortlist verified options and arrange viewings around you.', 'Agree terms, sign up and move in — with our support throughout.'].map((item, index) => (
                <p key={item} className="form-note"><strong>{`0${index + 1}`}</strong> · {item}</p>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
                <MapPin size={20} color="var(--accent)" />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Serving Accra and surrounding areas.</span>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
