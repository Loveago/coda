import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import WorkPayTracker from '@/components/WorkPayTracker';
import '../../globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Track Work & Pay Application | Mr Truth Agency',
  description: 'Check the live status of your Work & Pay vehicle ownership application.'
};

export default async function WorkPayTrackPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const [site, params] = await Promise.all([
    getSiteSettings(),
    searchParams ? searchParams : Promise.resolve<{ q?: string }>({})
  ]);

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
          <div className="container" style={{ maxWidth: 800 }}>
            <Link href="/work-and-pay" style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <ArrowLeft size={14} /> BACK TO WORK &amp; PAY
            </Link>
            <h1 style={{ fontSize: 'clamp(24px, 3.8vw, 36px)', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>
              Track Application Status
            </h1>
            <p style={{ fontSize: 14, color: '#cbd5e1', margin: 0 }}>
              Look up your screening and review status using your tracking reference code or phone number.
            </p>
          </div>
        </section>

        <section className="container page-body" style={{ maxWidth: 800, paddingBottom: 80, paddingTop: 32 }}>
          <WorkPayTracker initialQuery={params.q} />
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
