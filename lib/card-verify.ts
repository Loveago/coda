import { createHmac, timingSafeEqual } from 'node:crypto';

// Signed codes printed on membership cards so the public verification page
// can confirm authenticity without exposing member data to enumeration.

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required in production.');
  }
  return value || 'development-only-change-me';
}

export function cardSignature(memberNumber: string): string {
  return createHmac('sha256', secret()).update(`membership-card:${memberNumber}`).digest('hex').slice(0, 20);
}

export function verifyCardCode(memberNumber: string, code: string): boolean {
  if (!memberNumber || !code || !/^[0-9a-f]+$/i.test(code)) return false;
  const expected = Buffer.from(cardSignature(memberNumber));
  const actual = Buffer.from(code.toLowerCase());
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
