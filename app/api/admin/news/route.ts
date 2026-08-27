import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const articleSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  publishedAt: z.string().optional().or(z.literal('')),
  coverImage: z.string().url().optional().or(z.literal('')),
  openGraphImage: z.string().url().optional().or(z.literal('')),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  excerpt: z.string().min(10),
  content: z.string().min(20),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional()
});

export async function POST(request: Request) {
  try {
    const user = await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    if (!user) return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });
    const parsed = articleSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Please complete the article fields.' }, { status: 400 });
    const data = parsed.data;
    let categoryId: string | undefined;
    if (data.category?.trim()) {
      const slug = data.category.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const category = await db.newsCategory.upsert({ where: { slug }, update: {}, create: { name: data.category.trim(), slug } });
      categoryId = category.id;
    }
    const article = await db.newsArticle.create({ data: { title: data.title, slug: data.slug, excerpt: data.excerpt, content: data.content, coverImage: data.coverImage || null, openGraphImage: data.openGraphImage || null, canonicalUrl: data.canonicalUrl || null, status: data.status, publishedAt: data.status === 'PUBLISHED' ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null, seoTitle: data.seoTitle || null, seoDescription: data.seoDescription || null, authorId: user.id, categoryId } });
    await db.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: 'news', entityId: article.id } });
    return NextResponse.json({ success: true, id: article.id }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Unable to save the article.' }, { status: 500 }); }
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });
  return NextResponse.json(await db.newsArticle.findMany({ orderBy: { createdAt: 'desc' }, include: { category: true, author: { select: { name: true } } } }));
}
