import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { announcementKey, getSiteSettings } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import NewsExplorer from '@/components/NewsExplorer';
import '../globals.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'News & Updates', description: 'The latest news, announcements and updates from GACODA.' };

export default async function News() {
  const [articles, settings] = await Promise.all([
    db.newsArticle.findMany({
      where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: 'desc' },
      include: { category: true },
      take: 48
    }),
    getSiteSettings()
  ]);

  const explorerArticles = articles.map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    categoryName: article.category?.name || null,
    dateLabel: new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(article.publishedAt || article.createdAt)
  }));

  return (
    <>
      <SiteHeader
        phone={settings.contact_phone}
        email={settings.contact_email}
        announcement={settings.announcement_enabled === 'true' && settings.announcement_text ? { text: settings.announcement_text, key: announcementKey(settings.announcement_text) } : null}
      />
      <main>
        <section className="page-hero">
          <div className="container">
            <p className="kicker">NEWS & UPDATES</p>
            <h1>Latest from GACODA</h1>
            <p>Announcements, advocacy wins, events and everything happening across the association.</p>
          </div>
        </section>
        <section className="container page-body">
          <Reveal>
            {explorerArticles.length === 0 ? (
              <section className="empty-state">
                <h2>No published articles yet</h2>
                <p>Approved association news will appear here.</p>
              </section>
            ) : (
              <NewsExplorer articles={explorerArticles} />
            )}
          </Reveal>
        </section>
      </main>
      <SiteFooter phone={settings.contact_phone} email={settings.contact_email} whatsapp={settings.whatsapp_number} />
    </>
  );
}
