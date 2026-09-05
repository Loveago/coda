import type { Metadata } from 'next';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import ContactForm from '@/components/ContactForm';
import '../globals.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Contact Us', description: 'Get in touch with Mr Truth Agency for automotive, mobility and member support.' };

export default async function Contact() {
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
            <p className="kicker">GET IN TOUCH</p>
            <h1>Contact Mr Truth Agency</h1>
            <p>For service enquiries, partnership proposals or membership support, reach the agency through the details below.</p>
          </div>
        </section>
        <section className="container page-body">
          <div className="split" style={{ marginTop: 0 }}>
            <Reveal>
              <div className="about-card" style={{ minHeight: '100%' }}>
                <h2>Our office</h2>
                <p style={{ display: 'flex', alignItems: 'center', gap: 9 }}><MapPin size={14} /> Accra, Greater Accra Region, Ghana</p>
                <p style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Phone size={14} /> {site.contact_phone}</p>
                {site.whatsapp_number ? (
                  <a href={`https://wa.me/${site.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'inherit' }}><MessageCircle size={14} style={{ color: '#25D366' }} /> Chat with us on WhatsApp: +{site.whatsapp_number.replace(/\D/g, '')}</a>
                ) : (
                  <p style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Mail size={14} /> {site.contact_email}</p>
                )}
                <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 10 }}>Messages sent through the form go straight to our WhatsApp — type it, press send, and we reply there.</p>
                <div style={{ marginTop: 22, borderRadius: 12, height: 170, background: 'linear-gradient(135deg, rgba(255,255,255,.1), rgba(255,255,255,.03))', display: 'grid', placeItems: 'center', color: '#FFD2B3', fontSize: 12 }}>
                  Interactive map coming soon
                </div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <ContactForm whatsapp={site.whatsapp_number ? site.whatsapp_number.replace(/\D/g, '') : undefined} />
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
