import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getPaystackSecret } from '@/lib/payments/payment-service';

// Lets administrators manage Paystack keys from the settings UI instead of
// editing .env. Secrets are stored in the siteSetting table and are never
// returned in full by this endpoint — only a masked preview.

const SECRET_KEY_SETTING = 'paystack_secret_key';
const PUBLIC_KEY_SETTING = 'paystack_public_key';

function maskSecret(secret: string) {
  if (secret.length <= 12) return '••••••••';
  return `${secret.slice(0, 8)}••••${secret.slice(-4)}`;
}

function detectMode(key: string): 'test' | 'live' | 'unknown' {
  if (key.includes('_test_')) return 'test';
  if (key.includes('_live_')) return 'live';
  return 'unknown';
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });

  const rows = await db.siteSetting.findMany({ where: { key: { in: [SECRET_KEY_SETTING, PUBLIC_KEY_SETTING] } } });
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const dbSecret = stored[SECRET_KEY_SETTING]?.trim() || '';
  const publicKey = stored[PUBLIC_KEY_SETTING]?.trim() || '';
  const activeSecret = dbSecret || process.env.PAYSTACK_SECRET_KEY || '';

  return NextResponse.json({
    configured: Boolean(activeSecret),
    source: dbSecret ? 'database' : activeSecret ? 'environment' : 'none',
    mode: activeSecret ? detectMode(activeSecret) : 'unknown',
    secretMasked: activeSecret ? maskSecret(activeSecret) : null,
    publicKey: publicKey || null,
    updatedAt: rows.find((row) => row.key === SECRET_KEY_SETTING)?.updatedAt ?? null
  });
}

const schema = z.object({
  secretKey: z.string().trim().max(250).optional(),
  publicKey: z.string().trim().max(250).optional(),
  clear: z.boolean().optional()
});

export async function PUT(request: Request) {
  const user = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);
  if (!user) return NextResponse.json({ error: 'Administrator permission required.' }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { secretKey, publicKey, clear } = parsed.data;

  if (clear) {
    await db.siteSetting.deleteMany({ where: { key: { in: [SECRET_KEY_SETTING, PUBLIC_KEY_SETTING] } } });
    await db.auditLog.create({ data: { userId: user.id, action: 'DELETE', entity: 'settings', entityId: 'paystack_keys', metadata: { cleared: true } } });
    return NextResponse.json({ success: true, cleared: true });
  }

  if (secretKey === undefined && publicKey === undefined) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  if (secretKey && !/^sk_(test|live)_[A-Za-z0-9]{10,}$/.test(secretKey)) {
    return NextResponse.json({ error: 'That does not look like a Paystack secret key — expected sk_test_… or sk_live_…' }, { status: 400 });
  }
  if (publicKey && !/^pk_(test|live)_[A-Za-z0-9]{6,}$/.test(publicKey)) {
    return NextResponse.json({ error: 'That does not look like a Paystack public key — expected pk_test_… or pk_live_…' }, { status: 400 });
  }
  if (secretKey && publicKey && detectMode(secretKey) !== 'unknown' && detectMode(publicKey) !== 'unknown' && detectMode(secretKey) !== detectMode(publicKey)) {
    return NextResponse.json({ error: 'Both keys must come from the same mode (test or live).' }, { status: 400 });
  }

  const updates = [
    { key: SECRET_KEY_SETTING, value: secretKey },
    { key: PUBLIC_KEY_SETTING, value: publicKey }
  ] as const;
  for (const { key, value } of updates) {
    if (value === undefined) continue;
    if (value === '') {
      // Empty string removes the stored override and falls back to .env.
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
      entityId: 'paystack_keys',
      metadata: { secretUpdated: secretKey !== undefined, publicUpdated: publicKey !== undefined }
    }
  });

  return NextResponse.json({ success: true });
}
