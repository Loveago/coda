import { db } from '@/lib/db';
import ArticleEditor from '@/components/ArticleEditor';

export const dynamic = 'force-dynamic';

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  const article = await db.newsArticle.findUnique({ where: { id: (await params).id }, include: { category: true } });
  if (!article) return <main><h1>Article not found</h1></main>;
  return <ArticleEditor article={{ ...article, publishedAt: article.publishedAt?.toISOString() || null }} />;
}
