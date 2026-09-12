import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

function generateRandomCode(prefix = 'MTA'): string {
  // Generates e.g. MTA-7X9K2P (6 unambiguous alphanumeric characters)
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = randomBytes(6);
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return `${prefix.trim().toUpperCase()}-${result}`;
}

const createCodeSchema = z.object({
  mode: z.enum(['generate', 'custom']).default('generate'),
  customCode: z.string().trim().min(3).max(32).optional(),
  count: z.coerce.number().int().min(1).max(50).default(1),
  prefix: z.string().trim().max(10).default('MTA'),
  description: z.string().trim().max(255).optional(),
  maxUses: z.coerce.number().int().min(0).default(1), // 0 means unlimited
  expiresAt: z.string().nullable().optional()
});

const patchCodeSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean().optional(),
  description: z.string().trim().max(255).nullable().optional(),
  maxUses: z.coerce.number().int().min(0).optional(),
  expiresAt: z.string().nullable().optional()
});

const deleteCodeSchema = z.object({
  id: z.string().uuid()
});

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });
  }

  const codes = await db.registrationCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true }
      },
      members: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          memberNumber: true,
          email: true,
          phone: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return NextResponse.json(codes);
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }

  const parsed = createCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const { mode, customCode, count, prefix, description, maxUses, expiresAt } = parsed.data;
  const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
  if (parsedExpiresAt && Number.isNaN(parsedExpiresAt.valueOf())) {
    return NextResponse.json({ error: 'Invalid expiration date.' }, { status: 400 });
  }

  if (mode === 'custom') {
    if (!customCode) {
      return NextResponse.json({ error: 'Custom code cannot be empty.' }, { status: 400 });
    }
    const normalized = customCode.toUpperCase().replace(/\s+/g, '-');
    const existing = await db.registrationCode.findUnique({ where: { code: normalized } });
    if (existing) {
      return NextResponse.json({ error: `Registration code "${normalized}" already exists.` }, { status: 409 });
    }

    const created = await db.registrationCode.create({
      data: {
        code: normalized,
        description: description || null,
        maxUses,
        expiresAt: parsedExpiresAt,
        createdById: user.id
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: true
      }
    });

    return NextResponse.json({ success: true, codes: [created] }, { status: 201 });
  }

  // Generate batch
  const createdList = [];
  const cleanPrefix = (prefix || 'MTA').toUpperCase().replace(/[^A-Z0-9]/g, '');

  for (let i = 0; i < count; i++) {
    let candidate = '';
    let attempts = 0;
    while (attempts < 10) {
      candidate = generateRandomCode(cleanPrefix || 'MTA');
      const collision = await db.registrationCode.findUnique({ where: { code: candidate } });
      if (!collision) break;
      attempts++;
    }

    const created = await db.registrationCode.create({
      data: {
        code: candidate,
        description: description || null,
        maxUses,
        expiresAt: parsedExpiresAt,
        createdById: user.id
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: true
      }
    });
    createdList.push(created);
  }

  return NextResponse.json({ success: true, codes: createdList }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }

  const parsed = patchCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const { id, active, description, maxUses, expiresAt } = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (typeof active === 'boolean') updateData.active = active;
  if (description !== undefined) updateData.description = description;
  if (typeof maxUses === 'number') updateData.maxUses = maxUses;
  if (expiresAt !== undefined) {
    updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
  }

  try {
    const updated = await db.registrationCode.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
            email: true,
            createdAt: true
          }
        }
      }
    });
    return NextResponse.json({ success: true, code: updated });
  } catch {
    return NextResponse.json({ error: 'Registration code not found.' }, { status: 404 });
  }
}

export async function DELETE(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }

  const parsed = deleteCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid registration code ID.' }, { status: 400 });
  }

  try {
    await db.registrationCode.delete({ where: { id: parsed.data.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete registration code.' }, { status: 404 });
  }
}
