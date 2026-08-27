import Link from 'next/link';
import { db } from '@/lib/db';
import NewsManagement from '@/components/NewsManagement';
import '../../globals.css';

export const dynamic = 'force-dynamic';

export default async function AdminNews() {
  const articles = await db.newsArticle.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true, author: { select: { name: true } } }
  });

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <Link href="/admin" className="admin-back">← BACK TO DASHBOARD</Link>
          <h1>News management</h1>
        </div>
        <Link href="/admin/news/new" className="btn btn-primary">NEW ARTICLE</Link>
      </div>
      <NewsManagement initialArticles={articles.map((article) => ({ ...article, publishedAt: article.publishedAt?.toISOString() || null, updatedAt: article.updatedAt.toISOString() }))} />
    </main>
  );
}
