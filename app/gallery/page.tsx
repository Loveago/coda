import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { announcementKey, getSiteSettings } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import GalleryGrid from '@/components/GalleryGrid';
import '../globals.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Gallery', description: 'Photos from GACODA events, meetings and community activities.' };

export default async function Gallery() {
  const [images, site] = await Promise.all([
    db.galleryItem.findMany({
      orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }]
    }),
    getSiteSettings()
  ]);

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
            <p className="kicker">GACODA IN ACTION</p>
            <h1>Gallery</h1>
            <p>Moments from our meetings, outreach programmes and community activities across Greater Accra.</p>
          </div>
        </section>
        <section className="container page-body">
          {images.length === 0 ? (
            <section className="empty-state">
              <h2>Gallery coming soon</h2>
              <p>Approved association photos will appear here.</p>
            </section>
          ) : (
            <Reveal><GalleryGrid items={images} /></Reveal>
          )}
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} />
    </>
  );
}
