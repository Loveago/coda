import type { Metadata } from 'next';
import { announcementKey, getSiteSettings } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import MembershipStatusForm from '@/components/MembershipStatusForm';
import '../globals.css';

export const metadata: Metadata = { title: 'Check Application Status', description: 'Check the status of your GACODA membership application using your phone number or email.' };

export default async function MembershipStatus() {
  const site = await getSiteSettings();
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
            <p className="kicker">MEMBERSHIP</p>
            <h1>Check Your Application Status</h1>
            <p>Enter the phone number or email address you provided on your membership application to see its current status.</p>
          </div>
        </section>
        <section className="container page-body">
          <Reveal>
            <MembershipStatusForm />
          </Reveal>
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} />
    </>
  );
}
