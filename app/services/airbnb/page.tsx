import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BedDouble, CalendarCheck, CheckCircle2, DollarSign, Home, KeyRound, Megaphone, Smartphone, Sparkles, Star } from 'lucide-react';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Airbnb & Short-Let Hosting',
  description: 'Turn your property into a profitable Airbnb or short-let. Mr Truth Agency handles listing, pricing, guest communication and cleaning — you collect the income.'
};
export const dynamic = 'force-dynamic';

const services = [
  { title: 'Listing & Photography', description: 'Pro photos, compelling descriptions and smart titles that make your place stand out.', icon: Megaphone },
  { title: 'Smart Pricing', description: 'We price your stay dynamically for demand, season and events — maximising your income.', icon: DollarSign },
  { title: 'Guest Communication', description: 'Fast replies, smooth check-ins and issue resolution — professional hosting around the clock.', icon: Smartphone },
  { title: 'Cleaning & Turnovers', description: 'Hotel-grade cleaning and fresh linen between every single stay.', icon: Sparkles },
  { title: 'Property Styling', description: 'Furnished, styled and stocked to earn great reviews from the very first guest.', icon: BedDouble },
  { title: 'Income Reporting', description: 'Clear monthly statements of earnings, bookings and occupancy — total visibility.', icon: CalendarCheck }
] as const;

const whyUs = [
  'You own the property — we run the entire hosting operation',
  'Rates set to maximise occupancy and income',
  '5-star guest experience for 5-star reviews',
  'We handle platforms, bookings, cleaning and guests',
  'Ideal for Accra, coastal towns and business hubs'
];

export default async function AirbnbHostingPage() {
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
            <p className="kicker">MR TRUTH AGENCY · AIRBNB & SHORT-LET</p>
            <h1>Your property, hosting itself.</h1>
            <p>Turn your home, apartment or guest house into a thriving short-let. We handle the listing, pricing, guests and cleaning — you watch the bookings roll in.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
              <Link href="/contact?subject=airbnb-hosting" className="btn btn-primary">START HOSTING <ArrowRight size={15} /></Link>
              <Link href="/services/property-management" className="btn btn-outline">PROPERTY MANAGEMENT</Link>
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
              <p className="section-label">WHY HOST WITH US</p>
              <h2>Maximum income, zero hassle.</h2>
              {whyUs.map((item) => (
                <p key={item} className="form-note"><CheckCircle2 size={15} color="var(--accent)" style={{ verticalAlign: -3, marginRight: 7 }} />{item}</p>
              ))}
            </article>
            <article className="panel">
              <p className="section-label">HOW IT WORKS</p>
              <h2>Three simple steps.</h2>
              {['Tell us about your space — we assess its hosting potential.', 'We style, list and launch it across short-let platforms.', 'Guests arrive, income lands, and you get a clear monthly report.'].map((item, index) => (
                <p key={item} className="form-note"><strong>{`0${index + 1}`}</strong> · {item}</p>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
                <Star size={20} color="var(--accent)" />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Perfect for homes, apartments and guest houses across Ghana.</span>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
