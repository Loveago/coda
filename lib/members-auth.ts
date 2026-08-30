import { createHmac, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export const MEMBER_SESSION_COOKIE = 'mrtruth_member_session';
export const LEGACY_MEMBER_SESSION_COOKIE = 'gacoda_member_session';
const SESSION_TTL = 60 * 60 * 24 * 14;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET is required in production.');
  return value || 'development-only-change-me';
}

export function createMemberSessionToken(memberId: string) {
  const payload = `${memberId}.${Math.floor(Date.now() / 1000)}`;
  const signature = createHmac('sha256', secret()).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function verifyMemberSessionToken(token: string) {
  const [memberId, issuedAt, signature] = token.split('.');
  if (!memberId || !issuedAt || !signature) return null;
  const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_TTL) return null;
  const expected = createHmac('sha256', secret()).update(`${memberId}.${issuedAt}`).digest('hex');
  const actualBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  return memberId;
}

export type PortalMember = {
  id: string;
  memberNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  registrationPayment: 'NOT_REQUIRED' | 'PENDING' | 'PAID';
  photoUrl: string | null;
};

export async function getPortalMember(): Promise<PortalMember | null> {
  const cookieStore = await cookies();
  const session =
    cookieStore.get(MEMBER_SESSION_COOKIE)?.value ||
    cookieStore.get(LEGACY_MEMBER_SESSION_COOKIE)?.value;
  const memberId = session ? verifyMemberSessionToken(session) : null;
  if (!memberId) return null;
  const member = await db.member.findFirst({
    where: { id: memberId },
    select: { id: true, memberNumber: true, email: true, firstName: true, lastName: true, phone: true, status: true, registrationPayment: true, photoUrl: true }
  });
  return member ?? null;
}

export async function requireApprovedMember() {
  const member = await getPortalMember();
  if (!member || member.status !== 'APPROVED') return null;
  return member;
}

export const MEMBER_SESSION_MAX_AGE = SESSION_TTL;

export function hashToken(token: string) {
  return createHash('sha256').update(`${token}:${secret()}`).digest('hex');
}

export function generateToken() {
  return randomBytes(32).toString('hex');
}
