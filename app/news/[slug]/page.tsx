import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import ReadingProgress from '@/components/ReadingProgress';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = await db.newsArticle.findFirst({ where: { slug: (await params).slug, status: 'PUBLISHED', publishedAt: { lte: new Date() } }, select: { title: true, seoTitle: true, excerpt: true, seoDescription: true, coverImage: true, openGraphImage: true, canonicalUrl: true } });
  if (!article) return { title: 'Article not found' };
  const image = article.openGraphImage || article.coverImage || undefined;
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    alternates: { canonical: article.canonicalUrl || `/news/${(await params).slug}` },
    openGraph: { title: article.seoTitle || article.title, description: article.seoDescription || article.excerpt, images: image ? [image] : undefined },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: article.seoTitle || article.title, description: article.seoDescription || article.excerpt, images: image ? [image] : undefined }
  };
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [article, site] = await Promise.all([
    db.newsArticle.findFirst({ where: { slug, status: 'PUBLISHED', publishedAt: { lte: new Date() } }, include: { category: true, author: { select: { name: true } } } }),
    getSiteSettings()
  ]);
  if (!article) notFound();

  const related = await db.newsArticle.findMany({
    where: { status: 'PUBLISHED', publishedAt: { lte: new Date() }, id: { not: article.id }, ...(article.categoryId ? { categoryId: article.categoryId } : {}) },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    include: { category: true }
  });

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/news/${article.slug}`;
  const shareLinks = [
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`],
    ['X (Twitter)', `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`],
    ['WhatsApp', `https://wa.me/?text=${encodeURIComponent(`${article.title} ${shareUrl}`)}`]
  ] as const;

  return (
    <>
      <ReadingProgress />
      <SiteHeader
        phone={site.contact_phone}
        email={site.contact_email}
        announcement={site.announcement_enabled === 'true' && site.announcement_text ? { text: site.announcement_text, key: announcementKey(site.announcement_text) } : null}
        socials={socialLinks(site)}
      />
      <main className="container" style={{ padding: '60px 0 70px', maxWidth: 900 }}>
        <Reveal>
          <p className="kicker">{article.category?.name || 'MR TRUTH NEWS'}</p>
          <h1 style={{ fontSize: 54, lineHeight: 0.95, margin: '6px 0 14px' }}>{article.title}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            Published {new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(article.publishedAt || article.createdAt)} by {article.author.name}
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div style={{ height: 340, borderRadius: 18, margin: '26px 0', background: `url('${article.coverImage || 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80'}') center/cover`, boxShadow: 'var(--shadow-md)' }} />
        </Reveal>
        <Reveal delay={150}>
          <article style={{ lineHeight: 1.85, color: '#3a3a3a', whiteSpace: 'pre-wrap', fontSize: 15 }}>{article.content}</article>
        </Reveal>
        <Reveal delay={200}>
          <div style={{ marginTop: 34, paddingTop: 20, borderTop: '1px solid var(--line)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--muted)' }}>SHARE THIS ARTICLE</span>
            {shareLinks.map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="admin-action">{label.toUpperCase()}</a>
            ))}
          </div>
        </Reveal>
        {related.length > 0 && (
          <section style={{ marginTop: 50 }}>
            <Reveal><h2 style={{ fontSize: 28, margin: '0 0 16px' }}>RELATED ARTICLES</h2></Reveal>
            <div className="news-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {related.map((item, index) => (
                <Reveal as="article" delay={index * 80} key={item.id}>
                  <article className="news-card">
                    <div className="news-img" style={{ backgroundImage: `url(${item.coverImage || 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=700&q=80'})` }} />
                    <div className="news-body">
                      <span className="news-date">{item.category?.name || 'MR TRUTH NEWS'}</span>
                      <h3>{item.title}</h3>
                      <Link className="read" href={`/news/${item.slug}`}>READ MORE <ArrowRight size={12} /></Link>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
