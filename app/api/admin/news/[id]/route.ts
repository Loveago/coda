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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
  if (!user) return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });
  const id = (await params).id;
  const parsed = articleSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please complete the article fields.' }, { status: 400 });

  const data = parsed.data;
  let categoryId: string | null = null;
  if (data.category?.trim()) {
    const slug = data.category.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const category = await db.newsCategory.upsert({ where: { slug }, update: {}, create: { name: data.category.trim(), slug } });
    categoryId = category.id;
  }
  const publishedAt = data.status === 'PUBLISHED' ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null;
  const article = await db.newsArticle.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      categoryId,
      status: data.status,
      publishedAt,
      coverImage: data.coverImage || null,
      openGraphImage: data.openGraphImage || null,
      canonicalUrl: data.canonicalUrl || null,
      excerpt: data.excerpt,
      content: data.content,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null
    }
  });
  await db.auditLog.create({ data: { userId: user.id, action: 'UPDATE', entity: 'news', entityId: id } });
  return NextResponse.json({ success: true, article });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  if (!user) return NextResponse.json({ error: 'Administrator permission required.' }, { status: 403 });
  const id = (await params).id;
  await db.newsArticle.delete({ where: { id } });
  await db.auditLog.create({ data: { userId: user.id, action: 'DELETE', entity: 'news', entityId: id } });
  return NextResponse.json({ success: true });
}
