import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getPortalMember } from '@/lib/members-auth';
import { rateLimit, requestAddress } from '@/lib/rate-limit';
import { uploadDocument, uploadImage } from '@/lib/storage';

export async function POST(request: Request) {
  // Admins may upload anything; approved members may upload their profile photo.
  const admin = await requireAdmin();
  const member = admin ? null : await getPortalMember();
  if (!admin && !(member && member.status === 'APPROVED')) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const user = admin ?? member;

  const limit = rateLimit(`upload:${requestAddress(request)}`, 20);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many uploads. Please wait a moment.' }, { status: 429 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No image file was provided.' }, { status: 400 });

  try {
    const result = file.type === 'application/pdf' ? await uploadDocument(file) : await uploadImage(file);
    const media = await db.media.create({
      data: { url: result.url, mimeType: result.mimeType, size: result.size }
    });
    await db.auditLog.create({
      data: {
        userId: admin?.id ?? null,
        action: 'UPLOAD',
        entity: 'media',
        entityId: media.id,
        metadata: { driver: result.driver, size: result.size, memberId: member?.id ?? null }
      }
    });
    return NextResponse.json({ success: true, url: result.url, driver: result.driver }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed.' }, { status: 400 });
  }
}
