import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createPreviewToken } from '@/lib/preview';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
  if (!user) return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });
  const id = (await params).id;
  return NextResponse.json({ token: createPreviewToken(id), expiresIn: 600 });
}
