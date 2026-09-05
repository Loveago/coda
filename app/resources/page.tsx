import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import '../globals.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Resources', description: 'Driver guides, policies, safety documents and downloadable resources from Mr Truth Agency.' };

export default async function Resources() {
  const [resources, site] = await Promise.all([
    db.resource.findMany({ where: { published: true }, orderBy: { updatedAt: 'desc' } }),
    getSiteSettings()
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
        <section className="page-hero">
          <div className="container">
            <p className="kicker">DRIVER RESOURCES</p>
            <h1>Resources</h1>
            <p>Guides, policies, safety information and important documents for every Mr Truth Agency driver and member.</p>
          </div>
        </section>
        <section className="container page-body">
          {resources.length === 0 ? (
            <section className="empty-state">
              <h2>Resources coming soon</h2>
              <p>Published driver guides, policies, and notices will appear here.</p>
            </section>
          ) : (
            <div className="news-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {resources.map((resource, index) => (
                <Reveal as="article" delay={(index % 3) * 90} key={resource.id}>
                  <article className="news-card">
                    <div className="news-body">
                      <span className="news-date">{resource.category}</span>
                      <h3>{resource.title}</h3>
                      <p>{resource.description}</p>
                      <a className="read" href={resource.fileUrl} target="_blank" rel="noreferrer">OPEN RESOURCE <ArrowRight size={12} /></a>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
