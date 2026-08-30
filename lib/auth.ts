import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import type { Role, User } from '@prisma/client';

export const ADMIN_SESSION_COOKIE = 'mrtruth_admin_session';
export const LEGACY_ADMIN_SESSION_COOKIE = 'gacoda_admin_session';
const SESSION_TTL = 60 * 60 * 8;

type AdminUser = Pick<User, 'id' | 'email' | 'name' | 'role' | 'active'>;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required in production.');
  }
  return value || 'development-only-change-me';
}

export function createSessionToken(userId: string) {
  const payload = `${userId}.${Math.floor(Date.now() / 1000)}`;
  const signature = createHmac('sha256', secret()).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string) {
  const [userId, issuedAt, signature] = token.split('.');
  if (!userId || !issuedAt || !signature) return null;
  const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_TTL) return null;
  const expected = createHmac('sha256', secret()).update(`${userId}.${issuedAt}`).digest('hex');
  const actualBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  return userId;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || cookieStore.get(LEGACY_ADMIN_SESSION_COOKIE)?.value;
  const userId = session ? verifySessionToken(session) : null;
  if (!userId) return null;
  return db.user.findFirst({ where: { id: userId, active: true }, select: { id: true, email: true, name: true, role: true, active: true } });
}

export async function requireAdmin(allowedRoles?: Role[]) {
  const user = await getAdminUser();
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) return null;
  return user;
}

export const ADMIN_SESSION_MAX_AGE = SESSION_TTL;
