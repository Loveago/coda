import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CarFront } from 'lucide-react';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import WorkPayApplicationWizard from '@/components/WorkPayApplicationWizard';
import '../../globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apply for Work & Pay Ghana | Mr Truth Agency',
  description: 'Online application for Ghana Work & Pay commercial vehicle ownership program. Fast screening, transparent terms, and quick interview scheduling.'
};

export default async function WorkPayApplyPage({
  searchParams
}: {
  searchParams?: Promise<{ vehicle?: string; weeks?: string }>;
}) {
  const [site, params] = await Promise.all([
    getSiteSettings(),
    searchParams ? searchParams : Promise.resolve<{ vehicle?: string; weeks?: string }>({})
  ]);

  const selectedVehicle = params.vehicle ? decodeURIComponent(params.vehicle) : undefined;

  return (
    <>
      <SiteHeader
        phone={site.contact_phone}
        email={site.contact_email}
        announcement={site.announcement_enabled === 'true' && site.announcement_text ? { text: site.announcement_text, key: announcementKey(site.announcement_text) } : null}
        socials={socialLinks(site)}
      />
      <main>
        <section className="page-hero" style={{ background: '#0f172a', color: '#fff', padding: '40px 0 32px' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <Link href="/work-and-pay" style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <ArrowLeft size={14} /> BACK TO PROGRAM DETAILS
            </Link>
            <h1 style={{ fontSize: 'clamp(24px, 3.8vw, 36px)', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>
              Work &amp; Pay Driver Application
            </h1>
            <p style={{ fontSize: 14, color: '#cbd5e1', margin: 0, maxWidth: 680 }}>
              Complete the 6-step screening wizard below. Please ensure your Ghana Card, driver’s license, and guarantor information are on hand.
            </p>
          </div>
        </section>

        <section className="container page-body" style={{ maxWidth: 900, paddingBottom: 80, paddingTop: 32 }}>
          <WorkPayApplicationWizard initialVehicle={selectedVehicle} />
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
