import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyPreviewToken } from '@/lib/preview';

export const dynamic = 'force-dynamic';

export default async function ArticlePreview({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ token?: string }> }) {
  const { slug } = await params;
  const token = (await searchParams).token;
  const article = await db.newsArticle.findUnique({ where: { slug }, include: { category: true, author: { select: { name: true } } } });
  if (!article || !token || !verifyPreviewToken(token, article.id)) notFound();
  return (
    <main className="container" style={{ padding: '70px 0', maxWidth: 900 }}>
      <p className="kicker" style={{ color: 'var(--blue)' }}>PREVIEW · {article.category?.name || 'ASSOCIATION NEWS'}</p>
      <h1 style={{ fontFamily: 'Barlow Condensed', fontSize: 58, lineHeight: 0.95 }}>{article.title}</h1>
      <p style={{ color: 'var(--muted)' }}>Preview · by {article.author.name}</p>
      {article.coverImage && <div style={{ height: 300, borderRadius: 18, margin: '28px 0', background: `url('${article.coverImage}') center/cover` }} />}
      <article style={{ lineHeight: 1.8, color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>{article.content}</article>
    </main>
  );
}
