import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const bulkSchema = z.object({ ids: z.array(z.string().uuid()).min(1), action: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED', 'DELETE']) });

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });
  const parsed = bulkSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Select at least one valid article.' }, { status: 400 });
  const { ids, action } = parsed.data;
  if (action === 'DELETE' && !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) return NextResponse.json({ error: 'Only administrators can delete articles.' }, { status: 403 });
  if (action === 'DELETE') await db.newsArticle.deleteMany({ where: { id: { in: ids } } });
  else await db.newsArticle.updateMany({ where: { id: { in: ids } }, data: { status: action, publishedAt: action === 'PUBLISHED' ? new Date() : null } });
  await db.auditLog.create({ data: { userId: user.id, action: `BULK_${action}`, entity: 'news', metadata: { ids } } });
  return NextResponse.json({ success: true, count: ids.length });
}
