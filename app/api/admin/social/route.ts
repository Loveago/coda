import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { SOCIAL_PLATFORMS, getSiteSettings, normalizeSocialUrl } from '@/lib/settings';

// Lets administrators manage the social profile links shown in the public
// header and footer. Each platform is stored as a `social_<key>` row in the
// SiteSetting table; an empty value hides that icon on the site.

const platformKeys = SOCIAL_PLATFORMS.map((platform) => platform.key) as [string, ...string[]];

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });

  const settings = await getSiteSettings();
  return NextResponse.json({
    links: SOCIAL_PLATFORMS.map((platform) => ({
      key: platform.key,
      label: platform.label,
      url: settings[`social_${platform.key}`] ?? ''
    }))
  });
}

const schema = z.object({
  links: z.array(z.object({
    key: z.enum(platformKeys),
    url: z.string().trim().max(300)
  })).min(1).max(SOCIAL_PLATFORMS.length)
});

export async function PUT(request: Request) {
  const user = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  if (!user) return NextResponse.json({ error: 'Administrator permission required.' }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  // Validate every link before touching the database so one bad URL cannot
  // leave the settings half-saved.
  const normalized = new Map<string, string>();
  for (const link of parsed.data.links) {
    const value = normalizeSocialUrl(link.url);
    if (value === null) {
      const label = SOCIAL_PLATFORMS.find((platform) => platform.key === link.key)?.label ?? link.key;
      return NextResponse.json({ error: `"${link.url}" is not a valid ${label} link — use a full URL like https://facebook.com/yourpage.` }, { status: 400 });
    }
    normalized.set(link.key, value);
  }

  for (const platform of SOCIAL_PLATFORMS) {
    const key = `social_${platform.key}`;
    if (!normalized.has(platform.key)) continue;
    const value = normalized.get(platform.key)!;
    if (value === '') {
      await db.siteSetting.deleteMany({ where: { key } });
    } else {
      await db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
    }
  }

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'UPDATE',
      entity: 'settings',
      entityId: 'social_links',
      metadata: { updated: [...normalized.keys()] }
    }
  });

  return NextResponse.json({ success: true });
}
