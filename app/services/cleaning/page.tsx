import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, ClipboardList, Home, Sparkles, SprayCan, Timer, Waves } from 'lucide-react';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Cleaning Services',
  description: 'Professional house and office cleaning services from Mr Truth Agency — residential, commercial, deep and post-construction cleaning across Accra.'
};
export const dynamic = 'force-dynamic';

const offerings = [
  { title: 'House Cleaning', description: 'Regular weekly or fortnightly visits that keep every room fresh — dusting, mopping, bathrooms, kitchen and tidy-up.', icon: Home },
  { title: 'Office Cleaning', description: 'Before-hours or scheduled office care: desks, floors, washrooms, pantries and meeting rooms, presentation-ready every morning.', icon: Building2 },
  { title: 'Deep Cleaning', description: 'Top-to-bottom reset for homes, Airbnbs and rentals — inside cupboards, appliances, windows, grout and hard-to-reach corners.', icon: Sparkles },
  { title: 'Post-Construction Cleaning', description: 'Dust, paint splatter and debris removal after building or renovation work, handing over spotless, move-in-ready spaces.', icon: ClipboardList },
  { title: 'Carpet & Upholstery', description: 'Steam and dry cleaning for carpets, rugs, sofas and office chairs — stains lifted, odours neutralised, fabrics revived.', icon: Waves },
  { title: 'One-Off & Event Cleaning', description: 'Move-in/move-out resets, function halls and post-event cleanups with crews sized to the job and the clock.', icon: Timer }
] as const;

const whyUs = [
  'Vetted, uniformed and supervised cleaning crews',
  'We bring our own equipment and eco-friendly products',
  'Flexible scheduling — one-time, weekly, fortnightly or monthly',
  'Transparent quotes with no hidden charges',
  'Satisfaction check before every job is signed off'
];

export default async function CleaningServicesPage() {
  const site = await getSiteSettings();
  const whatsappHref = site.whatsapp_number
    ? `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent('Hello Mr Truth Agency, I would like a quote for your cleaning services.')}`
    : '/contact';
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
            <p className="kicker">MR TRUTH AGENCY · CLEAN & FRESH</p>
            <h1>Spotless spaces, handled with care.</h1>
            <p>Professional house and office cleaning for homes, businesses and everything in between. Trusted crews, flexible plans and a finish you can see and smell.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-primary">REQUEST A FREE QUOTE <ArrowRight size={15} /></a>
              <Link href="/contact" className="btn btn-outline">CONTACT THE TEAM</Link>
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
              <p className="section-label">WHY CHOOSE US</p>
              <h2>Cleaning you can trust.</h2>
              {whyUs.map((item) => (
                <p key={item} className="form-note"><CheckCircle2 size={15} color="var(--accent)" style={{ verticalAlign: -3, marginRight: 7 }} />{item}</p>
              ))}
            </article>
            <article className="panel">
              <p className="section-label">HOW IT WORKS</p>
              <h2>Three simple steps.</h2>
              {['Tell us the space and what it needs — house, office, deep or post-construction.', 'We send a transparent quote and agree a schedule that suits you.', 'Our vetted crew arrives on time and leaves the space spotless.'].map((item, index) => (
                <p key={item} className="form-note"><strong>{`0${index + 1}`}</strong> · {item}</p>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
                <SprayCan size={20} color="var(--accent)" />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Serving Accra and surrounding areas — quotes are always free.</span>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
